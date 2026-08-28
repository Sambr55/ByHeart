-- The translator's asks.
--
-- Two jobs, and the second is the reason this is a table rather than a log line.
--
-- It is the best content backlog DUB will ever have. vocab_miss records what somebody
-- searched the library for and did not find; this records what they actually wanted to
-- SAY, in their own words, at the moment they wanted to say it. That is the list a
-- language product should be authored from.
--
-- And it is the meter. A free-form box wired to a paid API is the one place in DUB where
-- a stranger can spend money, so the cap is counted off rows written here rather than
-- held in a process that a serverless platform is free to recycle between two requests.
create table if not exists translation (
  id bigserial primary key,
  device_id text,
  user_id text,
  -- What they typed, and what came back. Both kept: an answer without its question is
  -- unreadable a week later, and the question alone is the half that cannot be checked.
  ask text not null,
  answer text,
  note text,
  -- 'en-pt' or 'pt-en'. Which way somebody reaches is itself a finding.
  direction text,
  -- Whether they pressed KEEP. The strongest signal on the row: not "was this asked" but
  -- "was this worth keeping", which is the difference between traffic and demand.
  kept boolean not null default false,
  at timestamptz not null default now()
);

create index if not exists translation_device_at_idx on translation (device_id, at desc);
create index if not exists translation_at_idx on translation (at desc);
create index if not exists translation_ask_idx on translation (ask);
