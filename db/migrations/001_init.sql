-- DUB — initial schema.
--
-- Design notes that matter later:
--
--   * A learner exists before an account does. Anonymous testers are the majority
--     of early traffic and must never hit a signup wall, so `learners` is keyed by
--     an anonymous device id and only later claimed by a user.
--   * Entitlements are read from `subscriptions`, never from Stripe directly. When
--     the iOS build arrives, StoreKit writes into the same table and nothing
--     downstream has to know which store the money came through.
--   * Everything a person typed about themselves lives in one place per table so
--     that "delete my account" is a small, auditable set of statements.

create table if not exists users (
  id               uuid primary key default gen_random_uuid(),
  email            text unique not null,
  display_name     text,
  target_language  text not null default 'pt-PT',
  ui_locale        text not null default 'en-GB',
  marketing_opt_in boolean not null default false,
  created_at       timestamptz not null default now(),
  last_seen_at     timestamptz,
  -- Soft delete first, hard delete by the purge job. Gives us a window to undo a
  -- support mistake without keeping data indefinitely.
  deleted_at       timestamptz
);

create table if not exists sessions (
  id            text primary key,          -- opaque, high-entropy, hashed at rest
  user_id       uuid not null references users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  last_seen_at  timestamptz not null default now(),
  user_agent    text
);
create index if not exists sessions_user_idx on sessions(user_id);
create index if not exists sessions_expiry_idx on sessions(expires_at);

-- Magic links. We store only the hash, so a leaked database cannot be used to log in.
create table if not exists login_tokens (
  token_hash  text primary key,
  email       text not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  request_ip  text
);
create index if not exists login_tokens_email_idx on login_tokens(email);

-- The learner state blob. Keyed by device id so anonymous play persists across a
-- reload, then claimed by user_id at sign-in.
create table if not exists learners (
  device_id   text primary key,
  user_id     uuid references users(id) on delete cascade,
  state       jsonb not null,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index if not exists learners_user_idx on learners(user_id);

-- Telemetry. Append-only. `name` is a short verb, `payload` carries the specifics.
create table if not exists events (
  id         bigserial primary key,
  device_id  text,
  user_id    uuid references users(id) on delete set null,
  name       text not null,
  payload    jsonb not null default '{}'::jsonb,
  at         timestamptz not null default now()
);
create index if not exists events_device_idx on events(device_id, at desc);
create index if not exists events_name_idx on events(name, at desc);

create table if not exists feedback (
  id            bigserial primary key,
  device_id     text,
  user_id       uuid references users(id) on delete set null,
  tester_label  text,
  answers       jsonb not null,
  at            timestamptz not null default now()
);

-- Money. `plan` and `status` are ours, not Stripe's vocabulary, so a second store
-- (StoreKit, Google Play) can populate the same row shape.
create table if not exists subscriptions (
  user_id               uuid primary key references users(id) on delete cascade,
  source                text not null default 'stripe',   -- stripe | apple | google | comp
  plan                  text not null default 'free',     -- free | pro
  status                text not null default 'inactive', -- active | trialing | past_due | canceled | inactive
  stripe_customer_id    text,
  stripe_subscription_id text,
  external_id           text,                             -- StoreKit / Play transaction id
  current_period_end    timestamptz,
  cancel_at_period_end  boolean not null default false,
  updated_at            timestamptz not null default now()
);
create index if not exists subs_customer_idx on subscriptions(stripe_customer_id);

-- Stripe redelivers webhooks. Recording the event id makes handling idempotent.
create table if not exists webhook_events (
  id          text primary key,
  source      text not null default 'stripe',
  type        text,
  received_at timestamptz not null default now()
);

-- The Booth. Real human voices, submitted by natives and by learners.
--   status: pending -> approved | rejected
--   A `line_id` is a content id (root_id, branch index, or piece id), not free text.
create table if not exists voice_takes (
  id          uuid primary key default gen_random_uuid(),
  line_id     text not null,
  line_pt     text not null,
  user_id     uuid references users(id) on delete set null,
  device_id   text,
  blob_url    text not null,
  duration_ms integer,
  locale      text not null default 'pt-PT',
  region      text,                                       -- Lisboa, Porto, Açores, Brasil…
  speaker_kind text not null default 'learner',           -- native | learner
  status      text not null default 'pending',
  approvals   integer not null default 0,
  rejections  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists voice_line_idx on voice_takes(line_id, status);
create index if not exists voice_user_idx on voice_takes(user_id);
