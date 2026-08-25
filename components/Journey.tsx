'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  CRATES,
  PIECES,
  ROOTS_BY_FAMILY,
  RUNGS,
  daysLeft,
  branchAt,
  entryRung,
  isLive,
  linesFor,
  registerFor,
  rootById,
  rungReached,
  sourceOf,
  type Branch,
  type Crate,
  type CultureFamily,
  type DropEvent,
  type Register,
  type Root,
  type Rung,
} from '@/content/roots'
import {
  CLOSE,
  DEAL as DEAL_COPY,
  RELEASE,
  THE_SWITCH,
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
import { LEGEND_COPY, LEGEND_FRAMES, framesUnlockedBy } from '@/content/legend'
import { CrateIcon } from '@/components/CrateIcon'
import { PAIRS, SOURCE_CULTURES } from '@/content/pairs'
import { setPair } from '@/engine/pair'
import { Wordmark } from '@/components/Wordmark'
import { useNowAfterMount } from '@/engine/useNow'
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
  loadLearner,
  markSwitchSeen,
  rememberPlayed,
  setLegendPrompt,
  resetLearnerCache,
  setAffinity,
  setProfile,
  voiceLean,
} from '@/engine/learner'
import {
  branchesFor,
  buildTargetFor,
  capabilities,
  capabilityEntries,
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
  drain = false,
}: {
  stage: string
  eyebrow?: string
  /** The crate's own colour. ROOT and LANDING take it; CHOICE and REAL WORLD do not. */
  tone?: string
  nav?: boolean
  /**
   * The culture is leaving, right now, on this screen.
   *
   * Set by the release beat when the learner taps TAKE IT AWAY — never by a timer and
   * never on mount. Same CSS either way, opposite meaning: on a timer the app confiscates
   * the scaffolding, and on the tap the learner hands it over.
   */
  drain?: boolean
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
      data-drain={drain ? 'on' : undefined}
      className="flex min-h-dvh flex-col bg-bg text-fg"
    >
      {/* The bar is solid: a coloured header needs neither the translucency nor the
          blur, and the blur was what forced the menu overlay to be portalled to the
          body in the first place. */}
      {nav || eyebrow ? (
        <header className="bar sticky top-0 z-30 px-5 py-3">
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
      className="tap-target eyebrow mt-auto w-full rounded bg-accent px-5 py-3 text-accent-ink transition active:scale-[0.99] disabled:border disabled:border-line-strong disabled:bg-transparent disabled:text-muted"
    >
      {label}
    </button>
  )
}

/** A piece, rendered the same way in every cultural world (§16 extraction). */
function Piece({ pt, gloss }: { pt: string; gloss: string }) {
  return (
    <span className="inline-flex items-center gap-3 rounded-full border border-accent/60 bg-accent/10 px-3 py-1">
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
      {/* Rhythm on the parent. The children carry no vertical margin at all, so
          nothing can collapse, nothing can double, and the whole screen's spacing is
          readable in one line rather than scattered through forty. */}
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-muted">{PAIR_STEP.eyebrow}</p>
        <h1 className="display text-balance text-2xl">{PAIR_STEP.headline}</h1>
        <p className="text-sm leading-relaxed text-muted">{PAIR_STEP.sub}</p>
      </div>

      <div className="flex flex-col gap-3">
        {PAIRS.map((p) => (
          <button
            key={p.target_locale}
            type="button"
            data-testid={'pair-' + p.target_locale}
            aria-pressed={picked === p.target_locale}
            disabled={!p.available}
            onClick={() => setPicked(p.target_locale)}
            className={
              'tap-target flex w-full items-center justify-between gap-3 rounded border px-4 py-3 text-left transition ' +
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
              <span className="mt-1 block text-xs text-muted">{p.label}</span>
            </span>
            {!p.available ? (
              <span className="shrink-0 rounded-full border border-line px-2 py-1 text-[0.55rem] uppercase tracking-wider text-muted">
                {PAIR_STEP.soon}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-3 text-xs text-muted">
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
        <div className="mt-3 rounded border border-line bg-bg-elev px-4 py-3">
          <p className="text-xs leading-relaxed text-muted">{PAIR_STEP.source_note}</p>
          <ul className="mt-3 flex flex-wrap gap-3">
            {SOURCE_CULTURES.map((c) => (
              <li
                key={c.id}
                className={
                  'rounded-full border px-2.5 py-1 text-xs ' +
                  (c.available
                    ? 'border-accent/50 text-accent'
                    : 'border-line text-muted')
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
    <section className="border-t border-line pt-3">
      <p className="eyebrow text-accent">{label}</p>
      <ul className="mt-3 space-y-3">
        {lines.map((line, i) => (
          <li key={line} className="flex gap-3 text-sm leading-relaxed text-fg/85">
            <span className="shrink-0 pt-1 text-xs tabular-nums text-muted">
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
      <p className="display mt-3 text-balance text-3xl">{DEAL_COPY.headline}</p>

      <div className="mt-6 space-y-6 pb-6">
        <Block label={DEAL_COPY.how.label} lines={DEAL_COPY.how.steps} numbered />

        {/* The ladder, drawn rather than described. */}
        <section className="border-t border-line pt-3">
          <p className="eyebrow text-accent">{DEAL_COPY.stages.label}</p>
          <p className="mt-3 text-sm leading-relaxed text-fg/85">{DEAL_COPY.stages.intro}</p>
          <ol className="mt-6">
            {RUNGS.map((r, i) => (
              <li key={r.rung} className="relative grid grid-cols-[28px_1fr] gap-x-3 pb-6 last:pb-1">
                {/* the rail, stopping at the last dot rather than running past it */}
                {i < RUNGS.length - 1 ? (
                  <span aria-hidden className="absolute left-[13.5px] top-7 bottom-0 w-px bg-line" />
                ) : null}
                <span
                  className={
                    'relative z-[1] flex h-7 w-7 items-center justify-center rounded-full border text-[0.65rem] font-semibold tabular-nums ' +
                    (r.rung === 1
                      ? 'border-accent bg-accent text-accent-ink'
                      : 'border-line bg-bg text-muted')
                  }
                >
                  {r.rung}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-3">
                    <span className="display text-sm">{r.name}</span>
                    {r.rung === 1 ? (
                      <span className="eyebrow text-[0.5rem] text-accent">{DEAL_COPY.stages.start}</span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">{r.what}</span>
                  <span className="pt mt-1 block text-xs text-accent">{r.example}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 border-t border-line/60 pt-3 text-xs leading-relaxed text-muted">
            {DEAL_COPY.stages.move}
          </p>
        </section>

        {/* What accumulates — the thing the picker calls a vocabulary bank. */}
        <section className="border-t border-line pt-3">
          <p className="eyebrow text-accent">{DEAL_COPY.collect.label}</p>
          <ul className="mt-3 space-y-3">
            {DEAL_COPY.collect.lines.map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed text-fg/85">
                <span className="shrink-0 pt-1 text-xs text-muted">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-3">
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
          <p className="mt-3 text-sm leading-relaxed">{DEAL_COPY.not.line}</p>
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
      {/*
        Four lines, each with a typographic job, and the copy is written to exactly this
        shape — lint:content fails a fifth. It had six for a while and this component
        renders indices 0 to 3, so two of them were written and silently never shown.

        The cascade is 70ms a step, which is the list rhythm rather than a reveal: a hand
        fanning cards, under the threshold where the items read as separate arrivals.
        Mount-fired, which the rules allow for a list — it is the loud beats that must be
        fired by a tap, and a front door is not a peak.
      */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="animate-bank">
          {/* The real mark, at last. It was live Archivo text until the SVGs arrived. */}
          <Wordmark className="h-12 text-fg" />
          <p className="mt-3 text-balance text-xl text-accent">{LANDING.line}</p>
        </div>
        <div className="mt-10 space-y-6">
          <p
            className="animate-bank display text-balance text-2xl"
            style={{ animationDelay: '70ms' }}
          >
            {LANDING.lines[0]}
          </p>
          <p
            className="animate-bank text-pretty text-sm text-muted"
            style={{ animationDelay: '140ms' }}
          >
            {LANDING.lines[1]}
          </p>
          <div className="space-y-3">
            {LANDING.lines[2].split('\n').map((l, i) => (
              <p
                key={l}
                style={{ animationDelay: 210 + i * 70 + 'ms' }}
                className="animate-bank display text-balance text-xl leading-snug"
              >
                {l}
              </p>
            ))}
          </div>
          <p
            className="animate-bank text-balance text-base font-semibold"
            style={{ animationDelay: '420ms' }}
          >
            {LANDING.lines[3]}
          </p>
        </div>
      </div>
      <Cta label={LANDING.cta} onClick={() => { track('landing_cta_tap', {}); next() }} />
      {/* Two ways back in for a returning person: today's line if they have ninety
          seconds, their account if they are on a new phone. */}
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted">
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
                <p className="mt-3 text-sm text-muted">{beat.translation!.en}</p>
              </div>
            ) : null}

            {reveal >= 2 && beat.takeaway ? (
              <div className="animate-bank mt-6 rounded border border-accent/50 bg-accent/10 p-4">
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
                style={{ animationDelay: Math.min(n, 5) * 70 + 'ms' }}
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
          <p className="mt-6 text-balance text-sm font-semibold leading-relaxed">{beat.close}</p>
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
function DropClock({ crate, now }: { crate: Crate; now: Date | null }) {
  const left = now ? daysLeft(crate, now) : null
  if (left === null) return null
  return (
    <span className="shrink-0 rounded-full border border-accent/60 px-2 py-1 text-[0.55rem] uppercase tracking-wider text-accent">
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

type GroupKey = 'open' | 'later' | 'done' | 'pro' | 'drops'

/**
 * Drops last.
 *
 * The ship-to-test pass pinned live drops to the top because they expire. Reversed here
 * on instruction: the countdown stays, so the urgency is still legible where it sits,
 * and the top of the screen belongs to what a learner can act on right now.
 */
const GROUP_ORDER: GroupKey[] = ['open', 'later', 'done', 'pro', 'drops']

/**
 * What opens it, and how far off that is.
 *
 * A stage NAME is not a distance. "MEAN IT" reads as an instruction, and a learner
 * sitting on stage 5 has no way to tell whether that is next or four away. Every
 * stage-gated card gets both halves: RUNGS supplies what opens it, and the subtraction
 * supplies the rest.
 */
function distanceTo(at: Rung, rung: Rung): string {
  const away = at - rung
  const how =
    away <= 0
      ? ''
      : away === 1
        ? ' You are on stage ' + rung + ' — one to go.'
        : ' You are on stage ' + rung + ' — ' + away + ' to go.'
  return 'Opens at stage ' + at + ', ' + RUNGS[at - 1].opens.replace(/^Opens once /, 'when ') + how
}

function Picker() {
  const { chooseFamily, state } = useJourney()
  const params = useSearchParams()
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

  /**
   * /crates?open=world_of_wizardry — the library linking into the crate that teaches a
   * word, which is the only way "taught in the world of wizardry" is worth reading.
   *
   * It runs through the same guard a tap does rather than around it. A URL must not be
   * able to open a crate the learner has not reached or has no allowance for — so a
   * link at a locked crate lands on the picker with that crate visible and saying why,
   * which is the honest outcome and needs no extra copy.
   *
   * Waits for `mounted` and for `access.known`, because before either the answer is
   * "assume open", and acting on that would spend one of three free crates on a guess.
   */
  const opened = useRef(false)
  const wanted = params.get('open')
  useEffect(() => {
    if (opened.current || !wanted || !mounted || !access.known) return
    opened.current = true
    const crate = shown.find((c) => c.id === wanted)
    if (!crate) return
    const openable = crate.drop || entryRung(crate) <= rung
    const capped = !crate.drop && atLimit && !claimed.has(crate.id)
    if (!openable || capped) return
    setEntering(crate.id)
    chooseFamily(crate.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, mounted, access.known, atLimit, rung])

  /**
   * What is true about one crate, computed once.
   *
   * These used to live inside the map, which was fine while the list was a flat sort and
   * impossible once it needed grouping — you cannot group by facts you only work out
   * while rendering.
   */
  interface Facts {
    crate: Crate
    finished: boolean
    waiting: boolean
    unreached: boolean
    planLocked: boolean
    /** The stage that opens what is still inside it. */
    at: Rung
    group: GroupKey
  }

  /** One section of the basics is the doorway. Read from the learner, not the tab. */
  const basicsStarted = !mounted || (learner.sections_completed ?? []).includes('the_basics')

  const facts = (f: Crate): Facts => {
    const all = ROOTS_BY_FAMILY[f.id] ?? []
    const finished = all.length > 0 && all.every((r) => playedIds.has(r.root_id))
    const unplayed = all.filter((r) => !playedIds.has(r.root_id))
    const available = unplayed.filter((r) => r.rung <= rung).length
    // Explored as far as this learner can go, with more still inside. Not the same as
    // locked, and it would be a lie to show it as either finished or open. It also has
    // to have been started: a crate whose every root sits above this stage has nothing
    // "taken" in it, and saying so would be nonsense.
    const started = all.some((r) => playedIds.has(r.root_id))
    const waiting = !finished && started && available === 0
    const nextAt = (unplayed.length ? Math.min(...unplayed.map((r) => r.rung)) : 6) as Rung
    const opensAt = entryRung(f)
    // Only a crate nobody has ever been able to open is closed. Anything already visited
    // can be gone through again — being told "no, you did that already" is a strange
    // thing for a product built on things you enjoy to say.
    /*
      The basics come first, and nothing else opens until one section of them is done.

      Not a paywall and not the ladder — a doorway. Five of the eleven crates have
      nothing at rung 1 at all, so a learner who picks Marcus Aurelius first meets rung-2
      Stoic philosophy before they can say hello.

      Deliberately ONE SECTION rather than the whole crate: the point is to get somebody
      standing up before they choose, not to hold them in a tutorial for four sittings.
      The rest of the basics stays on the shelf like any other crate.
    */
    const gatedByBasics = f.id !== 'the_basics' && !f.drop && !basicsStarted
    const unreached = gatedByBasics || (!f.drop && !started && opensAt > rung)
    // A drop is never plan-locked, and never stage-locked. It can be lost forever by
    // being busy, and charging for the one thing that expires would turn the only real
    // deadline in the product into a punishment.
    const planLocked = !f.drop && atLimit && !claimed.has(f.id)
    const group: GroupKey = f.drop
      ? 'drops'
      : planLocked
        ? 'pro'
        : unreached || waiting
          ? 'later'
          : finished
            ? 'done'
            : 'open'
    return { crate: f, finished, waiting, unreached, planLocked, at: waiting ? nextAt : opensAt, group }
  }

  /**
   * The same ranking as before, made visible.
   *
   * Within "Opens as you go", the furthest-off crate is deliberately FIRST: swearing is
   * the most enticing crate in the product and being last is the point. That tension is
   * worth showing rather than burying at the bottom of a group.
   */
  const grouped = useMemo(() => {
    const out: Record<GroupKey, Facts[]> = { open: [], later: [], done: [], pro: [], drops: [] }
    for (const f of shown) {
      const fact = facts(f)
      out[fact.group].push(fact)
    }
    out.later.sort((a, b) => b.at - a.at)
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, playedIds, rung, atLimit, claimed])

  return (
    <Shell stage="CHOICE">
      {/* "Pick a crate you connect with" is a promise about choice, and on the first
          visit there is exactly one card on the screen. Say the true thing instead. */}
      <h1 className="display text-balance text-2xl">
        {mounted && !basicsStarted ? PICKER.basics_first_headline : PICKER.headline}
      </h1>
      {/* One line, and only for somebody who has a Legend to feed. It answers "what is
          any of this for" at the exact moment they are choosing. */}
      {mounted && learner.legend_prompt === 'accepted' ? (
        <p className="-mt-3 text-sm text-muted">{PICKER.feeds_legend}</p>
      ) : null}
      {/*
        The ladder is quiet now.

        It used to sit here as "Talk about other people · stage 5 of 6", which is a
        second progress system on the one screen that already has a goal — and two
        ladders on one screen is exactly what made the product feel like it was
        flip-flopping between two games. The rung still sequences roots inside a crate
        and still gates what a crate can serve; it just stops competing for the spine.
      */}
      {/*
        Nothing open is worth a sentence, not a scroll.

        Three crates claimed against an allowance of three, two of them finished, and
        every card on the screen a dead end — no ordering rescues that. It has to be said
        at the top rather than discovered eleven cards down. It is also the most honest
        paywall moment in the product: nobody is being blocked from starting, they have
        genuinely used what the free tier offers.
      */}
      {mounted && !basicsStarted ? (
        <div className="flex flex-col gap-1 rounded border border-accent bg-accent/10 px-4 py-3">
          <p className="text-sm font-semibold">{PICKER.basics_first_head}</p>
          <p className="text-xs leading-relaxed text-muted">{PICKER.basics_first_sub}</p>
        </div>
      ) : null}

      {mounted && access.known && !grouped.open.length ? (
        <div className="flex flex-col gap-1 rounded border border-line-strong bg-bg-elev px-4 py-3">
          <p className="text-sm font-semibold">{PICKER.nothing_open}</p>
          {/*
            It has to consult atLimit before it blames the plan. This message always said
            "you have used your free crates", so a stage-1 learner who had merely run out
            of ladder was shown a paywall they had not hit — at the moment they were most
            likely to leave.
          */}
          <p className="text-xs leading-relaxed text-muted">
            {atLimit ? PICKER.nothing_open_paid : PICKER.nothing_open_ladder}
          </p>
        </div>
      ) : null}

      {GROUP_ORDER.map((key) => {
        const list = grouped[key]
        // A group with nothing in it does not render. An empty heading is worse than no
        // heading, because it implies something has been taken away.
        if (!list.length) return null
        return (
          <section key={key} className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <h2 className="eyebrow min-w-0 text-accent">{PICKER.groups[key]}</h2>
              <span className="h-px flex-1 bg-line" />
              <span className="eyebrow shrink-0 tabular-nums text-muted">
                {key === 'open' && access.known && allowance - spent > 0
                  ? allowance - spent + ' left'
                  : list.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {list.map(({ crate: f, finished, waiting, unreached, planLocked, at }) => (
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
                      'tap-target flex w-full justify-between gap-3 border-l-[3px] border-l-[color:var(--tone)] px-4 py-3 text-left transition ' +
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
                    {/* Every card is built the same way, the drop included — it was the
                        only one in the list without a tile, which is half of why it read
                        as floating free of everything around it. */}
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
                      <span className="mt-1 block text-xs text-muted">
                        {planLocked
                          ? PICKER.join_up
                          : finished
                            ? 'You have been through all of it. Go again whenever you like.'
                            : waiting
                              ? 'Everything here that your stage reaches is done. ' +
                                RUNGS[at - 1].opens.replace('Opens once', 'The rest opens once') +
                                ' Go again in the meantime if you like.'
                              : unreached
                                ? f.id !== 'the_basics' && !f.drop && !basicsStarted
                                  ? PICKER.basics_first
                                  : distanceTo(at, rung)
                                : f.blurb}
                      </span>
                      {f.drop ? (
                        <span className="mt-1 block text-xs text-muted">
                          {f.drop.event} · {f.drop.place}
                        </span>
                      ) : null}
                    </span>
                    {/*
                      One vocabulary per badge slot, and it names the plan you need rather
                      than the plan you have. A locked card badged DUB was labelled with
                      the name of the free plan — so it read as included.

                      A stage badge says the NUMBER, never the stage's name: "MEAN IT" is
                      a name and reads as an instruction, where "STAGE 6" is a distance.
                    */}
                    {finished ? (
                      <span className="shrink-0 rounded-full border border-correct/50 px-2 py-1 text-[0.55rem] uppercase tracking-wider text-correct">
                        done
                      </span>
                    ) : planLocked ? (
                      <span className="shrink-0 rounded-full border border-line px-2 py-1 text-[0.55rem] uppercase tracking-wider text-muted">
                        PRO
                      </span>
                    ) : unreached && f.id !== 'the_basics' && !f.drop && !basicsStarted ? (
                      <span className="shrink-0 rounded-full border border-line px-2 py-1 text-[0.55rem] uppercase tracking-wider text-muted">
                        after basics
                      </span>
                    ) : unreached || waiting ? (
                      <span className="shrink-0 rounded-full border border-line px-2 py-1 text-[0.55rem] uppercase tracking-wider tabular-nums text-muted">
                        stage {at}
                      </span>
                    ) : f.drop ? (
                      <DropClock crate={f} now={now} />
                    ) : null}
                  </button>
                  {/* Outside the button on purpose — an anchor nested in a button is not
                      a thing a browser or a screen reader can make sense of. And "join
                      up" is a call to action, so the phrase has to BE the link: as plain
                      text it named an action with no way to take it. */}
                  {planLocked ? (
                    <p className="mt-1 px-4 text-xs text-muted">
                      <Link href="/pro" className="text-accent underline underline-offset-4">
                        {PICKER.join_up_link}
                      </Link>
                    </p>
                  ) : null}
                  {/* The explanation sits with the thing it explains. It used to render
                      after the whole list, several screens below the card it describes. */}
                  {f.drop ? (
                    <p className="mt-3 px-4 text-xs leading-relaxed text-muted">
                      {PICKER.drop_note}
                    </p>
                  ) : null}
                  {f.drop?.link ? (
                    <a
                      href={f.drop.link}
                      target="_blank"
                      rel="noreferrer"
                      className="tap-target mb-3 ml-4 inline-block px-0 text-[0.6rem] uppercase tracking-wider text-muted underline underline-offset-4 transition hover:text-accent"
                    >
                      {f.drop.link_label ?? 'TICKETS'} ↗
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        )
      })}
      {/*
        The two footers are gone.

        They explained in small grey text at the bottom what the group headings now say
        in place — that dimmed crates are appointments rather than refusals, and that
        three are yours for good. A note under eleven cards explaining the order of the
        eleven cards is a symptom of the order being invisible, and it is not any more.
      */}
      {anyLocked ? (
        <p className="text-xs leading-relaxed text-muted">{PICKER.locked_note}</p>
      ) : null}
      {/* One quiet mark at the foot of the list, not one per card — eleven cards would
          be eleven logos and no design. */}
      <Wordmark className="mx-auto mt-auto h-3 text-muted" />
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
export function MiniBuild({
  target,
  helpers,
  onSolved,
  onStuck,
}: {
  target: string
  helpers?: Record<string, string>
  /** `clean` means right on the first submission, which is what the proof card counts. */
  onSolved: (result: { clean: boolean }) => void
  /**
   * Three failed checks on one sentence.
   *
   * Reported rather than handled here, because what to do about it is a decision the
   * beat owns — and only the release beat does anything at all. Nothing here scolds,
   * clears the tiles or counts attempts on screen.
   */
  onStuck?: () => void
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
      if (attempts.current >= 3) onStuck?.()
    }
  }

  return (
    <div className="mt-6">
      {glosses.length ? (
        <p className="pt mb-3 text-sm text-accent">
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
          <div className="flex flex-wrap gap-3">
            {placed.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={state === 'done'}
                onClick={() => setPlaced((cur) => cur.filter((x) => x.id !== p.id))}
                className={
                  'tap-target rounded border px-3 py-3 ' +
                  (state === 'done' ? 'border-correct/50 bg-correct/10' : 'border-accent/50 bg-chip')
                }
              >
                <span className="pt">{p.text}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-1 py-3 text-xs text-muted">Tap the pieces in order.</p>
        )}
      </div>

      {state === 'done' ? null : (
        <div data-testid="tile-pool" className="mt-3 flex flex-wrap gap-3">
          {pool.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPlaced((cur) => [...cur, t])}
              className="tap-target rounded border border-line bg-bg-elev px-3 py-3 hover:border-accent/50"
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
/**
 * The line, with the useful bit standing out of it.
 *
 * The contrast between the two used to be made by fading the REST of the line —
 * text-accent, which measures 2.00:1 on sand. That is not "de-emphasised", it is
 * unreadable, and it was the Portuguese: the one thing on screen that must never be hard
 * to read. Twenty-one translucent text variants existed and the contrast script had
 * never seen one of them.
 *
 * The hierarchy is made the other way round now. The rest of the line is muted at full
 * strength and the piece is accent, bold, and slightly larger — so the difference is
 * carried by colour and weight rather than by making half the sentence disappear.
 */
/**
 * One branch, at the register this learner is being taught.
 *
 * The other version sits underneath whenever there is one, quietly. That is the whole
 * answer to the finding that DUB asked somebody's age, explained why it mattered, and
 * then taught everybody tu regardless — and it is also better than picking one and
 * hiding the other, because the thing a learner most needs to recognise is the SWITCH.
 * Seeing both is how you learn what it means when somebody changes.
 *
 * CASCADE: 70ms per item, capped at six, so the whole list lands inside 420ms — below
 * the threshold where the items read as separate events. A hand fanning cards, not a
 * sequence of arrivals.
 */
function BranchRow({ branch, i, register }: { branch: Branch; i: number; register: Register }) {
  const shown = branchAt(branch, register)
  const other = branch.formal && branch.address === 'tu'
    ? register === 'formal' ? branch.target : branch.formal
    : null
  return (
    <li
      style={{ animationDelay: Math.min(i, 5) * 70 + 'ms' }}
      className="animate-bank flex items-center gap-3 rounded border border-line bg-bg-elev px-4 py-3"
    >
      <AudioButton slug={slugFor(shown)} text={shown} size="sm" />
      <span className="min-w-0">
        <span className="pt block text-lg text-accent">{shown}</span>
        <span className="mt-1 block text-sm text-fg/75">{branch.en}</span>
        {other ? (
          <span className="pt mt-1 block text-xs text-muted">
            {register === 'formal' ? 'tu: ' : 'formal: '}
            {other}
          </span>
        ) : null}
      </span>
    </li>
  )
}

function Highlighted({
  line,
  pieces,
  dim = 'text-muted',
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
      <span key={'h' + i} className="font-semibold text-accent">
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
  /**
   * The release beat's three states, and 'draining' is not padding.
   *
   * The line has to still BE there while it goes, or it does not go — it just stops
   * existing, which is the opposite of watching the culture leave. So the tap moves to
   * 'draining' with the line still on screen fading out under the header, and the ask
   * arrives when the transition itself says it has finished.
   *
   * Ended by transitionend rather than a timer, so it cannot drift out of step with the
   * CSS and it collapses correctly under prefers-reduced-motion, where the duration is
   * 0.001ms and the event fires almost immediately.
   */
  const [released, setReleased] = useState<'before' | 'draining' | 'building'>('before')
  const [switched, setSwitched] = useState(false)
  /*
    The first time age_band has ever decided anything.

    It was read in exactly one place — to work out whether to ask the question again —
    while the screen asking it promised it decided which version you were taught.
  */
  const learner = useLearner()
  const register = registerFor(learner.profile?.age_band)

  /*
    A safety net, and it is not belt-and-braces.

    'draining' is the one state in the product with no way forward — that is the point,
    it lasts 620ms and then the ask arrives. But it ends on a transitionend event, and a
    transitionend that never fires leaves a learner on a dead screen with no button, no
    back and nothing to tap. That is a worse failure than any animation glitch, and the
    event genuinely can be missed: a backgrounded tab, a browser that drops it, an
    element removed mid-transition.

    So the state also ends on a timer set slightly past the duration. Whichever happens
    first wins, and the timer is a floor rather than the mechanism — the drain is still
    fired by the learner's tap, and still ends when the CSS says it has.
  */
  useEffect(() => {
    if (released !== 'draining') return
    const t = setTimeout(() => setReleased('building'), 900)
    return () => clearTimeout(t)
  }, [released])
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
            <p className="mt-3 text-xs uppercase tracking-wider text-muted">A freebie. No puzzle.</p>
          ) : null}
        </div>
        <Cta label="WHAT IS THAT IN PORTUGUESE?" onClick={next} />
      </Shell>
    )
  }

  if (beat === 'translate') {
    return (
      <Shell stage={stage} eyebrow={family.title} tone={family.tone}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted">“{root.root_display}”</p>
            <p className="pt text-balance text-3xl text-accent">{root.target}</p>
          </div>
          <div>
            <AudioButton slug={slugFor(root.target)} text={root.target} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {/* The bridge is mandatory: the learner must be able to trace root -> Portuguese
              before anything is pulled out of it (§10). */}
          <div className="flex flex-col gap-1 rounded border border-line bg-bg-elev p-4">
            <p className="eyebrow text-accent">WHY IT LANDS</p>
            <p className="text-sm leading-relaxed">{root.semantic_bridge}</p>
          </div>
          {root.literal_note ? (
            <p className="text-xs text-muted">{root.literal_note}</p>
          ) : null}
          <div className="flex flex-col gap-1 rounded border border-line/70 bg-surface/50 p-4">
            <p className="eyebrow text-muted">HOW IT FEELS</p>
            <p className="text-sm leading-relaxed text-muted">{root.subtext}</p>
          </div>
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
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="eyebrow text-muted">
              {many ? root.extracts.length + ' USEFUL BITS IN HERE' : 'THE USEFUL BIT'}
            </p>
            <p className="pt text-balance text-2xl leading-relaxed">
              <Highlighted line={root.target} pieces={root.extracts.map((e) => e.target)} />
            </p>
          </div>
          <p className="text-sm text-muted">
          {many
            ? 'Two things worth keeping. One at a time.'
            : 'One thing worth keeping.'}
          </p>
        </div>
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
          <Highlighted line={root.target} pieces={[e.target]} />
        </p>

        <div className="mt-6 flex items-center gap-3">
          <AudioButton slug={slugFor(e.target.replace('…', '').trim())} text={e.target} />
          <div>
            <p className="pt text-3xl text-accent">{e.target}</p>
            <p className="mt-1 text-sm text-muted">{e.gloss}</p>
          </div>
        </div>

        {pieceIndex === 0 && reinforced.length ? (
          <p className="mt-6 text-xs text-muted">
            This also strengthens {reinforced.map((r) => PIECES[r].target).join(', ')}.
          </p>
        ) : null}

        {/* The quiet end of the thread. Never a modal, never more than once a section,
            and never shown to somebody who has not taken the Legend up. */}
        <LegendNudge piece={e.id} />

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
            <BranchRow key={b.target} branch={b} i={i} register={register} />
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
        <p className="eyebrow text-muted">BOTH PIECES</p>
        <p className="display mt-3 text-balance text-2xl">
          One {root.root_type === 'title' ? 'title' : 'line'}. {root.branches.length} things you can say.
        </p>
        <p className="pt mt-3 text-sm">
          <Highlighted
            line={root.target}
            pieces={root.extracts.map((x) => x.target)}
          />
        </p>
        <ul className="mt-6 space-y-3">
          {root.branches.map((b, i) => (
            <BranchRow key={b.target} branch={b} i={i} register={register} />
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
        <p className="display mt-3 text-balance text-2xl">“{target.en}”</p>
        <MiniBuild target={target.target} helpers={root.helpers} onSolved={() => setDone(true)} />
        {done ? <Cta label="CONTINUE" onClick={next} /> : <div className="mt-auto" />}
      </Shell>
    )
  }

  if (beat === 'voice' && root.voice_options?.length) {
    const picked = root.voice_options.find((o) => o.target === choice)
    return (
      <Shell stage={stage} eyebrow={family.title} tone={family.tone}>
        <div className="flex flex-col gap-3">
          <p className="display text-balance text-2xl">Here are two ways to say it.</p>
          <p className="text-sm text-muted">
            Same meaning, different room. Nothing here is scored and there is no right
            answer — pick the one that sounds more like you. If neither does, that is an
            answer too.
          </p>
        </div>
        {/* The two options arrived with no instruction, so it was not obvious they were
            a choice rather than two things to read. */}
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-muted">SELECT ONE</p>
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
                'tap-target w-full rounded border px-4 py-3 text-left transition ' +
                (choice === o.target ? 'border-accent bg-accent/10' : 'border-line bg-bg-elev')
              }
            >
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="eyebrow text-accent">{o.register}</span>
                {o.safest ? (
                  <span className="eyebrow rounded-full border border-line px-2 py-1 text-muted">
                    IF IN DOUBT
                  </span>
                ) : null}
              </span>
              <span className="pt mt-3 block text-lg text-fg">{o.target}</span>
              <span className="mt-1 block text-xs text-muted">{o.en}</span>
              <span className="mt-3 block text-sm text-fg/80">{o.when}</span>
              {o.risk ? (
                <span className="mt-3 block border-l-2 border-line pl-3 text-xs text-muted">
                  Careful: {o.risk}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        {(picked || ruleShown) && root.voice_rule ? (
          <div className="animate-bank mt-6 rounded border border-line bg-bg-elev p-4">
            <p className="eyebrow text-muted">THE RULE</p>
            <p className="mt-3 text-sm">{root.voice_rule}</p>
          </div>
        ) : null}
        {picked ? <VoiceReflection /> : null}
        {!choice && !ruleShown ? (
          <button
            type="button"
            data-testid="voice-skip"
            onClick={() => setRuleShown(true)}
            className="tap-target mt-6 self-start text-xs uppercase tracking-wider text-muted underline underline-offset-4 transition hover:text-fg"
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

  /*
    THE RELEASE — the most important thirty seconds in the product, and the flattest.

    It mounted with `stage="REAL WORLD"` and no tone at all, which meant the culture was
    already gone before the screen existed. The learner never saw it leave. The signature
    move of the entire visual system fired on a screen nobody watched, and the payoff was
    a small grey line reading "That one no longer needs the original cue."

    It outranks everything else because rungReached counts clean releases and nothing
    else: this is the sole beat that moves the ladder — in every crate at once — and the
    only beat in a crate that produces a proof line.

    Three states, one mount. The Shell is the same element throughout, so the drain
    happens under the learner rather than across a screen transition.

      A  before the tap. Still ROOT, still the crate's colour, the line on screen one
         last time. The learner decides.
      B  the tap. data-drain runs the 620ms: header to ink, band out, line gone.
      C  solved. The demotion — the English ask was 40px ink at the top of the screen
         and becomes 12px muted underneath the Portuguese.

    And nothing says the cue has gone. They watched it go.
  */
  return (
    <Shell
      stage="ROOT"
      eyebrow={released === 'before' ? family.title : undefined}
      tone={released === 'before' ? family.tone : undefined}
      drain={released !== 'before'}
    >
      {/*
        THE SWITCH — what actually happens when you get it wrong in Portugal.

        Not a correction. The overwhelmingly common response is the switch to English,
        done kindly, and it ends the conversation as a Portuguese one. Shown once ever,
        at a release beat, after a third failed check — and it does the thing it is
        describing: the ask, the tiles and the azulejo all go, and there is ink on sand.

        It does not clear the learner's work. Dismissing it puts them back exactly where
        they were, with the tiles as they left them.
      */}
      {switched ? (
        <div className="flex flex-1 flex-col justify-center gap-3">
          <p className="eyebrow text-muted">{THE_SWITCH.eyebrow}</p>
          <p className="t-line">{THE_SWITCH.line}</p>
          <p className="text-base leading-relaxed text-fg/85">{THE_SWITCH.body}</p>
          <div className="mt-6 flex flex-col gap-1 rounded border-l-2 border-accent bg-surface px-3 py-3">
            <p className="text-xs text-muted">{THE_SWITCH.answer}</p>
            <p className="pt text-lg text-accent">{THE_SWITCH.repair}</p>
            <p className="text-xs text-muted">{THE_SWITCH.repair_en}</p>
          </div>
          <Cta label={THE_SWITCH.cta} onClick={() => setSwitched(false)} />
        </div>
      ) : released !== 'building' ? (
        <>
          <div className="flex flex-1 flex-col justify-center gap-3">
            <p className="eyebrow drains text-muted">{RELEASE.eyebrow}</p>
            <p
              className="t-line drains"
              onTransitionEnd={() => setReleased('building')}
            >
              {root.root_type === 'quote' ? '“' + root.root_display + '”' : root.root_display}
            </p>
            {/*
              The sentence that makes the tap mean something.

              Without it this screen showed the cultural cue a second time and stopped —
              so it read as the title repeated, on the one beat that moves the ladder and
              produces a line for the card. Nothing about what was leaving, or why anybody
              should want it to.
            */}
            <p className="drains text-base leading-relaxed text-muted">{RELEASE.why}</p>
          </div>
          {released === 'before' ? (
            <Cta label={RELEASE.cta} onClick={() => setReleased('draining')} />
          ) : (
            <div className="mt-auto" />
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-muted">{RELEASE.ask_eyebrow}</p>
            {/*
              THE DEMOTION — the mechanic that replaces every animation we are not
              building. One conditional className: face, size, colour and position all
              change the instant the sentence exists, inside a single mount.
            */}
            {done ? (
              <>
                <p className="pt t-said">{root.transfer_prompt.answer}</p>
                <p className="text-xs text-muted">{root.transfer_prompt.ask}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold">{root.transfer_prompt.context}</p>
                <p className="t-ask">“{root.transfer_prompt.ask}”</p>
              </>
            )}
          </div>

          {done ? null : (
            <MiniBuild
              target={root.transfer_prompt.answer}
              helpers={root.helpers}
              onStuck={() => {
                // Once per learner, ever, and only here. Read fresh rather than off the
                // snapshot, because the store may not have loaded when this beat mounted.
                if (loadLearner().switch_seen_at) return
                markSwitchSeen()
                track('switch_shown', { root: root.root_id })
                setSwitched(true)
              }}
              onSolved={({ clean }) => {
                recordProof({
                  pt: root.transfer_prompt.answer,
                  en: root.transfer_prompt.ask,
                  source: 'release',
                  clean,
                })
                /*
                  HERE is where a root counts as played — at its release, not when the
                  section queued it. Recording it at queue time meant entering a crate
                  consumed it: tap in, see one screen, leave, and the picker said
                  "everything here is done" while the Club would never offer to resume it.
                */
                rememberPlayed([root.root_id], null)
                setDone(true)
              }}
            />
          )}

          {done ? <Cta label="CONTINUE" onClick={next} /> : <div className="mt-auto" />}
        </>
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
      <p className="eyebrow text-accent">GETTING YOU</p>
      <p className="mt-3 text-sm">
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
    /*
      There is no "last time" on somebody's first time.

      This fallback greeted a brand-new learner — the majority of the people who will
      ever see it — by referring to a session they have not had. The empty case has two
      genuinely different meanings and now says both: nothing new to point out yet, or
      nothing new since the last one.
    */
    const returning = (learner.osmosis_seen ?? []).length > 0
    return (
      <Shell stage="CHOICE">
        <div className="flex flex-1 flex-col justify-center gap-3">
          <p className="eyebrow text-accent">{returning ? 'STILL IN THERE' : 'NOTHING TO EXPLAIN'}</p>
          <p className="display text-balance text-2xl">
            {returning
              ? 'Everything you picked up last time is still holding.'
              : 'You have picked up the words. The patterns come next.'}
          </p>
          {!returning ? (
            <p className="text-sm leading-relaxed text-muted">
              This screen shows you the grammar you absorbed without being taught it — and
              it waits until there is something real to point at rather than inventing one.
            </p>
          ) : null}
        </div>
        <Cta label="CONTINUE" onClick={next} />
      </Shell>
    )
  }

  return (
    <Shell stage="CHOICE">
      <p className="eyebrow text-accent">YOU DID THIS</p>
      <p className="display mt-3 text-balance text-2xl">
        {insights.length === 1
          ? 'One thing you absorbed on the way past.'
          : insights.length + ' things you absorbed on the way past.'}
      </p>

      <div className="mt-6 space-y-3">
        {insights.map((i, n) => (
          <section
            key={i.id}
            style={{ animationDelay: Math.min(n, 5) * 70 + 'ms' }}
            className="animate-bank rounded border border-line bg-bg-elev p-4"
          >
            <p className="text-balance text-base font-semibold">{i.headline}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{i.body}</p>
            <ul className="mt-3 space-y-1 border-t border-line/60 pt-3">
              {i.evidence.map((e) => (
                <li key={e.pt} className="flex flex-wrap items-baseline gap-x-3">
                  <span className="pt text-sm text-accent">{e.pt}</span>
                  <span className="text-xs text-muted">{e.en}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.6rem] uppercase tracking-wider text-muted">
              Linguists call this {i.proper_name}. You do not have to.
            </p>
          </section>
        ))}
      </div>

      <p className="mb-3 mt-6 text-sm text-muted">
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
      {/* Rhythm on the parent: the question is one thought, so its three parts sit at
          close and the options are a group away. It was four stacked margins. */}
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-accent">{q.eyebrow}</p>
        <h1 className="display text-balance text-2xl">{q.headline}</h1>
        <p className="text-sm italic text-muted">{q.askerLine}</p>
        <p className="text-sm leading-relaxed text-muted">{q.why}</p>
      </div>

      {!answer && !skipped ? (
        <>
          <div className="flex flex-col gap-3">
            {q.options.map((o) => (
              /*
                Stacked, not justified apart.

                A long label on the left and a long hint on the right both wrapped, so
                the two collided into a ragged block that looked like a layout accident.
                And the hint was accent-coloured, which is the link colour — it read as
                the tappable part when the whole card is the button.
              */
              <button
                key={o.id}
                type="button"
                data-testid={'profile-' + o.id}
                onClick={() => choose(o.id)}
                className="tap-target flex w-full flex-col gap-1 rounded border border-line bg-bg-elev px-4 py-3 text-left transition hover:border-accent/50"
              >
                <span className="eyebrow text-fg">{o.label}</span>
                {o.sub ? <span className="text-sm text-muted">{o.sub}</span> : null}
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
            className="tap-target w-full text-center text-xs uppercase tracking-wider text-muted underline underline-offset-4"
          >
            {q.skip}
          </button>
        </>
      ) : null}

      {skipped ? (
        <>
          <p className="animate-bank mt-6 text-sm text-muted">{q.skipNote}</p>
          <Cta label="CONTINUE" onClick={next} />
        </>
      ) : null}

      {answer ? (
        <>
          <div className="animate-bank mt-6">
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
      <p className="eyebrow text-accent">HOW YOU SPEAK</p>
      <ul className="mt-3 space-y-3">
        {GENDER_PAYOFF[gender].map((row) => (
          <li key={row.en} className="rounded border border-line bg-bg-elev px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="pt text-lg text-fg">{row.yours}</span>
              <span className="pt text-sm text-muted line-through">{row.theirs}</span>
            </div>
            <span className="mt-1 block text-xs text-muted">{row.en}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm leading-relaxed">{GENDER_RULE[gender]}</p>
    </div>
  )
}

function AgePayoff({ band }: { band: AgeBand }) {
  const p = AGE_PAYOFF[band]
  return (
    <div>
      <p className="eyebrow text-accent">HOW THEY SPEAK</p>
      <p className="display mt-3 text-balance text-xl">{p.headline}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{p.body}</p>
      <div className="mt-6 space-y-3">
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
        <p className="eyebrow text-accent">NO DESTINATION</p>
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
      <ul className="mt-3 space-y-3">
        {needs.map((n) => {
          const got = n.pieces.every((p) => has.has(p))
          return (
            <li
              key={n.label}
              className={
                'flex items-center gap-3 rounded border px-4 py-3 text-sm ' +
                (got ? 'border-correct/40 bg-correct/5' : 'border-line bg-bg-elev/50 text-muted')
              }
            >
              <span aria-hidden="true" className={got ? 'text-correct' : 'text-muted'}>
                {got ? '✓' : '○'}
              </span>
              {n.label}
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-sm text-muted">
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
        {/*
          The capability sentence is not here any more.

          It was written in three places and the capability screen is now the very next
          beat, so this said the same thing twice in a row — and the weaker of the two
          came first. What belongs on this screen is what came out of THIS crate, which
          is the shelf underneath.
        */}
        <p className="display mt-3 text-balance text-2xl">
          {family ? 'That is ' + family.title + ' emptied out.' : 'That crate is done.'}
        </p>
        {/*
          What you gained in THIS crate, not your whole bank. Showing everything at the
          end of every crate was the actual mess: it grows each time and says nothing
          about what just happened.
        */}
        <div className="mt-6">
          <Shelves owned={new Set(owned)} pool={justGained} highlight={justGained} />
        </div>

        {/*
          The payoff, and the only loud place the thread ever speaks.

          The ladder answers "what opens the next crate?" and nothing answered "what is
          any of this FOR". This does: a crate just opened cards in a thing the learner
          can picture themselves using, in a room, with a person. It is the first goal in
          DUB that exists outside the app.

          The first time it appears it OFFERS the Legend, because saying "this goes in
          your Legend" to somebody who has never seen one is meaningless. After that it
          is quiet reinforcement, and if they declined it never appears again.
        */}
        <LegendPayoff owned={owned} />
        {remaining.length ? (
          <p className="mt-6 text-sm text-muted">
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
          className="tap-target eyebrow mt-6 w-full rounded bg-accent px-5 py-3 text-accent-ink"
        >
          ANOTHER CRATE
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
        className="tap-target eyebrow mt-3 w-full rounded border border-line px-5 py-3 text-fg"
      >
        PROVE IT
      </button>
      <p className="mt-3 text-center text-xs text-muted">
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
      <p className="eyebrow text-accent">ONE SENTENCE</p>
      <p className="mt-3 text-sm font-semibold">{collision.context}</p>
      <p className="display mt-3 text-balance text-2xl">“{collision.ask}”</p>
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
          <div className="animate-bank mt-6 rounded border border-line bg-bg-elev p-4">
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
      <div className="flex flex-col gap-1">
        <p className="eyebrow text-muted">{i + 1} OF {Math.min(3, prompts.length)}</p>
        <p className="text-sm font-semibold">{prompt.context}</p>
        <p className="display text-balance text-2xl">“{prompt.ask}”</p>
      </div>
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
 * "This one is for your Legend."
 *
 * One quiet line under a piece that an unanswered card is waiting on. It is the softest
 * of the thread's three surfaces and it obeys the honesty rule strictly: nothing at all
 * unless the learner has already taken the Legend up, because telling somebody a word
 * "goes in your Legend" when they have never seen one is meaningless.
 *
 * Once per section, tracked in a module-level set rather than state — the beat unmounts
 * between pieces, so component state would forget and it would say it on every screen.
 */
let nudgedIn: { family: string | null; piece: string | null } = { family: null, piece: null }

function LegendNudge({ piece }: { piece: string }) {
  const { state } = useJourney()
  const learner = useLearner()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (learner.legend_prompt !== 'accepted') return
    // Once per section, and a section is a crate. Keyed on the family rather than
    // cleared by a lifecycle hook, so entering a second crate says it again and walking
    // back and forth inside one does not.
    if (nudgedIn.family === state.family && nudgedIn.piece !== piece) return
    const answered = (learner.legend ?? []).map((a) => a.frame_id)
    const waiting = LEGEND_FRAMES.some(
      (f) => !answered.includes(f.id) && f.built_from.includes(piece),
    )
    if (!waiting) return
    nudgedIn = { family: state.family, piece }
    setShow(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piece, state.family])

  if (!show) return null
  return (
    <p data-testid="legend-nudge" className="text-xs text-muted">
      This one is for your Legend.
    </p>
  )
}

/**
 * What this crate just opened in the learner's Legend.
 *
 * Renders nothing at all in three cases: they declined, nothing new unlocked, or they
 * have not been offered it and have not yet reached enough cards to make the offer
 * honest. A goal you did not choose is a nag.
 */
function LegendPayoff({ owned }: { owned: string[] }) {
  const learner = useLearner()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const answered = (learner.legend ?? []).map((a) => a.frame_id)
  const fresh = useMemo(
    () => (mounted ? framesUnlockedBy(owned, answered) : []),
    [owned, answered.join('|'), mounted],
  )

  useEffect(() => {
    if (fresh.length) track('legend_unlocked', { cards: fresh.map((f) => f.id) })
  }, [fresh.length])

  if (!mounted || learner.legend_prompt === 'declined' || !fresh.length) return null

  const offering = learner.legend_prompt === 'unseen'

  return (
    <div
      data-testid="legend-payoff"
      className="mt-6 flex flex-col gap-3 rounded border border-accent bg-accent/10 px-4 py-3"
    >
      <p className="eyebrow text-accent">{offering ? 'YOUR LEGEND' : 'LEGEND'}</p>
      <p className="text-sm font-semibold">
        {offering
          ? LEGEND_COPY.offer_head
          : fresh.length === 1
            ? 'One Legend card just opened.'
            : fresh.length + ' Legend cards just opened.'}
      </p>
      <p className="flex flex-wrap gap-x-3 gap-y-1">
        {fresh.slice(0, 3).map((f) => (
          <span key={f.id} className="pt text-sm text-accent">
            {f.ask}
          </span>
        ))}
      </p>
      {/*
        One card is enough to offer on, because the offer is not only the cards.

        Gating this at two locked out anybody whose first crate was the basics, and it
        was the wrong measure anyway: what comes with the Legend is the repair kit, which
        is four lines that keep a conversation alive and are worth more than the ten
        cards above them. Saying so is what makes a one-card offer honest.
      */}
      {offering ? (
        <>
          <p className="text-xs leading-relaxed text-muted">{LEGEND_COPY.offer_body}</p>
          <p className="text-xs leading-relaxed text-muted">{LEGEND_COPY.offer_repair}</p>
        </>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/legend"
          data-testid="legend-open"
          onClick={() => {
            setLegendPrompt('accepted')
            track('legend_offered', { taken: true, cards: fresh.length })
          }}
          className="tap-target eyebrow rounded bg-accent px-4 py-3 text-accent-ink"
        >
          {offering ? LEGEND_COPY.offer_cta : 'FILL THEM IN'}
        </Link>
        {offering ? (
          <button
            type="button"
            data-testid="legend-decline"
            onClick={() => {
              setLegendPrompt('declined')
              track('legend_declined', {})
            }}
            className="tap-target eyebrow rounded border border-line-strong px-4 py-3 text-muted"
          >
            {LEGEND_COPY.offer_later}
          </button>
        ) : null}
      </div>
    </div>
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
      <div className="mx-auto w-full max-w-md px-5 pb-6">
        <Cta label="CONTINUE" onClick={next} />
      </div>
    </div>
  )
}

/** §13 — progress as expressive power. What you can do, not how many words. */
function CanSay() {
  const { next, owned, state } = useJourney()
  const acts = capabilities(owned)
  const entries = capabilityEntries(owned)
  const [open, setOpen] = useState<string | null>(null)
  const families = useMemo(
    () => new Set(state.rootsPlayed.map((id) => rootById(id)?.culture_family).filter(Boolean)),
    [state.rootsPlayed],
  )
  return (
    <Shell stage="REAL WORLD">
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-accent">YOU CAN SAY</p>
        {/*
          Guarded, like the other two.

          This sentence is written in three places — here, SectionComplete and the Club —
          and the other two both handled the empty case. This one did not, so with no
          mapped act it rendered the string "You can now ." That shipped for three of the
          five crates a beginner could open. SPEECH_ACTS is much fuller now, but a screen
          whose correctness depends on a lookup table staying complete needs the guard
          whatever the table currently holds.
        */}
        <p className="display text-balance text-2xl">
          {acts.length
            ? 'You can now ' +
              acts.slice(0, 3).join(', ') +
              (acts.length > 3 ? ' — and more.' : '.')
            : 'Here is everything you have taken out of it.'}
        </p>
      </div>

      {/*
        The best list in the product, and it was inert.

        Fourteen flat bullets — refuse without being rude · agree warmly · wish someone
        well — where a learner reads "ask what happened" and cannot see what they would
        actually say. Every line opens now, and no new content was needed: SPEECH_ACTS
        already maps act to piece, linesFor gives the phrases and sourceOf gives the root.

        The quote comes back AFTER the capability, never before, so it rewards
        recognition instead of prompting it.
      */}
      <ul className="flex flex-col gap-1">
        {entries.map((e) => (
          <CapabilityRow
            key={e.act}
            act={e.act}
            pieces={e.pieces}
            owned={owned}
            open={open === e.act}
            onToggle={() => setOpen(open === e.act ? null : e.act)}
          />
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wider text-muted">Your Portuguese</p>
        <Shelves owned={new Set(owned)} />
      </div>

      <p className="text-sm text-muted">
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

/**
 * One capability, opened.
 *
 * Shows the phrase first — the thing you would actually say — then the piece it hangs
 * on, then where it came from. One open at a time, the same as the library.
 */
function CapabilityRow({
  act,
  pieces,
  owned,
  open,
  onToggle,
}: {
  act: string
  pieces: string[]
  owned: string[]
  open: boolean
  onToggle: () => void
}) {
  const lines = open ? pieces.flatMap((p) => linesFor(p, 2, undefined)).slice(0, 3) : []
  const root = open ? sourceOf(pieces[0]) : null
  const crate = root ? CRATES.find((c) => c.id === root.culture_family) : undefined

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        data-testid={'act-' + pieces[0]}
        onClick={onToggle}
        className={
          'tap-target flex w-full items-baseline justify-between gap-3 rounded border px-4 py-3 text-left transition ' +
          (open ? 'border-accent bg-accent/10' : 'border-line bg-bg-elev hover:border-accent/50')
        }
      >
        <span className="min-w-0 text-sm">{act}</span>
        <span className="shrink-0 text-[0.55rem] uppercase tracking-wider text-muted">
          {open ? 'close' : 'say it'}
        </span>
      </button>
      {open ? (
        <div className="mt-1 flex flex-col gap-3 rounded border border-line bg-bg-elev px-4 py-3">
          <ul className="flex flex-col gap-3">
            {lines.map((l) => (
              <li key={l.target} className="flex items-center gap-3">
                <AudioButton slug={slugFor(l.target)} text={l.target} size="sm" />
                <span className="min-w-0">
                  <span className="pt block text-sm text-accent">{l.target}</span>
                  <span className="block text-xs text-muted">{l.en}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-1">
            <p className="eyebrow text-muted">It hangs on</p>
            <p className="text-xs">
              {pieces
                .filter((p) => owned.includes(p) && PIECES[p])
                .map((p) => PIECES[p].target)
                .join(' · ')}
            </p>
          </div>
          {root ? (
            <div className="flex flex-col gap-1">
              <p className="eyebrow text-muted">WHERE FROM</p>
              <p className="text-xs text-muted">{crate?.title}</p>
              <p className="pt text-sm">{root.target}</p>
              <p className="text-xs text-muted">{root.source}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

function Close() {
  const { finish } = useJourney()
  const learner = useLearner()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  /*
    The session ends on the sentence, not on a compliment.

    It closed with "YOU ALREADY KNOW MORE THAN YOU THINK" — a nice thing to say, and the
    app saying it. What the learner actually did is sitting right there in the proof log:
    the last thing they produced with nothing on screen to copy from. Showing that is the
    same move as the proof card's inversion, and it is the most confident thing a product
    can end on, because it is a person doing the thing rather than the app describing it.

    Legend lines are excluded. They are the learner's own family and belong on a screen
    they chose to open, not on the one that ends a session about a film.
  */
  const carried = mounted
    ? [...(learner.proof ?? [])].reverse().find((p) => p.source !== 'legend')
    : undefined

  return (
    <Shell stage="REAL WORLD">
      <div className="flex flex-1 flex-col justify-center gap-3">
        {carried ? (
          <>
            <p className="eyebrow text-muted">YOU SAID</p>
            <p className="pt t-said">{carried.pt}</p>
            <p className="text-xs text-muted">{carried.en}</p>
            <p className="mt-6 text-sm text-muted">{CLOSE.sub}</p>
          </>
        ) : (
          <>
            <p className="display text-balance text-3xl">{CLOSE.eyebrow}</p>
            <p className="text-sm text-muted">{CLOSE.sub}</p>
          </>
        )}
      </div>
      {/* Home, not back to the beginning. The session used to end where it began —
          the crate picker — which is what made the whole product read as one session
          repeated with nowhere that knew you had been here before. */}
      <Link
        href="/club"
        data-testid="continue"
        onClick={() => finish()}
        className="tap-target eyebrow mt-auto block w-full rounded mt-6 bg-accent px-5 py-3 text-center text-accent-ink"
      >
        {CLOSE.cta}
      </Link>
      {/* Offered here rather than at the door: there is now something worth keeping,
          which is the only honest moment to ask anyone for an email address. */}
      <div className="mt-3 flex flex-col items-center gap-3 text-xs text-muted">
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
