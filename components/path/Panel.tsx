'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { ChapterId } from '@/content/chapters'
import type { Purpose } from '@/content/situations'
import { SHELVES } from '@/content/roots'
import { wordsOnShelf } from '@/content/collection'
import { panelArt, tileWord } from '@/content/panel'
import type { PathNode, PathView } from './progress'
import { keystoneGlaze, milestoneHref, type Glaze } from './progress'
import { UNLOCK_HREF } from './locks'
import { LockIcon } from './icons'

/**
 * THE PANEL — progress as a painting you reveal, tile by tile (Sam approved, 2026-11-02).
 *
 * It replaces the Wall the same day. Sam, on the Wall: "We are supposed to be building a
 * wall of beauty and tiles and progress. At the moment it looks like a badly laid out
 * PowerPoint. Either something much more elegant and aspirational with some level of
 * movement, or we go back to the Duolingo approach." He was shown this on the website
 * (dub-site-v2/components/Panel.tsx) — "you surpassed yourself there" — and chose it for
 * the app. This is a faithful port of that prototype, wired to the learner's own record.
 *
 * Lisbon's azulejos are not grids of separate tiles, they are PANELS: one blue-and-white
 * painting across dozens of squares. So each purpose path is ONE painting (content/panel.ts:
 * a trip is the view with the 28, a season a street of shopfronts, moving a house with its
 * door open), and each room is one square of it.
 *
 * HOW A ROOM'S STATE (PathNode, from pathView in progress.ts) BECOMES A TILE:
 *
 *   open     the GHOST: the painting faintly (~16%) under white glaze. You can always see
 *            what you are working towards. Tap → the room.
 *   next     the ghost, with a breathing outline. Tap → the room. No bounce, no START.
 *   paid     the ghost, with a tiny lock in the corner. Tap → /pro (roomLock, locks.ts).
 *   done     LAID: the square in full colour, flipped into place the first time you see it.
 *            Tap → the TileSheet (remind, say it cold, where it came from).
 *   + cold   laid, with a thin gold glaze at the edge — said cold, finished and it looks it.
 *   + slipping
 *            DRIFTED: knocked a little out of place. See DRIFT below.
 *
 * THE LAYOUT IS THE SITE'S: six columns, laid from the BOTTOM-LEFT upward in path order —
 * unit 1 is the lowest course, because that is how a panel goes up. When the rooms do not
 * fill the top course, the squares left over are the panel's FRIEZE, a patterned border
 * tile, so it is never ragged. Light sweeps across the glaze every seven seconds; the next
 * tile breathes; each tile's one word (content/panel.ts TILE_WORDS) fades in on hover,
 * focus or a finger. Under reduced motion nothing sweeps, flips or breathes.
 *
 * THE KEYSTONES ARE A LEGEND, NOT FRIEZES IN THE GRID. A unit's rooms flow continuously
 * across six columns, so a unit can start halfway along a course, and a strip forced
 * between units would either break the painting or leave holes in it. So, as the site
 * does, the units are listed under the panel — name, tiles laid of the unit's total, and
 * the unit's practice session as a slim labelled keystone ("TENHO DE …") glazed by its
 * 0–3 (outline → part → glazed → gold; keystoneGlaze), which opens the milestone.
 *
 * Laid tiles open the TileSheet; `onLaid` is how PathHome hears it. Unlaid tiles open the
 * room, as they always did.
 */
const COLS = 6

/** The keystone's label: the pattern it practises, by name — "POSSO …?", "TENHO DE …". */
export function keystoneLabel(unit: PathView['units'][number]['unit']): string {
  return unit.milestone.title.toUpperCase()
}

const GLAZE_WORDS: Record<Glaze, string> = {
  outline: 'not glazed yet',
  part: 'part-glazed',
  glazed: 'glazed',
  gold: 'glazed, gold-rimmed',
}

/*
  DRIFT — phase one of Sam's "restoring the panel" (2026-11-02).

  Sam remembered a sliding puzzle from childhood: "only one square was empty and you had
  to move all the others around." A tile whose words have gone quiet (`slipping`, read from
  the record in progress.ts — flagged, or untouched for SLIP_DAYS) is not cracked, not red
  and never taken away: it has just slid a little out of its place, the way a loose tile
  does, and the gap behind it shows. Putting it back is saying the room cold again
  (/revise?kind=room), which recalls its words (recallPieces) and clears `slipping` — so
  next time the panel is drawn, the tile is back where it belongs.

  UNMISTAKABLE AT A GLANCE. The first cut leaned 3–6°, and Sam, testing the same thing
  on the website the same day, said the tilts "aren't crooked enough to see". So it is the
  site's settled look now: 8–13°, lifted and shrunk a touch, a deep shadow and a white edge,
  with bare mortar showing in the bed it came out of.

  The angle is fixed per room (a hash of its id), so a drifted tile sits the same
  way every time you look, and two drifted neighbours lean differently.
*/
export function driftOf(id: string): { rot: number; dx: number; dy: number } {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0
  const sign = h & 1 ? 1 : -1
  const rot = sign * (8 + ((h >>> 1) % 51) / 10) // 8.0°–13.0°
  /* The site's offset: a little right and lifted, as if it had come away from the wall. */
  return { rot, dx: 3, dy: -4 }
}

/* Before paint in the browser (so a fresh tile never shows laid, then face-down); a plain effect on the server. */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/* Laid tiles this device has already shown. New ones flip in; old ones are simply there. */
const SEEN_KEY = 'dub.panel.seen'

export function Panel({
  view,
  purpose,
  chapter,
  inventory,
  onLaid,
  openId = null,
}: {
  view: PathView
  purpose: Purpose
  chapter: ChapterId
  inventory: Record<string, unknown>
  onLaid: (n: PathNode) => void
  /*
    The room whose sheet is open, if any. While it is, that tile alone keeps its outline
    and its word, and every other word stays hidden — Sam, testing the website's version on
    2026-11-02, saw a "DOCTOR" label beside a question about the Navegante, and a label on
    the wrong tile is worse than none.
  */
  openId?: string | null
}) {
  const art = panelArt(chapter, purpose)
  const nodes = useMemo(() => view.units.flatMap((u) => u.nodes), [view])
  const n = nodes.length
  const rows = Math.max(1, Math.ceil(n / COLS))
  const cells = rows * COLS
  /* Laid from the bottom-left, course by course, upwards. */
  const cellOf = (i: number) => (rows - 1 - Math.floor(i / COLS)) * COLS + (i % COLS)
  const byCell = new Map<number, number>()
  nodes.forEach((_, i) => byCell.set(cellOf(i), i))

  /*
    THE PAINTING IS SQUARE AND THE PANEL IS NOT (6 wide, 5 or 6 high), so it is cropped,
    centred, rather than stretched — the site's prototype stretched it, which a 6×5 panel
    shows as a 20% squash. Each cell draws its slice of a square S×S cells big, S being the
    larger side; background-position as a percentage of (cell − image) does the rest.
  */
  const S = Math.max(COLS, rows)
  const sliceOf = (c: number): CSSProperties => {
    const x = (S - COLS) / 2 + (c % COLS)
    const y = (S - rows) / 2 + Math.floor(c / COLS)
    return {
      backgroundImage: `url(${art.src})`,
      backgroundSize: `${S * 100}% ${S * 100}%`,
      backgroundPosition: `${(x / (S - 1)) * 100}% ${(y / (S - 1)) * 100}%`,
    }
  }

  /*
    THE FLIP. The site lays a tile when you press "Lay a tile"; here a tile is laid in a
    room, and you see it when you come home. So the ones laid since this device last drew
    the panel start face-down and flip into place a beat after the panel appears. On the
    very first visit nothing flips — a whole panel turning over at once is a trick, not a
    reward — and the server render, which has no localStorage, simply shows them laid.
  */
  const doneIds = useMemo(() => nodes.filter((x) => x.state === 'done').map((x) => x.room.id), [nodes])
  const [face, setFace] = useState<Set<string>>(() => new Set())
  const doneKey = doneIds.join()
  useIsoLayoutEffect(() => {
    if (doneIds.length === 0) return
    let seen: string[] | null = null
    try {
      const raw = window.localStorage.getItem(SEEN_KEY)
      seen = raw ? (JSON.parse(raw) as string[]) : null
      window.localStorage.setItem(SEEN_KEY, JSON.stringify(doneIds))
    } catch {
      /* No storage: nothing flips, which is the quiet failure. */
    }
    if (!seen) return
    const fresh = doneIds.filter((id) => !seen!.includes(id))
    if (!fresh.length) return
    setFace(new Set(fresh))
    const t = window.setTimeout(() => setFace(new Set()), 260) // --t-arrive: the panel is there first
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- doneKey is doneIds, by value
  }, [doneKey])

  const drifted = useMemo(() => nodes.filter((x) => x.slipping).slice(0, 3), [nodes])

  return (
    <section aria-labelledby="panel-caption" data-testid="panel" className={'flex flex-col gap-6' + (openId ? ' panel-open' : '')}>
      <p id="panel-caption" className="text-sm leading-snug text-muted" data-testid="panel-caption">
        <span className="font-semibold text-fg">Your panel: {art.title}</span>
        <br />
        {view.done} of {view.total} tiles laid
      </p>

      <PutBack
        drifted={drifted}
        chip={(x) => (
          <span aria-hidden className="panel-chip" style={{ ...sliceOf(cellOf(nodes.indexOf(x))), transform: `rotate(${driftOf(x.room.id).rot}deg)` }} />
        )}
      />

      <div className="panel-frame rounded-[1.25rem] p-3">
        <ol
          className="panel-sheen relative grid overflow-hidden rounded-md"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, aspectRatio: `${COLS} / ${rows}` }}
          aria-label={`Your panel, laid from the bottom: ${view.done} of ${view.total} tiles laid. ${art.alt}.`}
        >
          {Array.from({ length: cells }, (_, c) => {
            const i = byCell.get(c)
            if (i === undefined) return <li key={c} className="panel-frieze" aria-hidden="true" data-testid="frieze" />
            return (
              <li key={c} className="contents">
                <Tile node={nodes[i]} slice={sliceOf(c)} face={face.has(nodes[i].room.id)} open={nodes[i].room.id === openId} onLaid={onLaid} />
              </li>
            )
          })}
        </ol>
      </div>

      <Legend view={view} />
      <Foundation inventory={inventory} />
    </section>
  )
}

/**
 * PUT THESE BACK, up to three, and only when there are any — shared by the Panel and the
 * Road, so the one thing on the home screen that asks you for something asks it the same
 * way in both views. Above the picture because it is that one thing, and it asks gently:
 * the tiles are still laid, they have only come loose. (It was "Worth another look" on the
 * Wall.)
 *
 * Each link carries `round` — the ids in the strip — so /revise can say "2 of 3 put back"
 * when one comes home. It is counted there from the record (roomSlipping), not stored.
 */
export function PutBack({ drifted, chip }: { drifted: PathNode[]; chip: (n: PathNode) => ReactNode }) {
  if (!drifted.length) return null
  const round = drifted.map((x) => x.room.id).join(',')
  return (
    <div data-testid="put-back" className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-6 py-3">
      <p className="eyebrow text-muted">Put these back</p>
      <ul className="flex flex-wrap gap-3">
        {drifted.map((x) => (
          <li key={x.room.id}>
            <Link
              href={putBackHref(x.room.id, round)}
              className="tap-target inline-flex items-center gap-3 rounded-full border border-line-strong px-3 py-1 text-sm"
            >
              {chip(x)}
              {x.room.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Where "Put it back" goes: the room's own revision, with the strip's round if there is one. */
export function putBackHref(id: string, round?: string): string {
  return '/revise?kind=room&id=' + encodeURIComponent(id) + (round ? '&round=' + encodeURIComponent(round) : '')
}

function Tile({
  node,
  slice,
  face,
  open,
  onLaid,
}: {
  node: PathNode
  slice: CSSProperties
  face: boolean
  open: boolean
  onLaid: (n: PathNode) => void
}) {
  const { room, state, cold, slipping } = node
  const word = tileWord(room)
  const laid = state === 'done'
  const label =
    room.title +
    (laid ? (cold ? ' — laid and glazed: said cold' : ' — laid') : '') +
    (slipping ? ', slid out of place: put it back' : '') +
    (state === 'next' ? ' — up next' : '') +
    (state === 'paid' ? ' — locked, unlock with membership' : '')
  const d = slipping ? driftOf(room.id) : null
  const tileStyle: CSSProperties = d
    ? ({ ...slice, '--rot': d.rot + 'deg', '--dx': d.dx + 'px', '--dy': d.dy + 'px' } as CSSProperties)
    : slice
  const inner = (
    <>
      {d ? <span aria-hidden className="panel-gap absolute inset-0" /> : <span aria-hidden className="panel-ghost absolute inset-0" style={slice} />}
      <span
        aria-hidden
        data-drift={d ? 'true' : undefined}
        className={
          'panel-tile absolute inset-0' +
          (laid && !face ? ' is-laid' : '') +
          (cold ? ' is-cold' : '') +
          (d ? ' is-drifted' : '')
        }
        style={tileStyle}
      />
      {state === 'next' ? <span aria-hidden className="panel-next absolute inset-0" /> : null}
      {state === 'paid' ? (
        <span aria-hidden className="absolute right-0.5 top-0.5 rounded-full bg-[#fbfaf6]/90 p-0.5 text-[#14243a]">
          <LockIcon className="h-3 w-3" />
        </span>
      ) : null}
      <span className="panel-word pointer-events-none absolute inset-x-0.5 bottom-0.5 truncate rounded-full bg-[#14243a]/75 px-1 py-px text-center text-[9px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-sm sm:text-[10px]">
        {word}
      </span>
    </>
  )
  const cls = 'panel-cell relative block aspect-square [perspective:700px]' + (d || open ? ' z-[1]' : '') + (open ? ' is-open' : '')
  if (laid) {
    return (
      <button
        type="button"
        onClick={() => onLaid(node)}
        aria-label={label}
        data-testid="tile"
        data-state={cold ? 'glazed' : 'laid'}
        data-slipping={slipping ? 'true' : undefined}
        data-room={room.id}
        className={cls}
      >
        {inner}
      </button>
    )
  }
  return (
    <Link
      href={state === 'paid' ? UNLOCK_HREF : '/errand/' + room.id}
      aria-label={label}
      data-testid="tile"
      data-state={state}
      data-room={room.id}
      className={cls}
    >
      {inner}
    </Link>
  )
}

/**
 * THE LEGEND: each unit, its tiles laid, and its keystone. In path order, top to bottom —
 * a list is read downwards even though the panel is laid upwards, and "Unit 1" first is
 * what anybody expects of a list.
 */
function Legend({ view }: { view: PathView }) {
  return (
    <ol className="flex flex-col gap-3" aria-label="The units of your panel">
      {view.units.map(({ unit, nodes, done, stars }) => {
        const glaze = keystoneGlaze(stars)
        return (
          <li key={unit.id} data-unit={unit.id} className="flex items-center gap-3 text-sm">
            <span className="display w-5 shrink-0 text-muted">{unit.n}</span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate">{unit.title}</span>
              <span className="flex items-center gap-3">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                  <span
                    className="block h-full rounded-full bg-[color:var(--azulejo)]"
                    style={{ width: `${(done / Math.max(1, nodes.length)) * 100}%` }}
                  />
                </span>
                <span className="w-9 text-right text-xs tabular-nums text-muted">
                  {done}/{nodes.length}
                </span>
              </span>
            </span>
            <Link
              href={milestoneHref(unit.milestone.cheat)}
              data-testid="keystone"
              data-glaze={glaze}
              aria-label={
                'Keystone, practice session: ' + unit.milestone.title + ' — ' + GLAZE_WORDS[glaze] + ', ' + stars + ' of 3 said cold. ' + unit.milestone.blurb
              }
              className={'panel-keystone tap-target shrink-0 is-' + glaze}
            >
              <span lang="pt-PT" className="pt">
                {keystoneLabel(unit)}
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * THE FOUNDATION: the words the rooms handed over, by shelf (SHELVES in content/roots.ts,
 * counted by wordsOnShelf in content/collection.ts — the same count the library shows).
 * Kept from the Wall: every room you lay puts words in the ground it stands on. → /vocab.
 */
export function Foundation({ inventory }: { inventory: Record<string, unknown> }) {
  const counts = useMemo(() => wordsOnShelf(inventory), [inventory])
  const shelves = SHELVES.filter((s) => counts[s.id] > 0)
  const words = shelves.reduce((k, s) => k + counts[s.id], 0)
  return (
    <Link href="/vocab" data-testid="foundation" className="wall-foundation tap-target flex flex-col gap-3 rounded-2xl px-6 py-3">
      <span className="flex items-baseline gap-3">
        <span className="eyebrow text-fg">Foundation</span>
        <span className="text-sm text-muted" data-testid="foundation-count">
          {words === 0
            ? 'Every word a room hands over lands here.'
            : words + (words === 1 ? ' word' : ' words') + ' · ' + shelves.length + (shelves.length === 1 ? ' shelf' : ' shelves')}
        </span>
      </span>
      {shelves.length ? (
        <span className="flex flex-wrap gap-1">
          {shelves.map((s) => (
            <span key={s.id} className="rounded-full bg-bg-elev px-3 py-px text-xs text-fg">
              {s.label.charAt(0) + s.label.slice(1).toLowerCase()} <span className="tabular-nums text-muted">{counts[s.id]}</span>
            </span>
          ))}
        </span>
      ) : null}
    </Link>
  )
}
