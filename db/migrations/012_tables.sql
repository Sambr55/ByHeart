-- A table: six people who can already say the same things, and one night.
--
-- Sam: "The problem with ex-pats is they hang out together and never feel a pressing need
-- to learn the new language... take a look at timeleft.com — why cant we do that?"
--
-- WE CAN DO BETTER THAN THAT, AND THE REASON IS THE ONLY THING DUB MEASURES. Timeleft
-- seats you by a language dropdown you tick yourself; 20,000 people in Lisbon alone, and
-- every one of them self-declared. DUB WATCHED YOU SAY IT. A seat here is earned by proof
-- rather than claimed on a form, which is a table nobody else can assemble.
--
-- AND IT IS THE ANSWER TO SAM'S OWN DIAGNOSIS. Expats default to English because English
-- is always available and nobody at the table knows what anybody else can do. A table
-- where everyone's Legend is open changes which direction the social pressure runs: the
-- first ten minutes are in Portuguese BECAUSE EVERYBODY THERE HAS ALREADY DONE IT, and
-- then English for the rest of the night with no shame. A ritual with a defined end,
-- rather than a resolution somebody breaks by nine o'clock.
--
-- DUB MATCHES, IT DOES NOT HOST. Sam: "match the people, not run the dinners." There is no
-- venue in this schema, no booking, no money and no no-show handling, because the moment
-- those exist this is a logistics company rather than a language product. A table names a
-- place somebody else already chose and a time; what happens there is between the people.
--
-- WHAT IS DELIBERATELY ABSENT, and each one is a door this must not open:
--   no messaging between members     — that is moderation, safety and a different company
--   no photographs                   — engine/avatar.ts keeps a face off the server
--   no surnames, no contact details  — a first name is what you are called in a room
--   no location of a person          — a table has a place; a member does not
-- The schema has nowhere to put any of it, which is a ceiling rather than a convention.

create table if not exists tables (
  id              text primary key,

  -- Which market's content this belongs to. Lisbon today; the column exists so a second
  -- city is a row rather than a migration.
  chapter         text not null default 'lisbon',

  -- Where and when, as somebody would say it out loud. A place DUB did not book.
  place           text not null,
  area            text,
  sits_at         timestamptz not null,

  -- How many seats. Six is the number Timeleft settled on and it is right for the same
  -- reason: four is a conversation nobody can leave, eight is two conversations.
  seats           int not null default 6,

  -- Drafted, open for seats, full, or called off. A table is never deleted — somebody
  -- planned an evening around it and the history is theirs.
  state           text not null default 'open',

  created_at      timestamptz not null default now()
);

-- A seat is a person at a table, and the row is the whole of their commitment.
create table if not exists seats (
  table_id        text not null references tables(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,

  -- WHAT THEY COULD SAY WHEN THEY SAT DOWN, counted at the moment they took the seat.
  --
  -- Stamped rather than read live, and that is the honest choice: a table is matched on
  -- what people can say THE WEEK IT IS ARRANGED, and somebody who learns forty more words
  -- between booking and Wednesday has not stopped belonging at it. Reading it live would
  -- quietly re-sort a room that has already agreed to meet.
  said_cold       int not null default 0,

  -- Taken, or given back. A seat released stays as a row so the same person cannot take
  -- and release repeatedly to hold a place.
  state           text not null default 'taken',

  took_at         timestamptz not null default now(),

  primary key (table_id, user_id)
);

create index if not exists seats_by_user on seats (user_id);
create index if not exists tables_open on tables (chapter, sits_at) where state = 'open';
