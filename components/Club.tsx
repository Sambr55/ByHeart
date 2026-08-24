'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  CRATES,
  PIECES,
  ROOTS_BY_FAMILY,
  RUNGS,
  daysLeft,
  entryRung,
  isLive,
  rungReached,
  type Crate,
  type Rung,
} from '@/content/roots'
import { CLUB, MOVES } from '@/content/club'
import { CrateIcon } from '@/components/CrateIcon'
import { Menu } from '@/components/Menu'
import { Wordmark } from '@/components/Wordmark'
import { capabilities } from '@/engine/journey'
import { track } from '@/engine/analytics'
import { loadLearner, welcomeToClub } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'
import { useNowAfterMount } from '@/engine/useNow'

/**
 * Dub Club.
 *
 * A returning learner used to re-enter through the front door every time — proposition,
 * demo, deal, picker — so the product read as one session repeated and nothing anywhere
 * knew they had been here before.
 *
 * It is a masthead and three to five MOVES, deliberately not four tiles. A tile is a
 * destination; a move is a reason, and the difference is the whole screen. Every move
 * names something true about this learner right now — the crate with more in it, the
 * drop that expires, the line that is different this morning — and a move with nothing
 * behind it does not render.
 *
 * What it will never do: count days, show a streak, or ask where somebody has been. The
 * home screen is exactly where a product betrays that promise, so it is written here
 * first and the moves are ordered by what expires rather than by what is overdue.
 */
export function Club() {
  const learner = useLearner()
  const now = useNowAfterMount()
  const mounted = now !== null

  const owned = useMemo(
    () => Object.keys(learner.inventory ?? {}).filter((id) => PIECES[id]),
    [learner.inventory],
  )
  const acts = capabilities(owned)
  const rung: Rung = mounted ? rungReached(learner.proof ?? []) : 1
  const played = useMemo(() => new Set(learner.roots_played ?? []), [learner.roots_played])
  const done = useMemo(() => new Set(learner.sections_completed ?? []), [learner.sections_completed])

  /**
   * The welcome, once.
   *
   * Gated on rung 2 as specified: somebody who has finished a section but cannot yet ask
   * for anything has not really been through DUB, and a ceremony at that moment would be
   * congratulating them for turning up — which is the one thing this product refuses to
   * do. `loadLearner()` is called explicitly rather than read off the snapshot, because
   * an unread store is indistinguishable from a learner who has never been welcomed.
   */
  const [welcome, setWelcome] = useState(false)
  useEffect(() => {
    const state = loadLearner()
    if (state.club_welcomed_at) return
    if (!state.sections_completed.length) return
    if (rungReached(state.proof) < 2) return
    setWelcome(true)
    welcomeToClub()
    track('club_welcome', { sections: state.sections_completed.length })
  }, [])

  if (welcome) return <Welcome onDone={() => setWelcome(false)} />

  return (
    <main
      data-stage="REAL WORLD"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 pb-10 pt-6 text-fg"
    >
      <div className="flex items-center gap-3">
        <Wordmark mark="club" className="h-8" />
        <span className="flex-1" />
        <Menu />
      </div>

      {/*
        The masthead says what they can do, never how often they have done it. The
        fallback is a real sentence rather than an empty state, because a learner who
        has finished a section always has something.
      */}
      <div className="flex flex-col gap-3">
        <h1 className="display text-balance text-3xl">
          {acts.length
            ? 'You can ' + acts.slice(0, 3).join(', ') + (acts.length > 3 ? ' — and more.' : '.')
            : CLUB.greeting}
        </h1>
        <p className="text-sm text-muted">
          {mounted ? RUNGS[rung - 1].name + ', stage ' + rung + ' of 6.' : ' '}
          {done.size ? ' ' + throughLine(done.size) : ''}
        </p>
      </div>

      <Moves
        learner={{ played, done, rung, owned: owned.length }}
        now={now}
        mounted={mounted}
      />

      <p className="mt-auto text-center text-xs text-muted">{CLUB.footer}</p>
    </main>
  )
}

/** Crates finished, said as a fact about them rather than as a score. */
function throughLine(n: number): string {
  if (n === 1) return 'One crate all the way through.'
  return n + ' crates all the way through.'
}

/**
 * The ceremony.
 *
 * Once, ever. It is the only screen in DUB that congratulates anybody, and it earns it
 * by being about what they did rather than about how often they showed up.
 */
function Welcome({ onDone }: { onDone: () => void }) {
  return (
    <main
      data-stage="REAL WORLD"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 pb-10 pt-6 text-fg"
    >
      <Wordmark mark="club" className="h-8" />
      <div className="flex flex-1 flex-col justify-center gap-3">
        <p className="eyebrow text-accent">{CLUB.welcome.eyebrow}</p>
        <h1 className="display text-balance text-3xl">{CLUB.welcome.headline}</h1>
        <p className="text-sm leading-relaxed text-muted">{CLUB.welcome.body}</p>
        <p className="text-sm leading-relaxed text-muted">{CLUB.welcome.body_two}</p>
      </div>
      <button
        type="button"
        data-testid="club-welcome-cta"
        onClick={onDone}
        className="tap-target eyebrow w-full rounded bg-accent px-5 py-4 text-accent-ink"
      >
        {CLUB.welcome.cta}
      </button>
    </main>
  )
}

interface Move {
  key: string
  verb: string
  why: string
  detail: string
  href: string
  crate?: Crate
  urgent?: boolean
}

/**
 * Three to five, chosen by what is true.
 *
 * Ordered by what can be lost rather than by what is overdue — the drop expires and
 * nothing else here does, so it leads when there is one. Everything below it is a
 * standing offer, which is the point of a product with no streak in it.
 */
function Moves({
  learner,
  now,
  mounted,
}: {
  learner: { played: Set<string>; done: Set<string>; rung: Rung; owned: number }
  now: Date | null
  mounted: boolean
}) {
  const { played, done, rung } = learner
  const moves: Move[] = []

  if (mounted && now) {
    const drop = CRATES.find((c) => c.drop && isLive(c, now) && !done.has(c.id))
    if (drop?.drop) {
      moves.push({
        key: 'drop',
        ...MOVES.drop,
        detail: drop.title + ' · ' + daysLeft(drop, now) + ' days left',
        href: '/crates?open=' + drop.id,
        crate: drop,
        urgent: true,
      })
    }
  }

  moves.push({ key: 'line', ...MOVES.line, detail: 'One sentence, chosen for what you own', href: '/line' })

  if (mounted) {
    /** Started, not finished, and with something inside it this stage now reaches. */
    const resume = CRATES.find((c) => {
      if (c.drop) return false
      const roots = ROOTS_BY_FAMILY[c.id] ?? []
      const left = roots.filter((r) => !played.has(r.root_id) && r.rung <= rung)
      return roots.some((r) => played.has(r.root_id)) && left.length > 0
    })
    if (resume) {
      const left = (ROOTS_BY_FAMILY[resume.id] ?? []).filter(
        (r) => !played.has(r.root_id) && r.rung <= rung,
      ).length
      moves.push({
        key: 'resume',
        ...MOVES.resume,
        detail: resume.title + ' · ' + left + (left === 1 ? ' left' : ' left'),
        href: '/crates?open=' + resume.id,
        crate: resume,
      })
    }

    /** Never opened, and reachable. */
    const fresh = CRATES.find(
      (c) =>
        !c.drop &&
        entryRung(c) <= rung &&
        !(ROOTS_BY_FAMILY[c.id] ?? []).some((r) => played.has(r.root_id)),
    )
    if (fresh) {
      moves.push({
        key: 'open',
        ...MOVES.open,
        detail: fresh.title,
        href: '/crates?open=' + fresh.id,
        crate: fresh,
      })
    }

    // Nothing new to open is not a dead end here, the way it is on the picker. Going
    // through something again is a legitimate move and this is the screen that says so.
    if (!fresh && done.size) {
      const first = CRATES.find((c) => done.has(c.id))
      if (first) {
        moves.push({
          key: 'again',
          ...MOVES.again,
          detail: first.title,
          href: '/crates?open=' + first.id,
          crate: first,
        })
      }
    }
  }

  moves.push({
    key: 'proof',
    ...MOVES.proof,
    detail: learner.owned + (learner.owned === 1 ? ' piece kept' : ' pieces kept'),
    href: '/proof',
  })
  if (moves.length < 4) {
    moves.push({ key: 'library', ...MOVES.library, detail: 'The whole map', href: '/vocab' })
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="eyebrow min-w-0 text-accent">{CLUB.moves_label}</h2>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-col gap-3">
        {moves.slice(0, 5).map((m) => (
          <Link
            key={m.key}
            href={m.href}
            data-testid={'move-' + m.key}
            data-tone={m.crate?.tone}
            onClick={() => track('club_move', { move: m.key })}
            className={
              'tap-target flex items-center gap-3 rounded border px-4 py-4 transition ' +
              (m.urgent
                ? 'border-accent/45 bg-accent/[0.04] hover:border-accent'
                : 'border-line bg-bg-elev hover:border-accent/50')
            }
          >
            {m.crate ? (
              <span
                aria-hidden
                className="azulejo-block flex h-10 w-10 shrink-0 items-center justify-center rounded"
              >
                <CrateIcon crate={m.crate.id} className="h-6 w-6 text-[color:var(--tone)]" />
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="display block text-base">{m.verb}</span>
              <span className="mt-1 block text-xs text-muted">{m.detail}</span>
              <span className="mt-1 block text-xs text-muted/80">{m.why}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
