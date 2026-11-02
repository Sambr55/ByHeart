'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef } from 'react'
import type { ChapterId } from '@/content/chapters'
import type { Purpose } from '@/content/situations'
import { SHELVES } from '@/content/roots'
import { wordsOnShelf } from '@/content/collection'
import type { PathNode, PathView } from './progress'
import { keystoneGlaze, milestoneHref, type Glaze } from './progress'
import { UNLOCK_HREF } from './locks'
import { LockIcon } from './icons'

/**
 * THE WALL — the phone's progress, as a building going up (Sam approved, 2026-11-02).
 *
 * Replaces WindingPath, which its own comment called "Duolingo's winding line of round
 * nodes" with "Duolingo's START" bouncing over the next one. The design review's verdict
 * was "too Duolingo", and the fix is not a reskin of the same line: a path is something you
 * are walked along, and a wall is something you BUILD. Every room you do stays where you
 * put it.
 *
 * WHAT EACH PART IS, all read from the record by pathView (components/path/progress.ts):
 *
 *   a COURSE      one unit of the path (a ResolvedUnit), in path order, built BOTTOM-UP —
 *                 unit 1 is the lowest course, because that is how walls go up. The wall
 *                 opens scrolled to the course you are on.
 *   a TILE        one room (PathNode). open = a dashed outline, waiting; next = an outline
 *                 with a soft glow and a dot; paid = an outline with a small lock (→ /pro);
 *                 done = LAID, in plaster; done and said cold = GLAZED, a full azulejo.
 *                 Order never locks a tile — only the paid lock does (locks.ts).
 *   a CRACK       a hairline across a laid tile whose words have gone quiet — "worth
 *                 another look" (roomSlipping). Never red, and the tile is never removed.
 *   the KEYSTONE  caps each course: the unit's practice session (unit.milestone), named by
 *                 the pattern it practises. Its 0–3 is GLAZE, not stars (keystoneGlaze).
 *   FOUNDATION    under the wall, the words those rooms handed over, by shelf (→ /vocab).
 *
 * WHY YOU ARE HERE CHANGES THE NAME OF THE BUILDING, AND NOTHING ELSE. A trip builds a
 * doorway, a season a shopfront, a move a house — one caption over the same component. It
 * is the cheapest way to say "this is yours" and costs no second layout.
 *
 * Laid tiles open the TileSheet (remind, say it cold, where it came from); unlaid tiles
 * open the room, as they always did. `onLaid` is how PathHome hears the first kind.
 */

/*
  THE CITY'S SKIN, keyed by chapter. Lisbon is azulejo; the CSS reads --wall-* tokens under
  [data-skin], so a brick or stone city later is a token here and a block in globals.css.
  Porto is azulejo too — it is the other city famous for it. The Algarve keeps azulejo
  until somebody chooses its stone.
*/
export const WALL_CITY: Record<ChapterId, { skin: 'azulejo' | 'brick' | 'stone'; city: string }> = {
  lisbon: { skin: 'azulejo', city: 'Lisboa' },
  porto: { skin: 'azulejo', city: 'Porto' },
  algarve: { skin: 'azulejo', city: 'o Algarve' },
}

/* The building, by purpose. One line of caption — the component is the same for all three. */
export const BUILDING: Record<Purpose, (city: string) => string> = {
  visiting: (city) => 'Your doorway into ' + city,
  staying: (city) => 'Your shopfront in ' + city,
  moving: (city) => 'Your house in ' + city,
}

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

export function Wall({
  view,
  purpose,
  chapter,
  inventory,
  onLaid,
}: {
  view: PathView
  purpose: Purpose
  chapter: ChapterId
  inventory: Record<string, unknown>
  onLaid: (n: PathNode) => void
}) {
  const { skin, city } = WALL_CITY[chapter] ?? WALL_CITY.lisbon
  const scroller = useRef<HTMLDivElement>(null)

  /*
    THE COURSE YOU ARE ON: the one holding the glowing tile, or — every open room played —
    the top of the wall. That is where it opens, because a new learner's course is the
    bottom one, under five courses of outlines, and opening at the top would show them
    everything they have not done before the one thing they can.
  */
  const current = view.next?.unit.id ?? view.units[view.units.length - 1]?.unit.id
  useEffect(() => {
    const box = scroller.current
    const el = box?.querySelector<HTMLElement>('[data-current="true"]')
    if (!box || !el) return
    box.scrollTop = Math.max(0, el.offsetTop - (box.clientHeight - el.offsetHeight) / 2)
  }, [current])

  const slipping = useMemo(
    () => view.units.flatMap((u) => u.nodes).filter((n) => n.slipping).slice(0, 3),
    [view],
  )

  return (
    <section aria-labelledby="wall-caption" data-skin={skin} data-testid="wall" className="flex flex-col gap-4">
      <p id="wall-caption" className="text-sm leading-snug text-muted" data-testid="wall-caption">
        <span className="font-semibold text-fg">{BUILDING[purpose](city)}</span>
        {' — '}
        {view.done} of {view.total} tiles laid
      </p>

      {/*
        WORTH ANOTHER LOOK, up to three, and only when there are any. Above the wall
        because it is the one thing on it that asks you for something — and it asks
        gently: the tiles are still laid, this is the way to mend the hairline.
      */}
      {slipping.length ? (
        <div data-testid="worth-another-look" className="flex flex-col gap-2 rounded-2xl border border-line bg-bg-elev px-4 py-3">
          <p className="eyebrow text-muted">Worth another look</p>
          <ul className="flex flex-wrap gap-2">
            {slipping.map((n) => (
              <li key={n.room.id}>
                <Link
                  href={'/revise?kind=room&id=' + encodeURIComponent(n.room.id)}
                  className="tap-target inline-flex items-center gap-2 rounded-full border border-line-strong px-3 py-1.5 text-sm"
                >
                  <CrackGlyph />
                  {n.room.title}
                  <span className="eyebrow text-accent">Say it cold</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        ref={scroller}
        data-testid="wall-scroll"
        className="relative max-h-[34rem] overflow-y-auto rounded-t-2xl px-1 pt-3 [scrollbar-width:thin]"
      >
        {/* flex-col-reverse: unit 1 is the bottom course. The DOM keeps path order for readers. */}
        <ol className="flex flex-col-reverse gap-5" aria-label="The wall, one course per unit, built from the bottom">
          {view.units.map(({ unit, nodes, done, stars }) => {
            const glaze = keystoneGlaze(stars)
            return (
              <li
                key={unit.id}
                data-course={unit.id}
                data-current={unit.id === current ? 'true' : undefined}
                className="flex flex-col gap-2"
              >
                <Link
                  href={milestoneHref(unit.milestone.cheat)}
                  data-testid="keystone"
                  data-glaze={glaze}
                  aria-label={
                    'Keystone, practice session: ' + unit.milestone.title + ' — ' + GLAZE_WORDS[glaze] + ', ' + stars + ' of 3 said cold. ' + unit.milestone.blurb
                  }
                  className={
                    'tap-target relative mx-auto flex h-14 w-48 items-center justify-center rounded-b-md rounded-t-[1.75rem] ' +
                    (glaze === 'outline'
                      ? 'border-2 border-dashed border-line-strong'
                      : glaze === 'part'
                        ? 'keystone-part border-2 border-[color:var(--wall-glaze)]'
                        : 'wall-glazed ' + (glaze === 'gold' ? 'keystone-gold' : ''))
                  }
                >
                  <span
                    lang="pt-PT"
                    className={
                      'pt rounded px-2 text-sm font-semibold leading-tight ' +
                      (glaze === 'glazed' || glaze === 'gold' ? 'bg-[color:var(--wall-plaster)] text-accent' : 'text-fg')
                    }
                  >
                    {keystoneLabel(unit)}
                  </span>
                </Link>
                <p className="flex items-baseline gap-2 px-1 text-xs text-muted">
                  <span className="eyebrow">Unit {unit.n}</span>
                  <span className="min-w-0 flex-1 truncate">{unit.title}</span>
                  <span className="tabular-nums">
                    {done}/{nodes.length}
                  </span>
                </p>
                {/* wrap-reverse: the first rooms sit on the lower row of the course. */}
                <ol className="flex flex-wrap-reverse justify-center gap-1.5">
                  {nodes.map((n) => (
                    <li key={n.room.id} className="basis-[calc(25%-0.3rem)]">
                      <Tile n={n} onLaid={onLaid} />
                    </li>
                  ))}
                </ol>
              </li>
            )
          })}
        </ol>
      </div>

      <Foundation inventory={inventory} />
    </section>
  )
}

function Tile({ n, onLaid }: { n: PathNode; onLaid: (n: PathNode) => void }) {
  const { room, state, cold, slipping } = n
  const label =
    room.title +
    (state === 'done' ? (cold ? ' — laid and glazed: said cold' : ' — laid') : '') +
    (slipping ? ', worth another look' : '') +
    (state === 'next' ? ' — up next' : '') +
    (state === 'paid' ? ' — locked, unlock with membership' : '')
  const base =
    'tap-target relative flex h-[4.75rem] w-full flex-col justify-end overflow-hidden rounded-md px-1.5 pb-1.5 pt-3 text-left text-[0.68rem] font-semibold leading-tight'
  const look =
    state === 'done'
      ? cold
        ? 'wall-glazed'
        : 'wall-laid text-fg'
      : state === 'next'
        ? 'wall-next border-2 border-accent bg-bg-elev text-fg'
        : state === 'paid'
          ? 'border border-line bg-[color-mix(in_srgb,var(--surface)_45%,transparent)] text-muted'
          : 'border border-dashed border-line-strong text-muted'
  const inner = (
    <>
      {slipping ? <Crack /> : null}
      {state === 'next' ? <span aria-hidden className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" /> : null}
      {state === 'paid' ? <LockIcon className="absolute right-1 top-1 h-3.5 w-3.5" /> : null}
      <span className={'relative line-clamp-3 ' + (cold ? 'rounded-sm' : '')}>{room.title}</span>
    </>
  )
  if (state === 'done') {
    return (
      <button
        type="button"
        onClick={() => onLaid(n)}
        aria-label={label}
        data-testid="tile"
        data-state={cold ? 'glazed' : 'laid'}
        data-slipping={slipping ? 'true' : undefined}
        data-room={room.id}
        className={base + ' ' + look}
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
      className={base + ' ' + look}
    >
      {inner}
    </Link>
  )
}

/* A hairline crack across the tile. Decorative: the label says "worth another look". */
function Crack() {
  return (
    <svg
      aria-hidden
      className="wall-crack pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 80 76"
      preserveAspectRatio="none"
      fill="none"
    >
      <path
        d="M52 0 L47 14 L55 24 L44 38 L50 47 L41 62 L45 76"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CrackGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 12 16" className="wall-crack h-4 w-3" fill="none">
      <path d="M7 0 L5 5 L8 8 L4 12 L6 16" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * THE FOUNDATION: the words the rooms handed over, by shelf (SHELVES in content/roots.ts,
 * counted by wordsOnShelf in content/collection.ts — the same count the library shows).
 *
 * Under the wall because that is what they are: every room you lay puts words in the
 * ground it stands on. Tap → /vocab, the library itself.
 */
function Foundation({ inventory }: { inventory: Record<string, unknown> }) {
  const counts = useMemo(() => wordsOnShelf(inventory), [inventory])
  const shelves = SHELVES.filter((s) => counts[s.id] > 0)
  const words = shelves.reduce((n, s) => n + counts[s.id], 0)
  return (
    <Link
      href="/vocab"
      data-testid="foundation"
      className="wall-foundation tap-target -mt-4 flex flex-col gap-2 rounded-b-2xl px-4 py-3"
    >
      <span className="flex items-baseline gap-2">
        <span className="eyebrow text-fg">Foundation</span>
        <span className="text-sm text-muted" data-testid="foundation-count">
          {words === 0
            ? 'Every word a room hands over lands here.'
            : words + (words === 1 ? ' word' : ' words') + ' · ' + shelves.length + (shelves.length === 1 ? ' shelf' : ' shelves')}
        </span>
      </span>
      {shelves.length ? (
        <span className="flex flex-wrap gap-1.5">
          {shelves.map((s) => (
            <span key={s.id} className="rounded-full bg-bg-elev px-2.5 py-0.5 text-xs text-fg">
              {s.label.charAt(0) + s.label.slice(1).toLowerCase()} <span className="tabular-nums text-muted">{counts[s.id]}</span>
            </span>
          ))}
        </span>
      ) : null}
    </Link>
  )
}
