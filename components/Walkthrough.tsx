'use client'

import Image from 'next/image'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/engine/analytics'
import { walkedTheClub } from '@/engine/learner'
import { WALK } from '@/content/walk'
import { MENTORS, type MentorId } from '@/content/mentors'
import { chooseMentor } from '@/engine/learner'

/**
 * THE WALK — every control in Yours, one at a time, with a hole cut over it.
 *
 * Sam: "Build a Club intro animation that walks through each icon in the bottom, mid and
 * top rails and the Logo tap which will take you to the Club home page not app home page.
 * Ideally it will overlay the Yours page and the cut out the area of interest, give a short
 * text description and show a screenshot."
 *
 * WHY THIS SCREEN AND NOT A TOUR SCREEN. Every product that explains itself with a carousel
 * of pictures is explaining a product the learner is not looking at. The thing being
 * described is on screen, in the position it will be in every time they come back, and the
 * hole is the sentence: THAT one, there. A picture of a control teaches you what it looks
 * like; a hole over the real control teaches you where it is, which is the only question
 * somebody has after being let into a room.
 *
 * ROUND, and that is Sam's correction to his own reference shots — they show a square
 * around the bottom-nav item. "The cut outs should be ROUND not square." He is right and
 * the reason is the same one the rest of this product keeps arriving at: a rectangle reads
 * as a selection, a thing you have highlighted for editing. A circle reads as attention —
 * a torch, a spotlight — which is what this is.
 *
 * MEASURED, NEVER TYPED. Every hole is a getBoundingClientRect on the real element at the
 * moment the step opens. The bar is fixed and the boards scroll, so a step's coordinates
 * are a fact about this phone at this scroll position and nothing else — and a hardcoded
 * circle is wrong on the first device with a different height. It re-measures on resize
 * and on scroll for the same reason.
 *
 * IT MUST BE COMPLETABLE WITH NO ANIMATION AT ALL. The walk TEACHES THE PRODUCT, so
 * somebody who has turned motion off still needs to learn it — the reduced-motion rule in
 * globals.css already flattens every duration to 0.001ms, and nothing here gates progress
 * on a transition finishing. The hole moves, or it appears; either way the caption is
 * readable and NEXT is tappable the whole time.
 */
/**
 * What the hole is cut out of, in two parts.
 *
 * An SVG mask rather than four divs around a gap, and rather than a giant box-shadow. The
 * four-div version has to recompute four rectangles per step and leaves hairline seams on
 * fractional device pixels; the box-shadow version cannot be feathered and cannot be made
 * round without clipping. A mask is one rect and one circle, and the circle is simply
 * white where the scrim should be absent.
 */
export function Walkthrough({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const [at, setAt] = useState(0)

  /*
    THE STEPS THIS SCREEN ACTUALLY HAS, decided once on mount.

    Yours has an empty state — one sentence and a button, no boards at all — and the
    deliberate route can land on it: /walkthrough forces the walk whatever the record says,
    which is exactly what it is for, and a device handed across a table at a festival may
    be a brand new one. Four of the nine steps are about the library, and circling sand
    while the caption says "your boards" is the kind of thing that is invisible in the DOM
    and obvious in a picture.

    So a step whose control is not on this screen is not walked. Not hidden, not stubbed:
    the counter says 5 and means five, because a walk-through that counts steps it is not
    going to show is lying about how long it is.

    IN AN EFFECT, NOT IN A useState INITIALISER, and that distinction cost a browser run.

    The initialiser runs DURING this component's first render, and this component renders
    in the same pass as the library it is asking about — so every query came back null and
    the walk silently dropped both board steps while reporting a clean five. Exactly the
    shape the brief warns about: invisible in the DOM, obvious the moment the step count
    read 5 instead of 9.

    ONCE, AFTER PAINT, and deliberately not live after that. The library appears the moment
    the learner has anything in it, and a list that re-filters mid-walk would renumber under
    somebody's thumb. The bar and the top rail are always there, so the floor is never zero.
  */
  const [steps, setSteps] = useState<typeof WALK>(WALK)
  useEffect(() => {
    /*
      A STEP THAT POINTS AT NOTHING IS ALWAYS KEPT — see `pick` in content/walk.ts.

      This filter exists to drop steps whose control is not on this screen, and it would
      have dropped the mentor picker on the way in: it has no target, so the query finds
      nothing, so it looked exactly like a board step on an empty library. The difference
      is that an absent board is a reason not to talk about boards, and an absent control
      here is the whole design — the question does not describe anything on the page.
    */
    setSteps(
      WALK.filter(
        (s) => !s.target || document.querySelector('[data-testid="' + s.target + '"]'),
      ),
    )
  }, [])

  const step = steps[at] ?? steps[0]
  const last = at >= steps.length - 1

  /*
    THE HOLE, AS THE PAGE ACTUALLY HAS IT.

    Null until measured, and null is a real state rather than a loading one: a step whose
    target is not on this screen — somebody arriving at Yours scrolled down, the MORE
    drawer open over the rail — gets no hole, and the caption still reads. The walk is
    about where things are; a missing control is better described by saying nothing than
    by drawing a circle over the wrong part of the page.
  */
  const [hole, setHole] = useState<{ x: number; y: number; r: number } | null>(null)

  /*
    MEASURED ON EVERY STEP, AND AGAIN WHENEVER THE PAGE MOVES.

    Scroll and resize are the two ways a measured rect goes stale, and both happen here:
    the boards scroll under a fixed bar, and the keyboard or a rotation changes the
    viewport. requestAnimationFrame rather than a bare call so a scroll that fires sixty
    times a second costs one measurement per frame at most.
  */
  const frame = useRef<number | null>(null)
  const measure = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      const el = document.querySelector('[data-testid="' + step.target + '"]')
      if (!el) {
        setHole(null)
        return
      }
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) {
        setHole(null)
        return
      }
      /*
        A CIRCLE AROUND A RECTANGLE, and the radius is the whole of the design problem.

        Sam: "The cut outs should be ROUND not square." A round hole over a round-ish
        control is easy; over a ROW it is a decision, because no circle contains a 350px
        rail without also containing most of the card under it.

        SO THERE ARE TWO RULES, and which one applies is a fact about the control rather
        than a flag on the step:

        AN ICON — anything roughly as tall as it is wide — gets a circle that CONTAINS it.
        Half the diagonal is the smallest such circle, plus PAD, because a control sitting
        exactly on the edge of its own spotlight reads as cropped rather than picked out.
        Capped at 56, because the bottom-nav items are 97px wide and a circle containing
        one whole would reach into its neighbours — which would say "these four" on the
        step whose entire job is to say "this one".

        A ROW — more than twice as wide as it is tall — gets a circle sized to its WIDTH,
        which is the only honest answer when the thing being pointed at is a row of five
        and the caption says so. The first attempt sized it to the row's HEIGHT: a neat
        torch beam, and in the screenshot it sat squarely over CHEATS and DROPS with LEGEND
        and MORE outside it, so the picture said "these two" while the words said "your
        boards". A circle that contradicts its own caption is worse than a big one.

        It reaches a little into whatever is above and below the row, and that is the
        bargain a round hole over a horizontal control makes. It is the right way round:
        including a strip of the grid says "this rail changes that", which is exactly what
        the caption claims.

        PAD is in device pixels and is deliberately not on the spacing scale. It is the
        radius of a drawn circle, not the rhythm of a page, and the scale is about the gaps
        between things in a column.
      */
      const PAD = 10
      const row = r.width > r.height * 2
      const half = Math.sqrt(r.width * r.width + r.height * r.height) / 2
      setHole({
        x: r.x + r.width / 2,
        y: r.y + r.height / 2,
        r: row ? r.width / 2 + PAD : Math.min(half + PAD, 56),
      })
    })
  }, [step.target])

  useEffect(() => {
    measure()
    /*
      The target is brought into view before it is measured, not after — a control below
      the fold would otherwise get a hole off the bottom of the screen. `block: 'center'`
      so a step on the boards puts them in the middle rather than under the header, and
      the measurement re-runs on the scroll it causes.
    */
    const el = document.querySelector('[data-testid="' + step.target + '"]')
    el?.scrollIntoView({ block: 'center', behavior: 'auto' })
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [measure, step.target])

  const finish = useCallback(() => {
    walkedTheClub()
    track('club_walk_done', { steps: steps.length })
    onDone()
  }, [onDone, steps.length])

  /*
    THE WAY OUT IS ALWAYS THERE, and it is not a cross in a corner.

    SKIP is a named control at the top with the same weight as the step counter beside it.
    A walk-through you cannot leave is a modal with a story in it, and the one thing worse
    than not knowing where the buttons are is being held in front of them.

    It stamps the record exactly as finishing does: somebody who skipped has decided they
    do not need this, and showing it to them again the next time they open Yours would be
    the product arguing with them. /walkthrough is how it is seen again.
  */
  const next = useCallback(() => {
    if (last) {
      finish()
      return
    }
    setAt((i) => i + 1)
  }, [last, finish])

  /*
    AND THE LOGO STEP CAN ACTUALLY GO THERE.

    The last step describes the wordmark, which Sam is separately pointing at the Club home
    page. Where it points is HIS fix and not this component's — so this offers the
    destination rather than changing it: finishing on that step takes you to /club, which
    is where the walk has spent five steps saying the product lives. If the mark's own
    routing changes underneath this, nothing here has to be told.
  */
  const finishAndGo = useCallback(() => {
    finish()
    router.push('/club')
  }, [finish, router])

  useEffect(() => {
    track('club_walk_step', { step: step.id, at: at + 1 })
  }, [step.id, at])

  /*
    KEYBOARD, because this is reachable at /walkthrough on a laptop and because a
    walk-through that only answers a thumb is one more thing to learn.
  */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        next()
      }
      if (e.key === 'ArrowLeft') setAt((i) => Math.max(0, i - 1))
      if (e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, finish])

  return (
    <div
      data-testid="walkthrough"
      role="dialog"
      aria-modal="true"
      aria-label="Where everything is"
      /*
        z-50, the same layer as the bar, and later in the DOM than it — which is how
        everything in this product that has to cover the navigation does it. See the note
        in components/Translator.tsx on why a fourth layer is not the answer to a stacking
        problem.
      */
      className="fixed inset-0 z-50"
    >
      {/*
        THE SCRIM WITH THE HOLE IN IT.

        pointer-events-none on the SVG so the control under the hole is still tappable —
        somebody who wants to try the thing being described should be able to, and a
        spotlight that blocks the thing it is pointing at is a picture of a control again.

        The mask is white where the scrim shows and black where it does not, which is the
        way round an SVG mask works: luminance is opacity.
      */}
      <svg
        aria-hidden
        data-testid="walk-scrim"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          <mask id="walk-hole">
            <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
            {hole ? (
              <circle
                data-testid="walk-hole"
                cx={hole.x}
                cy={hole.y}
                r={hole.r}
                fill="#000000"
                /*
                  --t-arrive, which is the token for "a thing becomes present". The hole
                  TRAVELS between steps rather than blinking out and back: one object
                  moving is what says the walk is going somewhere, where two events say
                  two unrelated things were pointed at.
                */
                style={{
                  transition:
                    'cx var(--t-arrive) var(--ease-out), cy var(--t-arrive) var(--ease-out), r var(--t-arrive) var(--ease-out)',
                }}
              />
            ) : null}
          </mask>
        </defs>
        {/*
          80% BLACK, AND THE CAPTION IS MEASURED AGAINST IT.

          White on 80% black over the palest thing Yours can be (its sand ground, and the
          white cards on it) is 15.0:1 — the same composite the specimen palette is
          measured by in scripts/contrast-check.mts, and far past the 4.5:1 this has to
          clear. A lighter scrim would be prettier and would put the caption at the mercy
          of whichever photograph happened to be under it, which is the white-on-white
          fault this codebase keeps having to undo.
        */}
        {/*
          AND A STEP THAT POINTS AT NOTHING GOES FULLY OPAQUE.

          80% exists so the control in the hole stays visible THROUGH the scrim, which is
          the whole mechanic — you can see the thing being described. A step with no hole
          is describing nothing, so the 20% of page showing through is not information, it
          is interference: photographed on the mentor step, the question "Who do you want
          telling you how it is going?" sat directly over the empty-state paragraph behind
          it, and the inbox badge showed through the first card as a stray dark block.
          Both invisible in the DOM, both obvious in a picture.

          Keyed off the HOLE rather than off the step id, so any future step that asks
          something instead of pointing at it gets this for free and nothing here needs
          editing. Black at 100% also moves the caption contrast from 15:1 to 21:1, which
          is the one direction that rule is allowed to move.
        */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={hole ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,1)'}
          mask="url(#walk-hole)"
        />
        {/*
          THE RING, which is what makes the hole read as deliberate rather than as a gap.

          Drawn after the scrim so it sits on the edge of the circle, and in white at 60%
          rather than the accent: the accent is the product's blue and it means "this is
          Portuguese, go on". A torch beam is not a control.
        */}
        {hole ? (
          <circle
            cx={hole.x}
            cy={hole.y}
            r={hole.r}
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2"
            style={{
              transition:
                'cx var(--t-arrive) var(--ease-out), cy var(--t-arrive) var(--ease-out), r var(--t-arrive) var(--ease-out)',
            }}
          />
        ) : null}
      </svg>

      {/*
        EVERYTHING THAT IS READ, IN ONE LAYER OVER THE SCRIM.

        This was three siblings of the SVG — header, spacer, caption — and it rendered the
        caption UNDER the scrim on exactly the steps that moved it, which was invisible in
        the DOM and unmistakable in a screenshot: white type ghosted to grey behind an 80%
        black fill, with a white-on-white NEXT in the middle of the page.

        The cause is a flexbox rule that is easy to miss: `order` changes PAINT order as
        well as layout order, so the caption at order:-9999 painted before the SVG even
        though it comes after it in the markup, and both carry z-index:auto. Fixed by
        removing the reason to reorder anything — the content is its own `relative` layer
        over the `absolute` scrim, and the caption moves between top and bottom by
        justify-content rather than by order.

        `pointer-events-none` on the layer with `pointer-events-auto` on the two controls,
        so the empty middle of this layer does not swallow a tap meant for the control in
        the hole. The whole argument for cutting a hole is that the thing under it is still
        the real thing.
      */}
      <div className="pointer-events-none absolute inset-0 flex flex-col">
        {/*
          THE HEADER: where you are in the walk, and the way out.

          safe-top because this covers the whole screen including the notch, and it is the
          one piece of furniture up there.

          BOTH TO THE RIGHT, because the left is taken. The counter was on the left and
          landed on top of the DUB mark — which is a control this walk POINTS AT on its last
          step, so the one piece of furniture the overlay adds was obscuring the one it
          exists to describe. Visible in a screenshot and nowhere else, which is the whole
          reason this is checked in a browser.

          IN THE FLOW, NOT PINNED, and a spacer decides where the caption goes.

          It was `absolute top-0`, so on the four bottom-bar steps — where the caption moves
          UP to leave the bar clear — the chips rendered straight through the counter. The
          fix is not more padding on the caption: that wants a 20, and the spacing scale is
          1/3/6/10 for reasons the gate enforces. These two are the overlay's only pieces of
          furniture, so they go in one column with a growing spacer between them, and which
          side of the caption that spacer falls on is the whole of the layout. They cannot
          overlap by construction, at any caption length, on any screen height.

          `shrink-0` so a long caption squeezes itself rather than this row.
        */}
        <div className="safe-top flex shrink-0 items-center justify-end gap-3 px-5 pt-6">
          <p data-testid="walk-count" className="eyebrow tabular-nums text-white/75">
            {at + 1} / {steps.length}
          </p>
          <button
            type="button"
            data-testid="walk-skip"
            onClick={finish}
            className="tap-target pointer-events-auto eyebrow -mr-2 px-3 py-3 text-white/75 transition hover:text-white"
          >
            SKIP
          </button>
        </div>

        {/*
          THE SPACER, AND WHICH SIDE OF THE CAPTION IT FALLS ON IS THE LAYOUT.

          Sam's reference shots put the caption low, and that is right for most of the walk:
          a caption at the top would sit over the top rail, which is two of the nine things
          being pointed at. The four bottom-nav steps are the exception — a panel of white
          type over the bar would cover the one control the step is about.

          560 is a measured threshold rather than a flag on the step: the bar sits at y≈810
          on an 844pt screen and the boards never get past the middle. Read off the HOLE, so
          a control that moves does not need this file edited — which is the same rule the
          circle itself follows.
        */}
        {hole && hole.y > 560 ? null : <div className="flex-1" />}

        <div
          data-testid="walk-say"
          /*
            THE SHOW, WHEN THERE IS ONE — Sam: "show a screenshot".

            Not a screenshot. A screenshot of DUB inside DUB is a picture that goes stale
            the first time any of these screens is touched, and the product has had exactly
            that failure with hardcoded coordinates. What a person needs at this moment is
            what the control OPENS, said in words they can read in two seconds — so the
            step carries a short list of what is behind it, drawn as the product's own
            chips.

            pt-6 and pb-10 on the scale, and no branch between them any more. An earlier
            version carried a pt-20 on the top branch to clear a counter row that was
            absolutely positioned above it — `npm run spacing` refused the 20, correctly,
            and the right answer was not a smaller number but removing the overlap: the
            counter is in the flow now with a spacer between, so there is nothing to clear.
          */
          className="animate-bank flex flex-col gap-6 px-5 pb-10 pt-6"
        >
          {/*
            THE PICTURE, WHERE THE SCREEN IS THE ARGUMENT — see `shot` in content/walk.ts.

            Above the caption rather than below it, because the caption reads as the answer
            to what you are looking at: picture, then the line that says what it means.

            A fixed aspect box rather than a bare image, so the card does not reflow when
            the file loads — the walk-through is a sequence of timed steps and a layout that
            jumps between them is the one thing it cannot do. `border-white/30` is the same
            keyline the chips below use, so the screenshot reads as part of the overlay
            rather than as the product having escaped it.
          */}
          {/*
            AND THE PICTURE SITS WITH THE CAPTION, never under the hole.

            First build put it at the top of the caption block, which on the boards step is
            directly beneath a circle 300px across — so the screenshot was half inside the
            cut-out, showing through onto the real page behind it. Photographed, obvious;
            invisible in the DOM, where both elements are exactly where they were asked to
            be.

            `self-end` keeps it on the side the counter is not, and the caption below is the
            thing that explains it either way.
          */}
          {step.shot ? (
            <div
              data-testid="walk-shot"
              className="relative aspect-[9/16] w-full max-w-[9rem] self-end overflow-hidden rounded-xl border border-white/30 shadow-lg"
            >
              <Image
                src={step.shot.src}
                alt={step.shot.alt}
                fill
                sizes="160px"
                className="object-cover object-top"
              />
            </div>
          ) : null}
          {step.opens ? (
            <ul data-testid="walk-opens" className="flex flex-wrap gap-3">
              {step.opens.map((what) => (
                <li
                  key={what}
                  /*
                    White on a 10% white wash over the 80% scrim. Measured rather than
                    eyeballed: that composite over the palest ground Yours offers is 13:1,
                    well past the 4.5 a chip this size has to clear.
                  */
                  className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs text-white"
                >
                  {what}
                </li>
              ))}
            </ul>
          ) : null}
          {/*
            BIG, WHITE AND BOLD, which is what the reference shots show and what the rest
            of this product calls `.t-line` — the display step a moment is allowed to be.
            Not invented here: the same type the Club's own cards use.
          */}
          <p className="t-line text-white">{step.say}</p>
          {/*
            THE SECOND LINE, on the steps that are making an argument rather than naming a
            control. See `more` in content/walk.ts: the furniture needs one sentence and
            the proposition needs two, and forcing the claim into a single display-sized
            line would make it a paragraph on a photograph.

            Smaller and at 85% white, so it reads as the thing under the headline rather
            than as a second headline competing with it.
          */}
          {step.more ? (
            <p data-testid="walk-more" className="-mt-3 text-base leading-relaxed text-white/85">
              {step.more}
            </p>
          ) : null}
          {/*
            THE CHOICE, WHERE A STEP ASKS ONE — see `pick` in content/walk.ts.

            Four people, each saying THE SAME SENTENCE in their own voice, so the choice is
            made on evidence rather than on a label. Somebody reading "A drill sergeant"
            and "Your gentle dad" is choosing between two adjectives; somebody reading the
            same observation four times over is choosing a person they want to hear from,
            which is the actual decision.

            The sample is deliberately the stuck line rather than the praise. Anyone sounds
            fine congratulating you — what somebody actually wants to know is how this
            thing is going to talk to them on a bad day.
          */}
          {step.pick === 'mentor' ? <MentorPick onPicked={next} /> : null}
          <button
            type="button"
            data-testid="walk-next"
            onClick={last && step.id === 'logo' ? finishAndGo : next}
            /*
              WHITE ON BLACK, not the accent.

              The accent is the product's blue and it means "this is the Portuguese". This
              button means "carry on", which is a different promise, and over a scrim the
              blue is also the one colour on screen competing with the thing in the hole.
              Black ink on white is 21:1 and cannot be argued with.
            */
            className="tap-target pointer-events-auto w-full rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-white/90"
          >
            {/*
              ON THE PICK STEP IT IS AN OPT-OUT, not a way on.

              Every other step's button means "I have read this". Here there is a real
              question above it, and a button saying NEXT under four choices reads as a
              fifth choice — so it says what it does. Somebody who skips keeps the default
              voice, which is the one the product was written in, so nothing is lost by
              not deciding. See DEFAULT_MENTOR.
            */}
            {step.pick === 'mentor'
              ? 'PICK FOR ME'
              : last
                ? (step.done ?? 'GOT IT')
                : 'NEXT'}
          </button>
        </div>

        {/* The other half of the spacer above. One of the two is always present. */}
        {hole && hole.y > 560 ? <div className="flex-1" /> : null}
      </div>
    </div>
  )
}

/**
 * PICK WHO IS TEACHING YOU, in the middle of the walk.
 *
 * Sam: "add the pick your mentor concept to the walk through and have some fun with it."
 *
 * THE FUN IS IN THE EVIDENCE, not in the decoration. Four cards, four names, and the SAME
 * observation written four ways — the stuck line, because anybody sounds pleasant
 * congratulating you and what somebody wants to know is how this will talk to them when
 * it is going badly. Reading "This sentence has beaten you how many times now?
 * Unacceptable. Again." next to "That one is tricky, love. No rush on it." is the whole
 * pitch, and it takes no explaining.
 *
 * ONE TAP AND IT MOVES ON. No confirm, no selected state waiting for a NEXT — the tap IS
 * the answer, and a picker that makes somebody choose and then press something else has
 * asked them twice. The brief chosen state exists only so the tap is acknowledged before
 * the step changes.
 *
 * AND IT IS NOT A WALL. The button below says PICK FOR ME, which keeps the default voice —
 * the one the product was already written in — so skipping costs nothing and nobody is
 * held at a question on their first visit.
 */
function MentorPick({ onPicked }: { onPicked: () => void }) {
  /*
    The tap, held just long enough to be seen before the step moves. Not state the walk
    reads — the record is written immediately — this is only so the card somebody pressed
    is visibly the one that won.
  */
  const [chosen, setChosen] = useState<MentorId | null>(null)

  function take(id: MentorId) {
    if (chosen) return
    setChosen(id)
    chooseMentor(id)
    track('mentor_chosen', { mentor: id })
    /*
      260ms, which is on the scale and is the acknowledgement rather than a pause for
      effect. Long enough to see the card take, short enough that it does not feel like
      the app is thinking about it.
    */
    window.setTimeout(onPicked, 260)
  }

  return (
    <ul data-testid="walk-mentors" className="pointer-events-auto flex flex-col gap-3">
      {MENTORS.map((m) => (
        <li key={m.id}>
          <button
            type="button"
            data-testid={'mentor-' + m.id}
            onClick={() => take(m.id)}
            /*
              White on the scrim like the chips above, and the chosen one inverts rather
              than growing a tick: at this size a tick is another small shape competing
              with the glyph, and a card that goes solid white is unmistakable from across
              a table — which is where this will be read, at a festival, on somebody
              else's phone.
            */
            className={
              'tap-target w-full rounded-xl border px-4 py-3 text-left transition ' +
              (chosen === m.id
                ? 'border-white bg-white text-black'
                : 'border-white/30 bg-white/10 text-white hover:bg-white/20')
            }
          >
            <span className="flex items-baseline gap-3">
              <span className="text-sm font-semibold">{m.name}</span>
              {/*
                How often they would get in touch, said as a word rather than a number.
                Sam asked for "potentially number of notifications" to be part of this, and
                the honest version at this size is which of them would ever nudge you —
                which is also the funniest thing on the dad card.
              */}
              <span
                className={
                  'eyebrow shrink-0 ' + (chosen === m.id ? 'text-black/55' : 'text-white/60')
                }
              >
                {m.nudges === 'none' ? 'NEVER NAGS' : m.nudges === 'more' ? 'WILL CHASE' : 'NOW AND THEN'}
              </span>
            </span>
            {/*
              THEM, TALKING. The line that makes this a choice rather than a menu — see the
              note on `sample` in content/mentors.ts.
            */}
            <span
              className={
                'mt-1 block text-sm leading-relaxed ' +
                (chosen === m.id ? 'text-black/75' : 'text-white/80')
              }
            >
              “{m.sample}”
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/**
 * The deliberate way in, for app/walkthrough/page.tsx.
 *
 * A redirect rather than a second copy of the walk. The whole argument of this component is
 * that the controls being described are the REAL ones, in the position they will be in
 * every time — so a standalone page would have to render a replica of Yours to put holes
 * in, which is a tour of a mock-up and goes stale the first time Yours changes.
 *
 * `replace` rather than `push`, so backing out of the walk does not land on a route whose
 * only job is to bounce — which would make the back gesture a loop.
 */
export function WalkHere() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/profile?walk=1')
  }, [router])

  return (
    <div className="app-frame safe-top bg-bg text-fg">
      <p className="mx-auto w-full max-w-md px-5 py-6 text-sm text-muted">
        Showing you where everything is…
      </p>
    </div>
  )
}
