-- Tester access without an account.
--
-- Redeeming a comp code required a user id, and a user id required a magic link, and
-- the magic link required an email sender that is not configured — so on a live domain
-- the comp system was reachable by nobody. Worse, an account is the wrong thing to ask
-- a test cohort for: they are on their own phones for ten minutes, and DUB's whole
-- premise is that it works with no account at all.
--
-- So a code can also be redeemed against the device cookie. Same codes, same table,
-- same uses counter — only the thing it is bound to differs.
--
-- Deliberately NOT part of `subscriptions`: that table is keyed on user_id and is the
-- single source of truth for BILLING. A device grant is not a subscription, nobody has
-- paid, and conflating the two would put rows Stripe never made into the table the
-- webhook owns.

create table if not exists device_comps (
  device_id    text primary key,
  code         text not null references comp_codes(code) on delete cascade,
  plan         text not null default 'pro',
  grants_until timestamptz,               -- null = a permanent grant
  created_at   timestamptz not null default now()
);

-- A device grant is looked up on every entitlements call, which the picker makes on
-- every load. The primary key covers it; this is only for the reverse question, "who
-- redeemed this code", which is how a cohort gets counted.
create index if not exists device_comps_code_idx on device_comps (code);
