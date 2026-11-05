/**
 * SEARCHING YOURS (Sam, 2026-11-05: "we may want to improve the organisation of yours and
 * add a search facility").
 *
 * One flat index of everything a learner has, in Portuguese and English, each entry saying
 * where it lives (Level 2 · At the café, Words, Hacks, Places …) and where tapping it goes.
 * Built from the same derivations the screens already use — whatYouCanSay, collected,
 * metOn — so the search can never find something Yours does not show, or miss something
 * it does. Pure: no React, no storage. Everything is already on the device, so it needs no
 * server.
 */
import { collected, decks, cardHref } from '@/content/collection'
import { STAGES } from '@/content/legend'
import { IDIOMS } from '@/content/idioms'
import { PIECES } from '@/content/roots'
import { gemById } from '@/content/gems'
import { visibleWalks } from '@/content/walks'
import { placeKeysToGems, whatYouCanSay } from '@/content/yours'
import { metStop, unitById } from '@/content/level'
import type { LearnerState } from '@/engine/learner'

export interface Found {
  /** The Portuguese, when the thing has some. */
  pt?: string
  en: string
  /** Where it lives in Yours. */
  where: string
  href: string
}

export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

type Me = Partial<
  Pick<
    LearnerState,
    | 'finished_cards'
    | 'proof'
    | 'purpose'
    | 'profile'
    | 'inventory'
    | 'sheet_got'
    | 'sections_completed'
    | 'legend'
    | 'drops_done'
    | 'cheats_used'
    | 'idioms_got'
    | 'asked'
    | 'card_levels'
    | 'walk_stops'
    | 'board_met'
  >
>

export function yoursIndex(me: Me, now: Date = new Date()): Found[] {
  const out: Found[] = []
  const seen = new Set<string>()
  const add = (f: Found) => {
    const k = fold((f.pt ?? '') + '|' + f.en + '|' + f.where)
    if (seen.has(k)) return
    seen.add(k)
    out.push(f)
  }

  /* Every line of every room, under its level. */
  const can = whatYouCanSay({ finished_cards: me.finished_cards, proof: me.proof, purpose: me.purpose ?? null, profile: me.profile }, now)
  can.levels.forEach((lvl) => {
    const n = lvl.id === 'elsewhere' ? null : unitById(lvl.id, me.purpose ?? null, now)?.level
    for (const room of lvl.rooms)
      for (const l of room.lines)
        add({
          pt: l.pt,
          en: l.en,
          where: (n ? 'Level ' + n : lvl.title) + ' · ' + room.title,
          href: n ? '/level/' + encodeURIComponent(lvl.id) : '/revise?kind=room&id=' + encodeURIComponent(room.id),
        })
  })

  /* Every word owned. */
  for (const id of Object.keys(me.inventory ?? {})) {
    const p = PIECES[id]
    if (p?.target && p.gloss) add({ pt: p.target, en: p.gloss, where: 'Words', href: '/revise?kind=words&id=' + encodeURIComponent(p.shelf) })
  }

  /* Every card the library holds, by its deck — sentences you asked for and idioms carry their Portuguese. */
  /* The level a card was finished at does not matter to a search, so any one will do. */
  const [{ id: anyLevel }] = STAGES
  const all = collected({
    sheet_got: me.sheet_got ?? [],
    sections_completed: me.sections_completed ?? [],
    legend: me.legend ?? [],
    drops_done: me.drops_done ?? [],
    cheats_used: me.cheats_used ?? [],
    idioms_got: me.idioms_got ?? [],
    asked: me.asked ?? [],
    inventory: me.inventory ?? {},
    card_levels: me.card_levels ?? {},
    stageNow: anyLevel,
  })
  const askedPt = new Map((me.asked ?? []).filter((a) => a?.pt).map((a) => [a.en || a.pt, a.pt]))
  for (const d of decks(all)) {
    if (d.id === 'words') continue
    for (const c of d.cards) {
      if (!c.done) continue
      const pt = c.kind === 'idiom' ? IDIOMS.find((i) => i.id === c.id)?.equivalent : c.kind === 'asked' ? askedPt.get(c.label) : undefined
      add({ pt, en: c.label, where: d.label.charAt(0) + d.label.slice(1).toLowerCase(), href: cardHref(c) })
    }
  }

  /* Places you have said it. */
  const said = me.walk_stops ?? []
  for (const w of visibleWalks()) for (const s of w.stops) if (said.includes(s.key)) add({ en: s.g.name, where: 'Places you’ve said it', href: '/city?gem=' + s.g.id })
  for (const id of placeKeysToGems(said)) {
    const g = gemById(id)
    if (g) add({ en: g.name, where: 'Places you’ve said it', href: '/city?gem=' + g.id })
  }

  /* And what each board showed you. */
  for (const key of me.board_met ?? []) {
    const m = metStop(key)
    if (!m) continue
    const unit = key.split(':')[1]
    const n = unitById(unit, me.purpose ?? null, now)?.level
    add({ en: m.title, where: m.what + (n ? ' · met on Level ' + n : ''), href: m.href })
  }

  return out
}

/** Matches in Portuguese or English, accents optional: "cafe" finds "café". */
export function searchYours(index: Found[], q: string, limit = 40): Found[] {
  const want = fold(q)
  if (want.length < 2) return []
  const hits = index.filter((f) => fold((f.pt ?? '') + ' ' + f.en + ' ' + f.where).includes(want))
  /* What you said or own first: a match on the line itself beats a match on where it lives. */
  const own = (f: Found) => (fold((f.pt ?? '') + ' ' + f.en).includes(want) ? 0 : 1)
  return hits.sort((a, b) => own(a) - own(b)).slice(0, limit)
}
