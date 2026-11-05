'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { slugFor } from '@/content/audio-manifest'
import { whatYouCanSay } from '@/content/yours'
import { levelKey, metOn, unitById } from '@/content/level'
import { useLearner } from '@/engine/useLearner'

/**
 * WHAT YOU CAN SAY — the head of Yours (2026-11-04).
 *
 * Every line from every room this learner has finished, by the level it belongs to, each
 * with its sound. The lines they have said out loud with nothing on screen carry a gold
 * mark: that is the difference between having read something and owning it.
 *
 * The newest level is open and the rest are folded, so the screen starts on what is fresh
 * and the whole record is one tap away. Nothing here is computed twice — see
 * content/yours.ts, which the check script exercises.
 */
export function CanSay({ focus }: { focus?: string | null } = {}) {
  const learner = useLearner()
  const can = useMemo(
    () =>
      whatYouCanSay({
        finished_cards: learner.finished_cards,
        proof: learner.proof,
        purpose: learner.purpose ?? null,
        profile: learner.profile,
      }),
    [learner.finished_cards, learner.proof, learner.purpose, learner.profile],
  )
  if (!can.rooms) return null
  const newest = [...can.levels].reverse().find((l) => l.id !== 'elsewhere')?.id ?? can.levels[0]?.id
  /* ?level= from a recap or a search opens that level instead (2026-11-05). */
  const opened = focus && can.levels.some((l) => l.id === focus) ? focus : newest
  const levelNo = (id: string) => unitById(id, learner.purpose ?? null)?.level

  return (
    <section data-testid="yours-can-say" className="flex flex-col gap-4 rounded-2xl border border-line bg-bg-elev px-5 py-6">
      <div className="flex flex-col gap-1">
        <p className="eyebrow text-accent">What you can say</p>
        <p className="display text-2xl leading-tight">
          {can.lines} {can.lines === 1 ? 'line' : 'lines'} from {can.rooms} {can.rooms === 1 ? 'room' : 'rooms'}
        </p>
        {can.cold ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Gold /> {can.cold} said out loud, with nothing on screen
          </p>
        ) : (
          <p className="text-sm text-muted">Say one out loud in a room and it gets a gold mark here.</p>
        )}
      </div>

      <div className="flex flex-col divide-y divide-line border-t border-line">
        {can.levels.map((lvl) => (
          <details key={lvl.id} id={'level-' + lvl.id} open={lvl.id === opened} className="group scroll-mt-20 py-3" data-testid="yours-can-level">
            <summary className="tap-target flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="eyebrow block text-[0.6rem] text-telha">
                  {levelNo(lvl.id) ? 'Level ' + levelNo(lvl.id) + ' · ' : ''}
                  {lvl.title}
                </span>
                <span className="text-sm text-muted">
                  {lvl.rooms.length} {lvl.rooms.length === 1 ? 'room' : 'rooms'} ·{' '}
                  {lvl.rooms.reduce((n, r) => n + r.lines.length, 0)} lines
                </span>
              </span>
              <span aria-hidden className="text-muted transition group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="mt-3 flex flex-col gap-4">
              {/* The level's recap, and its test, from where it is kept (content/level.ts). */}
              {lvl.id !== 'elsewhere' ? (
                <Link
                  href={'/level/' + encodeURIComponent(lvl.id)}
                  data-testid="yours-level-recap"
                  className="tap-target eyebrow flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-[0.65rem] text-accent"
                >
                  <span>Recap · test yourself on this level</span>
                  <span aria-hidden>→</span>
                </Link>
              ) : null}
              {lvl.rooms.map((room) => (
                <div key={room.id} className="flex flex-col gap-2">
                  <Link href={'/errand/' + room.id} className="eyebrow text-[0.6rem] text-muted hover:text-accent">
                    {room.title} →
                  </Link>
                  <ul className="flex flex-col gap-2">
                    {room.lines.map((l) => (
                      <li key={l.pt} className="flex items-start gap-3" data-cold={l.cold || undefined}>
                        <AudioButton slug={slugFor(l.pt)} text={l.pt} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span lang="pt-PT" className="pt block text-base leading-snug text-accent">
                            {l.pt} {l.cold ? <Gold /> : null}
                          </span>
                          <span className="block text-sm leading-snug text-muted">{l.en}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <Met level={levelKey(learner.purpose ?? null, lvl.id)} met={learner.board_met} />
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

/** What the level's board turned over: postcards, places, what's on. Met, never scored. */
function Met({ level, met }: { level: string; met?: string[] }) {
  const stops = metOn(level, met)
  if (!stops.length) return null
  return (
    <div className="flex flex-col gap-2" data-testid="yours-level-met">
      <p className="eyebrow text-[0.6rem] text-muted">Met on this board</p>
      <ul className="flex flex-wrap gap-2">
        {stops.map((m) => (
          <li key={m.kind + m.id}>
            <Link href={m.href} className="tap-target inline-flex items-baseline gap-1 rounded-full border border-line px-3 py-1 text-sm">
              <span className="eyebrow text-[0.55rem] text-telha">{m.what}</span> {m.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Gold() {
  return (
    <span
      aria-label="said out loud"
      title="Said out loud"
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[#e5b04a] align-middle shadow-[0_0_0_2px_rgba(229,176,74,0.25)]"
    />
  )
}
