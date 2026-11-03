import type { Situation } from '@/content/situations'
import { CHEATS } from '@/content/cheats'
import { IDIOMS } from '@/content/idioms'

/**
 * ONE FUN TILE IN EVERY LEVEL (Sam, 2026-11-03: "We put in too many fun lines up front. I
 * think every section should have a fun section thrown in — idioms, cheats, hacks etc.").
 *
 * Built from content the app already teaches — a cheat or hack or bluff (content/cheats.ts),
 * an idiom (content/idioms.ts), a chat-up line or a song (content/roots.ts) — and shaped as
 * a room, so it is a tile on the Panel, a stop on the Road and plays in the room screen like
 * the rest. Nothing here is new Portuguese; it is the existing lines in a new place.
 *
 * Content rule, as on the website: DUB-authored lines and song titles, no Bond; Goose is
 * not used. Every one is free (lib/entitlements.ts).
 */
const ALL = ['visiting', 'staying', 'moving'] as const
const KIND = { cheat: 'Cheat', hack: 'Hack', bluff: 'Bluff' } as const

/* The photographs are the website's (dub-site public/moments), described as it describes them. */
const ALT: Record<string, string> = {
  cao_hack: 'A ring of old brass keys on a tiled windowsill.',
  bluff_time: 'A small hourglass beside a glass of cherry liqueur on a café table.',
  bluff_react: 'Two friends laughing at a café table at dusk, wine glasses in focus.',
}

function cheatRoom(id: string): Situation {
  const c = CHEATS.find((x) => x.id === id)
  if (!c) throw new Error('fun room names a cheat the app does not have: ' + id)
  return {
    id: 'fun_' + id,
    chapter: 'lisbon',
    kind: 'moment',
    purposes: [...ALL],
    title: KIND[c.kind] + ': ' + c.shape,
    why: c.does,
    lines: c.says.map((l, i) => ({
      pt: l.pt,
      en: l.en,
      when: i === 0 ? c.does : i === 1 && c.note ? c.note : 'The same shape again — that is the whole trick.',
    })),
    release: { ask: c.says[0].en, answer: c.says[0].pt },
    image: { src: '/rooms/fun_' + id + '.jpg', alt: ALT[id] ?? c.shape, rights_status: 'generated' },
    rung: 1,
    pieces: c.needs,
  }
}

function idiomRoom(id: string): Situation {
  const i = IDIOMS.find((x) => x.id === id)
  if (!i) throw new Error('fun room names an idiom the app does not have: ' + id)
  return {
    id: 'fun_' + id,
    chapter: 'lisbon',
    kind: 'moment',
    purposes: [...ALL],
    title: 'Idiom: ' + i.english,
    why: 'Say it word for word and they hear “' + i.literal + '” — nonsense. This is what they say instead.',
    lines: [
      { pt: i.equivalent, en: i.gloss || i.english, when: 'You say “' + i.english + '”. They say this.' + (i.note ? ' ' + i.note : '') },
    ],
    release: { ask: i.gloss || i.english, answer: i.equivalent },
    image: { src: '/idioms/' + id + '.jpg', alt: i.clue, rights_status: 'generated' },
    rung: 1,
  }
}

/*
  THE CHAT-UP LINE AND THE SONG ARE COPIED IN, not looked up: content/roots.ts imports the
  room list, so a lookup from here would be an import cycle that loads half-empty. The
  lines are the roots' own (fl_m_posso_oferecer, dd_wolf); scripts/path-check.mts holds
  them equal so they cannot drift apart.
*/
export const FUN_ROOT_LINES = {
  fl_m_posso_oferecer: {
    display: 'Can I get you a drink?',
    target: 'Posso oferecer-te uma bebida?',
    more: [
      { target: 'Posso sentar-me?', en: 'May I sit down?' },
      { target: 'Posso oferecer-te um café?', en: 'Can I get you a coffee?' },
    ],
  },
  dd_wolf: {
    display: 'Hungry Like the Wolf',
    target: 'Tenho uma fome de lobo.',
    more: [
      { target: 'Tenho fome.', en: 'I’m hungry.' },
      { target: 'Não tenho fome.', en: 'I’m not hungry.' },
    ],
  },
} as const

function rootRoom(id: keyof typeof FUN_ROOT_LINES, title: string, image: string, alt: string): Situation {
  const r = FUN_ROOT_LINES[id]
  return {
    id: 'fun_' + id,
    chapter: 'lisbon',
    kind: 'moment',
    purposes: [...ALL],
    title,
    why: r.display + ' — and the everyday Portuguese hiding inside it.',
    lines: [
      { pt: r.target, en: r.display, when: 'The line you know, the Portuguese way.' },
      ...r.more.map((b) => ({ pt: b.target, en: b.en, when: 'And what it turns into at a café counter.' })),
    ],
    release: { ask: r.more[0].en, answer: r.more[0].target },
    image: { src: image, alt, rights_status: 'generated' },
    rung: 1,
  }
}

export const LISBON_FUN: Situation[] = [
  cheatRoom('cao_hack'),
  cheatRoom('bluff_time'),
  cheatRoom('bluff_react'),
  idiomRoom('piece_of_cake'),
  idiomRoom('hold_your_horses'),
  idiomRoom('bobs_your_uncle'),
  idiomRoom('the_penny_dropped'),
  rootRoom('fl_m_posso_oferecer', 'Chat-up: can I get you a drink?', '/rooms/fun_fl_m_posso_oferecer.jpg', 'Two glasses of cold white wine touching on a stone balcony wall at night, the lights of the city below.'),
  rootRoom('dd_wolf', 'Song: Hungry Like the Wolf', '/rooms/fun_dd_wolf.jpg', 'Wet cobbles at night reflecting floodlights, a torn ticket stub on the ground beside a tiled wall.'),
]

export const FUN_IDS = LISBON_FUN.map((s) => s.id)
