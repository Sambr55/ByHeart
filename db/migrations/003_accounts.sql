-- Comping, and the two columns the account needs to know who somebody is.
--
-- The mechanism for granting Pro already existed: entitlementsFor grants it to any
-- active plan='pro' row whatever its source, and source already accepts 'comp'. What
-- was missing was any way to WRITE such a row, so testers, native reviewers and Booth
-- voices had no way to be given the product.

alter table users add column if not exists first_seen_at timestamptz;
alter table users add column if not exists referred_by text;
alter table users add column if not exists locale_country text;

create table if not exists comp_codes (
  code         text primary key,          -- short, human-typable
  plan         text not null default 'pro',
  note         text,                      -- 'tester cohort 2', 'native reviewer'
  max_uses     integer not null default 1,
  uses         integer not null default 0,
  expires_at   timestamptz,               -- null = the code never stops working
  grants_until timestamptz,               -- null = a permanent grant
  created_at   timestamptz not null default now()
);

create table if not exists comp_redemptions (
  code       text not null references comp_codes(code) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (code, user_id)
);
