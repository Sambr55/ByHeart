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
  rootById,
  type Crate,
  type CultureFamily,
  type Rung,
} from '@/content/roots'
import { CLUB, MOVES } from '@/content/club'
import { cardDone, cardToGo, clubOpen } from '@/content/legend'
import { DEFAULT_CHAPTER } from '@/content/chapters'
import { isCurrent, situationsFor } from '@/content/situations'
import { CrateIcon } from '@/components/CrateIcon'
import { Menu } from '@/components/Menu'
import { Wordmark } from '@/components/Wordmark'
import { LEGEND_FRAMES, legendUnlocked } from '@/content/legend'
import { capabilities } from '@/engine/journey'
import { useEntitlements } from '@/engine/useEntitlements'
import { track } from '@/engine/analytics'
import { loadLearner, welcomeToClub, type LearnerState } from '@/engine/learner'
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

  /*
    The free allowance, computed exactly as the picker computes it.

    A crate counts as claimed by having been opened, and it stays claimed for good. A
    drop never counts against the allowance, so it can never use one up either.
  */
  const access = useEntitlements()
  const claimed = useMemo(() => {
    const out = new Set<CultureFamily>()
    for (const id of learner.roots_played ?? []) {
      const family = rootById(id)?.culture_family
      const crate = family ? CRATES.find((c) => c.id === family) : undefined
      if (crate && !crate.drop) out.add(crate.id)
    }
    return out
  }, [learner.roots_played])
  const capped = access.known && claimed.size >= access.entitlements.crates

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
    const answered = (state.legend ?? [])
      .filter((a) => Object.keys(a.values).length > 0)
      .map((a) => a.frame_id)
    if (!clubOpen({ answeredFrameIds: answered, rung: rungReached(state.proof) })) return
    setWelcome(true)
    welcomeToClub()
    track('club_welcome', { sections: state.sections_completed.length })
  }, [])

  const answeredIds = useMemo(
    () =>
      (learner.legend ?? [])
        .filter((a) => Object.keys(a.values).length > 0)
        .map((a) => a.frame_id),
    [learner.legend],
  )
  /*
    The door, which did not exist.

    /club rendered for anybody who typed the address — the welcome CEREMONY was gated and
    the room behind it was not, so the most important threshold in the product was a
    formality you could walk straight past. Membership is now the thing you can be
    outside of.

    `mounted` matters: the answer is unknowable before the browser has read localStorage,
    and flashing the door at a member is worse than a moment of nothing.
  */
  const inside =
    !mounted ||
    clubOpen({ answeredFrameIds: answeredIds, rung, welcomedAt: learner.club_welcomed_at })

  if (welcome) return <Welcome onDone={() => setWelcome(false)} />
  if (!inside) return <Door answered={answeredIds} />

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
        learner={{
          played,
          done,
          rung,
          owned: owned.length,
          ownedPieces: owned,
          legendAnswered: (learner.legend ?? [])
            .filter((a) => Object.keys(a.values).length > 0)
            .map((a) => a.frame_id),
          legendPrompt: learner.legend_prompt ?? 'unseen',
          legendUnlocked: legendUnlocked(learner.sections_completed ?? []),
          capped,
          claimed,
        }}
        now={now}
        mounted={mounted}
      />

      {/*
        The city half of the Club, and the half that is not about Portuguese.

        Pull, not push: nobody is sent this. It is here for the person who has a thing to
        do tomorrow and would rather not do the whole exchange in English — which is the
        only reason a tool like this gets opened at all.
      */}
      <Situations />

      <p className="mt-auto text-center text-xs text-muted">{CLUB.footer}</p>
    </main>
  )
}

/** Crates finished, said as a fact about them rather than as a score. */
function throughLine(n: number): string {
  if (n === 1) return 'One vibe all the way through.'
  return n + ' vibes all the way through.'
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
        className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink"
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
  learner: {
    played: Set<string>
    done: Set<string>
    rung: Rung
    owned: number
    ownedPieces: string[]
    legendAnswered: string[]
    legendPrompt: LearnerState['legend_prompt']
    legendUnlocked: boolean
    /** The picker's own allowance rule, so the two screens cannot disagree. */
    capped: boolean
    claimed: Set<CultureFamily>
  }
  now: Date | null
  mounted: boolean
}) {
  const { played, done, rung, capped, claimed } = learner
  const moves: Move[] = []

  if (mounted && now) {
    const drop = CRATES.find((c) => c.drop && isLive(c, now) && !done.has(c.id))
    if (drop?.drop) {
      moves.push({
        key: 'drop',
        ...MOVES.drop,
        detail: drop.title + ' · ' + daysLeft(drop, now) + ' days left',
        href: '/vibes?open=' + drop.id,
        crate: drop,
        urgent: true,
      })
    }
  }

  /*
    The Legend sits directly under the drop, above everything else.

    It is the product's proposition rather than one of its pages, and the count is the
    thread's payoff: "6 of 10 · two new cards opened in Pulp Fiction" is a sentence about
    what a crate was FOR. It never appears to somebody who declined it.
  */
  if (mounted && learner.legendPrompt !== 'declined' && learner.legendUnlocked) {
    /*
      Counted in cards ANSWERED, not in cards "unlocked".

      This asked framesUnlockedBy — which cards you have the words for — and offered "2
      new Legend cards". The Legend has not worked that way for a long time: it counts
      vibes and opens all ten at once, so the number here was from a model the page it
      links to had no concept of. Once it is open, what is left is simply what is left.
    */
    const total = LEGEND_FRAMES.length
    const done = learner.legendAnswered.length
    const left = total - done
    if (left) {
      moves.push({
        key: 'legend',
        ...MOVES.legend,
        detail: done ? done + ' of ' + total + ' answered' : 'Ten questions, one at a time',
        href: '/legend',
        urgent: false,
      })
    }
  }

  // Two cards is where a cold open stops being one card asked repeatedly.
  if (mounted && learner.legendAnswered.length >= 2) {
    moves.push({
      key: 'cold',
      ...MOVES.cold,
      detail: 'One of your ' + learner.legendAnswered.length + ' answers, at random',
      href: '/legend?cold=1',
    })
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
        href: '/vibes?open=' + resume.id,
        crate: resume,
      })
    }

    /*
      Never opened, reachable, AND within the allowance.

      This checked entryRung only, so the Club cheerfully offered "Open a new crate ·
      Audrey Hepburn" to somebody who had spent all three — they tapped it, the picker's
      guard refused, and nothing happened with no message. A home screen that offers a
      move the product will not honour is worse than one that offers nothing.
    */
    const fresh = CRATES.find(
      (c) =>
        !c.drop &&
        entryRung(c) <= rung &&
        !(ROOTS_BY_FAMILY[c.id] ?? []).some((r) => played.has(r.root_id)) &&
        (!capped || claimed.has(c.id)),
    )
    if (fresh) {
      moves.push({
        key: 'open',
        ...MOVES.open,
        detail: fresh.title,
        href: '/vibes?open=' + fresh.id,
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
          href: '/vibes?open=' + first.id,
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
              'tap-target flex items-center gap-3 rounded border px-4 py-3 transition ' +
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
              <span className="mt-1 block text-xs text-muted">{m.why}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}


/**
 * What somebody outside the Club sees.
 *
 * It has to say the same thing the deal screen says, because this is the goal the whole
 * product is pointed at: the way in is being able to introduce yourself in Portuguese.
 * Two different reasons for being outside, and they are not the same problem — the card
 * is not written yet, or it is written and has never been said cold.
 */
function Door({ answered }: { answered: string[] }) {
  const left = cardToGo(answered)
  const written = cardDone(answered)
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

      <div className="flex flex-1 flex-col gap-3">
        <p className="eyebrow text-muted">{CLUB.door.eyebrow}</p>
        <h1 className="display text-balance text-3xl">{CLUB.door.headline}</h1>
        <p className="text-sm leading-relaxed text-muted">{CLUB.door.body}</p>

        {/* Where they actually are, said as a distance rather than a failure. */}
        <p className="mt-3 text-sm font-semibold">
          {written
            ? CLUB.door.speak
            : left === 1
              ? 'One question left on your card.'
              : left + ' questions left on your card.'}
        </p>

        <p className="mt-6 text-xs leading-relaxed text-muted">{CLUB.door.inside}</p>
      </div>

      <Link
        href="/legend"
        className="tap-target eyebrow block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
      >
        {CLUB.door.cta}
      </Link>
    </main>
  )
}


/** What is worth doing in the city, as opposed to what is worth doing in the language. */
function Situations() {
  const list = situationsFor(DEFAULT_CHAPTER).filter((x) => isCurrent(x))
  if (!list.length) return null
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="eyebrow min-w-0 text-accent">{CLUB.city_label}</h2>
        <span className="h-px flex-1 bg-line" />
      </div>
      <p className="text-xs leading-relaxed text-muted">{CLUB.city_note}</p>
      <div className="flex flex-col gap-3">
        {list.map((s) => (
          <Link
            key={s.id}
            href={'/errand/' + s.id}
            data-testid={'situation-' + s.id}
            className="tap-target flex flex-col gap-1 rounded border border-line bg-bg-elev px-4 py-3 transition hover:border-accent/50"
          >
            <span className="display text-base">{s.title}</span>
            <span className="text-xs leading-relaxed text-muted">{s.why}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
