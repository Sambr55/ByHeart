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
 * corners are Lisbon's: Partida, Miradouro, Férias, A mesa.
 */
import type { Purpose } from '@/content/situations'

export type CornerId = 'start' | 'miradouro' | 'ferias' | 'mesa'

export interface Corner {
  /** On the square: Portuguese, short enough for a 50px tile. */
  pt: string
  /** What it is, in English, on its sheet. */
  title: string
  /** One line on the sheet, for this reason for being here. */
  body: string
}

/*
  THE CORNERS, BY REASON FOR BEING HERE. Same four places on every board; what they say is
  the visitor's, the season's or the mover's. Partida is the start of the lap and, once the
  board's rooms are laid, its finish — the practice session that opens the next board.
*/
export const CORNERS: Record<Purpose, Record<CornerId, Corner>> = {
  visiting: {
    start: { pt: 'Partida', title: 'Start', body: 'Round the board, room by room. Back here and the next stretch of the trip opens.' },
    miradouro: {
      pt: 'Miradouro',
      title: 'The viewpoint',
      body: 'Stop and look back down the hill: everything you can already say on this trip, with its sound.',
    },
    ferias: {
      pt: 'Férias',
      title: 'A holiday from the holiday',
      body: 'You made it halfway round. Take a week off: nothing on your path slips out of place while you’re away.',
    },
    mesa: {
      pt: 'A mesa',
      title: 'Eat where Lisbon eats',
      body: 'Take your lines to a tasca table — with whoever you’re travelling with, in Portuguese, for one dinner.',
    },
  },
  staying: {
    start: { pt: 'Partida', title: 'Start', body: 'Round the board, room by room. Back here and the next part of the season opens.' },
    miradouro: {
      pt: 'Miradouro',
      title: 'The viewpoint',
      body: 'Stop and look back over the weeks: everything you can already say, with its sound.',
    },
    ferias: {
      pt: 'Férias',
      title: 'A week off',
      body: 'Halfway round. Take a week off: nothing on your path slips out of place while you’re away.',
    },
    mesa: {
      pt: 'A mesa',
      title: 'Host a table',
      body: 'The same faces, round one table: host an evening with friends, and DUB brings the lines for it.',
    },
  },
  moving: {
    start: { pt: 'Partida', title: 'Start', body: 'Round the board, room by room. Back here and the next part of the move opens.' },
    miradouro: {
      pt: 'Miradouro',
      title: 'The viewpoint',
      body: 'Stop and look back at how far the move has come: everything you can already say, with its sound.',
    },
    ferias: {
      pt: 'Férias',
      title: 'A week off the paperwork',
      body: 'Halfway round. Take a week off: nothing on your path slips out of place while you’re away.',
    },
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
 * prize. Set it and the corner's sheet shows the prize and its entry link.
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
    i('hold_your_horses'),
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
    i('speak_of_the_devil'),
    c('muito_hack'),
    c('e_hack'),
    i('the_penny_dropped'),
    c('mente_hack'),
    c('bluff_move'),
    i('storm_in_a_teacup'),
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
    i('the_last_straw'),
    c('opposites_hack'),
    c('bluff_react'),
    i('bobs_your_uncle'),
    c('e_hack'),
    c('bluff_move'),
  ],
}
