-- What each phone wants to hear about (2026-11-04).
--
-- cadence: how often the morning line comes — 'daily', 'three' (Mon, Wed, Fri) or 'off'.
-- topics:  which of the other kinds it takes — 'week' (Monday's place in Lisbon) and
--          'table' (who is coming to your table, and a reminder before it sits).
-- Defaults keep every existing subscriber on exactly what they signed up for: a line
-- every morning. The new kinds are switched on by default for them too, but nothing is
-- sent for either until PUSH_WEEKLY / PUSH_TABLES are set to 'on' in the environment.

alter table push_subscriptions add column if not exists cadence text not null default 'daily';
alter table push_subscriptions add column if not exists topics text[] not null default '{week,table}';
