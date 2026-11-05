-- WHAT HAPPENED, NOT ONLY WHAT IS (2026-11-05). Sam: "I need an admin function to see
-- registrations, sign-ups and cancels". `subscriptions` holds each person's state now; this
-- holds the moments — a trial starting, a trial turning into a payment, a cancel, an end —
-- written by lib/billing.ts syncSubscription as Stripe reports them, and the free access
-- given to existing users at launch (lib/comp.ts compExisting). Additive.
create table if not exists billing_events (
  id          bigserial primary key,
  user_id     uuid references users(id) on delete cascade,
  device_id   text,
  -- trial_started | converted | subscribed | cancel_requested | cancel_undone | ended | payment_failed | comped
  kind        text not null,
  -- month | year | founding | existing | a comp code
  detail      text,
  at          timestamptz not null default now()
);
create index if not exists billing_events_at on billing_events (at desc);
create index if not exists billing_events_user on billing_events (user_id);
