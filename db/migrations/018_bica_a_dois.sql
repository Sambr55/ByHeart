-- BICA A DOIS (Sam, 2026-11-05: "ok do it"): a venue may give something to two DUB friends
-- who check in there together — the learner who brought the other one in, and the one
-- brought in. The venue chooses, as it chooses its 150 reward. Off by default.
--
-- Numbered 018, not 016: 016 and 017 belong to the accounts-billing branch (PR #44).
-- Additive: two columns on venues. The voucher is a venue_vouchers row with tier 3.
alter table venues add column if not exists offer_pair boolean not null default false;
alter table venues add column if not exists pair_item text;
