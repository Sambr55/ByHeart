'use client'

import { useEffect, useState } from 'react'
import {
  CRATES,
  ROOTS_BY_FAMILY,
  entryRung,
  rungReached,
  type CultureFamily,
} from '@/content/roots'
import { cratesToGo } from '@/content/legend'
import { loadLearner, type LearnerState } from '@/engine/learner'
import { useEntitlements } from '@/engine/useEntitlements'

/**
 * Why is this vibe not open?
 *
 * Written after four rounds of failing to reproduce a shelf that would not open for the
 * one person using it. Every seed I wrote behaved; every real device did not, and there
 * was no way for either of us to see what the device actually held — so each attempt was
 * a guess dressed up as a diagnosis.
 *
 * This is the answer to that. It prints the state the picker actually reads, and then
 * runs the picker's own reasons over every vibe, so "nothing is clickable" becomes a list
 * of why. Read-only, unlisted, and it changes nothing.
 */
export function Diagnostic() {
  const access = useEntitlements()
  const [s, setS] = useState<LearnerState | null>(null)
  useEffect(() => setS(loadLearner()), [])
  if (!s) return null

  const proof = s.proof ?? []
  const releases = proof.filter((p) => p.source === 'release')
  const rung = rungReached(proof)
  const done = s.sections_completed ?? []
  const played = new Set(s.roots_played ?? [])

  const claimed = new Set<CultureFamily>()
  for (const id of s.roots_played ?? []) {
    for (const c of CRATES) {
      if (c.drop) continue
      if ((ROOTS_BY_FAMILY[c.id] ?? []).some((r) => r.root_id === id)) claimed.add(c.id)
    }
  }
  const allowance = access.entitlements.crates
  const atLimit = access.known && claimed.size >= allowance
  const basicsStarted = done.includes('the_basics')

  /** The picker's own reasoning, reproduced so the two cannot disagree silently. */
  const why = (id: CultureFamily) => {
    const crate = CRATES.find((c) => c.id === id)!
    const all = ROOTS_BY_FAMILY[id] ?? []
    const started = all.some((r) => played.has(r.root_id))
    if (!crate.drop && id !== 'the_basics' && !basicsStarted) return 'LOCKED · basics not finished'
    if (!crate.drop && !started && entryRung(crate) > rung) {
      return 'LOCKED · opens at stage ' + entryRung(crate) + ', you are ' + rung
    }
    if (!crate.drop && atLimit && !claimed.has(id)) return 'PAYWALL · ' + claimed.size + '/' + allowance + ' used'
    return 'OPEN'
  }

  const rows: [string, string][] = [
    ['Rung reached', String(rung)],
    ['Releases recorded', String(releases.length)],
    ['…of those, clean', String(releases.filter((p) => p.clean).length)],
    ['Vibes finished', done.length ? done.join(', ') : 'none'],
    ['Vibes claimed', claimed.size + ' of ' + (allowance > 999 ? 'unlimited' : allowance)],
    ['Roots played', String((s.roots_played ?? []).length)],
    ['Legend opens in', cratesToGo(done) + ' more'],
    ['Entitlements known', String(access.known)],
    ['Plan', access.entitlements.plan + (access.comped ? ' (comped)' : '')],
    ['At the paywall', String(atLimit)],
  ]

  return (
    <section className="flex flex-col gap-3">
      <p className="eyebrow text-accent">WHAT THIS DEVICE HOLDS</p>
      <dl className="flex flex-col">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="text-xs font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <p className="eyebrow mt-3 text-accent">EVERY VIBE, AND WHY</p>
      <ul className="flex flex-col">
        {CRATES.filter((c) => c.built !== false).map((c) => {
          const verdict = why(c.id)
          return (
            <li key={c.id} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1">
              <span className="min-w-0 text-xs">{c.title}</span>
              <span
                className={
                  'shrink-0 text-[0.6rem] uppercase tracking-wider ' +
                  (verdict === 'OPEN' ? 'text-correct' : 'text-muted')
                }
              >
                {verdict}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
