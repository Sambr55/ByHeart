-- Invitations that landed while the device grant could not be written (until 2026-11-09).
--
-- lib/invites.ts grant() inserted device_comps with code 'INVITE-<code>', which no comp_codes
-- row named, so the foreign key refused it — after the invite had already been marked paid.
-- Every landed invitation whose side was a device (no account) therefore paid nothing. This
-- gives those devices the thirty days they were promised, from today. Idempotent: a device
-- that already has any grant is left alone, and running it twice inserts nothing new.

insert into comp_codes (code, plan, note, max_uses, uses)
select 'INVITE-' || code, 'pro', 'An invitation that landed (repaired 2026-11-09)', 2, 0
  from invites where landed_at is not null
on conflict (code) do nothing;

insert into device_comps (device_id, code, plan, grants_until)
select from_device, 'INVITE-' || code, 'pro', now() + interval '30 days'
  from invites
 where landed_at is not null and from_user is null and from_device is not null
on conflict (device_id) do nothing;

insert into device_comps (device_id, code, plan, grants_until)
select to_device, 'INVITE-' || code, 'pro', now() + interval '30 days'
  from invites
 where landed_at is not null and to_user is null and to_device is not null
on conflict (device_id) do nothing;
