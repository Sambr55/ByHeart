'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { GOAL_LABEL, GOAL_NEEDS, type Goal } from '@/content/profile'
import { PIECES } from '@/content/roots'
import { useLearner } from '@/engine/useLearner'

/**
 * The proof card — what replaces the streak.
 *
 * The whole design rests on one decision: the number counts sentences produced with
 * nothing on screen to copy from, and nothing else. Not days, not taps, not lessons
 * finished. That makes it slow, occasionally flat, and impossible to inflate by
 * opening the app — which are the properties that make it worth showing to somebody.
 *
 * It is built to be screenshotted. That is the share mechanism that actually happens,
 * so the layout is a card rather than a page, and the honest detail — the lines
 * themselves, in Portuguese — is the part that photographs.
 */
export function Proof({ standalone = false }: { standalone?: boolean }) {
  const learner = useLearner()
  const [copied, setCopied] = useState(false)

  const proof = learner.proof ?? []
  const clean = proof.filter((p) => p.clean).length
  const recent = [...proof].reverse().slice(0, 3)

  const worlds = useMemo(() => {
    const set = new Set<string>()
    for (const id of Object.keys(learner.inventory)) {
      const fam = PIECES[id]?.family
      if (fam) set.add(fam)
    }
    return set.size
  }, [learner.inventory])

  /** What is still between them and the thing they said they wanted. */
  const distance = useMemo(() => {
    const goal = learner.profile?.goal as Goal | null | undefined
    if (!goal) return null
    const owned = new Set(Object.keys(learner.inventory))
    const missing = (GOAL_NEEDS[goal] ?? []).filter((n) => !n.pieces.every((x) => owned.has(x)))
    if (!missing.length) return { done: true, count: 0, goal }
    return { done: false, count: missing.length, goal, next: missing[0].label }
  }, [learner.profile, learner.inventory])

  const shareText = useMemo(() => {
    const latest = recent[0]
    return (
      proof.length +
      (proof.length === 1 ? ' thing' : ' things') +
      ' I can say in Portuguese without looking.' +
      (latest ? '\n\n“' + latest.pt + '” — ' + latest.en : '') +
      '\n\nLearned off ' +
      (worlds === 1 ? 'a film' : worlds + ' completely unrelated things') +
      '. No streak involved.'
    )
  }, [proof.length, recent, worlds])

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : ''
    const data = { title: 'DUB', text: shareText, url }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(data)
        return
      } catch {
        // Dismissed the sheet, or the browser refused. Fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(shareText + '\n' + url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch {
      setCopied(false)
    }
  }

  const empty = proof.length === 0

  return (
    <main
      data-stage="REAL WORLD"
      className={
        'mx-auto flex w-full max-w-md flex-col gap-6 bg-bg px-5 text-fg ' +
        // Standalone it is the page; inside the journey the step below owns the
        // remaining height, and forcing full height here strands the CTA off-screen.
        (standalone ? 'min-h-svh py-8' : 'pt-8 pb-2')
      }
    >
      {standalone ? (
        <Link href="/" className="eyebrow text-muted">
          ← DUB
        </Link>
      ) : null}

      {/* ---------------------------------------------------------- the card */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <p className="eyebrow text-accent">WHAT I CAN SAY</p>

        {empty ? (
          <>
            <p className="display mt-4 text-balance text-3xl">Nothing yet.</p>
            <p className="mt-3 text-sm text-muted">
              This fills up when you say something with the film taken away. Not when you
              finish a lesson — when you produce it cold.
            </p>
          </>
        ) : (
          <>
            <p className="display mt-3 text-6xl tabular-nums leading-none">{proof.length}</p>
            <p className="mt-3 text-sm text-fg/80">
              {proof.length === 1 ? 'sentence' : 'sentences'} said with nothing on screen to
              copy from
              {clean ? ', ' + clean + ' of them right first time' : ''}.
            </p>

            <ul className="mt-6 space-y-4 border-t border-line pt-5">
              {recent.map((p) => (
                <li key={p.pt}>
                  <p className="pt text-lg font-semibold text-accent">{p.pt}</p>
                  <p className="mt-0.5 text-xs text-muted">{p.en}</p>
                </li>
              ))}
            </ul>

            {worlds > 1 ? (
              <p className="mt-5 text-xs text-muted">
                Gathered from {worlds} unrelated worlds. None of it needs them any more.
              </p>
            ) : null}
          </>
        )}
      </section>

      {/* ------------------------------------------------------- the distance */}
      {distance ? (
        <section className="rounded-xl border border-line p-4">
          <p className="eyebrow text-muted">WHERE YOU SAID YOU WANTED TO GET TO</p>
          {distance.done ? (
            <p className="mt-2 text-sm">
              You have everything the graph can give you for {GOAL_LABEL[distance.goal]}. Pick
              another area and it starts compounding.
            </p>
          ) : (
            <p className="mt-2 text-sm">
              <span className="font-semibold">
                {distance.count} {distance.count === 1 ? 'thing' : 'things'} to go
              </span>{' '}
              before {GOAL_LABEL[distance.goal]}. Next one up: {distance.next}.
            </p>
          )}
        </section>
      ) : null}

      {/* ---------------------------------------------------------- controls */}
      {!empty ? (
        <button
          type="button"
          onClick={share}
          className="tap-target w-full rounded-full bg-accent px-5 py-4 text-xs tracking-widest text-accent-ink"
        >
          {copied ? 'COPIED' : 'SHARE THIS'}
        </button>
      ) : null}

      <p className="text-center text-xs leading-relaxed text-muted">
        No streak, no points, no level. This number only moves when you can actually say
        something new.
      </p>

      {standalone ? (
        <div className="mt-auto flex flex-col gap-3">
          <Link
            href="/line"
            className="tap-target block w-full rounded-full border border-line px-5 py-4 text-center text-xs tracking-widest"
          >
            TODAY’S LINE
          </Link>
          <Link
            href="/"
            className="tap-target block w-full rounded-full border border-line px-5 py-4 text-center text-xs tracking-widest"
          >
            KEEP GOING
          </Link>
        </div>
      ) : null}
    </main>
  )
}
