-- The Line: web push subscriptions.
--
-- Keyed by endpoint because that is what the push service considers the identity of a
-- subscription — the same person on two phones is two rows, and reinstalling the app
-- issues a new endpoint rather than reusing the old one.
--
-- `last_line_at` and `sent` exist so the cron can be run more than once a day without
-- sending twice, and so nobody is ever taught the same sentence on two mornings.

create table if not exists push_subscriptions (
  endpoint      text primary key,
  device_id     text,
  user_id       uuid references users(id) on delete cascade,
  p256dh        text not null,
  auth          text not null,
  -- Where they are, so 8am means 8am. Falls back to Europe/Lisbon.
  time_zone     text not null default 'Europe/Lisbon',
  created_at    timestamptz not null default now(),
  last_line_at  timestamptz,
  -- Line ids already sent, so the same sentence never arrives twice.
  sent          text[] not null default '{}',
  -- Set when the push service tells us the subscription is dead.
  expired_at    timestamptz
);
create index if not exists push_device_idx on push_subscriptions(device_id);
create index if not exists push_live_idx on push_subscriptions(expired_at) where expired_at is null;
