-- YOUR TABLE (2026-11-03): an evening a host puts together for their own friends.
-- content/table-night.ts and lib/hosted.ts.
--
-- Additive: two new tables, nothing existing is touched. Parties are the device cookie
-- (lib/auth.ts `ensureDevice`), so a guest needs no account to say "I'm in". The only
-- personal data is a first name each, typed by the person themselves; nothing is kept
-- about who invited whom beyond the table they share.

create table if not exists hosted_tables (
  code            text primary key,
  host_device     text not null,
  host_name       text not null,
  chapter         text not null default 'lisbon',
  -- a gem id from content/gems.ts, or null when the host typed their own place
  gem             text,
  place           text not null,
  sits_at         timestamptz not null,
  house_rule      text not null default 'ten',
  -- which round every phone at the table is on; moved by the host only
  round           int not null default 0,
  state           text not null default 'on',
  created_at      timestamptz not null default now()
);

create table if not exists hosted_guests (
  code            text not null references hosted_tables(code) on delete cascade,
  device          text not null,
  name            text not null,
  joined_at       timestamptz not null default now(),
  primary key (code, device)
);

create index if not exists hosted_tables_by_host on hosted_tables (host_device);
create index if not exists hosted_guests_by_device on hosted_guests (device);
