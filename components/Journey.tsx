'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
  HOW_IN,
  WELCOME,
  THE_WAY,
  RELEASE,
  THE_SWITCH,
  DEMO_BEATS,
  GATEWAY,
  LANDING,
  NO_CUE_PROMPTS,
  PAIR_STEP,
  PICKER,
} from '@/content/front-door'
import { BottomNav } from '@/components/BottomNav'
import { VibeOpen } from '@/components/VibeOpen'
import { vibeImage } from '@/content/vibe-images'
import { primeAudio } from '@/engine/audio'
import { UNLIMITED } from '@/lib/entitlements'
import { Path } from '@/components/Path'
import { COLLISIONS } from '@/content/roots'
import { slugFor } from '@/content/audio-manifest'
import { Proof } from '@/components/Proof'
import { Shelves } from '@/components/Shelves'
import { LEGEND_COPY, LEGEND_FRAMES, legendStatus } from '@/content/legend'
import { CrateIcon } from '@/components/CrateIcon'
import { PAIRS, SOURCE_CULTURES } from '@/content/pairs'
import { setPair } from '@/engine/pair'
import { Dock, Framed } from '@/components/Dock'
import { Install } from '@/components/Install'
import { Tick } from '@/components/Tick'
import { useScreenIn } from '@/components/Native'
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
  rememberSection,
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
  const { back, goHome, canGoBack, owned, step } = useJourney()
  /*
    A token that changes exactly when the screen does.

    The step's kind and beat rather than an index: the index moves when a section is
    appended without the screen changing, and the point is to animate what somebody sees.
  */
  const arriving = useScreenIn(
    step ? step.kind + ':' + (step.kind === 'root' ? step.beat + ':' + step.rootId : '') : 'none',
  )
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
      className="app-frame bg-bg text-fg"
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
            {/* needs-learner: this is 0 until the browser has read the record, and a
                count that corrects itself upward reads as the app changing its mind. */}
            {kept > 0 ? (
              <span
                className="needs-learner eyebrow shrink-0 tabular-nums opacity-80"
                title="Pieces you have kept"
              >
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
                Vibes
              </button>
            ) : null}
          </div>
        </header>
      ) : null}
      {/* The field used to run behind the body text of every screen. It is a band under
          the header now — texture where it frames something, never under a paragraph. */}
      <div aria-hidden className="azulejo-band h-6 w-full shrink-0" />
      {/*
        One viewport unit, and no arithmetic.

        The page was min-h-dvh and this column was min-h-[calc(100svh-4rem)] — two
        different units for the same screen. dvh is DYNAMIC: it grows the moment Safari's
        URL bar hides. svh is SMALL: it permanently assumes that bar is showing. So the
        column that positions the button was sized against a height 60-90px different from
        the page it sat in, and the difference changed as you scrolled. That is not a
        button with a bad margin, it is a button measured against a moving ruler — and the
        4rem it subtracted was a guess at the header that PageShell guessed as 6rem.

        Flexing all the way down removes both problems: the column is exactly the room
        between the header and the bar, whatever the chrome above it decides to do, and
        there is no constant to fall out of step.
      */}
      {/*
        One scrolling region, and the dock underneath it rather than on top of it.

        See components/Dock.tsx: the button is still written next to the words that earned
        it and lands outside the scroller by portal, so a summary taller than the phone
        scrolls its own words WITHIN the region rather than behind the thing to press.
      */}
      <Framed className="flex flex-col">
        {/*
          Beats arrive rather than being swapped. See useScreenIn — the element stays
          mounted, so a half-built line survives a re-render that is only a re-render.
        */}
        <div
          ref={arriving}
          className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pb-6 pt-6"
        >
          {children}
        </div>
      </Framed>
      {/*
        The bar is on the lesson beats too.

        The argument against it was that a held sequence with three ways out is an
        invitation to leave in the middle of the one thing that works. That argument is
        about a bar that comes and goes — and in an app the bar is simply part of the
        device, anchored, always there, no more an invitation than the home indicator is.
        Somewhere is not the same as everywhere-except-here, and a learner who notices the
        bar disappearing has been told the app is holding them.
      */}
      <BottomNav />
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
    <Dock>
      <button
        type="button"
        data-testid="continue"
        onClick={onClick}
        disabled={disabled}
        className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink transition active:scale-[0.99] disabled:border disabled:border-line-strong disabled:bg-transparent disabled:text-muted"
      >
        {label}
      </button>
    </Dock>
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
    case 'welcome':
      return <Welcome />
    case 'howin':
      return <HowIn />
    case 'demo':
      return <Demo i={step.i} />
    case 'pair':
      return <PairStep />
    case 'theway':
      return <TheWay />
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

/**
 * Welcome — what the room is, before anything about how to reach it.
 *
 * The one screen of the intro allowed to be a promise. Everything after it is route and
 * evidence, and somebody who does not want what this describes should find that out here
 * rather than four screens in.
 */
function Welcome() {
  const { next } = useJourney()
  return (
    <Shell stage="CHOICE">
      <h1 className="display text-balance text-3xl">{WELCOME.headline}</h1>
      <p className="text-sm leading-relaxed text-fg/85">{WELCOME.body}</p>
      <Cta label={WELCOME.cta} onClick={next} />
    </Shell>
  )
}

/**
 * How you get in — the screen before the demo.
 *
 * The deal screen this replaces was seven sections and a scroll, delivered to somebody who
 * had seen one screen of a language app. Every part of it was true and the whole of it was
 * a document.
 *
 * This one has a job: set the demo up. Two steps and then "here is one of them", so the
 * Goose line lands as the EXAMPLE of a claim just made rather than as a trick with its
 * explanation trailing after it.
 */
function HowIn() {
  const { next } = useJourney()
  return (
    <Shell stage="CHOICE">
      <p className="eyebrow text-muted">{HOW_IN.eyebrow}</p>
      <h1 className="display mt-3 text-balance text-3xl">{HOW_IN.headline}</h1>

      <ol className="mt-6 flex flex-col gap-6">
        {HOW_IN.steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="eyebrow shrink-0 pt-1 tabular-nums text-accent">{i + 1}</span>
            <span className="text-sm leading-relaxed text-fg/85">{step}</span>
          </li>
        ))}
        {/* The third step is the demo itself, numbered with the other two because it is
            one of them rather than a flourish after them. */}
        <li className="flex gap-3">
          <span className="eyebrow shrink-0 pt-1 tabular-nums text-accent">3</span>
          <span className="text-sm leading-relaxed text-fg/85">{HOW_IN.example}</span>
        </li>
      </ol>

      <Cta label={HOW_IN.cta} onClick={next} />
    </Shell>
  )
}

/**
 * Where it goes — the screen after the demo and the language pair.
 *
 * After, because it can only say "in Portugal" once the pair is known, and because the
 * route is worth reading when somebody has just been shown that the trick works.
 *
 * This is where the deal is accepted. It is the last screen before the shelf, and it is
 * the one that describes what accepting gets you.
 */
function TheWay() {
  const { next } = useJourney()
  /*
    No place name to fill in any more.

    This screen used to say "in Portugal" and had to wait for the language pair to be able
    to. It says "every time you meet somebody new" instead, which is true in Lisbon and
    true in the next city — so the pair moved after it and the intro stopped interrupting
    its own story with a form.
  */
  const Block = ({ label, body }: { label: string; body: string }) => (
    <section className="border-t border-line pt-6">
      <p className="eyebrow text-accent">{label}</p>
      <p className="mt-3 text-sm leading-relaxed text-fg/85">{body}</p>
    </section>
  )

  return (
    <Shell stage="CHOICE">
      <p className="eyebrow text-muted">{THE_WAY.eyebrow}</p>
      <h1 className="display mt-3 text-balance text-3xl">{THE_WAY.headline}</h1>

      <div className="mt-6 flex flex-col gap-6">
        <Block label={THE_WAY.legend.label} body={THE_WAY.legend.body} />
        <Block label={THE_WAY.club.label} body={THE_WAY.club.body} />
      </div>

      <Cta
        label={THE_WAY.cta}
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
  const access = useEntitlements()
  return (
    /*
      The door is a place, not an argument.

      This was four lines of prose — the wall every learner hits, what DUB does about it,
      a reassurance — delivered before anybody had seen a word of Portuguese. Good essay,
      poor front door. Everything it argued is proved two taps later by the Goose demo,
      which is a demonstration rather than a claim, so the door only has to make somebody
      want to go.

      It is the ONE screen in DUB that gets to be aspirational. The city-content rule is
      the opposite — the queue outside the pastelaria, not sunset over the Tejo — and it
      still holds everywhere it applies, because a teaching screen has to be evidence. A
      front door has a different job. It sells the destination; the rest of the product
      spends its time being honest about the work.
    */
    <main
      data-stage="LANDING"
      className="relative flex min-h-svh w-full flex-col justify-end overflow-hidden bg-[#241f1a] text-white"
    >
      {/*
        The photograph, and the page has to work without it.

        Nothing in the layout depends on it loading: the ground underneath is a dark warm
        tone taken from the image, so a slow or failed fetch is a dimmer version of the
        same screen rather than white text on white. `priority` because it is the largest
        thing on the first screen anybody ever sees, and a hero that arrives late arrives
        after the tap.
      */}
      <Image
        src="/hero/lisbon.jpg"
        alt={LANDING.hero_alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/*
        The scrim, which is what makes the type legible rather than hopeful.

        Contrast cannot be measured against a photograph — it changes with every pixel —
        so the text never sits on the image. It sits on this.

        Confined to the bottom 58% rather than laid over everything. A full-screen scrim
        cleared the contrast check and took the warmth out of the picture with it, which
        is the one thing the picture is there for. Above this line the photograph is
        untouched; below it, it is dark enough that white clears AA on the scrim alone,
        whatever is underneath.
      */}
      <div
        aria-hidden
        data-testid="scrim"
        className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/92 via-black/70 to-transparent"
      />

      <div className="relative flex flex-col items-center gap-6 px-5 pb-10 text-center">
        <Wordmark className="h-10 text-white" />
        <p className="display text-balance text-3xl leading-tight sm:text-4xl">
          {LANDING.strapline}
        </p>
        {/*
          Not the shared Cta: that is built for a sand ground and an accent fill, and on a
          photograph the thing that reads is white on nothing. The iOS unlock still rides
          on it — the first tap of a session is where the browser decides whether this
          page may ever make a sound.
        */}
        <button
          type="button"
          data-testid="landing-cta"
          onClick={() => {
            primeAudio()
            track('landing_cta_tap', {})
            next()
          }}
          /*
            Azulejo blue, pinned rather than tokenised.

            --accent is that blue in light mode and flips to a pale #7fb3da with dark ink
            in dark mode, because everywhere else in the product it sits on sand or on
            near-black. The door does neither: it is a photograph and a scrim, always
            dark, whatever the phone is set to. Using the token here would give a pale
            button with dark text on half of all devices, and the tiles in the picture
            are this blue.
          */
          className="tap-target eyebrow w-full max-w-sm rounded bg-[#1f5d8c] px-5 py-3 text-white transition active:scale-[0.99]"
        >
          {LANDING.cta}
        </button>
        {access.signInReady ? (
          <Link href="/signin" className="text-xs text-white/80 underline underline-offset-4">
            Been here before?
          </Link>
        ) : null}
      </div>
    </main>
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
        {/*
          The claim first, then the set-up, then the thing itself.

          The claim is the argument the landing used to carry and no longer does. It has
          to be ABOVE the line rather than under it, because it is what the line is about
          to prove — underneath, it would read as a comment on a trick that already
          happened.
        */}
        {beat.claim ? (
          <p className="display mb-3 text-balance text-xl leading-snug">{beat.claim}</p>
        ) : null}
        {/* Sentence case and quiet on purpose: it is somebody speaking to you, not a
            label for the screen, so it must not read as an eyebrow. */}
        {beat.lead ? <p className="mb-3 text-sm text-muted">{beat.lead}</p> : null}
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

        {/*
          Inside the centred block, not under it.

          The demo is deliberately centred — it is the showpiece — and a CTA that followed
          the BLOCK ended up three hundred pixels below the last card, hard against the
          bottom bar. Inside, the button moves with the words it belongs to and the drama
          is untouched.
        */}
        {staged && !ready ? (
          <Cta
            label={reveal === 0 ? 'IN PORTUGUESE?' : 'SO WHAT DO I KEEP?'}
            onClick={() => setReveal((r) => r + 1)}
          />
        ) : (
          <Cta label={beat.cta} onClick={next} />
        )}
      </div>
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

/**
 * The drop keeps its row.
 *
 * It is the one card with a countdown and a ticket link on it, and a three-by-four tile
 * has nowhere to put either. It is also the only thing on the shelf that can be lost by
 * being busy, so it is worth it looking different from everything around it.
 */
function DropRow({
  crate,
  now,
  onOpen,
}: {
  crate: Crate
  now: Date | null
  onOpen: () => void
}) {
  const dropImage = vibeImage(crate.id)
  return (
    <div data-tone={crate.tone} className="flex flex-col">
      <button
        type="button"
        data-testid={'vibe-' + crate.id}
        onClick={onOpen}
        className="tap-target flex w-full items-start gap-3 rounded border border-l-[3px] border-line border-l-[color:var(--tone)] bg-bg-elev px-4 py-3 text-left transition hover:border-accent/50"
      >
        {/* A drop has a photograph like every other vibe — it just cannot be a tile,
            because a countdown and a ticket link have nowhere to go on one. */}
        <span className="relative flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded">
          {dropImage ? (
            <Image src={dropImage.src} alt="" aria-hidden fill sizes="44px" className="object-cover" />
          ) : (
            <>
              <span className="azulejo-block absolute inset-0" />
              <CrateIcon crate={crate.id} className="relative h-6 w-6 text-[color:var(--tone)]" />
            </>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="eyebrow mb-1 block text-[0.55rem] text-accent">
            DROP · {crate.drop ? goneOn(crate.drop) : ''}
          </span>
          <span className="display block text-base">{crate.title}</span>
          <span className="mt-1 block text-xs text-muted">{crate.blurb}</span>
          {crate.drop ? (
            <span className="mt-1 block text-xs text-muted">
              {crate.drop.event} · {crate.drop.place}
            </span>
          ) : null}
        </span>
        {crate.drop ? <DropClock crate={crate} now={now} /> : null}
      </button>
      <p className="mt-3 px-4 text-xs leading-relaxed text-muted">{PICKER.drop_note}</p>
      {crate.drop?.link ? (
        <a
          href={crate.drop.link}
          target="_blank"
          rel="noreferrer"
          className="tap-target mb-3 ml-4 inline-block text-[0.6rem] uppercase tracking-wider text-muted underline underline-offset-4 transition hover:text-accent"
        >
          {crate.drop.link_label ?? 'TICKETS'} ↗
        </a>
      ) : null}
    </div>
  )
}

/*
  A badge on a photograph needs its own ground.

  These were border-and-muted-text, drawn against the page palette, and over a picture that
  is a pale outline on whatever happens to be behind it. Black at 55% carries them on all
  twelve images without having to tune one per photograph.
*/
const BADGE =
  'rounded-full bg-black/55 px-2 py-1 text-[0.5rem] uppercase tracking-wider backdrop-blur-sm'

function Picker() {
  const router = useRouter()
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
  /*
    The vibe somebody is looking at, which is not yet the vibe they have chosen.

    Tapping used to enter. That was right when a tile was a line drawing and a title —
    there was nothing more to see, so there was nothing to look at first. A photograph
    changes it: the tile identifies the vibe and the full screen is what makes somebody
    want it, and putting a commitment on the tap means nobody ever sees the picture.
  */
  const [looking, setLooking] = useState<CultureFamily | null>(null)
  const now = useNowAfterMount()
  // Nothing is dimmed until the browser has read what this learner has actually done.
  // A crate that locks itself a frame after hydration is worse than one that never did.
  const mounted = now !== null
  const rung: Rung = mounted ? rungReached(learner.proof) : 6
  // A crate is finished when every root in it has been played — not, as before, when
  // any single one has. Now that a section only serves the stages you have reached,
  // "played one root" and "seen the whole vibe" are different things.
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
    /** Roots played, of roots there are. The card shows this whenever it is partway. */
    taken: number
    total: number
  }

  /**
   * The doorway opens on having BEEN THROUGH some of the basics, not on having tapped
   * the button at the end of them.
   *
   * It read sections_completed alone, and that is only written by finishSection — the
   * two buttons on the end-of-section screen. A learner who played the basics and then
   * went to the shelf by any other route (the header, a bookmark, the back gesture, or
   * simply closing the tab and coming back) had played three roots and finished nothing,
   * so every other vibe stayed shut behind "AFTER BASICS" while the basics card itself
   * said "3 of 14 taken" directly above it. The product contradicted itself on one
   * screen, and the only way out was a button that was no longer on screen.
   *
   * Having played a basics root is the honest test, and it is what the copy on those
   * cards already claims: "opens once you have been through a section of the basics".
   * It also cannot be lost by navigating, which the old one could.
   */
  const basicsStarted =
    !mounted ||
    (learner.sections_completed ?? []).includes('the_basics') ||
    (ROOTS_BY_FAMILY['the_basics' as CultureFamily] ?? []).some((r) => playedIds.has(r.root_id))

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
    /*
      The ladder outranks the paywall, because the ladder is the binding constraint.

      Swearing opens at stage 6. A stage-1 learner saw it filed under "Comes with Dub
      Pro", captioned "tap to see what membership opens" — an invitation to pay for
      something paying would not unlock. Whichever wall you would hit FIRST is the one
      worth naming, and money cannot move that one.
    */
    const group: GroupKey = f.drop
      ? 'drops'
      : unreached || waiting
        ? 'later'
        : planLocked
          ? 'pro'
          : finished
            ? 'done'
            : 'open'
    return {
      crate: f,
      finished,
      waiting,
      unreached,
      planLocked,
      at: waiting ? nextAt : opensAt,
      group,
      // How much of it you have actually had. A vibe is 6–14 roots and a session serves
      // three or four, so "I did James Bond" and "James Bond is finished" are three to
      // five sessions apart — and with nothing on the card saying so, a vibe you
      // remember doing reappears at full brightness looking untouched.
      taken: all.filter((r) => playedIds.has(r.root_id)).length,
      total: all.length,
    }
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

  /*
    The picture, over the shelf.

    Returned before the Shell rather than inside it: it is the whole screen, and rendering
    it as a child of the picker would leave the shelf scrolling underneath a fixed overlay.
  */
  if (looking) {
    const f = shown.find((c) => c.id === looking)
    if (f) {
      const fact = facts(f)
      return (
        <VibeOpen
          crate={f}
          state={fact.unreached || fact.waiting ? 'stage' : fact.planLocked ? 'pro' : 'open'}
          at={fact.at}
          onClose={() => setLooking(null)}
          onEnter={() => {
            setEntering(f.id)
            chooseFamily(f.id)
          }}
        />
      )
    }
  }

  return (
    <Shell stage="CHOICE">
      {/*
        Asking to be installed, on the screen somebody comes back to.

        Not on the way in — a product that asks to be on your home screen before it has
        shown you anything is asking for a commitment it has not earned. The picker is
        where a returning learner starts, so it is the first honest moment. It renders
        nothing at all once installed, or once waved away.
      */}
      <Install />
      {/* "Pick a vibe you connect with" is a promise about choice, and on the first
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

      {/*
        The gateway. A learner who finished the basics and picked two crates used to land
        on a small grey box that said "nothing new is open right now" and named Pro in
        prose with no link on it — the moment the whole free tier had been building
        towards, delivered as a dead end.

        The first fix only rendered it when NOTHING was open, which is never true at the
        cap: the three crates you have already claimed stay open forever, so the shelf
        looks full while being finished. It renders on the cap itself. When the LADDER is
        the reason instead it stays a quiet note, because that is not a paywall and must
        not be dressed as one.
      */}
      {mounted && access.known && atLimit ? (
        <div
          data-testid="gateway"
          className="flex flex-col gap-3 rounded border border-accent bg-accent/5 px-4 py-6"
        >
          <p className="eyebrow text-accent">{GATEWAY.eyebrow}</p>
          <h2 className="display text-balance text-xl">{GATEWAY.headline}</h2>
          <Path at={2} className="mt-3" />
          <p className="text-xs leading-relaxed text-muted">{GATEWAY.body}</p>
          <Link
            href="/pro"
            className="tap-target eyebrow mt-1 block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            {GATEWAY.cta}
          </Link>
          <p className="text-xs leading-relaxed text-muted">{PICKER.nothing_open_paid}</p>
        </div>
      ) : mounted && access.known && !grouped.open.length ? (
        <div className="flex flex-col gap-1 rounded border border-line-strong bg-bg-elev px-4 py-3">
          <p className="text-sm font-semibold">{PICKER.nothing_open}</p>
          <p className="text-xs leading-relaxed text-muted">{PICKER.nothing_open_ladder}</p>
        </div>
      ) : null}

      {/*
        Every vibe is on the shelf from the first visit.

        This was a sentence — "ten more vibes are waiting behind this one" — because ten
        dimmed tiles read as a locked product rather than a queue, and it had been reported
        as a regression twice. That was true of ten grey squares. It is not true of ten
        photographs: a picture of what you have not got yet is an opportunity, and naming
        the vibes in prose while refusing to show them was the weaker half of the trade.

        So they are back, undimmed enough to be seen, each one saying what opens it.
      */}
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
                {/*
                  UNLIMITED is 1,000,000 — a large finite number, because Infinity does
                  not survive JSON. It is fine to compare against and absurd to print, and
                  a comped member was told they had "999999 LEFT".
                */}
                {key === 'open' && access.known && allowance < UNLIMITED && allowance - spent > 0
                  ? allowance - spent + ' left'
                  : list.length}
              </span>
            </div>
            {/*
              A grid, two across, three by four.

              It was a stack of wide rows, which is a list of options — you read it top to
              bottom and each one argues for itself in a paragraph. A vibe is not read, it
              is CHOSEN, and choosing is what a grid is for: everything at once, the tone
              and the drawing doing the identifying, the words underneath only confirming
              what the tile already said.

              The drop keeps its own row. It is time-pegged and carries a countdown and a
              ticket link, and a tile has nowhere to put either.
            */}
            {/* needs-learner: which of these are open is unknowable before localStorage
                has been read, and drawing them all open first and locking eight of them a
                frame later is the loudest guess in the product. */}
            <div
              className={
                'needs-learner ' +
                (key === 'drops' ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-3')
              }
            >
              {list.map(({ crate: f, finished, waiting, unreached, planLocked, at, taken, total }) => {
                const image = vibeImage(f.id)
                return f.drop ? (
                  <DropRow key={f.id} crate={f} now={now} onOpen={() => { setEntering(f.id); chooseFamily(f.id) }} />
                ) : (
                  <button
                    key={f.id}
                    type="button"
                    data-tone={f.tone}
                    data-testid={'vibe-' + f.id}
                    /*
                      Every tile opens, including the ones you cannot have.

                      A dimmed square that does not respond answers "can I have this?" with
                      silence. The photograph is the argument for the thing you have not
                      reached yet, and it belongs at full size where it can make it — with
                      the reason, and a way to act on it when there is one.
                    */
                    onClick={() => {
                      if (planLocked) track('crate_locked_tapped', { crate: f.id })
                      setLooking(f.id)
                    }}
                    /*
                      Brightness still means a tap opens the vibe — the rule the stacked
                      version was gated on, carried over unchanged. Only the shape moved.
                    */
                    /*
                      Not yet is a colour, not an opacity.

                      This went from 0.4 — where a photograph is a grey rectangle and the
                      shelf reads as a locked product — to 0.75, which is barely a
                      difference at all: with the badge gone too, every vibe looked open and
                      was reported as such. Both mistakes are the same mistake, which is
                      trying to say "not yet" by turning the volume down.

                      So the tile keeps its full presence and the PICTURE carries the state:
                      drained of colour and darkened, which reads instantly and from across
                      the room, and does not make anybody wonder whether the screen is
                      broken. A dashed border and a chip say which wall it is.
                    */
                    className={
                      'tap-target relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden rounded border p-3 text-left transition ' +
                      (entering === f.id
                        ? 'border-accent'
                        : unreached || planLocked
                          ? 'border-dashed border-line-strong/70'
                          : finished || waiting
                            ? 'border-line/60 opacity-80'
                            : 'border-line hover:border-accent/60')
                    }
                  >
                    {image ? (
                      <Image
                        src={image.src}
                        alt=""
                        aria-hidden
                        fill
                        sizes="(max-width: 448px) 50vw, 224px"
                        className={
                          'object-cover ' +
                          (unreached || planLocked ? 'grayscale brightness-[0.45]' : '')
                        }
                      />
                    ) : null}
                    {/*
                      The drawing is gone and the badge only appears when it says something.

                      A line icon over a photograph is two identifications of the same vibe
                      competing at the same corner, and the photograph is the better one.
                      The badge went the same way for a different reason: before the basics
                      are started every tile on the shelf is waiting on the basics, so ten
                      tiles carried ten identical BASICS chips under a heading that already
                      said it. A badge that is on everything is not information.
                    */}
                    <span className="absolute inset-x-0 top-0 flex items-start justify-end p-3">
                      {finished ? (
                        <span className={BADGE + ' text-white'}>done</span>
                      ) : unreached && f.id !== 'the_basics' && !basicsStarted ? (
                        <span className={BADGE + ' text-white'}>basics first</span>
                      ) : unreached || waiting ? (
                        <span className={BADGE + ' tabular-nums text-white'}>stage {at}</span>
                      ) : planLocked ? (
                        <span className={BADGE + ' text-white'}>PRO</span>
                      ) : null}
                    </span>

                    {/* The ground under the words, so a title reads over the pattern. */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/45 to-transparent"
                    />
                    <span className="relative flex flex-col gap-1 text-white">
                      <span className="display text-sm leading-tight">{f.title}</span>
                      {/*
                        Said as an offer, not a tally.

                        This read "3 of 14 taken", which is arithmetically correct and
                        communicates the opposite of what is true. A session serves three
                        or four roots and then ends — that is the design — so somebody who
                        does everything DUB gives them, all of it, correctly, is handed a
                        card saying they are 21% of the way through. Right after a screen
                        that congratulated them for finishing. The product told them they
                        had done well and then scored them at a fifth.

                        Nothing on the card explained that a vibe is several sittings, and
                        "taken" is our word for it rather than anybody else's — taken from
                        what, by whom.

                        So it says what is left and what happens if you come back, in the
                        same shape the Legend already uses for exactly this ("8 more when
                        you want them"). No denominator, because a denominator is a score
                        whatever sentence it is wrapped in.
                      */}
                      {mounted && taken > 0 && taken < total ? (
                        <span className="text-[0.6rem] text-white/80">
                          {total - taken === 1
                            ? 'One more in here'
                            : total - taken + ' more in here'}
                        </span>
                      ) : null}
                    </span>
                  </button>
                )
              })}
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
      {/*
        Only when something dimmed is actually on screen.

        On the first visit the dimmed vibes are a sentence rather than ten tiles, so this
        footer was explaining a convention nothing on the page was using.
      */}
      {anyLocked && mounted ? (
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

  /**
   * The small words, all of them, in the order they appear.
   *
   * This took the first three matching helpers in whatever order the object happened to
   * list them, so "Quero fazer as coisas que adoro." glossed que, fazer and as — and
   * dropped `coisas`, which is in the helpers map and is the only noun in the sentence.
   * Not a missing gloss: a cap, silently eating one, and choosing which three survived by
   * the order somebody wrote the keys in.
   *
   * Two changes. The cap is gone — 39 of 492 build targets wanted more than three, and a
   * word left unexplained to save a line is a worse trade than a line that wraps. And they
   * are ordered by where they fall in the sentence, so reading the line left to right
   * matches reading the tiles left to right.
   *
   * What is still NOT glossed is deliberate: the root's own extracts. `quero` and `adoro`
   * are the pieces this root exists to give you, they were taught two beats ago, and
   * glossing them here would say the thing you just learned is scaffolding.
   */
  const glosses = useMemo(() => {
    if (!helpers) return []
    const words = target.replace(/[.?,!]/g, '').split(' ')
    const at = (w: string) =>
      words.findIndex((x) => x.toLowerCase() === w.replace(/[.?,!]/g, '').toLowerCase())
    const seen = new Set<string>()
    return Object.entries(helpers)
      .filter(([w]) => {
        const bare = w.replace(/[.?,!]/g, '').toLowerCase()
        if (at(w) === -1) return false
        if (seen.has(bare)) return false
        seen.add(bare)
        return true
      })
      .sort((a, b) => at(a[0]) - at(b[0]))
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

  /**
   * Clear the line and go again, after being shown.
   *
   * Being shown the order is the useful half; putting it back yourself is the half that
   * sticks, and until now there was no way to do it — the answer sat there, already
   * correct, and the only move left was to press CHECK on somebody else's work.
   *
   * `helped` deliberately survives. It is a fact about this attempt, not a mood: the line
   * was seen, so it cannot count towards the sentences said cold however many times it is
   * rebuilt afterwards. Clearing that flag would quietly turn the one honest number in the
   * product into a number about persistence.
   */
  function retry() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPlaced([])
    setState('open')
    track('build_retry', { target })
  }

  const check = useCallback(
    (viaHelp = false) => {
      const built = placed.map((p) => p.text)
      const right = built.length === answer.length && built.every((w, i) => w === answer[i])
      if (!viaHelp) attempts.current += 1
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [placed, helped, target],
  )

  /**
   * The last word IS the answer. There is nothing to press.
   *
   * CHECK was a second action for a decision already made: the line is either the sentence
   * or it is not, and the app can see which the instant the last tile lands. Asking for
   * confirmation of something already decided is a tax on the person who got it right, and
   * it is paid on every single build in the product.
   *
   * Not when the line was laid out by SHOW ME. Those words were not entered by anybody, so
   * firing on them would mark the sentence solved on the learner's behalf and skip straight
   * past the half that makes it stick — and it would take RETRY with it, since a finished
   * build has no line left to clear.
   */
  const settled = useRef('')
  useEffect(() => {
    if (state === 'done' || helped) return
    if (placed.length !== answer.length) {
      settled.current = ''
      return
    }
    const line = placed.map((p) => p.text).join(' ')
    if (settled.current === line) return
    settled.current = line
    check()
  }, [placed, state, helped, answer.length, check])

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

      {helped && state !== 'done' ? (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          There it is, in order. Read it out loud — this one will not count towards the
          sentences you can say cold, which is the only number here worth anything. Put it
          back yourself and it still will not, but you will know it.
        </p>
      ) : null}

      {state === 'done' ? (
        <div className="animate-bank mt-3 flex items-center gap-3 rounded border border-correct/40 bg-correct/10 px-4 py-3">
          <AudioButton slug={slugFor(target)} text={target} size="sm" />
          <span className="pt min-w-0 flex-1 text-lg">{target}</span>
          {/* Acknowledgement, not applause. See components/Tick.tsx. */}
          <Tick className="text-correct" />
        </div>
      ) : (
        /*
          What is left once CHECK goes.

          Before being shown there is one thing worth offering, so it gets the whole line:
          SHOW ME. "Need some help?" used to be a text link under everything else — the
          quietest thing on a screen where somebody is stuck, which is the moment they are
          least inclined to go hunting.

          Afterwards the line already holds the answer, so offering to show it again is
          nothing. RETRY clears it so the words can be put back by the person who is meant
          to be learning them — the only way being shown turns into being able — and SAID IT
          is the way past for somebody who has read it out and wants to move. Neither
          un-helps: the proof card still refuses this line, because it was seen.
        */
        <div className="mt-3 flex gap-3">
          {helped ? (
            <>
              <button
                type="button"
                data-testid="build-retry"
                onClick={retry}
                className="tap-target eyebrow flex-1 rounded border border-accent bg-accent/10 px-4 py-3 text-accent"
              >
                RETRY
              </button>
              <button
                type="button"
                data-testid="build-said"
                onClick={() => check(true)}
                className="tap-target eyebrow flex-1 rounded border border-line-strong px-4 py-3 text-muted transition hover:text-fg"
              >
                SAID IT
              </button>
            </>
          ) : (
            <button
              type="button"
              data-testid="build-help"
              onClick={showOrder}
              className="tap-target eyebrow w-full rounded border border-line-strong px-4 py-3 text-muted transition hover:text-fg"
            >
              SHOW ME
            </button>
          )}
        </div>
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

  if (beat === 'translate') {
    /*
      One screen, and everything on it.

      This was two screens, then it was one screen with a tap-to-reveal — and the
      tap-to-reveal was still a title, a credit and a button with half the phone empty
      underneath. Removing the navigation did not remove the dead space; it just stopped
      the dead space from having its own URL.

      So the recognition is carried by ORDER instead of by a tap: what you already know
      sits on top, the Portuguese directly under it, and the bridge under that. Same
      sequence, one screen, nothing to press to get to the point.
    */
    return (
      <Shell stage={stage} eyebrow={family.title} tone={family.tone}>
        <div className="flex flex-col gap-6">
          {/* What you already know, first and biggest. It is the argument. */}
          <div className="flex flex-col gap-1">
            <p className="display text-balance text-2xl">
              {root.root_type === 'quote' ? '“' + root.root_display + '”' : root.root_display}
            </p>
            {root.credit ? <p className="text-sm text-muted">{root.credit}</p> : null}
          </div>
          <div className="flex flex-col gap-3">
            <p className="pt text-balance text-3xl text-accent">{root.target}</p>
            <div>
              <AudioButton slug={slugFor(root.target)} text={root.target} />
            </div>
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
              The ask stays put, and the answer lands underneath it.

              This beat used to swap the whole screen out: solving it unmounted the build
              and replaced the question with the bare sentence in a display face, no audio,
              nothing to press to hear it. Every other build in the product — the collision,
              the no-cue prompts, the Legend rehearsal — keeps the build mounted, and its
              done state shows the sentence in a banked row WITH the audio button. So this
              was the one screen where getting it right took the sound away, on the single
              beat that moves the ladder.

              The question is worth keeping on screen too. Reading "what you were asked" and
              "what you said" together is the whole point of the moment; replacing one with
              the other leaves a sentence floating with nothing to have answered.
            */}
            <p className="text-sm font-semibold">{root.transfer_prompt.context}</p>
            <p className="t-ask">“{root.transfer_prompt.ask}”</p>
          </div>

          {(
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
        The rest are in the vibes you have not opened yet.
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
  /*
    The section is finished because this screen exists, not because a button was pressed.

    rememberSection fired inside finishSection — the two buttons at the foot of this
    screen — so a learner who got here and left by any other route had done the work and
    banked none of it. That produced two separate reports: a shelf where every vibe said
    AFTER BASICS above a card reading "3 of 14 taken", and a Legend that said "your
    Legend is open" one tap before saying it was locked.

    The second was mine. The payoff counted the vibe in progress and the Legend counted
    only recorded ones, so at exactly four-plus-this-one they disagreed — and the fix for
    that was a flag passed to one caller, which is a patch over the same split. Recording
    it here removes the split instead: by the time anything on this screen speaks, the
    section is real.
  */
  useEffect(() => {
    if (state.family) rememberSection(state.family)
  }, [state.family])
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

  /*
    Is the VIBE finished, or just this session of it?

    A session serves at most four roots and the basics has fourteen, so the two are three or
    four sittings apart — and this screen said "— DONE" and "VIBE COMPLETE" after the first
    one. The learner is then told on the shelf that they have taken 3 of 14, and reasonably
    concludes the count is broken. It was not: this was.

    The headline underneath already said the true thing — "That is the basics, for today" —
    and was fixed for exactly this reason. The eyebrow above it was missed, which is how a
    screen ends up contradicting itself in two lines.
  */
  const inFamily = family ? (ROOTS_BY_FAMILY[family.id] ?? []) : []
  const leftInFamily = inFamily.filter((r) => !state.rootsPlayed.includes(r.root_id)).length
  const vibeFinished = Boolean(family) && inFamily.length > 0 && leftInFamily === 0

  return (
    <Shell stage="CHOICE">
      <div className="flex flex-1 flex-col justify-center">
        <p className="eyebrow text-accent">
          {vibeFinished && family ? family.title + ' — DONE' : 'A SESSION DONE'}
        </p>
        {/*
          The capability sentence is not here any more.

          It was written in three places and the capability screen is now the very next
          beat, so this said the same thing twice in a row — and the weaker of the two
          came first. What belongs on this screen is what came out of THIS crate, which
          is the shelf underneath.
        */}
        <p className="display mt-3 text-balance text-2xl">
          {/*
            It said "emptied out" after a single session of a fourteen-root vibe.

            That is the sentence that starts the confusion on the shelf: a learner is
            told a vibe is finished, sees it open again at full brightness next time, and
            reasonably concludes the shelf is broken. Say what is true instead — the
            session is done, and whether there is more in there.
          */}
          {family ? 'That is ' + family.title + ', for today.' : 'That vibe is done for today.'}
        </p>
        {/*
          And how much of it is left, said here rather than discovered on the shelf.

          "3 of 14 taken" is true and it reads as a fault when the screen before it implied
          the whole thing was finished. Saying the number at the moment somebody earns it
          turns the shelf's count into a reminder instead of a contradiction.
        */}
        {leftInFamily > 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {leftInFamily === 1
              ? 'One more sitting in there whenever you want it.'
              : 'There are ' + leftInFamily + ' more in there whenever you want them.'}
          </p>
        ) : null}
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

          The ladder answers "what opens the next vibe?" and nothing answered "what is
          any of this FOR". This does: a crate just opened cards in a thing the learner
          can picture themselves using, in a room, with a person. It is the first goal in
          DUB that exists outside the app.

          The first time it appears it OFFERS the Legend, because saying "this goes in
          your Legend" to somebody who has never seen one is meaningless. After that it
          is quiet reinforcement, and if they declined it never appears again.
        */}
        <LegendPayoff />
        {remaining.length ? (
          <p className="mt-6 text-sm text-muted">
            {remaining.length} more {remaining.length === 1 ? 'vibe' : 'vibes'} to raid,
            whenever you want them.
          </p>
        ) : null}
      </div>

      <Dock>
        {remaining.length ? (
          <button
            type="button"
            data-testid="another-vibe"
            onClick={() => finishSection('another')}
            className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink"
          >
            ANOTHER VIBE
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
          className="tap-target eyebrow w-full rounded border border-line px-5 py-3 text-fg"
        >
          PROVE IT
        </button>
        <p className="text-center text-xs text-muted">
          Three sentences, no clues. That is what fills the card.
        </p>
      </Dock>
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
function LegendPayoff() {
  const learner = useLearner()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  /*
    One model, asked once.

    This used to compute framesUnlockedBy(owned, answered) — "which cards do you now have
    the WORDS for" — and announce them: "two Legend cards just opened". The Legend
    stopped working that way a long time ago; it counts vibes and opens every card at
    once. So the promise was made in a language the Legend could not honour, and tapping
    through landed on a wall.

    `family` is the vibe being finished right now. sections_completed does not include it
    until the learner taps through, so without it this screen tells somebody finishing
    their fifth vibe that they need one more.
  */
  // No currentFamily any more: SectionComplete records the section on mount, so this
  // reads the same truth /legend does rather than a prediction of it.
  const status = legendStatus({ sectionsCompleted: learner.sections_completed ?? [] })
  const answered = (learner.legend ?? []).filter((a) => Object.keys(a.values).length > 0).length
  const waiting = LEGEND_FRAMES.length - answered

  useEffect(() => {
    if (status.open) track('legend_unlocked', { cards: [] })
  }, [status.open])

  // Nothing to say once the whole thing is built, and nothing to say to somebody who
  // declined it.
  if (!mounted || learner.legend_prompt === 'declined' || !waiting) return null

  const usable = status.open
  const toGo = status.toGo
  const offering = usable && learner.legend_prompt === 'unseen'
  /** The hook is the questions themselves, not a count of them. */
  const preview = LEGEND_FRAMES.slice(0, 3)

  return (
    <div
      data-testid="legend-payoff"
      className="mt-6 flex flex-col gap-3 rounded border border-accent bg-accent/10 px-4 py-3"
    >
      <p className="eyebrow text-accent">{offering ? 'YOUR LEGEND' : 'LEGEND'}</p>
      <p className="text-sm font-semibold">
        {offering
          ? LEGEND_COPY.offer_head
          : usable
            ? LEGEND_COPY.open_head
            : toGo === 1
              ? LEGEND_COPY.one_more
              : toGo + ' ' + LEGEND_COPY.more_to_go}
      </p>
      {!usable ? (
        <p className="text-xs leading-relaxed text-muted">
          {toGo === 1 ? LEGEND_COPY.banked_note_one : LEGEND_COPY.banked_note_many}
        </p>
      ) : null}
      <p className="flex flex-wrap gap-x-3 gap-y-1">
        {preview.map((f) => (
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
            track('legend_offered', { taken: true, cards: status.openCards })
          }}
          className="tap-target eyebrow rounded bg-accent px-4 py-3 text-accent-ink"
        >
          {offering ? LEGEND_COPY.offer_cta : usable ? 'FILL THEM IN' : LEGEND_COPY.banked_cta}
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
  const access = useEntitlements()
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
        /*
          Both mt-auto and mt-6 were on this element — a cascade collision, where whichever
          Tailwind emitted last won and the gap above the button was whatever the build
          happened to produce. Exactly the fault the Cta above documents as fixed, still
          living here. One value now, and it is the section step.
        */
        className="tap-target eyebrow mt-10 block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
      >
        {CLOSE.cta}
      </Link>
      {/* Offered here rather than at the door: there is now something worth keeping,
          which is the only honest moment to ask anyone for an email address. */}
      <div className="mt-3 flex flex-col items-center gap-3 text-xs text-muted">
        {access.signInReady ? (
          <Link href="/signin" className="underline underline-offset-4">
            Keep what you have learned — it lives on this phone until you do.
          </Link>
        ) : null}
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
