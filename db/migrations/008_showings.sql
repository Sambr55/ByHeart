-- Showing: one member shows one other person their proof card.
--
-- Not a follow graph. There is no `follows` table here on purpose — a follow is a
-- standing claim on somebody's attention, and a showing is one card, once. The row is an
-- artefact plus consent, and when the consent has not been returned there is nothing
-- mutual to see.
--
-- Both an account and a device can be a party. DUB works signed out by design, and the
-- proof card is free at every tier; requiring an account to show one would gate the one
-- artefact that brings people in.

create table if not exists showings (
  id             text primary key,        -- short, unguessable, and the whole invitation

  -- Who is showing. A user when there is one, and always the device, so a showing made
  -- signed out still belongs to somebody after they sign in.
  from_user      uuid references users(id) on delete set null,
  from_device    text,

  -- Who may look. Null until somebody opens the link and shows one back — this is the
  -- column that makes the thing mutual rather than a broadcast.
  to_user        uuid references users(id) on delete set null,
  to_device      text,

  card_id        text not null references share_cards(id) on delete cascade,
  return_card_id text references share_cards(id) on delete set null,

  created_at     timestamptz not null default now(),
  -- Invitations do not sit open for ever. Once returned, the pair keeps it.
  expires_at     timestamptz not null,
  returned_at    timestamptz
);

create index if not exists showings_from on showings (from_user, from_device);
create index if not exists showings_to on showings (to_user, to_device);

-- Blocking. One-sided to invoke, two-directional in effect: the person who blocks does
-- not have to be the one who would be contacted again.
create table if not exists showing_blocks (
  id             bigserial primary key,
  blocker_user   uuid references users(id) on delete cascade,
  blocker_device text,
  blocked_user   uuid references users(id) on delete cascade,
  blocked_device text,
  created_at     timestamptz not null default now()
);

-- Reports. A closed set of reasons and no free text anywhere, which is the property that
-- keeps the moderation obligation small enough to actually honour.
create table if not exists showing_reports (
  id              bigserial primary key,
  showing_id      text references showings(id) on delete cascade,
  reporter_user   uuid references users(id) on delete set null,
  reporter_device text,
  reason          text not null,
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz
);

create index if not exists showing_reports_open on showing_reports (created_at)
  where reviewed_at is null;
