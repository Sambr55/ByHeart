'use client'

import { useEffect, useState } from 'react'
import {
  CRATES,
  ROOTS_BY_FAMILY,
  entryRung,
  rungReached,
  type CultureFamily,
} from '@/content/roots'
import { doorwayToGo } from '@/content/legend'
import { roadProgress } from '@/content/road'
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
  const [copied, setCopied] = useState('')
  const [showRaw, setShowRaw] = useState(false)
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
  const road = roadProgress({
    rootsPlayed: s.roots_played ?? [],
    sectionsCompleted: done,
    purpose: s.purpose ?? null,
  })

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
    /*
      THE ROAD, SAID OUT LOUD, because reading it off a phone beat four rounds of guessing.

      Sam, twice: "the road is just loping around 2 of 10". The first diagnosis — a latched
      ref in the picker — was real and was not the whole of it, and every follow-up was me
      reasoning about code instead of looking at his device. These four rows are what I kept
      wanting to know: how far the road thinks he is, which step it is trying to serve, what
      crate that step lives in, and the actual roots recorded — because `done` is derived
      from that list and nothing else, so a step that never lands in it is a step that will
      be served forever.
    */
    ['Road', road.done + ' of ' + road.total + (road.open ? ' · OPEN' : '')],
    ['Road next', road.next ? road.next.root : '—'],
    ['…in crate', road.next ? road.next.family : '—'],
    ['Roots recorded', (s.roots_played ?? []).join(', ') || 'none'],
    ['Legend opens in', doorwayToGo(s.roots_played ?? []) + ' more basics lines'],
    ['Entitlements known', String(access.known)],
    ['Plan', access.entitlements.plan + (access.comped ? ' (comped)' : '')],
    ['At the paywall', String(atLimit)],
  ]

  return (
    <section className="flex flex-col gap-3">
      <p className="eyebrow text-accent">THIS DEVICE</p>
      <dl className="flex flex-col">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="text-xs font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {/*
        THE WHOLE RECORD, IN ONE TAP, because four rounds of me seeding a test learner and
        watching it work is four rounds of not looking at the device where it does not.

        Sam: "No still stuck on 2 out of 10… check them and solve this once and for all."
        Every reproduction I built walked the road correctly — 2 to 5, through Bond, ending
        on A SESSION DONE — which means the fault is in a state I have not managed to guess,
        and guessing again costs another round trip to a festival he is already at.

        So the record comes to the diagnosis instead. It is the learner blob exactly as
        stored, nothing summarised and nothing interpreted, because the summary is what has
        been lying: every row above was derived by the same code that is producing the
        wrong answer.
      */}
      <button
        type="button"
        data-testid="diag-copy"
        onClick={() => {
          const text = JSON.stringify(s, null, 2)
          void navigator.clipboard?.writeText(text).then(
            () => setCopied('copied — paste it into the chat'),
            () => setCopied('could not copy; screenshot the block below'),
          )
          setShowRaw(true)
        }}
        className="tap-target eyebrow mt-3 rounded border border-accent px-4 py-3 text-accent"
      >
        COPY THE WHOLE RECORD
      </button>
      {copied ? <p className="text-xs text-muted">{copied}</p> : null}
      {showRaw ? (
        <pre className="max-h-64 overflow-auto rounded border border-line bg-surface p-3 text-[10px] leading-snug">
          {JSON.stringify(s, null, 2)}
        </pre>
      ) : null}

      <p className="eyebrow mt-3 text-accent">EVERY VIBE</p>
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
