-- Nudges for people who have gone quiet (2026-11-09). See lib/nudge.ts.
--
-- push_subscriptions.nudged_at  when this phone was last sent the "it's been a few days"
--                                line, so a nudge goes once and then at most weekly.
-- users.nudge_email             a separate yes to "email me if I go quiet". Separate from
--                                marketing_opt_in on purpose: that box says "drops… nothing
--                                else", so nobody who ticked it agreed to this.
-- users.nudge_emailed_at        when the last one went: at most one a week.

alter table push_subscriptions add column if not exists nudged_at timestamptz;
alter table users add column if not exists nudge_email boolean not null default false;
alter table users add column if not exists nudge_emailed_at timestamptz;
