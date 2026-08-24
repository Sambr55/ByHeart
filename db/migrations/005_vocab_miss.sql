-- A learner typing a word DUB cannot answer is a content brief, unprompted and free.
--
-- The most valuable moment in the library is the dead end: somebody searched for
-- "chave" and got nothing. That is a better backlog than any survey, because it is
-- what a real learner reached for at the moment they reached for it, and nobody had
-- to be asked a question.
--
-- Deliberately thin. No learner text beyond the query itself, and the query is the
-- whole point of the row.
create table if not exists vocab_miss (
  id          bigserial primary key,
  device_id   text,
  user_id     uuid references users (id) on delete set null,
  query       text not null,
  -- Which scope they were in when it missed. A miss in Mine is a different fact from
  -- a miss in All: the first means "I have it somewhere", the second means "DUB does
  -- not teach this at all", and only the second is a content brief.
  scope       text not null default 'all',
  at          timestamptz not null default now()
);

create index if not exists vocab_miss_query_idx on vocab_miss (query);
create index if not exists vocab_miss_at_idx on vocab_miss (at desc);
