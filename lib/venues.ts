import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { db } from '@/lib/db'
import { gemById, visibleGems } from '@/content/gems'
import { DRAW_TERMS, FIRST_REWARD, PAIR_REWARD, PAIR_TIER, PAIR_WINDOW_H, SECOND_OFFERS, type SecondOffer } from '@/content/board'
import { MAX_WRONG_PINS, drawOn, nearEnough, pairOffered, tiersHeld, validPin, type VenueOffer } from '@/lib/venue-rules'
import { pinHash } from '@/lib/venue-pin'

/**
 * REWARDS ON THE GROUND, ON THE SERVER (Sam, 2026-11-05). content/board.ts says what they
 * are; lib/venue-rules.ts holds the rules; this file is every read and write of
 * db/migrations/015_venues.sql.
 *
 *   CHECK-IN     a signed-in learner at a venue, once each, ever — by location, or by the
 *                venue's DUB card, which they ask for in Portuguese at the counter.
 *   COUNTS       per venue, for everybody to see, from day one, partner or not: the number
 *                a local partner walks in with ("48 of our learners have been here").
 *   CLAIM        an admin makes a claim link; the partner hands it to the venue, which
 *                sets its rewards and a 4-digit staff PIN on its own phone. No venue app.
 *   VOUCHERS     made when the learner looks, from the count and the venue's choices, so
 *                a venue that signs at 48 owes nobody a back-fill. Spent with the PIN.
 *   BICA A DOIS  a learner and the friend they brought in, checked in at one venue within
 *                PAIR_WINDOW_H hours: a voucher each, where the venue chose to give one.
 *   DRAW         entries recorded only while PRIZE_DRAW is on. Nothing is drawn by code.
 *
 * NO DATABASE: everything reports 'unavailable' — there is no in-memory version, because
 * a reward that disappears on a restart is worse than none.
 */

const sha = (s: string) => createHash('sha256').update(s).digest('hex')
const token = (n = 18) => randomBytes(n).toString('base64url')
/* The card code goes on a QR: short, unambiguous, no 0/O or 1/I. */
const CARD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const cardCode = () => Array.from(randomBytes(8), (b) => CARD_ALPHABET[b % CARD_ALPHABET.length]).join('')

export type Proof = { card: string } | { lat: number; lng: number; accuracy: number }

export async function checkIn(
  userId: string,
  gemId: string | null,
  proof: Proof,
): Promise<{ ok: true; gem: string; count: number; method: 'geo' | 'card'; first: boolean; pair: boolean } | { ok: false; error: string }> {
  const sql = db()
  if (!sql) return { ok: false, error: 'unavailable' }
  let gem = gemId ? gemById(gemId) : undefined
  let method: 'geo' | 'card'
  if ('card' in proof) {
    const [v] = await sql<{ gem: string; paused: boolean }[]>`select gem, paused from venues where card = ${proof.card.toUpperCase()}`
    if (!v) return { ok: false, error: 'card' }
    gem = gemById(v.gem)
    method = 'card'
  } else {
    if (!gem) return { ok: false, error: 'gem' }
    if (!nearEnough(gem, proof)) return { ok: false, error: 'far' }
    method = 'geo'
  }
  if (!gem || !visibleGems().some((g) => g.id === gem!.id)) return { ok: false, error: 'gem' }
  const ins = await sql`
    insert into venue_checkins (gem, user_id, method) values (${gem.id}, ${userId}, ${method})
    on conflict (gem, user_id) do nothing
  `
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from venue_checkins where gem = ${gem.id}`
  const pair = ins.count > 0 ? await pairUp(gem.id, userId) : false
  return { ok: true, gem: gem.id, count: n, method, first: ins.count > 0, pair }
}

export interface Partner extends VenueOffer {
  second_item: string | null
  offer_pair: boolean
  pair_item: string | null
}

/*
  THE FRIENDS A LEARNER BROUGHT IN, AND THE ONE WHO BROUGHT THEM — invitations that have
  LANDED (the friend said their first room out loud), either direction. An invitation names
  a user when it was sent or taken up signed in, and otherwise a device; a device belongs to
  a user once they sign in (learners.user_id, lib/store.ts claimDevice). So both are asked.
*/
async function pairedWith(userId: string): Promise<string[]> {
  const sql = db()
  if (!sql) return []
  const rows = await sql<{ id: string | null }[]>`
    with mine as (select device_id from learners where user_id = ${userId}),
    landed as (
      select i.*, coalesce(i.from_user, (select l.user_id from learners l where l.device_id = i.from_device and l.user_id is not null limit 1)) as fu,
                  coalesce(i.to_user,   (select l.user_id from learners l where l.device_id = i.to_device   and l.user_id is not null limit 1)) as tu
        from invites i
       where i.landed_at is not null
         and (i.from_user = ${userId} or i.to_user = ${userId} or i.from_device in (select device_id from mine) or i.to_device in (select device_id from mine))
    )
    select case when fu = ${userId} then tu else fu end as id from landed
  `
  return [...new Set(rows.map((r) => r.id).filter((x): x is string => Boolean(x) && x !== userId))]
}

/**
 * BICA A DOIS, at check-in: if this learner's friend (either way round) checked in here
 * within the window, both get the venue's pair voucher — once each per venue, ever, by the
 * table's own (gem, user_id, tier) key. True when this check-in made one.
 */
async function pairUp(gemId: string, userId: string): Promise<boolean> {
  const sql = db()
  if (!sql) return false
  const [v] = await sql<{ offer_pair: boolean; paused: boolean }[]>`
    select offer_pair, paused from venues where gem = ${gemId} and claimed_at is not null
  `
  if (!pairOffered(v ?? null)) return false
  const friends = await pairedWith(userId)
  if (!friends.length) return false
  const [mine] = await sql<{ at: Date }[]>`select at from venue_checkins where gem = ${gemId} and user_id = ${userId}`
  if (!mine) return false
  const near = await sql<{ user_id: string }[]>`
    select user_id from venue_checkins
     where gem = ${gemId} and user_id = any(${friends}::uuid[])
       and abs(extract(epoch from (at - ${mine.at}::timestamptz))) <= ${PAIR_WINDOW_H * 3600}
     order by at desc limit 1
  `
  if (!near.length) return false
  let made = false
  for (const u of [userId, near[0].user_id]) {
    const r = await sql`
      insert into venue_vouchers (id, gem, user_id, tier) values (${token(12)}, ${gemId}, ${u}, ${PAIR_TIER})
      on conflict (gem, user_id, tier) do nothing
    `
    if (u === userId && r.count > 0) made = true
  }
  return made
}

/** Every venue's count, the partners' offers, and — signed in — where this learner has been. */
export async function venueBoard(userId: string | null): Promise<{
  counts: Record<string, number>
  partners: Record<string, Partner>
  mine: string[]
  draw: boolean
} | null> {
  const sql = db()
  if (!sql) return null
  const counts = await sql<{ gem: string; n: number }[]>`select gem, count(*)::int as n from venue_checkins group by gem`
  const partners = await sql<(Partner & { gem: string })[]>`
    select gem, offer_first, offer_second, second_item, paused, offer_pair, pair_item from venues where claimed_at is not null
  `
  const mine = userId ? await sql<{ gem: string }[]>`select gem from venue_checkins where user_id = ${userId}` : []
  return {
    counts: Object.fromEntries(counts.map((r) => [r.gem, r.n])),
    partners: Object.fromEntries(
      partners.map((p) => [
        p.gem,
        { offer_first: p.offer_first, offer_second: p.offer_second as SecondOffer, second_item: p.second_item, paused: p.paused, offer_pair: p.offer_pair, pair_item: p.pair_item },
      ]),
    ),
    mine: mine.map((r) => r.gem),
    draw: drawOn() && DRAW_TERMS !== null,
  }
}

export interface VoucherView {
  id: string
  gem: string
  venue: string
  /** 1 and 2: the 50 and 150 rewards. 3: Bica a dois. */
  tier: 1 | 2 | 3
  what: string
  usedAt: string | null
  locked: boolean
}

/** This learner's rewards, made on first look. */
export async function vouchersFor(userId: string): Promise<VoucherView[] | null> {
  const sql = db()
  if (!sql) return null
  const rows = await sql<(Partner & { gem: string; n: number })[]>`
    select v.gem, v.offer_first, v.offer_second, v.second_item, v.paused,
           (select count(*)::int from venue_checkins c2 where c2.gem = v.gem) as n
      from venue_checkins c
      join venues v on v.gem = c.gem and v.claimed_at is not null
     where c.user_id = ${userId}
  `
  for (const r of rows) {
    for (const tier of tiersHeld(r.n, { ...r, offer_second: r.offer_second as SecondOffer })) {
      await sql`
        insert into venue_vouchers (id, gem, user_id, tier) values (${token(12)}, ${r.gem}, ${userId}, ${tier})
        on conflict (gem, user_id, tier) do nothing
      `
    }
  }
  const held = await sql<{ id: string; gem: string; tier: number; used_at: Date | null; wrong_pins: number; second_item: string | null; offer_second: string; pair_item: string | null }[]>`
    select w.id, w.gem, w.tier, w.used_at, w.wrong_pins, v.second_item, v.offer_second, v.pair_item
      from venue_vouchers w join venues v on v.gem = w.gem
     where w.user_id = ${userId}
     order by w.used_at nulls first, w.unlocked_at desc
  `
  return held.map((h) => ({
    id: h.id,
    gem: h.gem,
    venue: gemById(h.gem)?.name ?? h.gem,
    tier: h.tier === PAIR_TIER ? 3 : h.tier === 2 ? 2 : 1,
    what:
      h.tier === PAIR_TIER
        ? PAIR_REWARD.name + ': ' + (h.pair_item?.trim() || PAIR_REWARD.fallback)
        : h.tier === 2
          ? h.second_item?.trim() || SECOND_OFFERS[h.offer_second as SecondOffer]?.label || 'On the house'
          : FIRST_REWARD,
    usedAt: h.used_at ? new Date(h.used_at).toISOString() : null,
    locked: h.wrong_pins >= MAX_WRONG_PINS,
  }))
}

/** Spend a voucher: the staff type their PIN on the learner's phone. */
export async function redeem(userId: string, id: string, pin: unknown): Promise<'used' | 'wrong' | 'locked' | 'spent' | 'cap' | 'gone' | 'unavailable'> {
  const sql = db()
  if (!sql) return 'unavailable'
  const [w] = await sql<{ gem: string; tier: number; used_at: Date | null; wrong_pins: number; pin_hash: string | null; weekly_cap: number | null; offer_second: string }[]>`
    select w.gem, w.tier, w.used_at, w.wrong_pins, v.pin_hash, v.weekly_cap, v.offer_second
      from venue_vouchers w join venues v on v.gem = w.gem
     where w.id = ${id} and w.user_id = ${userId}
  `
  if (!w) return 'gone'
  if (w.used_at) return 'spent'
  if (w.wrong_pins >= MAX_WRONG_PINS) return 'locked'
  if (!validPin(pin) || !w.pin_hash || pinHash(w.gem, pin) !== w.pin_hash) {
    await sql`update venue_vouchers set wrong_pins = wrong_pins + 1 where id = ${id}`
    return w.wrong_pins + 1 >= MAX_WRONG_PINS ? 'locked' : 'wrong'
  }
  if (w.tier === 2 && w.offer_second === 'meal_all' && w.weekly_cap) {
    const [{ n }] = await sql<{ n: number }[]>`
      select count(*)::int as n from venue_vouchers where gem = ${w.gem} and tier = 2 and used_at > now() - interval '7 days'
    `
    if (n >= w.weekly_cap) return 'cap'
  }
  const done = await sql`update venue_vouchers set used_at = now() where id = ${id} and used_at is null`
  return done.count ? 'used' : 'spent'
}

// ---------------------------------------------------------------------------
// Signing a venue up
// ---------------------------------------------------------------------------

/** Admin: a claim link for the local partner to hand over, and the venue's card code. */
export async function makeClaim(gemId: string): Promise<{ token: string; card: string } | 'gem' | 'unavailable'> {
  const sql = db()
  if (!sql) return 'unavailable'
  if (!gemById(gemId)) return 'gem'
  const t = token()
  const card = cardCode()
  await sql`
    insert into venues (gem, claim_hash, card) values (${gemId}, ${sha(t)}, ${card})
    on conflict (gem) do update set claim_hash = excluded.claim_hash
  `
  const [v] = await sql<{ card: string }[]>`select card from venues where gem = ${gemId}`
  return { token: t, card: v.card }
}

export async function claimFor(t: string): Promise<{ gem: string; claimed: boolean; card: string } | null> {
  const sql = db()
  if (!sql) return null
  const [v] = await sql<{ gem: string; claimed_at: Date | null; card: string }[]>`
    select gem, claimed_at, card from venues where claim_hash = ${sha(t)}
  `
  return v ? { gem: v.gem, claimed: Boolean(v.claimed_at), card: v.card } : null
}

/** The venue, on its own phone: who to contact, the staff PIN, and what it offers. */
export async function claim(
  t: string,
  o: { contactName: string; contact: string; pin: unknown; offerFirst: boolean; offerSecond: SecondOffer; item: string; cap: number | null; offerPair: boolean; pairItem: string },
): Promise<'ok' | 'gone' | 'pin' | 'offer' | 'unavailable'> {
  const sql = db()
  if (!sql) return 'unavailable'
  const v = await claimFor(t)
  if (!v) return 'gone'
  if (!validPin(o.pin)) return 'pin'
  if (!(o.offerSecond in SECOND_OFFERS) || (o.offerSecond === 'meal_draw' && !drawOn())) return 'offer'
  const clip = (s: string, n: number) => s.replace(/\s+/g, ' ').trim().slice(0, n)
  await sql`
    update venues set
      claimed_at = coalesce(claimed_at, now()),
      contact_name = ${clip(o.contactName, 60)}, contact = ${clip(o.contact, 120)},
      pin_hash = ${pinHash(v.gem, o.pin)},
      offer_first = ${o.offerFirst}, offer_second = ${o.offerSecond},
      second_item = ${clip(o.item, 60) || null},
      weekly_cap = ${o.cap && o.cap > 0 ? Math.min(500, Math.floor(o.cap)) : null},
      offer_pair = ${o.offerPair}, pair_item = ${clip(o.pairItem, 60) || null}
    where gem = ${v.gem}
  `
  return 'ok'
}

/** Admin: every venue, its count, and whether it has signed up. */
export async function adminVenues(): Promise<{ gem: string; count: number; status: 'none' | 'invited' | 'partner' | 'paused'; card: string | null; contact: string | null; used: number }[] | null> {
  const sql = db()
  if (!sql) return null
  const counts = await sql<{ gem: string; n: number }[]>`select gem, count(*)::int as n from venue_checkins group by gem`
  const vs = await sql<{ gem: string; claimed_at: Date | null; paused: boolean; card: string; contact_name: string | null; contact: string | null }[]>`
    select gem, claimed_at, paused, card, contact_name, contact from venues
  `
  const used = await sql<{ gem: string; n: number }[]>`select gem, count(*)::int as n from venue_vouchers where used_at is not null group by gem`
  const c = new Map(counts.map((r) => [r.gem, r.n]))
  const u = new Map(used.map((r) => [r.gem, r.n]))
  const v = new Map(vs.map((r) => [r.gem, r]))
  return visibleGems()
    .map((g) => {
      const x = v.get(g.id)
      return {
        gem: g.id,
        count: c.get(g.id) ?? 0,
        status: !x ? 'none' : !x.claimed_at ? 'invited' : x.paused ? 'paused' : 'partner',
        card: x?.card ?? null,
        contact: x ? [x.contact_name, x.contact].filter(Boolean).join(' · ') || null : null,
        used: u.get(g.id) ?? 0,
      } as const
    })
    .sort((a, b) => b.count - a.count)
}

export async function setPaused(gemId: string, paused: boolean): Promise<boolean> {
  const sql = db()
  if (!sql) return false
  const r = await sql`update venues set paused = ${paused} where gem = ${gemId}`
  return r.count > 0
}

// ---------------------------------------------------------------------------
// The prize draw
// ---------------------------------------------------------------------------

export async function enterDraw(userId: string, board: string, kinds: ('board' | 'venues')[]): Promise<number | 'off' | 'unavailable'> {
  if (!drawOn() || !DRAW_TERMS) return 'off'
  const sql = db()
  if (!sql) return 'unavailable'
  for (const k of kinds) {
    await sql`insert into draw_entries (user_id, board, kind) values (${userId}, ${board}, ${k}) on conflict do nothing`
  }
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from draw_entries where user_id = ${userId}`
  return n
}
