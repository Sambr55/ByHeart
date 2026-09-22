-- A calendar somebody can subscribe to from their own phone.
--
-- The point of this table is that a phone's calendar app is NOT a browser. It fetches a
-- URL on a schedule, with no cookies, no session and no chance to sign in — so the URL
-- itself has to say who it is for. That is a bearer token, and a bearer token in a
-- calendar subscription is a URL that will sit in somebody's phone settings for years and
-- be handed to whoever asks for a screenshot of it.
--
-- So it is scoped to the smallest thing that is useful: what is on in a city, filtered to
-- the genres somebody chose. It carries no name, no progress, nothing about the learner,
-- and it cannot be used to read or write anything else. Leaked, it reveals which kinds of
-- event somebody likes — which is the same thing the feed is FOR, and why the row can be
-- deleted and re-minted from the app in one tap.
--
-- ONE PER LEARNER RATHER THAN ONE PER SUBSCRIPTION. A calendar subscription that changes
-- its address every time somebody adjusts a filter is a calendar subscription that breaks
-- every time somebody adjusts a filter, and the phone gives no warning — it just quietly
-- stops updating. The token is stable and the filters are read at fetch time.

create table if not exists calendar_feeds (
  token       text primary key,
  -- UNIQUE, because the upsert depends on it and because the token must be stable: one
  -- device has one subscription, and adjusting the filters edits it rather than minting a
  -- second URL the phone will never be told about.
  device_id   text not null unique,
  user_id     text,
  chapter     text not null,
  -- The genres this feed carries. Empty means all of them, which is what a learner who
  -- has never opened the filters expects: they subscribed to "what is on", not to nothing.
  genres      text[] not null default '{}',
  -- How many events a week this feed is willing to place in somebody's diary. Sam: "how
  -- many event drop notifications they want to receive per week or month". A calendar is
  -- somebody's own space and a feed that fills it is uninstalled.
  per_week    int not null default 3,
  created_at  timestamptz not null default now(),
  fetched_at  timestamptz,
  -- Counted rather than logged: the only question worth asking of a feed is whether
  -- anything is actually reading it, and a row nobody has fetched in a month is a
  -- subscription somebody removed without telling us.
  fetches     int not null default 0
);

create index if not exists calendar_feeds_user on calendar_feeds (user_id);
