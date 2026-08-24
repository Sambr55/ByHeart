'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CRATES,
  PIECES,
  ROOTS_BY_FAMILY,
  RUNGS,
  daysLeft,
  entryRung,
  isLive,
  rootById,
  rungReached,
  type Crate,
  type CultureFamily,
  type DropEvent,
  type Root,
  type Rung,
} from '@/content/roots'
import {
  CLOSE,
  DEAL as DEAL_COPY,
  DEMO_BEATS,
  DEMO_CLOSE,
  LANDING,
  NO_CUE_PROMPTS,
  PAIR_STEP,
  PICKER,
} from '@/content/front-door'
import { COLLISIONS } from '@/content/roots'
import { slugFor } from '@/content/audio-manifest'
import { Proof } from '@/components/Proof'
import { Menu } from '@/components/Menu'
import { Shelves } from '@/components/Shelves'
import { CrateIcon } from '@/components/CrateIcon'
import { PAIRS, SOURCE_CULTURES } from '@/content/pairs'
import { setPair } from '@/engine/pair'
import { track } from '@/engine/analytics'
import { insightsFor } from '@/content/osmosis'
import {
  AGE_PAIR,
  AGE_PAYOFF,
  AGE_QUESTION,
  GENDER_PAYOFF,
  GENDER_QUESTION,
  GENDER_RULE,
  GOAL_LABEL,
  GOAL_NEEDS,
  GOAL_QUESTION,
  type AgeBand,
  type Goal,
  type LanguageGender,
} from '@/content/profile'
import {
  acceptDeal,
  acquirePiece,
  markOsmosisSeen,
  recordProof,
  rememberNoCue,
  resetLearnerCache,
  setAffinity,
  setProfile,
  voiceLean,
} from '@/engine/learner'
import {
  branchesFor,
  buildTargetFor,
  capabilities,
  nextProfileQuestion,
  useJourney,
} from '@/engine/journey'
import { useLearner } from '@/engine/useLearner'
import { useEntitlements } from '@/engine/useEntitlements'
import { AudioButton } from './AudioButton'

/**
 * The journey UI.
 *
 * §16 asks for a cultural platform rather than a school product: the root gets space,
 * the Portuguese arrives as a transformation rather than a subtitle, pieces are pulled
 * physically out of the line, and the no-cue beats strip the styling away entirely
 * because the absence of culture is the point.
 */

function Shell({
  stage,
  children,
  eyebrow,
  tone,
  nav = true,
}: {
  stage: string
  eyebrow?: string
  /** The crate's own colour. ROOT and LANDING take it; CHOICE and REAL WORLD do not. */
  tone?: string
  nav?: boolean
  children: React.ReactNode
}) {
  const { back, goHome, canGoBack, owned } = useJourney()
  // The pieces were taught one at a time and then vanished, so a learner could finish a
  // whole crate without ever seeing the "vocabulary bank" the picker promised them.
  // Read after mount, like everything else that comes out of saved state.
  const mountedAt = useNowAfterMount()
  const kept = mountedAt ? owned.length : 0
  return (
    <div
      data-stage={stage}
      data-tone={tone}
      className="flex min-h-dvh flex-col bg-bg text-fg transition-colors duration-700"
    >
      {/* The bar is solid: a coloured header needs neither the translucency nor the
          blur, and the blur was what forced the menu overlay to be portalled to the
          body in the first place. */}
      {nav || eyebrow ? (
        <header className="bar sticky top-0 z-10 px-5 py-2.5">
          <div className="mx-auto flex w-full max-w-md items-center gap-3">
            {nav && canGoBack ? (
              <button
                type="button"
                data-testid="back"
                onClick={back}
                aria-label="Back"
                className="tap-target -ml-2 flex items-center justify-center rounded px-2 opacity-80 transition hover:opacity-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}
            <p className="eyebrow flex-1 truncate">{eyebrow ?? ''}</p>
            {kept > 0 ? (
              <span className="eyebrow shrink-0 tabular-nums opacity-80" title="Pieces you have kept">
                {kept} kept
              </span>
            ) : null}
            {nav && canGoBack ? (
              <button
                type="button"
                data-testid="home"
                onClick={goHome}
                className="tap-target text-[0.6rem] uppercase tracking-wider opacity-80 transition hover:opacity-100"
              >
                Crates
              </button>
            ) : null}
            <Menu />
          </div>
        </header>
      ) : null}
      {/* The field used to run behind the body text of every screen. It is a band under
          the header now — texture where it frames something, never under a paragraph. */}
      <div aria-hidden className="azulejo-band h-6 w-full shrink-0" />
      <main className="flex-1">
        {/*
            mt-auto pushes the button to the foot of a short screen and gives nothing at
            all on a full one, which is how the CTA came to land hard against the
            paragraph above it. A real gap on the flex parent cannot collapse, and the
            deeper bottom well stops the last row of a scrolling page finishing flush
            with the screen edge.
          */}
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md flex-col gap-6 px-5 pb-10 pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}

function Cta({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      data-testid="continue"
      onClick={onClick}
      disabled={disabled}
      // mt-auto and mt-6 were both on this element, which is a cascade collision: whichever
      // Tailwind emitted last won, so the gap above the button was whatever the build
      // happened to produce. mt-auto keeps it at the foot of a short screen; the padding
      // gives it clearance on a long one, and padding cannot be swallowed by auto.
      className="tap-target eyebrow mt-auto w-full rounded bg-accent px-5 py-4 text-accent-ink transition active:scale-[0.99] disabled:border disabled:border-line-strong disabled:bg-transparent disabled:text-muted"
    >
      {label}
    </button>
  )
}

/** A piece, rendered the same way in every cultural world (§16 extraction). */
function Piece({ pt, gloss }: { pt: string; gloss: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-accent/60 bg-accent/10 px-3 py-1.5">
      <span className="pt text-sm font-semibold text-accent">{pt}</span>
      <span className="text-xs text-muted">{gloss}</span>
    </span>
  )
}

export function Journey() {
  const { step } = useJourney()
  if (!step) return null
  switch (step.kind) {
    case 'landing':
      return <Landing />
    case 'demo':
      return <Demo i={step.i} />
    case 'pair':
      return <PairStep />
    case 'deal':
      return <Deal />
    case 'picker':
      return <Picker />
    case 'root':
      return (
        <RootBeatView
          key={step.rootId + step.beat + (step.pieceIndex ?? '')}
          rootId={step.rootId}
          beat={step.beat}
          pieceIndex={step.pieceIndex}
        />
      )
    case 'osmosis':
      return <Osmosis />
    case 'profile':
      return <ProfileStep key={step.which} which={step.which} />
    case 'section-complete':
      return <SectionComplete />
    case 'collision':
      return <CollisionView key={step.collisionId} id={step.collisionId} />
    case 'nocue':
      return <NoCueView key={step.i} i={step.i} />
    case 'cansay':
      return <CanSay />
    case 'proof':
      return <ProofBeat />
    case 'close':
      return <Close />
  }
}

/**
 * The deal.
 *
 * Three questions a person has after the demo — what is this, what do you want from
 * me, what do I get — answered in that order and then got out of the way. The fourth
 * block is the one that matters: saying plainly what DUB has refused to build stops
 * people measuring it against the thing everyone else built.
 */
/**
 * Choosing the language.
 *
 * Everything unavailable is shown rather than hidden, and stays inert — a disabled row
 * must never become an email capture. The deal screen two beats later promises DUB does
 * not do that kind of thing, and the only honest moment to ask for an email is at the
 * end, when there is something worth keeping.
 */
function PairStep() {
  const { next } = useJourney()
  const [showSources, setShowSources] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const source = SOURCE_CULTURES.find((c) => c.available)!

  return (
    <Shell stage="CHOICE">
      <p className="eyebrow text-muted">{PAIR_STEP.eyebrow}</p>
      <h1 className="display mt-2 text-balance text-2xl">{PAIR_STEP.headline}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{PAIR_STEP.sub}</p>

      <div className="mt-6 space-y-2">
        {PAIRS.map((p) => (
          <button
            key={p.target_locale}
            type="button"
            data-testid={'pair-' + p.target_locale}
            aria-pressed={picked === p.target_locale}
            disabled={!p.available}
            onClick={() => setPicked(p.target_locale)}
            className={
              'tap-target flex w-full items-center justify-between gap-3 rounded border px-4 py-4 text-left transition ' +
              (!p.available
                ? 'border-line/40 bg-surface/30 opacity-40'
                : picked === p.target_locale
                  ? 'border-accent bg-accent/10'
                  : 'border-line bg-bg-elev hover:border-accent/50')
            }
          >
            <span className="min-w-0">
              <span className="display block text-base">
                {p.native} {p.flag}
              </span>
              <span className="mt-0.5 block text-xs text-muted">{p.label}</span>
            </span>
            {!p.available ? (
              <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[0.55rem] uppercase tracking-wider text-muted">
                {PAIR_STEP.soon}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-baseline gap-x-2 text-xs text-muted">
        <span>
          {PAIR_STEP.source_label}: {source.label} {source.flag}
        </span>
        <button
          type="button"
          data-testid="pair-source"
          onClick={() => setShowSources((v) => !v)}
          className="tap-target underline underline-offset-4 transition hover:text-fg"
        >
          {PAIR_STEP.source_change}
        </button>
      </div>

      {showSources ? (
        <div className="mt-3 rounded border border-line bg-bg-elev px-4 py-4">
          <p className="text-xs leading-relaxed text-muted">{PAIR_STEP.source_note}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SOURCE_CULTURES.map((c) => (
              <li
                key={c.id}
                className={
                  'rounded-full border px-2.5 py-1 text-xs ' +
                  (c.available
                    ? 'border-accent/50 text-accent'
                    : 'border-line text-muted/60')
                }
              >
                {c.label} {c.flag}
                {c.available ? '' : ' · soon'}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Cta
        label={PAIR_STEP.cta}
        disabled={!picked}
        onClick={() => {
          const chosen = PAIRS.find((p) => p.target_locale === picked)
          if (!chosen) return
          setPair({
            source_culture: chosen.source_culture,
            target_language: chosen.target_language,
            target_locale: chosen.target_locale,
            day_zone: chosen.day_zone,
          })
          // The record to read has just changed. Drop the cached one so the next read
          // loads this pair's, rather than whatever was in memory from the default.
          resetLearnerCache()
          track('pair_chosen', { pair: chosen.source_culture + ':' + chosen.target_locale })
          next()
        }}
      />
    </Shell>
  )
}

function Deal() {
  const { next } = useJourney()

  const Block = ({
    label,
    lines,
    numbered = false,
  }: {
    label: string
    lines: readonly string[]
    numbered?: boolean
  }) => (
    <section className="border-t border-line pt-4">
      <p className="eyebrow text-accent">{label}</p>
      <ul className="mt-3 space-y-2.5">
        {lines.map((line, i) => (
          <li key={line} className="flex gap-3 text-sm leading-relaxed text-fg/85">
            <span className="shrink-0 pt-0.5 text-xs tabular-nums text-muted">
              {numbered ? i + 1 : '·'}
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  )

  return (
    <Shell stage="CHOICE">
      <p className="eyebrow text-muted">{DEAL_COPY.eyebrow}</p>
      <p className="display mt-2 text-balance text-3xl">{DEAL_COPY.headline}</p>

      <div className="mt-7 space-y-6 pb-7">
        <Block label={DEAL_COPY.how.label} lines={DEAL_COPY.how.steps} numbered />

        {/* The ladder, drawn rather than described. */}
        <section className="border-t border-line pt-4">
          <p className="eyebrow text-accent">{DEAL_COPY.stages.label}</p>
          <p className="mt-3 text-sm leading-relaxed text-fg/85">{DEAL_COPY.stages.intro}</p>
          <ol className="mt-5">
            {RUNGS.map((r, i) => (
              <li key={r.rung} className="relative grid grid-cols-[28px_1fr] gap-x-3 pb-5 last:pb-0">
                {/* the rail, stopping at the last dot rather than running past it */}
                {i < RUNGS.length - 1 ? (
                  <span aria-hidden className="absolute left-[13.5px] top-7 bottom-0 w-px bg-line" />
                ) : null}
                <span
                  className={
                    'relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[0.65rem] font-semibold tabular-nums ' +
                    (r.rung === 1
                      ? 'border-accent bg-accent text-accent-ink'
                      : 'border-line bg-bg text-muted')
                  }
                >
                  {r.rung}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="display text-sm">{r.name}</span>
                    {r.rung === 1 ? (
                      <span className="eyebrow text-[0.5rem] text-accent">{DEAL_COPY.stages.start}</span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">{r.what}</span>
                  <span className="pt mt-1.5 block text-xs text-accent/80">{r.example}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t border-line/60 pt-3 text-xs leading-relaxed text-muted">
            {DEAL_COPY.stages.move}
          </p>
        </section>

        {/* What accumulates — the thing the picker calls a vocabulary bank. */}
        <section className="border-t border-line pt-4">
          <p className="eyebrow text-accent">{DEAL_COPY.collect.label}</p>
          <ul className="mt-3 space-y-2.5">
            {DEAL_COPY.collect.lines.map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed text-fg/85">
                <span className="shrink-0 pt-0.5 text-xs text-muted">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {DEAL_COPY.collect.examples.map((e) => (
              <span
                key={e}
                className="pt rounded-[3px] border border-line bg-chip px-2.5 py-1 text-xs text-accent"
              >
                {e}
              </span>
            ))}
          </div>
        </section>

        <Block label={DEAL_COPY.ask.label} lines={DEAL_COPY.ask.lines} />
        <Block label={DEAL_COPY.get.label} lines={DEAL_COPY.get.lines} />

        <section className="rounded border border-line bg-bg-elev p-4">
          <p className="eyebrow text-muted">{DEAL_COPY.not.label}</p>
          <p className="mt-2 text-sm leading-relaxed">{DEAL_COPY.not.line}</p>
        </section>
      </div>

      <Cta
        label={DEAL_COPY.cta}
        onClick={() => {
          acceptDeal()
          track('deal_accepted', {})
          next()
        }}
      />
    </Shell>
  )
}

// --------------------------------------------------------------- front door

function Landing() {
  const { next } = useJourney()
  return (
    <Shell stage="LANDING">
      <div className="flex flex-1 flex-col justify-center">
        <p className="display text-5xl tracking-tight">{LANDING.wordmark}</p>
        <p className="mt-2 text-balance text-xl text-accent">{LANDING.line}</p>
        <div className="mt-10 space-y-7">
          <p className="display text-balance text-2xl">{LANDING.lines[0]}</p>
          <p className="text-pretty text-sm text-muted">{LANDING.lines[1]}</p>
          <div className="space-y-4">
            {LANDING.lines[2].split('\n').map((l) => (
              <p key={l} className="display text-balance text-xl leading-snug">
                {l}
              </p>
            ))}
          </div>
          <p className="text-balance text-base font-semibold">{LANDING.lines[3]}</p>
        </div>
      </div>
      <Cta label={LANDING.cta} onClick={() => { track('landing_cta_tap', {}); next() }} />
      {/* Two ways back in for a returning person: today's line if they have ninety
          seconds, their account if they are on a new phone. */}
      <div className="mt-4 flex items-center justify-center gap-5 text-xs text-muted">
        <Link href="/line" className="underline underline-offset-4">
          Today’s line
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/signin" className="underline underline-offset-4">
          Been here before?
        </Link>
      </div>
    </Shell>
  )
}

/**
 * Recognition, translation and takeaway on one screen, staged.
 *
 * The point of the demo is that the trick looks like a trick: you already know the
 * line, here it is living in Portuguese, and here is the piece you just got for free.
 * Three taps broke that into three unrelated assertions.
 */
function Demo({ i }: { i: number }) {
  const { next } = useJourney()
  const beat = DEMO_BEATS[i]
  const [reveal, setReveal] = useState(0)
  const staged = Boolean(beat.translation)
  const ready = !staged || reveal >= 2

  return (
    <Shell stage="DEMO" nav>
      <div className="flex flex-1 flex-col justify-center">
        <p className="display text-balance text-3xl sm:text-4xl">{beat.display}</p>
        {beat.gloss ? <p className="mt-3 text-sm text-muted">{beat.gloss}</p> : null}

        {staged ? (
          <div className="mt-10 min-h-[9rem]">
            {reveal >= 1 ? (
              <div className="animate-bank">
                <div className="flex items-center gap-3">
                  <AudioButton slug={slugFor('Fala comigo.')} text="Fala comigo, Goose." size="sm" />
                  <p className="pt text-balance text-2xl text-accent sm:text-3xl">
                    {beat.translation!.pt}
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted">{beat.translation!.en}</p>
              </div>
            ) : null}

            {reveal >= 2 && beat.takeaway ? (
              <div className="animate-bank mt-7 rounded border border-accent/50 bg-accent/10 p-4">
                <p className="pt text-xl font-semibold text-accent">{beat.takeaway.display}</p>
                <p className="mt-1 text-sm text-muted">{beat.takeaway.gloss}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {beat.branches ? (
          <ul className="mt-6 space-y-3">
            {beat.branches.map((b, n) => (
              <li
                key={b.pt}
                style={{ animationDelay: n * 110 + 'ms' }}
                className="animate-bank flex items-center gap-3 rounded border border-line bg-bg-elev px-4 py-3"
              >
                <AudioButton slug={slugFor(b.pt)} text={b.pt} size="sm" />
                <span>
                  <span className="pt block text-lg text-accent">{b.pt}</span>
                  <span className="mt-1 block text-sm text-fg/75">{b.en}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {beat.close ? (
          <p className="mt-8 text-balance text-sm font-semibold leading-relaxed">{beat.close}</p>
        ) : null}
      </div>

      {staged && !ready ? (
        <Cta
          label={reveal === 0 ? 'IN PORTUGUESE?' : 'SO WHAT DO I KEEP?'}
          onClick={() => setReveal((r) => r + 1)}
        />
      ) : (
        <Cta label={beat.cta} onClick={next} />
      )}
    </Shell>
  )
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/**
 * The day the drop stops existing — the morning after the thing it was pegged to.
 * Computed from the ISO date in UTC so it renders identically on the server and in the
 * browser; a date formatted from local time is a hydration mismatch waiting to happen.
 */
function goneOn(drop: DropEvent): string {
  const d = new Date(drop.on + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return 'GONE ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]
}

/**
 * The clock is read after mount, never during render.
 *
 * A countdown is the one piece of state that is guaranteed to differ between a server
 * render and a browser render, and an expiring crate that vanishes mid-hydration is
 * worse than one that lingers for a single frame. So: everything is live until the
 * browser says otherwise.
 */
function useNowAfterMount(): Date | null {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])
  return now
}

function DropClock({ crate, now }: { crate: Crate; now: Date | null }) {
  const left = now ? daysLeft(crate, now) : null
  if (left === null) return null
  return (
    <span className="shrink-0 rounded-full border border-accent/60 px-2 py-0.5 text-[0.55rem] uppercase tracking-wider text-accent">
      {left <= 1 ? 'last day' : left + ' days left'}
    </span>
  )
}

/**
 * The ladder, drawn.
 *
 * It is the spine of the product and it was an ordered list inside a disclosure, which
 * made it look like a footnote. Drawing it makes it a thing you climb with your position
 * marked on it — and it is a real object rather than a decoration: the rungs you have
 * passed are solid, the one you are on is filled, and the ones above are drawn but
 * empty, which is the whole argument of the stage model in one picture.
 *
 * Bottom-to-top, because that is what climbing looks like. Inline SVG, so it costs no
 * asset and takes its colour from the theme it lands in.
 */
function Ladder({ here }: { here: Rung }) {
  const step = 34
  const height = RUNGS.length * step + 16
  return (
    <figure className="mt-3">
      <svg
        viewBox={'0 0 260 ' + height}
        role="img"
        aria-label={'Stage ' + here + ' of 6: ' + RUNGS[here - 1].name}
        className="w-full max-w-[260px]"
        style={{ height: height }}
      >
        {/* the two rails */}
        <line x1="14" y1="8" x2="14" y2={height - 8} stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
        <line x1="40" y1="8" x2="40" y2={height - 8} stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
        {RUNGS.map((r, i) => {
          // Drawn from the bottom up: stage 1 is the rung you stand on first.
          const y = height - 16 - i * step
          const reached = r.rung <= here
          const isHere = r.rung === here
          return (
            <g key={r.rung}>
              <line
                x1="14"
                y1={y}
                x2="40"
                y2={y}
                stroke={reached ? 'var(--accent)' : 'currentColor'}
                strokeOpacity={reached ? 1 : 0.3}
                strokeWidth={isHere ? 3 : 2}
                strokeLinecap="round"
              />
              <circle
                cx="27"
                cy={y}
                r={isHere ? 5 : 3}
                fill={isHere ? 'var(--accent)' : reached ? 'var(--accent)' : 'none'}
                fillOpacity={isHere ? 1 : reached ? 0.45 : 0}
                stroke={reached ? 'var(--accent)' : 'currentColor'}
                strokeOpacity={reached ? 1 : 0.3}
                strokeWidth="1.5"
              />
              <text
                x="56"
                y={y + 4}
                fontSize="11"
                fill="currentColor"
                fillOpacity={isHere ? 1 : reached ? 0.75 : 0.42}
                fontWeight={isHere ? 600 : 400}
              >
                {r.name}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-1 text-xs text-muted">
        You are on {RUNGS[here - 1].name.toLowerCase()}. Nothing above is locked forever —
        each one opens by saying something cold.
      </figcaption>
    </figure>
  )
}

function Picker() {
  const { chooseFamily, state } = useJourney()
  const learner = useLearner()
  const access = useEntitlements()
  // Remember what they chose. Stepping back onto this screen and finding the choice
  // wiped is the kind of small betrayal that makes a product feel unreliable.
  // Tap enters. A list of eleven where every row is a destination should behave like a
  // list of eleven destinations — select-then-confirm is for forms, and it put the only
  // way in at the very bottom, under eleven cards and three notes. The pressed state is
  // kept so the tap is acknowledged in the moment before the screen changes.
  const [entering, setEntering] = useState<CultureFamily | null>(null)
  const now = useNowAfterMount()
  // Nothing is dimmed until the browser has read what this learner has actually done.
  // A crate that locks itself a frame after hydration is worse than one that never did.
  const mounted = now !== null
  const rung: Rung = mounted ? rungReached(learner.proof) : 6
  // A crate is finished when every root in it has been played — not, as before, when
  // any single one has. Now that a section only serves the stages you have reached,
  // "played one root" and "seen the whole crate" are different things.
  const playedIds = useMemo(() => new Set(state.rootsPlayed), [state.rootsPlayed])
  const shown = CRATES.filter((c) => (now ? isLive(c, now) : true))

  /**
   * The order of the list is a recommendation, and authoring order is not one.
   *
   * Live drops first, because they expire and the code already refuses to lock them.
   * Then what is open and untouched, then what is in progress, then what is explored as
   * far as this stage reaches, then finished, then what cannot be opened at all. A
   * learner scanning from the top meets the most urgent thing first and the unavailable
   * things last, which is the only ordering that answers "what should I do now".
   */
  const rank = (c: (typeof CRATES)[number]): number => {
    const all = ROOTS_BY_FAMILY[c.id] ?? []
    const played = all.filter((r) => playedIds.has(r.root_id)).length
    const done = all.length > 0 && played === all.length
    const available = all.filter((r) => r.rung <= rung && !playedIds.has(r.root_id)).length
    const openable = c.drop || entryRung(c) <= rung
    const capped = !c.drop && atLimit && !claimed.has(c.id)
    if (c.drop) return 0
    if (!openable || capped) return 5
    if (done) return 4
    if (available === 0) return 3
    if (played > 0) return 2
    return 1
  }

  /**
   * The free tier: three crates, chosen and permanent.
   *
   * Chosen by opening them, and never taken away — the shape of the free tier is set
   * once and never tightened, so a crate somebody has already been inside stays theirs
   * whatever happens to their plan afterwards.
   *
   * Nothing locks until the server has actually answered (`known`), because a gate
   * that fires on the default would shut a paying subscriber out of their own crates
   * for the first second of every page load.
   */
  const claimed = useMemo(() => {
    const out = new Set<CultureFamily>()
    for (const id of state.rootsPlayed) {
      const f = rootById(id)?.culture_family
      const crate = f ? CRATES.find((c) => c.id === f) : undefined
      // A drop never counts against the allowance, so it can never use one up either.
      if (crate && !crate.drop) out.add(crate.id)
    }
    return out
  }, [state.rootsPlayed])
  const allowance = access.entitlements.crates
  const spent = claimed.size
  const atLimit = access.known && spent >= allowance
  const anyLocked = shown.some((c) => entryRung(c) > rung)
  const here = RUNGS[rung - 1]
  return (
    <Shell stage="CHOICE">
      <h1 className="display text-balance text-2xl">{PICKER.headline}</h1>
      <p className="mt-2 text-sm text-muted">{PICKER.sub}</p>
      {mounted ? (
        <details className="group mt-4">
          {/*
            Two items that refused to shrink with only a collapsible divider between
            them, and nothing clipping the result — so at stage 5, where the label reads
            "Talk about other people", the row needed 459px, got 390, and slid the whole
            document sideways. It overflowed every phone made, including a 430 Pro Max.

            Wrapping, sentence case, and the capability leading with the number second.
            Worst case it takes two lines instead of running off the screen.
          */}
          <summary className="tap-target flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="display min-w-0 text-sm text-accent">{here.name}</span>
            <span className="min-w-0 text-xs tabular-nums text-muted">
              stage {rung} of 6
            </span>
            <span className="ml-auto shrink-0 text-xs text-muted">
              {PICKER.stages_toggle} ▸
            </span>
          </summary>
          <Ladder here={rung} />
        </details>
      ) : null}
      <div className="mt-5 space-y-2">
        {[...shown].sort((a, b) => rank(a) - rank(b)).map((f) => {
          const all = ROOTS_BY_FAMILY[f.id] ?? []
          const finished = all.length > 0 && all.every((r) => playedIds.has(r.root_id))
          const unplayed = all.filter((r) => !playedIds.has(r.root_id))
          const available = unplayed.filter((r) => r.rung <= rung).length
          // Explored as far as this learner can go, with more still inside. Not the
          // same as locked, and it would be a lie to show it as either finished or open.
          // It also has to have been started: a crate whose every root sits above this
          // stage has nothing "taken" in it, and saying so would be nonsense.
          const started = all.some((r) => playedIds.has(r.root_id))
          const waiting = !finished && started && available === 0
          const nextAt = (unplayed.length
            ? (Math.min(...unplayed.map((r) => r.rung)) as Rung)
            : 6) as Rung
          // A drop never locks. It expires, and something that can be lost forever by
          // being busy must never also be something you can be shut out of.
          const opensAt = entryRung(f)
          // Only a crate nobody has ever been able to open is closed. Anything already
          // visited can be gone through again — there is no reason it should not be,
          // and being told "no, you did that already" is a strange thing for a product
          // built on things you enjoy to say.
          const unreached = !f.drop && !started && opensAt > rung
          // A drop is never plan-locked. It can be lost forever by being busy, and
          // charging for the one thing that expires would turn the only real deadline
          // in the product into a punishment.
          const planLocked = !f.drop && atLimit && !claimed.has(f.id)
          const locked = unreached || waiting || planLocked
          return (
            <div
              key={f.id}
              data-tone={f.tone}
              className={
                // The drop's frame lives on the wrapper, not the button, so the ticket
                // link can sit inside the card without being nested in a button.
                f.drop
                  ? 'rounded border transition ' +
                    (finished
                      ? 'border-line/50 bg-surface/40 opacity-45'
                      : entering === f.id
                        ? 'border-accent bg-accent/10'
                        : 'border-accent/45 bg-accent/[0.04]')
                  : undefined
              }
            >
              <button
                type="button"
                aria-disabled={unreached || planLocked}
                disabled={unreached || planLocked}
                onClick={() => {
                  if (unreached || planLocked) return
                  setEntering(f.id)
                  chooseFamily(f.id)
                }}
                className={
                  'tap-target flex w-full justify-between gap-3 border-l-[3px] border-l-[color:var(--tone)] px-4 py-4 text-left transition ' +
                  (f.drop
                    ? 'items-start '
                    : 'items-center rounded border ' +
                      (unreached
                        ? 'border-line/40 bg-surface/30 opacity-40'
                        : entering === f.id
                          ? 'border-accent bg-accent/10'
                          : finished || waiting
                            ? 'border-line/60 bg-surface/50 opacity-70 hover:border-accent/40'
                            : 'border-line bg-bg-elev hover:border-accent/50'))
                }
              >
                {/* Every card is built the same way, the drop included — it was the only
                    one in the list without a tile, which is half of why it read as
                    floating free of everything around it. */}
                <span
                  aria-hidden
                  className={
                    'azulejo-block mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded ' +
                    (f.drop ? 'self-start' : 'self-center')
                  }
                >
                  <CrateIcon crate={f.id} className="h-6 w-6 text-[color:var(--tone)]" />
                </span>
                <span className="min-w-0 flex-1">
                  {f.drop ? (
                    <span className="eyebrow mb-1 block text-[0.55rem] text-accent">
                      DROP · {goneOn(f.drop)}
                    </span>
                  ) : null}
                  <span className="display block text-base">{f.title}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {planLocked
                      ? 'Your ' + allowance + ' crates are chosen, and they stay yours. This one comes with DUB.'
                      : finished
                      ? 'You have been through all of it. Go again whenever you like.'
                      : waiting
                        ? 'Everything here that your stage reaches is done. ' +
                          RUNGS[nextAt - 1].opens.replace('Opens once', 'The rest opens once') +
                          ' Go again in the meantime if you like.'
                        : unreached
                          ? RUNGS[opensAt - 1].opens
                          : f.blurb}
                  </span>
                  {f.drop ? (
                    <span className="mt-1.5 block text-xs text-muted">
                      {f.drop.event} · {f.drop.place}
                    </span>
                  ) : null}
                </span>
                {finished ? (
                  <span className="shrink-0 rounded-full border border-correct/50 px-2 py-0.5 text-[0.55rem] uppercase tracking-wider text-correct">
                    done
                  </span>
                ) : planLocked ? (
                  <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[0.55rem] uppercase tracking-wider text-muted">
                    DUB
                  </span>
                ) : locked ? (
                  <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[0.55rem] uppercase tracking-wider text-muted">
                    {RUNGS[(waiting ? nextAt : opensAt) - 1].name}
                  </span>
                ) : f.drop ? (
                  <DropClock crate={f} now={now} />
                ) : null}
              </button>
              {/* Outside the button on purpose — an anchor nested in a button is not a
                  thing a browser or a screen reader can make sense of. */}
              {/* The explanation sits with the thing it explains. It used to render
                  after the whole list, several screens below the card it describes. */}
              {f.drop ? (
                <p className="mt-2 px-4 text-xs leading-relaxed text-muted">
                  {PICKER.drop_note}
                </p>
              ) : null}
              {f.drop?.link ? (
                <a
                  href={f.drop.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-3 ml-4 inline-block px-0 text-[0.6rem] uppercase tracking-wider text-muted underline underline-offset-4 transition hover:text-accent"
                >
                  {f.drop.link_label ?? 'TICKETS'} ↗
                </a>
              ) : null}
            </div>
          )
        })}
      </div>
      {anyLocked ? (
        <p className="mt-2 text-xs leading-relaxed text-muted">{PICKER.locked_note}</p>
      ) : null}
      {atLimit ? (
        <p className="mt-2 mb-6 text-xs leading-relaxed text-muted">
          {PICKER.plan_note}{' '}
          <Link href="/pro" className="text-accent underline underline-offset-4">
            {PICKER.plan_cta}
          </Link>
        </p>
      ) : null}
    </Shell>
  )
}

// ------------------------------------------------------------------ a root

/** Build one branch from its own words. Production, not recognition. */
/**
 * Build one line from its own words.
 *
 * No decoys. A wrong tile made of a word the learner has never seen tests nothing
 * except whether they can recognise a stranger — the task is word order, so the tiles
 * are exactly the right words in the wrong order. Anything in the line that has not
 * been taught is glossed openly above it rather than quietly examined (§06).
 */
function MiniBuild({
  target,
  helpers,
  onSolved,
}: {
  target: string
  helpers?: Record<string, string>
  /** `clean` means right on the first submission, which is what the proof card counts. */
  onSolved: (result: { clean: boolean }) => void
}) {
  const tiles = useMemo(() => {
    const words = target.split(' ')
    const shuffled = words.map((text, i) => ({ id: text + i, text }))
    // Never hand back the answer already in order.
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    if (words.length > 1 && shuffled.every((s, i) => s.text === words[i])) {
      ;[shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]]
    }
    return shuffled
  }, [target])

  const glosses = useMemo(() => {
    if (!helpers) return []
    const words = target.replace(/[.?,]/g, '').split(' ')
    const seen = new Set<string>()
    return Object.entries(helpers)
      .filter(([w]) => {
        const bare = w.replace(/[.?,]/g, '')
        if (!words.some((x) => x.toLowerCase() === bare.toLowerCase())) return false
        if (seen.has(bare.toLowerCase())) return false
        seen.add(bare.toLowerCase())
        return true
      })
      .slice(0, 3)
  }, [helpers, target])

  const answer = target.split(' ')
  const [placed, setPlaced] = useState<{ id: string; text: string }[]>([])
  const [state, setState] = useState<'open' | 'wrong' | 'done'>('open')
  const [helped, setHelped] = useState(false)
  const attempts = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const pool = tiles.filter((t) => !placed.some((p) => p.id === t.id))

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  /**
   * Lay the answer out, in order, one piece at a time.
   *
   * Staggered rather than snapped into place because the point is to be watched: the
   * learner is meant to see WHERE each word goes, and a line that simply appears
   * teaches nothing. Tile ids carry their original position, so this is exact even
   * when a sentence repeats a word.
   */
  function showOrder() {
    if (helped) return
    setHelped(true)
    setState('open')
    setPlaced([])
    track('build_help', { target })
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const ordered = answer.map((text, i) => ({ id: text + i, text }))
    if (reduced) {
      setPlaced(ordered)
      return
    }
    ordered.forEach((t, i) => {
      timers.current.push(setTimeout(() => setPlaced((cur) => [...cur, t]), 190 * (i + 1)))
    })
  }

  function check() {
    const built = placed.map((p) => p.text)
    const right = built.length === answer.length && built.every((w, i) => w === answer[i])
    attempts.current += 1
    track('build_attempt', { target, correct: right })
    if (right) {
      setState('done')
      // Being shown the order means it was not said cold, and the proof card counts
      // nothing else. Quietly letting a helped line through would make the one number
      // the product asks to be judged on a lie.
      onSolved({ clean: attempts.current === 1 && !helped })
    } else {
      setState('wrong')
    }
  }

  return (
    <div className="mt-5">
      {glosses.length ? (
        <p className="pt mb-3 text-sm text-accent/80">
          {glosses.map(([w, g]) => w.replace(/[.,]/g, '') + ' = ' + g).join('   ·   ')}
        </p>
      ) : null}
      <div
        data-testid="tile-line"
        /* A seam for the walkthrough. The tile pool is shuffled, so without this the
           harness can only brute-force permutations, which is slow and flaky. */
        data-answer={target}
        className="min-h-[3.5rem] rounded border border-dashed border-line bg-bg-elev/60 p-2"
      >
        {placed.length ? (
          <div className="flex flex-wrap gap-2">
            {placed.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={state === 'done'}
                onClick={() => setPlaced((cur) => cur.filter((x) => x.id !== p.id))}
                className={
                  'tap-target rounded border px-3 py-2 ' +
                  (state === 'done' ? 'border-correct/50 bg-correct/10' : 'border-accent/50 bg-chip')
                }
              >
                <span className="pt">{p.text}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-1 py-2 text-xs text-muted">Tap the pieces in order.</p>
        )}
      </div>

      {state === 'done' ? null : (
        <div data-testid="tile-pool" className="mt-3 flex flex-wrap gap-2">
          {pool.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPlaced((cur) => [...cur, t])}
              className="tap-target rounded border border-line bg-bg-elev px-3 py-2 hover:border-accent/50"
            >
              <span className="pt">{t.text}</span>
            </button>
          ))}
        </div>
      )}

      {state === 'wrong' ? (
        <p className="mt-3 text-sm text-coach">
          Not the order Portuguese wants. Try moving the first piece.
        </p>
      ) : null}

      {state !== 'done' && !helped ? (
        <button
          type="button"
          data-testid="build-help"
          onClick={showOrder}
          className="tap-target mt-3 text-xs uppercase tracking-wider text-muted underline underline-offset-4 transition hover:text-fg"
        >
          Need some help?
        </button>
      ) : null}

      {helped && state !== 'done' ? (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          There it is, in order. Read it out loud, then check it — this one will not
          count towards the sentences you can say cold, which is the only number here
          worth anything.
        </p>
      ) : null}

      {state === 'done' ? (
        <div className="animate-bank mt-3 flex items-center gap-3 rounded border border-correct/40 bg-correct/10 px-4 py-3">
          <AudioButton slug={slugFor(target)} text={target} size="sm" />
          <span className="pt text-lg">{target}</span>
        </div>
      ) : (
        <button
          type="button"
          disabled={!placed.length}
          onClick={check}
          className="tap-target eyebrow mt-3 w-full rounded border border-accent bg-accent/10 px-4 py-3 text-accent disabled:border-line disabled:bg-transparent disabled:text-muted"
        >
          CHECK
        </button>
      )}
    </div>
  )
}

/** Highlight the extracted pieces where they sit inside the natural Portuguese. */
function Highlighted({
  line,
  pieces,
  dim = 'text-accent/70',
}: {
  line: string
  pieces: string[]
  dim?: string
}) {
  const spans = pieces
    .map((p) => {
      const needle = p.replace(/[…?]/g, '').trim()
      const at = line.toLowerCase().indexOf(needle.toLowerCase())
      return at < 0 ? null : { at, len: needle.length }
    })
    .filter(Boolean)
    .sort((a, b) => a!.at - b!.at) as { at: number; len: number }[]

  if (!spans.length) return <span className={dim}>{line}</span>

  const out: React.ReactNode[] = []
  let cursor = 0
  const rest = (text: string, key: string) =>
    text ? (
      <span key={key} className={dim}>
        {text}
      </span>
    ) : null

  spans.forEach((s, i) => {
    if (s.at < cursor) return
    out.push(rest(line.slice(cursor, s.at), 'r' + i))
    // The useful bit is the bright thing on the screen; the sentence it came out of
    // steps back. It was the wrong way round.
    out.push(
      <span key={'h' + i} className="font-semibold text-fg">
        {line.slice(s.at, s.at + s.len)}
      </span>,
    )
    cursor = s.at + s.len
  })
  out.push(rest(line.slice(cursor), 'rend'))
  return <>{out}</>
}

function RootBeatView({
  rootId,
  beat,
  pieceIndex,
}: {
  rootId: string
  beat: string
  pieceIndex?: number
}) {
  const { next, recordVoice } = useJourney()
  const root = rootById(rootId)!
  const family = CRATES.find((f) => f.id === root.culture_family)!
  const [done, setDone] = useState(false)
  const [choice, setChoice] = useState<string | null>(null)
  // Lets the rule be reached without a pick. The screen says nothing here is scored,
  // so blocking the way forward until something is chosen contradicts it.
  const [ruleShown, setRuleShown] = useState(false)

  const stage = beat === 'release' ? 'REAL WORLD' : 'ROOT'

  if (beat === 'recognise') {
    return (
      <Shell stage={stage} eyebrow={family.title} tone={family.tone}>
        <div className="flex flex-1 flex-col justify-center">
          <p className="display text-balance text-3xl sm:text-4xl">
            {root.root_type === 'quote' ? '“' + root.root_display + '”' : root.root_display}
          </p>
          {root.freebie_flag ? (
            <p className="mt-4 text-xs uppercase tracking-wider text-muted">A freebie. No puzzle.</p>
          ) : null}
        </div>
        <Cta label="WHAT IS THAT IN PORTUGUESE?" onClick={next} />
      </Shell>
    )
  }

  if (beat === 'translate') {
    return (
      <Shell stage={stage} eyebrow={family.title} tone={family.tone}>
        <p className="text-xs text-muted">“{root.root_display}”</p>
        <p className="pt mt-3 text-balance text-3xl text-accent">{root.target}</p>
        <div className="mt-3">
          <AudioButton slug={slugFor(root.target)} text={root.target} />
        </div>
        {/* The bridge is mandatory: the learner must be able to trace root -> Portuguese
            before anything is pulled out of it (§10). */}
        <div className="mt-6 rounded border border-line bg-bg-elev p-4">
          <p className="eyebrow text-accent">WHY IT LANDS THIS WAY</p>
          <p className="mt-2 text-sm leading-relaxed">{root.semantic_bridge}</p>
        </div>
        {root.literal_note ? (
          <p className="mt-3 text-xs text-muted">{root.literal_note}</p>
        ) : null}
        <div className="mt-4 rounded border border-line/70 bg-surface/50 p-4">
          <p className="eyebrow text-muted">HOW IT FEELS</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{root.subtext}</p>
        </div>
        <Cta label="TAKE THE USEFUL BIT" onClick={next} />
      </Shell>
    )
  }

  // Show every useful bit at once, sitting inside the line it came from…
  if (beat === 'extract') {
    const many = root.extracts.length > 1
    return (
      <Shell stage={stage} eyebrow={family.title} tone={family.tone}>
        <p className="eyebrow text-muted">
          {many ? root.extracts.length + ' USEFUL BITS IN HERE' : 'THE USEFUL BIT'}
        </p>
        <p className="pt mt-4 text-balance text-2xl leading-relaxed">
          <Highlighted line={root.target} pieces={root.extracts.map((e) => e.target)} />
        </p>
        <p className="mt-6 text-sm text-muted">
          {many
            ? 'Two things worth keeping. One at a time.'
            : 'One thing worth keeping.'}
        </p>
        <Cta label={many ? 'TAKE THE FIRST' : 'TAKE IT'} onClick={next} />
      </Shell>
    )
  }

  // …then unpack them one per screen. Two pieces on one screen means the second is
  // skimmed, and the second is often the better one.
  if (beat === 'piece' && pieceIndex !== undefined) {
    const e = root.extracts[pieceIndex]
    const total = root.extracts.length
    const last = pieceIndex === total - 1
    const reinforced = root.reinforces.filter((r) => PIECES[r])
    return (
      <Shell stage={stage} eyebrow={family.title} tone={family.tone}>
        {total > 1 ? (
          <p className="text-xs tabular-nums text-muted">
            {pieceIndex + 1} of {total}
          </p>
        ) : null}
        <p className="pt mt-3 text-balance text-lg">
          <Highlighted line={root.target} pieces={[e.target]} dim="text-accent/45" />
        </p>

        <div className="mt-8 flex items-center gap-3">
          <AudioButton slug={slugFor(e.target.replace('…', '').trim())} text={e.target} />
          <div>
            <p className="pt text-3xl text-accent">{e.target}</p>
            <p className="mt-1 text-sm text-muted">{e.gloss}</p>
          </div>
        </div>

        {pieceIndex === 0 && reinforced.length ? (
          <p className="mt-8 text-xs text-muted">
            This also strengthens {reinforced.map((r) => PIECES[r].target).join(', ')}.
          </p>
        ) : null}

        <Cta
          label={'WHAT DOES ' + e.target.replace('…', '').trim().toUpperCase() + ' GIVE ME?'}
          onClick={() => {
            acquirePiece(e.id, root.culture_family)
            next()
          }}
        />
      </Shell>
    )
  }

  if (beat === 'piece-branch' && pieceIndex !== undefined) {
    const e = root.extracts[pieceIndex]
    const own = branchesFor(root, e.id)
    const more = pieceIndex < root.extracts.length - 1
    return (
      <Shell stage={stage} eyebrow={family.title} tone={family.tone}>
        <p className="eyebrow text-accent">{e.target.replace('…', '').trim().toUpperCase()}</p>
        <p className="display mt-3 text-balance text-xl">
          {own.length === 1
            ? 'One thing you can say with it.'
            : own.length + ' things you can say with it.'}
        </p>
        <ul className="mt-6 space-y-3">
          {own.map((b, i) => (
            <li
              key={b.target}
              style={{ animationDelay: i * 110 + 'ms' }}
              className="animate-bank flex items-center gap-3 rounded border border-line bg-bg-elev px-4 py-3"
            >
              <AudioButton slug={slugFor(b.target)} text={b.target} size="sm" />
              <span>
                <span className="pt block text-lg text-accent">{b.target}</span>
                <span className="mt-1 block text-sm text-fg/75">{b.en}</span>
              </span>
            </li>
          ))}
        </ul>
        <Cta
          label={
            more
              ? 'NOW THE OTHER ONE: ' +
                root.extracts[pieceIndex + 1].target.replace('…', '').trim().toUpperCase()
              : 'PUT THEM BACK TOGETHER'
          }
          onClick={next}
        />
      </Shell>
    )
  }

  if (beat === 'branch') {
    return (
      <Shell stage={stage} eyebrow={family.title} tone={family.tone}>
        <p className="eyebrow text-muted">BOTH PIECES, BACK IN ONE PLACE</p>
        <p className="display mt-3 text-balance text-2xl">
          One {root.root_type === 'title' ? 'title' : 'line'}. {root.branches.length} things you can say.
        </p>
        <p className="pt mt-4 text-sm">
          <Highlighted
            line={root.target}
            pieces={root.extracts.map((x) => x.target)}
            dim="text-accent/45"
          />
        </p>
        <ul className="mt-6 space-y-3">
          {root.branches.map((b, i) => (
            <li
              key={b.target}
              style={{ animationDelay: i * 90 + 'ms' }}
              className="animate-bank flex items-center gap-3 rounded border border-line bg-bg-elev px-4 py-3"
            >
              <AudioButton slug={slugFor(b.target)} text={b.target} size="sm" />
              <span>
                <span className="pt block text-lg text-accent">{b.target}</span>
                <span className="mt-1 block text-sm text-fg/75">{b.en}</span>
              </span>
            </li>
          ))}
        </ul>
        <Cta label="YOUR TURN" onClick={() => { track('branch_reveal', { root: root.root_id, n: root.branches.length }); next() }} />
      </Shell>
    )
  }

  if (beat === 'build') {
    const target = buildTargetFor(root)
    return (
      <Shell stage={stage} eyebrow={family.title} tone={family.tone}>
        <p className="eyebrow text-muted">YOUR TURN</p>
        <p className="display mt-2 text-balance text-2xl">“{target.en}”</p>
        <MiniBuild target={target.target} helpers={root.helpers} onSolved={() => setDone(true)} />
        {done ? <Cta label="CONTINUE" onClick={next} /> : <div className="mt-auto" />}
      </Shell>
    )
  }

  if (beat === 'voice' && root.voice_options?.length) {
    const picked = root.voice_options.find((o) => o.target === choice)
    return (
      <Shell stage={stage} eyebrow={family.title} tone={family.tone}>
        <p className="display text-balance text-2xl">Here are two ways to say it.</p>
        <p className="mt-2 text-sm text-muted">
          Same meaning, different room. Nothing here is scored and there is no right
          answer — pick the one that sounds more like you. If neither does, that is an
          answer too.
        </p>
        <div className="mt-6 space-y-3">
          {root.voice_options.map((o) => (
            <button
              key={o.target}
              type="button"
              aria-pressed={choice === o.target}
              onClick={() => {
                setChoice(o.target)
                recordVoice(o.signal, o.target)
              }}
              className={
                'tap-target w-full rounded border px-4 py-4 text-left transition ' +
                (choice === o.target ? 'border-accent bg-accent/10' : 'border-line bg-bg-elev')
              }
            >
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="eyebrow text-accent">{o.register}</span>
                {o.safest ? (
                  <span className="eyebrow rounded-full border border-line px-2 py-0.5 text-muted">
                    IF IN DOUBT
                  </span>
                ) : null}
              </span>
              <span className="pt mt-2 block text-lg text-fg">{o.target}</span>
              <span className="mt-0.5 block text-xs text-muted">{o.en}</span>
              <span className="mt-3 block text-sm text-fg/80">{o.when}</span>
              {o.risk ? (
                <span className="mt-2 block border-l-2 border-line pl-3 text-xs text-muted">
                  Careful: {o.risk}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        {(picked || ruleShown) && root.voice_rule ? (
          <div className="animate-bank mt-6 rounded border border-line bg-bg-elev p-4">
            <p className="eyebrow text-muted">THE RULE UNDERNEATH</p>
            <p className="mt-2 text-sm">{root.voice_rule}</p>
          </div>
        ) : null}
        {picked ? <VoiceReflection /> : null}
        {!choice && !ruleShown ? (
          <button
            type="button"
            data-testid="voice-skip"
            onClick={() => setRuleShown(true)}
            className="tap-target mt-5 self-start text-xs uppercase tracking-wider text-muted underline underline-offset-4 transition hover:text-fg"
          >
            Not sure yet — show me which one to use
          </button>
        ) : null}
        {choice || ruleShown ? (
          <Cta label="CONTINUE" onClick={next} />
        ) : (
          <div className="mt-auto" />
        )}
      </Shell>
    )
  }

  // release — the cue is gone
  return (
    <Shell stage="REAL WORLD">
      <p className="eyebrow text-muted">NO FILM. NO CLUES.</p>
      <p className="mt-3 text-sm font-semibold">{root.transfer_prompt.context}</p>
      <p className="display mt-2 text-balance text-2xl">“{root.transfer_prompt.ask}”</p>
      <MiniBuild
        target={root.transfer_prompt.answer}
        helpers={root.helpers}
        onSolved={({ clean }) => {
          recordProof({
            pt: root.transfer_prompt.answer,
            en: root.transfer_prompt.ask,
            source: 'release',
            clean,
          })
          setDone(true)
        }}
      />
      {done ? (
        <>
          <p className="mt-5 text-sm text-muted">
            That one no longer needs the original cue.
          </p>
          <Cta label="CONTINUE" onClick={next} />
        </>
      ) : (
        <div className="mt-auto" />
      )}
    </Shell>
  )
}

/** §12 — tentative and useful, never psychological. Only after three signals. */
function VoiceReflection() {
  const learner = useLearner()
  const lean = useMemo(() => voiceLean(), [learner.voice_signals.length])
  if (!lean) return null
  const words: Record<string, string> = {
    direct: 'direct, unhedged language',
    softened: 'softened, careful language',
    dry: 'dry, understated language',
    warm: 'warm, open language',
    casual: 'casual language',
    polite: 'more formal language',
  }
  return (
    <div className="animate-bank mt-6 rounded border border-accent/40 bg-accent/5 p-4">
      <p className="eyebrow text-accent">WE ARE BEGINNING TO GET YOU</p>
      <p className="mt-2 text-sm">
        You tend to choose {words[lean.lean] ?? lean.lean}. We will lean that way when
        there is a choice.
      </p>
    </div>
  )
}

// ------------------------------------------------------- agency and payoff

/**
 * What they picked up without being taught it.
 *
 * Deliberately not a lesson. It names things they have already done correctly, quotes
 * the line they did it in, and puts the technical term last and small — for the two
 * people in twelve who want it. Nobody is asked to remember any of this, and the screen
 * says so, because the fastest way to make an easy thing feel hard is to imply a test.
 */
function Osmosis() {
  const { next, owned } = useJourney()
  const learner = useLearner()
  // A question is coming too. Three insights plus a question is more between-sections
  // than section, so the interstitial gives way rather than the question.
  const room = nextProfileQuestion() ? 2 : 3
  const insights = useMemo(
    () => insightsFor(owned, learner.osmosis_seen ?? [], room),
    [owned, learner.osmosis_seen, room],
  )

  if (!insights.length) {
    return (
      <Shell stage="CHOICE">
        <div className="flex flex-1 flex-col justify-center">
          <p className="eyebrow text-accent">STILL IN THERE</p>
          <p className="display mt-4 text-balance text-2xl">
            Everything you picked up last time is still holding.
          </p>
        </div>
        <Cta label="CONTINUE" onClick={next} />
      </Shell>
    )
  }

  return (
    <Shell stage="CHOICE">
      <p className="eyebrow text-accent">YOU WEREN’T TAUGHT THIS. YOU JUST DID IT.</p>
      <p className="display mt-3 text-balance text-2xl">
        {insights.length === 1
          ? 'One thing you absorbed on the way past.'
          : insights.length + ' things you absorbed on the way past.'}
      </p>

      <div className="mt-6 space-y-4">
        {insights.map((i, n) => (
          <section
            key={i.id}
            style={{ animationDelay: n * 120 + 'ms' }}
            className="animate-bank rounded border border-line bg-bg-elev p-4"
          >
            <p className="text-balance text-base font-semibold">{i.headline}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{i.body}</p>
            <ul className="mt-3 space-y-1.5 border-t border-line/60 pt-3">
              {i.evidence.map((e) => (
                <li key={e.pt} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="pt text-sm text-accent">{e.pt}</span>
                  <span className="text-xs text-muted">{e.en}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.6rem] uppercase tracking-wider text-muted/70">
              Linguists call this {i.proper_name}. You do not have to.
            </p>
          </section>
        ))}
      </div>

      <p className="mb-2 mt-6 text-sm text-muted">
        None of this gets tested. It is already in there.
      </p>

      <Cta
        label="CONTINUE"
        onClick={() => {
          markOsmosisSeen(insights.map((i) => i.id))
          track('osmosis_view', { insights: insights.map((i) => i.id) })
          next()
        }}
      />
    </Shell>
  )
}

/**
 * A question about them, and its answer, on one screen.
 *
 * Ask and pay out in the same place. A question whose consequence arrives two screens
 * later, or never, reads as data collection — and the learner is right about that. Each
 * of these is skippable in one tap, with the skip stated as a loss to them rather than
 * to us, because that is the truth of it.
 */
function ProfileStep({ which }: { which: 'gender' | 'age' | 'goal' }) {
  const { next, owned } = useJourney()
  const learner = useLearner()
  const q = which === 'gender' ? GENDER_QUESTION : which === 'age' ? AGE_QUESTION : GOAL_QUESTION
  const [answer, setAnswer] = useState<string | null>(null)
  const [skipped, setSkipped] = useState(false)

  const field = which === 'gender' ? 'gender' : which === 'age' ? 'age_band' : 'goal'

  function choose(id: string) {
    setAnswer(id)
    setProfile(field, id)
    track('profile_answer', { question: which, answer: id })
  }

  return (
    <Shell stage="CHOICE">
      <p className="eyebrow text-accent">{q.asker.toUpperCase()} ASKS</p>
      <p className="mt-2 text-sm italic text-muted">“{q.askerLine}”</p>
      <h1 className="display mt-5 text-balance text-2xl">{q.headline}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{q.why}</p>

      {!answer && !skipped ? (
        <>
          <div className="mt-6 space-y-2">
            {q.options.map((o) => (
              <button
                key={o.id}
                type="button"
                data-testid={'profile-' + o.id}
                onClick={() => choose(o.id)}
                className="tap-target flex w-full items-center justify-between gap-3 rounded border border-line bg-bg-elev px-4 py-4 text-left transition hover:border-accent/50"
              >
                <span className="eyebrow">{o.label}</span>
                {o.sub ? <span className="pt text-sm text-accent">{o.sub}</span> : null}
              </button>
            ))}
          </div>
          <button
            type="button"
            data-testid="profile-skip"
            onClick={() => {
              setSkipped(true)
              setProfile(field, null)
              track('profile_skip', { question: which })
            }}
            className="tap-target mt-5 w-full text-center text-xs uppercase tracking-wider text-muted underline underline-offset-4"
          >
            {q.skip}
          </button>
        </>
      ) : null}

      {skipped ? (
        <>
          <p className="animate-bank mt-8 text-sm text-muted">{q.skipNote}</p>
          <Cta label="CONTINUE" onClick={next} />
        </>
      ) : null}

      {answer ? (
        <>
          <div className="animate-bank mt-7">
            {which === 'gender' ? <GenderPayoff gender={answer as LanguageGender} /> : null}
            {which === 'age' ? <AgePayoff band={answer as AgeBand} /> : null}
            {which === 'goal' ? <GoalPayoff goal={answer as Goal} owned={owned} /> : null}
          </div>
          <Cta label="CONTINUE" onClick={next} />
        </>
      ) : null}
    </Shell>
  )
}

/** Their forms, with the ones that are not theirs greyed beside them. */
function GenderPayoff({ gender }: { gender: LanguageGender }) {
  return (
    <div>
      <p className="eyebrow text-accent">SO THIS IS HOW YOU SPEAK</p>
      <ul className="mt-4 space-y-3">
        {GENDER_PAYOFF[gender].map((row) => (
          <li key={row.en} className="rounded border border-line bg-bg-elev px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="pt text-lg text-fg">{row.yours}</span>
              <span className="pt text-sm text-muted/60 line-through">{row.theirs}</span>
            </div>
            <span className="mt-0.5 block text-xs text-muted">{row.en}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed">{GENDER_RULE[gender]}</p>
    </div>
  )
}

function AgePayoff({ band }: { band: AgeBand }) {
  const p = AGE_PAYOFF[band]
  return (
    <div>
      <p className="eyebrow text-accent">SO THIS IS HOW PEOPLE WILL SPEAK TO YOU</p>
      <p className="display mt-3 text-balance text-xl">{p.headline}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{p.body}</p>
      <div className="mt-5 space-y-2">
        <div className="flex items-baseline gap-3 rounded border border-line bg-bg-elev px-4 py-3">
          <span className="pt text-base text-fg">{AGE_PAIR.tu}</span>
          <span className="text-[0.6rem] uppercase tracking-wider text-muted">informal</span>
        </div>
        <div className="flex items-baseline gap-3 rounded border border-line bg-bg-elev px-4 py-3">
          <span className="pt text-base text-fg">{AGE_PAIR.voce}</span>
          <span className="text-[0.6rem] uppercase tracking-wider text-muted">polite</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">Same question. One step apart.</p>
    </div>
  )
}

/** What stands between them and the thing they said they wanted. */
function GoalPayoff({ goal, owned }: { goal: Goal; owned: string[] }) {
  const needs = GOAL_NEEDS[goal]
  if (!needs.length) {
    return (
      <div>
        <p className="eyebrow text-accent">NO DESTINATION, THEN</p>
        <p className="display mt-3 text-balance text-xl">
          We will keep giving you the things people actually say.
        </p>
        <p className="mt-3 text-sm text-muted">
          That is how most people who end up fluent got there, incidentally.
        </p>
      </div>
    )
  }
  const has = new Set(owned)
  const done = needs.filter((n) => n.pieces.every((p) => has.has(p)))
  return (
    <div>
      <p className="eyebrow text-accent">WHAT STANDS BETWEEN YOU AND {GOAL_LABEL[goal].toUpperCase()}</p>
      <p className="display mt-3 text-balance text-xl">
        {done.length} of {needs.length} already yours.
      </p>
      <ul className="mt-4 space-y-2">
        {needs.map((n) => {
          const got = n.pieces.every((p) => has.has(p))
          return (
            <li
              key={n.label}
              className={
                'flex items-center gap-3 rounded border px-4 py-2.5 text-sm ' +
                (got ? 'border-correct/40 bg-correct/5' : 'border-line bg-bg-elev/50 text-muted')
              }
            >
              <span aria-hidden="true" className={got ? 'text-correct' : 'text-muted/50'}>
                {got ? '✓' : '○'}
              </span>
              {n.label}
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-sm text-muted">
        The rest are in the crates you have not opened yet.
      </p>
    </div>
  )
}

/**
 * The end of a section. §08 still says the learner chooses what comes next — but the
 * choice belongs here, once they have something to show for the area they picked,
 * rather than between every single root.
 */
function SectionComplete() {
  const { finishSection, owned, state } = useJourney()
  const learner = useLearner()
  const acts = capabilities(owned)
  const now = useNowAfterMount()
  const family = state.family ? CRATES.find((f) => f.id === state.family) : null
  // An expired drop is not something we can honestly offer them next.
  const reached = rungReached(learner.proof)
  /** Everything the roots of this section handed over — the answer to "what just happened". */
  const justGained = useMemo(() => {
    const out = new Set<string>()
    for (const id of state.rootsPlayed) {
      const root = rootById(id)
      if (!root || (state.family && root.culture_family !== state.family)) continue
      for (const e of root.extracts) out.add(e.id)
    }
    return out
  }, [state.rootsPlayed, state.family])
  const remaining = CRATES.filter((f) => {
    if (now && !isLive(f, now)) return false
    return (ROOTS_BY_FAMILY[f.id] ?? []).some(
      (r) => r.rung <= reached && !state.rootsPlayed.includes(r.root_id),
    )
  })

  return (
    <Shell stage="CHOICE">
      <div className="flex flex-1 flex-col justify-center">
        <p className="eyebrow text-accent">{family ? family.title + ' — DONE' : 'CRATE COMPLETE'}</p>
        <p className="display mt-4 text-balance text-2xl">
          {acts.length
            ? 'You can now ' + acts.slice(0, 3).join(', ') + (acts.length > 3 ? ' — and more.' : '.')
            : 'That crate is done.'}
        </p>
        {/*
          What you gained in THIS crate, not your whole bank. Showing everything at the
          end of every crate was the actual mess: it grows each time and says nothing
          about what just happened.
        */}
        <div className="mt-6">
          <Shelves owned={new Set(owned)} pool={justGained} highlight={justGained} />
        </div>
        {remaining.length ? (
          <p className="mt-7 text-sm text-muted">
            {remaining.length} more {remaining.length === 1 ? 'crate' : 'crates'} to raid,
            whenever you want them.
          </p>
        ) : null}
      </div>

      {remaining.length ? (
        <button
          type="button"
          data-testid="another-crate"
          onClick={() => finishSection('another')}
          className="tap-target eyebrow mt-6 w-full rounded bg-accent px-5 py-4 text-accent-ink"
        >
          PICK ANOTHER AREA
        </button>
      ) : null}
      {/*
        The three cold prompts that follow are what GENERATE the number, so promising to
        show somebody what they have got and then testing them reads as a bait. The order
        was never the problem; the label was.
      */}
      <button
        type="button"
        data-testid="im-done"
        onClick={() => finishSection('done')}
        className="tap-target eyebrow mt-3 w-full rounded border border-line px-5 py-4 text-fg"
      >
        I’M DONE — PROVE IT
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        Three sentences, no clues. That is what fills the card.
      </p>
    </Shell>
  )
}

/** §11 — pieces from unrelated memories behaving like one language. */
function CollisionView({ id }: { id: string }) {
  const { next } = useJourney()
  const collision = COLLISIONS.find((c) => c.id === id)!
  const [done, setDone] = useState(false)
  return (
    <Shell stage="REAL WORLD">
      <p className="eyebrow text-accent">TWO WORLDS, ONE SENTENCE</p>
      <p className="mt-3 text-sm font-semibold">{collision.context}</p>
      <p className="display mt-2 text-balance text-2xl">“{collision.ask}”</p>
      <MiniBuild
        target={collision.answer}
        onSolved={({ clean }) => {
          track('collision_attempt', { collision: collision.id, correct: true })
          recordProof({ pt: collision.answer, en: collision.ask, source: 'collision', clean })
          setDone(true)
        }}
      />
      {done ? (
        <>
          <div className="animate-bank mt-5 rounded border border-line bg-bg-elev p-4">
            <p className="text-sm leading-relaxed text-muted">{collision.provenance}</p>
          </div>
          <Cta label="CONTINUE" onClick={next} />
        </>
      ) : (
        <div className="mt-auto" />
      )}
    </Shell>
  )
}

/**
 * §09 (7:30–8:35) — the no-cue sequence. No family label, no quote, no styling. Only
 * prompts for language this learner actually owns, or it measures surprise rather than
 * transfer.
 */
function NoCueView({ i }: { i: number }) {
  const { next, owned } = useJourney()
  const learner = useLearner()
  /**
   * Unseen prompts first.
   *
   * This used to index the filtered list by step number, so every section ended with
   * exactly the same three sentences — which makes the number on the proof card look
   * like it is measuring one thing repeatedly. Falls back to the whole pool once a
   * learner has been through all of them, because a repeat is better than a blank.
   */
  const prompts = useMemo(() => {
    const able = NO_CUE_PROMPTS.filter((p) => owned.includes(p.requires))
    const seen = new Set(learner.nocue_done ?? [])
    const fresh = able.filter((p) => !seen.has(p.answer))
    return fresh.length ? fresh : able
  }, [owned, learner.nocue_done])
  const prompt = prompts[i % Math.max(prompts.length, 1)]
  const [done, setDone] = useState(false)

  if (!prompt) {
    return (
      <Shell stage="REAL WORLD">
        <div className="flex flex-1 flex-col justify-center">
          <p className="display text-balance text-2xl">Out in the world.</p>
          <p className="mt-3 text-sm text-muted">
            Nothing here needs where it came from any more.
          </p>
        </div>
        <Cta label="CONTINUE" onClick={next} />
      </Shell>
    )
  }

  return (
    <Shell stage="REAL WORLD">
      <p className="eyebrow text-muted">{i + 1} OF {Math.min(3, prompts.length)}</p>
      <p className="mt-4 text-sm font-semibold">{prompt.context}</p>
      <p className="display mt-2 text-balance text-2xl">“{prompt.ask}”</p>
      <MiniBuild
        target={prompt.answer}
        onSolved={({ clean }) => {
          track('no_cue_attempt', { piece: prompt.requires, correct: true })
          recordProof({ pt: prompt.answer, en: prompt.ask, source: 'nocue', clean })
          rememberNoCue(prompt.answer)
          setDone(true)
        }}
      />
      {done ? <Cta label="CONTINUE" onClick={next} /> : <div className="mt-auto" />}
    </Shell>
  )
}

/**
 * The proof card, inside the journey.
 *
 * Placed after the capability screen rather than instead of it: one says what you can
 * now do, the other says what you actually produced. The second is the shareable one.
 */
function ProofBeat() {
  const { next } = useJourney()
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <Proof />
      <div className="mx-auto w-full max-w-md px-5 pb-8">
        <Cta label="CONTINUE" onClick={next} />
      </div>
    </div>
  )
}

/** §13 — progress as expressive power. What you can do, not how many words. */
function CanSay() {
  const { next, owned, state } = useJourney()
  const acts = capabilities(owned)
  const families = useMemo(
    () => new Set(state.rootsPlayed.map((id) => rootById(id)?.culture_family).filter(Boolean)),
    [state.rootsPlayed],
  )
  return (
    <Shell stage="REAL WORLD">
      <p className="eyebrow text-accent">THINGS YOU CAN SAY</p>
      <p className="display mt-3 text-balance text-2xl">
        You can now {acts.slice(0, 3).join(', ')}
        {acts.length > 3 ? ' — and more.' : '.'}
      </p>

      {acts.length > 3 ? (
        <ul className="mt-5 space-y-1.5">
          {acts.slice(3).map((a) => (
            <li key={a} className="text-sm text-muted">
              · {a}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-7 text-xs uppercase tracking-wider text-muted">Your Portuguese</p>
      <div className="mt-3">
        <Shelves owned={new Set(owned)} />
      </div>

      <p className="mt-6 text-sm text-muted">
        Gathered from {families.size} different {families.size === 1 ? 'world' : 'worlds'}.
        None of it needs them any more.
      </p>

      <Cta
        label="CONTINUE"
        onClick={() => {
          track('capability_view', { acts, pieces: owned.length, families: families.size })
          next()
        }}
      />
    </Shell>
  )
}

function Close() {
  const { finish } = useJourney()
  return (
    <Shell stage="REAL WORLD">
      <div className="flex flex-1 flex-col justify-center">
        <p className="display text-balance text-3xl">{CLOSE.eyebrow}</p>
        <p className="mt-4 text-sm text-muted">{CLOSE.sub}</p>
      </div>
      <Link
        href="/crates"
        data-testid="continue"
        onClick={() => finish()}
        className="tap-target eyebrow mt-auto block w-full rounded mt-6 bg-accent px-5 py-4 text-center text-accent-ink"
      >
        {CLOSE.cta}
      </Link>
      {/* Offered here rather than at the door: there is now something worth keeping,
          which is the only honest moment to ask anyone for an email address. */}
      <div className="mt-4 flex flex-col items-center gap-2 text-xs text-muted">
        <Link href="/signin" className="underline underline-offset-4">
          Keep what you have learned — it lives on this phone until you do.
        </Link>
        <Link href="/line" className="underline underline-offset-4">
          Or just take one line a morning.
        </Link>
        <Link href="/feedback" className="underline underline-offset-4">
          {CLOSE.feedback}
        </Link>
      </div>
    </Shell>
  )
}
