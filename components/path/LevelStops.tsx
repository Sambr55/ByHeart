'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { rowsFor } from '@/content/calendar'
import type { ChapterId } from '@/content/chapters'
import { gemsHomeFirst } from '@/content/gems'
import { awayText, roomsAway, stopLabel } from './stop-label'
import { metStop } from '@/content/level'
import { CRATES, entryRung } from '@/content/roots'
import type { Purpose } from '@/content/situations'
import { WALKS } from '@/content/walks'
import { markBoardMet } from '@/engine/learner'
import { lapOf } from './lap'
import type { PathView } from './progress'

/**
 * A LEVEL'S STOPS, FOR THE PANEL AND THE ROAD (2026-11-09: "keep them as alternative views
 * drawing exactly the same content").
 *
 * The Board deals its surprises, places and what's on round the edge (lap.ts). This asks the
 * SAME function for the same level and lists the result, so the three views cannot disagree:
 * the same squares, in board order, turned over as rooms are laid, face down until then,
 * each opening where the board's sheet opens it. What it turns over is recorded as met, as
 * the board records it — the level recap and Yours list it either way.
 */
export function LevelStops({
  view,
  index,
  purpose,
  chapter,
  rung,
  now,
}: {
  view: PathView
  index: number
  purpose: Purpose
  chapter: ChapterId
  rung: number
  now: Date
}) {
  const lap = useMemo(
    () => (view.units[index] ? lapOf(view, index, purpose, { gems: gemsHomeFirst(chapter), rows: rowsFor(chapter, now), walks: WALKS, chapter }) : null),
    [view, index, purpose, chapter, now],
  )
  const stops = useMemo(() => (lap ? lap.squares.filter((s) => s.kind !== 'room' && s.kind !== 'corner') : []), [lap])
  useEffect(() => {
    const keys = stops.filter((s) => s.reached).map((s) => s.key)
    if (keys.length) markBoardMet(keys)
  }, [stops])
  if (!stops.length) return null

  return (
    <ul className="flex flex-wrap gap-1.5" data-testid="level-stops" aria-label="Surprises, places and what's on, on this level">
      {stops.map((s) => {
        /* Named before it is reached, as on the board (stop-label.ts) — greyed, with how far away. */
        const l = stopLabel(s)
        if (!l) return null
        const m = metStop(s.key)
        const locked = s.kind === 'vibe' ? !CRATES.some((c) => c.id === s.crate && entryRung(c) <= rung) : false
        const chip = (
          <>
            <span aria-hidden>{l.mark}</span>
            <span className="text-[0.6rem] lowercase text-telha">{l.kind}</span>
            <span className="max-w-[9rem] truncate font-bold uppercase tracking-wide">{l.title}</span>
            {!s.reached ? <span className="text-[0.6rem] text-[#a8742a]">· {awayText(roomsAway(s, lap!))}</span> : null}
            {s.reached && locked ? <span aria-label="opens when you say one of this level's rooms out loud">🔒</span> : null}
          </>
        )
        return (
          <li key={s.key}>
            {!s.reached || locked || !m ? (
              <span className={'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ' + (s.reached ? 'border-line bg-surface text-muted' : 'border-dashed border-line text-muted')}>{chip}</span>
            ) : (
              <Link href={m.href} className="tap-target inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-elev px-2.5 py-1 text-xs" data-testid={'level-stop-' + s.kind}>
                {chip}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}

