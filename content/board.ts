/**
 * THE BOARD — the third way to see the path, beside the Panel and the Road (Sam, 2026-11-05).
 *
 * Sam: "a third method of navigating DUB alongside tiles/roadmap … the user starts in one
 * place, travels around the outside of the board until they reach the next level and a new
 * board. Along the way they complete cards, unlock surprises (the fun cards), visit venues,
 * are encouraged to set up a table, go to jail = win a holiday. All content must be 'reason
 * for visit' tailored. Styled like the tile board."
 *
 * And on the follow-ups: "no dice. Voice progression needs to be optional … Holiday will be
 * real, I will just need to find someone to put one up."
 *
 * This file is the CONTENT of the board — what each reason for being here gets on its
 * corners and its postcards. The shape (which square is where, who has reached what) is
 * worked out in components/path/lap.ts from the same pathView as the Panel and the Road, so
 * the three views can never disagree.
 *
 * NOT A FAMOUS BOARD GAME. A track round a board is a game form older than any brand; what a
 * brand owns is its names and its look. So nothing here is called Go, Jail, Free Parking,
 * Chance or Community Chest (or the Portuguese editions' Sorte and Caixa da Comunidade);
 * there is no money, no property, no rent, no houses, no coloured band across a square, no
 * fixed forty squares. The boards are azulejo, change shape with the level, and their
 * corners are Lisbon's: Partida, A mesa, and Até agora (so far) before home.
 */
import type { Purpose } from '@/content/situations'
import type { ChapterId } from '@/content/chapters'

/*
 * THREE CORNERS (Sam, 2026-11-10). Férias, the week off, went: "it doesn't add anything".
 * Miradouro went with its metaphor ("I don't like the metaphor, it should be a summary of
 * your trip so far") and came back as Até agora — so far — the LAST square of every board,
 * just before Partida, which opens the level recap. The board waits there until it is seen.
 */
export type CornerId = 'start' | 'trip' | 'mesa'

export interface Corner {
  /** On the square: Portuguese, short enough for a 50px tile. */
  pt: string
  /** What it is, in English, on its sheet. */
  title: string
  /** One line on the sheet, for this reason for being here. */
  body: string
}

/*
  THE CORNERS, BY REASON FOR BEING HERE. Same three places on every board; what they say is
  the visitor's, the season's or the mover's. Partida is the start of the lap and, once the
  board's rooms are laid, its finish — the practice session that opens the next board.
*/
export const CORNERS: Record<Purpose, Record<CornerId, Corner>> = {
  visiting: {
    start: { pt: 'Partida', title: 'Start', body: 'Round the board, room by room. Back here and the next stretch of the trip opens.' },
    trip: { pt: 'Até agora', title: 'Your trip so far', body: 'Everything this board gave you, in one place: what you can now say, with its sound, and a quick test. Then the next board.' },
    mesa: {
      pt: 'A mesa',
      title: 'Eat where the locals eat',
      body: 'Take your lines to a tasca table — with whoever you’re travelling with, in Portuguese, for one dinner.',
    },
  },
  staying: {
    start: { pt: 'Partida', title: 'Start', body: 'Round the board, room by room. Back here and the next part of the season opens.' },
    trip: { pt: 'Até agora', title: 'Your season so far', body: 'Everything this board gave you, in one place: what you can now say, with its sound, and a quick test. Then the next board.' },
    mesa: {
      pt: 'A mesa',
      title: 'Host a table',
      body: 'The same faces, round one table: host an evening with friends, and DUB brings the lines for it.',
    },
  },
  moving: {
    start: { pt: 'Partida', title: 'Start', body: 'Round the board, room by room. Back here and the next part of the move opens.' },
    trip: { pt: 'Até agora', title: 'Your move so far', body: 'Everything this board gave you, in one place: what you can now say, with its sound, and a quick test. Then the next board.' },
    mesa: {
      pt: 'A mesa',
      title: 'Host your first table',
      body: 'New city, new people: host an evening round one table, and DUB brings the lines for it.',
    },
  },
}

/** How long a holiday lasts: a week, during which nothing on the path drifts. */
export const HOLIDAY_DAYS = 7

/**
 * THE REAL HOLIDAY (Sam, 2026-11-05: "Holiday will be real, I will just need to find someone
 * to put one up").
 *
 * Null until there is a sponsor AND terms Sam has approved: a UK prize draw needs a free
 * route to enter, closing dates and a named promoter, and none of that is copy to guess at.
 * While it is null the Férias corner gives the in-app week off and says nothing about a
 * prize. Set it AND switch HOLIDAY_DRAW=on (Sam, 2026-11-05: "put the holiday behind a
 * switch") and the corner's sheet shows the prize and its entry link.
 */
export const HOLIDAY_PRIZE: { title: string; body: string; href: string; terms: string } | null = null

/*
  THE POSTCARDS — the fun stops between rooms, by reason for being here. Bluffs and hacks
  from the library (content/cheats.ts) and the Lost in translation idioms; the order is the
  argument. A visitor gets the bluffs that get them through a counter; somebody staying gets
  the ones that keep small talk going; somebody moving gets the ones for a queue and a form.
  Ids are checked against CHEATS and IDIOMS by scripts/lap-check.mts.
*/
export type PostcardRef = { kind: 'cheat' | 'idiom'; id: string }

const c = (id: string): PostcardRef => ({ kind: 'cheat', id })
const i = (id: string): PostcardRef => ({ kind: 'idiom', id })

export const POSTCARDS: Record<Purpose, PostcardRef[]> = {
  visiting: [
    c('bluff_time'),
    c('cao_hack'),
    i('piece_of_cake'),
    c('isto_hack'),
    c('bluff_agree'),
    i('touch_wood'),
    c('mente_hack'),
    c('bluff_react'),
    i('not_my_cup_of_tea'),
    c('coisa_hack'),
    c('bluff_move'),
    i('break_a_leg'),
    c('muito_hack'),
    c('bluff_dodge'),
  ],
  staying: [
    c('bluff_agree'),
    c('bluff_react'),
    i('elephant_in_the_room'),
    c('muito_hack'),
    c('e_hack'),
    i('the_penny_dropped'),
    c('mente_hack'),
    c('bluff_move'),
    i('writings_on_the_wall'),
    c('opposites_hack'),
    c('cao_hack'),
    i('plenty_more_fish'),
    c('bluff_time'),
    c('coisa_hack'),
  ],
  moving: [
    c('bluff_time'),
    c('cao_hack'),
    i('bite_the_bullet'),
    c('bluff_dodge'),
    c('coisa_hack'),
    i('keep_your_hair_on'),
    c('mente_hack'),
    c('bluff_agree'),
    i('what_goes_around'),
    c('opposites_hack'),
    c('bluff_react'),
    i('blessing_in_disguise'),
    c('e_hack'),
    c('bluff_move'),
  ],
}

/*
  EACH BOARD IS A REAL WALK (Sam, 2026-11-05: "I want to explore putting real venues into
  the board from the language walks"). Board n takes the n-th walk in its path's order, and
  the walk's stops, in walking order, are the board's venue squares; postcards and what's on
  fill the rest. The order is the argument again: a trip starts on the famous hills, a season
  where the same faces recognise you, a move where people actually live. Ids are walk ids
  from content/walks.ts, checked by scripts/lap-check.mts. The basics board (index 0) gets
  the first walk too — nobody should wait a level to meet a real place.
*/
export const WALK_ORDER: Record<Purpose, string[]> = {
  visiting: ['graca-saturday', 'mouraria-down', 'alfama-back-steps', 'campo-de-ourique-village', 'marvila-east', 'anjos-people'],
  staying: ['campo-de-ourique-village', 'anjos-people', 'graca-saturday', 'mouraria-down', 'marvila-east', 'alfama-back-steps'],
  moving: ['anjos-people', 'campo-de-ourique-village', 'marvila-east', 'mouraria-down', 'graca-saturday', 'alfama-back-steps'],
}

/**
 * A TOWN'S BOARDS (2026-11-05): its own walks first, in the order they are written, then
 * Lisbon's for that reason for being here — Cascais and Sintra are forty minutes from
 * Lisbon on the train, so the later boards are the day trip in, not the same two walks again.
 */
export function boardWalks(chapter: ChapterId, purpose: Purpose, own: string[]): string[] {
  return chapter === 'lisbon' ? WALK_ORDER[purpose] : [...own, ...WALK_ORDER[purpose].filter((id) => !own.includes(id))]
}

/**
 * REWARDS ON THE GROUND (Sam, 2026-11-05): "This takes the app from winning pointless points
 * to actual reward on the ground."
 *
 * A venue's count is the number of DUB learners who have checked in there — once each,
 * ever. At FIRST every learner who has checked in, the first fifty included, gets 25% off one
 * visit (fixed for every venue, Sam: "as recommended"). At SECOND the venue's own choice
 * unlocks (Sam: "let venues choose"). Only venues that have signed up give rewards; every
 * venue counts from day one, so a venue that signs at 48 unlocks almost at once.
 */
export const REWARD_TIERS = { first: 50, second: 150 } as const
export const FIRST_REWARD = '25% off one visit'

export type SecondOffer = 'none' | 'meal_all' | 'small_item' | 'meal_draw'
export const SECOND_OFFERS: Record<SecondOffer, { label: string; venue: string }> = {
  none: { label: '', venue: 'Nothing at 150 for now' },
  meal_all: { label: 'A free meal', venue: 'A free meal for each of them (you set a weekly cap)' },
  small_item: { label: 'Something on the house', venue: 'Something small on the house for each of them — a coffee, a pastel, a glass' },
  /* A draw is a prize draw: offered to venues only while PRIZE_DRAW is on (see lib/venues.ts). */
  meal_draw: { label: 'A monthly draw for dinner for two', venue: 'A monthly draw among them for dinner for two' },
}

/**
 * BICA A DOIS (Sam, 2026-11-05) — bring a friend in, then say it together at the counter.
 *
 * When a learner and the friend they brought into DUB (the invitation has LANDED: the friend
 * has said their first room out loud — lib/invites.ts) both check in at the same venue
 * within PAIR_WINDOW_H hours, each gets one voucher there, if that venue has chosen to
 * offer it. The venue pays for it and gets two customers who walked in speaking
 * Portuguese; the friend gets a reason to come out. Once per person per venue, ever, like
 * the check-in itself, and spent with the venue's staff PIN like any other voucher.
 */
export const PAIR_REWARD = {
  name: 'Bica a dois',
  /** What the learner sees when the venue has not named its own. */
  fallback: 'A bica each, on the house',
  /** What the venue is asked, on its sign-up link. */
  venue: 'Bica a dois: when a DUB learner comes in with the friend they brought to DUB and both check in, give each of them something small',
} as const
export const PAIR_WINDOW_H = 3
/** venue_vouchers.tier for the pair voucher (1 and 2 are the 50 and 150 rewards). */
export const PAIR_TIER = 3

/**
 * HOW CLOSE IS CLOSE ENOUGH to check in by location: the venue's pin plus this, and the
 * phone's own accuracy must be under GEO_ACCURACY_M. A partner venue's DUB card is the
 * stronger proof — asked for in Portuguese at the counter — and needs no location at all.
 */
export const GEO_RADIUS_M = 150
export const GEO_ACCURACY_M = 120

/**
 * THE DRAW'S TERMS — null until a lawyer has read them and Sam has approved them. While
 * null, /draw says the draw is not running even if PRIZE_DRAW is switched on by mistake,
 * because a draw without terms is the one thing worse than no draw.
 */
export const DRAW_TERMS: { promoter: string; closes: string; prizes: string; body: string } | null = null
