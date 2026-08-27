-- A code that also opens the Club.
--
-- The Club's door is real and should stay real: five vibes and the seven Legend Card
-- questions, answered in Portuguese. That gate IS the product, so it does not get
-- weakened to make testing convenient.
--
-- But somebody has to be able to see the room to build it, and grinding five vibes on a
-- phone before every look is not a workflow. So it is a property of the CODE rather than
-- a switch in the app: admin-issued, one flag, and a code without it opens nothing it
-- did not open yesterday.

alter table comp_codes add column if not exists grants_club boolean not null default false;
