/**
 * START HERE — the website's step one, as the level before Level 1 (Sam, 2026-11-03).
 *
 * The home page promises: "You'll start with the saves, the basics and the fun phrases that
 * build your confidence — the sentence that saves you, counting to twenty, the cheats and
 * bluffs that make a little Portuguese go a long way, and the lines you already know."
 * The app went straight from set-up to the rooms, so it did not keep that promise. These
 * tiles are it, in the same order and from the same content the website's strip is synced
 * from (dub-site scripts/sync-app.mts), so the two cannot disagree about what step one is.
 *
 * Content rule (the website's, kept here): DUB-authored lines and song titles; Goose may
 * appear but never leads; no Bond. So the fun lines are a chat-up line, a song and an idiom.
 *
 * Done is `start_done` (engine/learner.ts) — opened, heard, "Got it" — except the save,
 * which is a real room and is done when the room is (finished_cards).
 */
import { CHEATS } from '@/content/cheats'
import { IDIOMS } from '@/content/idioms'
import { say } from '@/content/numbers'
import { rootById } from '@/content/roots'
import { VIBE_IMAGES } from '@/content/vibe-images'
import { situationById } from '@/content/situations'

export type StartKind = 'save' | 'basics' | 'cheat' | 'hack' | 'bluff' | 'chat' | 'song' | 'idiom'

export interface StartTile {
  id: string
  kind: StartKind
  /** Big type on the tile — the idea, like the website's cards. */
  face: string
  /** One line: what it gives you. */
  does: string
  lines: { pt: string; en: string }[]
  /** The one thing worth knowing. */
  note?: string
  /** Idioms: the word-for-word nonsense, struck through. */
  literal?: string
  image?: { src: string; alt: string }
  /** The save is a room; everything else opens in place. */
  room?: string
  /** Where to practise it properly afterwards. */
  more?: { href: string; label: string }
}

export const KIND_LABEL: Record<StartKind, string> = {
  save: 'The save',
  basics: 'Basics',
  cheat: 'Cheat',
  hack: 'Hack',
  bluff: 'Bluff',
  chat: 'Chat-up',
  song: 'Song',
  idiom: 'Idiom',
}

function fromCheat(id: string): StartTile {
  const c = CHEATS.find((x) => x.id === id)
  if (!c) throw new Error('start-here names a cheat the app does not have: ' + id)
  return {
    id: 'cheat:' + id,
    kind: c.kind,
    face: c.shape,
    does: c.does,
    lines: c.says,
    note: c.note,
    more: { href: '/revise?kind=cheat&id=' + encodeURIComponent(id), label: 'Practise it cold' },
  }
}

function fromRoot(id: string, kind: 'chat' | 'song', face: string, vibe: keyof typeof VIBE_IMAGES): StartTile {
  const r = rootById(id)
  if (!r) throw new Error('start-here names a root the app does not have: ' + id)
  const keep = (r.branches ?? []).find((b) => b.en)
  return {
    id: 'root:' + id,
    kind,
    face,
    does: r.root_display,
    lines: [{ pt: r.target, en: r.root_display }, ...(keep ? [{ pt: keep.target, en: keep.en as string }] : [])],
    image: VIBE_IMAGES[vibe],
  }
}

function fromIdiom(id: string): StartTile {
  const i = IDIOMS.find((x) => x.id === id)
  if (!i) throw new Error('start-here names an idiom the app does not have: ' + id)
  return {
    id: 'idiom:' + id,
    kind: 'idiom',
    face: i.english,
    does: 'You say “' + i.english + '”. They say “' + i.equivalent + '”.',
    literal: i.literal,
    lines: [{ pt: i.equivalent, en: i.gloss || i.english }],
    image: { src: '/idioms/' + id + '.jpg', alt: i.clue },
    more: { href: '/revise?kind=idiom&id=' + encodeURIComponent(id), label: 'Practise it cold' },
  }
}

export const SAVE_ROOM = 'lisbon_save'

export const START_HERE: StartTile[] = [
  {
    id: 'save',
    kind: 'save',
    face: 'S.O.S.',
    does: 'The sentence that saves you when it goes past you.',
    lines: [{ pt: 'Desculpe, não percebi.', en: 'Sorry, I didn’t catch that.' }],
    room: SAVE_ROOM,
    image: situationById(SAVE_ROOM)?.image ? { src: situationById(SAVE_ROOM)!.image!.src, alt: situationById(SAVE_ROOM)!.image!.alt } : undefined,
  },
  {
    id: 'count',
    kind: 'basics',
    face: '1 → 20',
    does: 'Count to twenty: prices, platforms, times, tables.',
    lines: [
      { pt: [1, 2, 3, 4, 5].map((n) => say(n)).join(', '), en: 'One to five' },
      { pt: [6, 7, 8, 9, 10].map((n) => say(n)).join(', '), en: 'Six to ten' },
      { pt: [11, 12, 13, 14, 15].map((n) => say(n)).join(', '), en: 'Eleven to fifteen' },
      { pt: [16, 17, 18, 19, 20].map((n) => say(n)).join(', '), en: 'Sixteen to twenty' },
    ],
    note: 'Sixteen to nineteen are ten-and-six, ten-and-seven, run together: dezasseis, dezassete. Then you can build the rest.',
    more: { href: '/revise?kind=sheet&id=numbers_to_100', label: 'Practise the numbers' },
  },
  fromCheat('nao_verb'),
  fromCheat('cao_hack'),
  fromCheat('bluff_time'),
  fromRoot('fl_m_posso_oferecer', 'chat', 'A DRINK?', 'flirting_m2f'),
  fromRoot('dd_wolf', 'song', 'DURAN DURAN', 'duran_duran_lisboa'),
  fromIdiom('bobs_your_uncle'),
]

/** Is this tile met? The save by its room; the rest by start_done. */
export function startTileDone(t: StartTile, r: { finished_cards?: string[]; start_done?: string[] }): boolean {
  if (t.room) return (r.finished_cards ?? []).includes(t.room) || (r.start_done ?? []).includes(t.id)
  return (r.start_done ?? []).includes(t.id)
}

export function startProgress(r: { finished_cards?: string[]; start_done?: string[] }) {
  const done = START_HERE.filter((t) => startTileDone(t, r)).length
  return { done, total: START_HERE.length, complete: done === START_HERE.length }
}
