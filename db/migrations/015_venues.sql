-- REWARDS ON THE GROUND (2026-11-05): check-ins at real venues, venues that sign up to
-- reward them, the vouchers that unlock, and prize-draw entries. content/board.ts says what
-- each is for; lib/venues.ts is the only code that reads or writes these tables.
--
-- Additive: four new tables, nothing existing is touched. Everything here belongs to a
-- signed-in user (Sam, 2026-11-05: accounts for check-ins and rewards, "yes") and is deleted
-- with them — lib/store.ts deleteUser.

-- One row per learner per venue, ever: the count that unlocks rewards is unique learners.
create table if not exists venue_checkins (
  gem             text not null,
  user_id         uuid not null references users(id) on delete cascade,
  -- 'geo' (within the venue's radius) or 'card' (the DUB card asked for at the counter)
  method          text not null,
  at              timestamptz not null default now(),
  primary key (gem, user_id)
);
create index if not exists venue_checkins_by_user on venue_checkins (user_id);

-- A venue that has signed up. Rows are created by an admin (a claim link for the local
-- partner to hand over) and completed by the venue itself on that link.
create table if not exists venues (
  gem             text primary key,
  -- sha256 of the claim link's token; cleared once claimed
  claim_hash      text unique,
  claimed_at      timestamptz,
  contact_name    text,
  contact         text,
  -- sha256 of gem + the staff PIN; vouchers are spent with it
  pin_hash        text,
  -- the code printed on the venue's DUB card (its QR goes to /v/<card>)
  card            text unique not null,
  offer_first     boolean not null default true,
  -- content/board.ts SecondOffer
  offer_second    text not null default 'none',
  second_item     text,
  weekly_cap      int,
  paused          boolean not null default false,
  created_at      timestamptz not null default now()
);

-- A reward a learner holds at a venue. Created lazily when the learner looks (lib/venues.ts
-- vouchersFor), so a venue that signs at 48 needs no back-fill job.
create table if not exists venue_vouchers (
  id              text primary key,
  gem             text not null,
  user_id         uuid not null references users(id) on delete cascade,
  tier            int not null,
  unlocked_at     timestamptz not null default now(),
  used_at         timestamptz,
  wrong_pins      int not null default 0,
  unique (gem, user_id, tier)
);
create index if not exists venue_vouchers_by_user on venue_vouchers (user_id);

-- Prize-draw entries: one per board finished, and one for every venue on it said there.
-- Recorded only while PRIZE_DRAW is on; nothing is drawn by code.
create table if not exists draw_entries (
  user_id         uuid not null references users(id) on delete cascade,
  board           text not null,
  kind            text not null,
  at              timestamptz not null default now(),
  primary key (user_id, board, kind)
);
