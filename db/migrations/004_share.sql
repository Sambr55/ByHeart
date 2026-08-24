-- The growth loop.
--
-- Sharing a text blob asks the reader to go and look DUB up. A link does the work for
-- them, and the Portuguese belongs in the image rather than in a caption people scroll
-- past. The snapshot is frozen at creation on purpose: a card somebody posted in August
-- should still say what it said in August, not silently update as they learn more.

create table if not exists share_cards (
  id         text primary key,          -- short, public
  user_id    uuid references users(id) on delete set null,
  device_id  text,                      -- anonymous learners share too
  snapshot   jsonb not null,            -- frozen: lines, counts, date
  created_at timestamptz not null default now()
);

create index if not exists share_cards_user on share_cards (user_id);

-- The waitlist. Needs none of the account work: an email, where they heard about it,
-- and nothing else. Nobody is asked for a name they have no reason to give yet.
create table if not exists waitlist (
  email      text primary key,
  note       text,
  locale     text,
  created_at timestamptz not null default now()
);
