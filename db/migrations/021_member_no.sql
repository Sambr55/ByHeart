-- MEMBER NUMBERS (2026-11-18). Sam: the sign-in "doesn't feel meaty enough". Signing in
-- now makes you a sócio of the Dub Club, with a card that carries a number: sócio nº 0042.
--
-- Everybody who already has an account is numbered in the order they joined, so the first
-- people in keep the low numbers. New accounts take the next one from the sequence.
-- Additive: one column, one sequence, one unique index. Nothing reads it until this has run
-- (lib/auth.ts memberFor reads it on its own and treats a missing column as "no number").

alter table users add column if not exists member_no integer;

create sequence if not exists users_member_no_seq owned by users.member_no;

with ordered as (
  select id, row_number() over (order by created_at, id) as n
    from users
)
update users u
   set member_no = o.n
  from ordered o
 where u.id = o.id
   and u.member_no is null;

-- Start the sequence after the highest number handed out, or at 1 on an empty table.
select setval(
  'users_member_no_seq',
  greatest(1, (select coalesce(max(member_no), 0) from users)),
  (select count(*) > 0 from users where member_no is not null)
);

alter table users alter column member_no set default nextval('users_member_no_seq');

create unique index if not exists users_member_no_idx on users (member_no);
