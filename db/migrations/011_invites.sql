-- Bringing somebody in, and what it earns.
--
-- Sam: "This app is primarily for ex-pats and they are all about community, finding and
-- helping each other in a foreign city. But one of the side effects of ex-pats is they
-- then converse in their own language and dont work hard enough to learn the local
-- language. That is where we are going to come in."
--
-- So the thing being rewarded is NOT a signup. An invite that paid on acceptance would
-- reward an ex-pat for adding another English speaker to their phone, which is the
-- behaviour the product exists to counteract. It pays when the person they brought can
-- SAY THEIR LEGEND COLD — the one event in DUB that means somebody has actually learned
-- something. A fake account earns nothing because a fake account cannot speak Portuguese.
--
-- NO CONTACTS, NO PHONE NUMBERS, NO ADDRESSES. The invite travels through the operating
-- system's own share sheet, which already knows the sender's contacts and is a UI they
-- trust. DUB never reads the phone book and this schema has nowhere to put it: an invite
-- is a code, who minted it, and who redeemed it. That is a deliberate ceiling on what
-- this feature can become.

create table if not exists invites (
  -- Short and unguessable, like a showing id. It IS the invitation — it travels in a URL
  -- and there is nothing else to carry.
  code            text primary key,

  -- Who is asking. A user when there is one, and always the device, for the same reason
  -- showings record both: DUB works signed out and an invite minted before signing in
  -- still belongs to that person afterwards.
  from_user       uuid references users(id) on delete set null,
  from_device     text,

  -- Which city and language this was sent about, so a community can be counted by the
  -- thing it has in common rather than by who knows whom. Sam: "We need to BUILD
  -- communities around language and cities."
  chapter         text,
  pair            text,

  -- Who took it up. Null until somebody opens the link on their own device and starts.
  -- One redeemer per code: an invite is an introduction to a person, not a coupon.
  to_user         uuid references users(id) on delete set null,
  to_device       text,

  created_at      timestamptz not null default now(),
  accepted_at     timestamptz,

  -- WHEN THE PERSON BROUGHT IN SAID THEIR LEGEND COLD, which is the only event that
  -- pays. Null for an invite that was accepted and never earned anything, which is a
  -- normal and permanent state.
  landed_at       timestamptz,

  -- What each side was given when it landed, so a grant is never issued twice. Null
  -- means nothing has been paid against this invite yet.
  paid_from_at    timestamptz,
  paid_to_at      timestamptz,

  -- Invitations do not sit open for ever.
  expires_at      timestamptz not null
);

create index if not exists invites_from on invites (from_user, from_device);
create index if not exists invites_to on invites (to_user, to_device);

-- The open ones, for the screen that lists who you are waiting on.
create index if not exists invites_open on invites (created_at)
  where landed_at is null;

-- A device may only ever redeem one invite, ever. Without this, clearing an app's storage
-- is a way to mint free months for whoever holds the code — the device id is the only
-- stable thing about somebody who has not signed in, so it is where the limit has to sit.
create unique index if not exists invites_one_per_device on invites (to_device)
  where to_device is not null;
