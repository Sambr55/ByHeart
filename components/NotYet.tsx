'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { CLUB } from '@/content/club'
import { dropsFor, roomsFor } from '@/content/feed'
import { cardFor, frameApplies, legendStatus } from '@/content/legend'
import { useLearner } from '@/engine/useLearner'

/**
 * The three tabs, before there is a Club to put in them.
 *
 * WHAT THIS REPLACES. /club, /calendar and the translator each rendered in full to a
 * device that had never done anything — the Club showed its showcase, the calendar showed
 * a month of a city nobody had chosen, and ASK opened a translator on any screen. So the
 * bar offered four doors into a building the person had not entered, and three of them
 * gave away the thing the door is for.
 *
 * The door is the Legend, which it always was: `clubOpen` in content/legend.ts, asked
 * through useClub so all four tabs ask it once and in one place.
 *
 * TWO WAYS OUT, AND THEY GO TO THE SAME PLACE. Back, for somebody who tapped by mistake
 * and wants the screen they were on; and the way on, for somebody who has just been told
 * what this is and wants to start. Both land on the vibes, because the vibes are the only
 * thing to do before the Legend exists — a screen that explains a locked door and then
 * offers nothing is the dead end `forward-check` exists to catch.
 */
export function NotYet({
  what,
  line,
}: {
  /** The tab's own name, so the screen says what the person actually tapped. */
  what: string
  /** What is behind this particular door, in one sentence. */
  line: string
}) {
  const router = useRouter()
  const learner = useLearner()
  const played = learner.roots_played ?? []
  const sections = learner.sections_completed ?? []
  const status = legendStatus({
    rootsPlayed: played,
    sectionsCompleted: sections,
    sittings: learner.sittings ?? 0,
    purpose: learner.purpose ?? null,
  })
  const open = status.open
  const left = Math.max(0, status.sessionsNeeded - status.sessionsDone)
  const vibesLeft = Math.max(0, status.vibesNeeded - status.vibesDone)

  /*
    AND HOW MUCH OF THE LEGEND HAS ACTUALLY BEEN SAID.

    Sam: "this is about completing and rehearsing the legend, which has now become a soft
    option, not a gate." The road answers all seven as a learner walks it, so the card is
    written before they get here — and this screen said "It is open now, build it" to
    somebody whose card was already built and never spoken.

    What is outstanding is the rehearsal, so that is what the screen names. Counted from
    the same proof record the door reads, so the sentence here and the lock cannot
    disagree about what is left.
  */
  const saidCold = (learner.proof ?? []).filter((p) => p.source === 'legend' && p.clean).length
  const cardSize = cardFor(learner.purpose ?? null).filter((f) =>
    frameApplies(f, learner.legend ?? []),
  ).length
  const toSay = Math.max(0, cardSize - saidCold)

  /*
    The three things the Club actually holds, counted from the content it would serve.

    Read after mount like everything else that comes out of the learner record — the
    chapter decides the room count, and the server does not have it.

    PURPOSE NO LONGER CHANGES THIS NUMBER, and that is the point of the change behind it:
    it ranks the rooms rather than removing them, so the promise on this screen is the
    same 35 for everybody instead of 14 for a visitor and 23 for a mover. See purposeRank
    in content/feed.ts.
  */
  const inside = useMemo(() => {
    const chapter = learner.chapter ?? undefined
    const rooms = roomsFor(chapter, learner.purpose ?? null).length
    const drops = dropsFor(chapter, new Date(), false).length
    const out = [
      rooms + ' rooms of your city — the errands, the counters, the awkward ones',
      'What is on this week, and the words for being there',
      'Your Legend, said cold, to people doing the same thing',
    ]
    if (drops > 0) out[1] = drops + ' things on in Lisbon right now, and what to say there'
    return out
  }, [learner.chapter, learner.purpose])

  return (
    <main data-stage="CHOICE" className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-5 pb-10 pt-6">
      <p className="eyebrow text-accent">{what}</p>
      <h1 className="display text-balance text-3xl">Not yet — this opens with your Legend.</h1>
      <p className="text-sm leading-relaxed text-muted">{line}</p>
      <p className="text-sm leading-relaxed text-muted">
        {/*
          BOTH HALVES OF THE DOOR, named, in the order they are met.

          The door is the basics plus three vibes you chose, and this said only the first
          half — so somebody who had finished the basics was told "it opens now" by
          arithmetic that no longer decided anything, and somebody three vibes deep was
          told to play more of a vibe they had finished. Sam, having done exactly
          that: "I have just done multiple vibes but the legend isn't opening."

          One sentence per half, and only the half they are actually on: naming the vibes
          while the basics are unfinished is a second instruction nobody can act on yet.

          Counted in SITTINGS, which is the thing a learner chooses to start. This screen
          was the last one still counting roots, which is why it could say "5 more lines
          of the basics" to somebody who had just finished everything they were shown.
        */}
        Your Legend is seven things about yourself, said with nothing on screen.{' '}
        {open
          ? toSay === 0
            ? 'It is open now — the Club is yours.'
            : /*
                THE CARD IS WRITTEN; SAYING IT IS THE DOOR.

                "Build it" was right when the deck was where the Legend got filled in. The
                lessons fill it now, so by the time somebody reads this the card is
                complete and untouched — and the thing between them and the Club is having
                said it out loud with nothing on screen.
              */
              toSay === 1
              ? 'Your Legend is written. Say the last one out loud and the Club is yours.'
              : 'Your Legend is written. Say all ' +
                toSay +
                ' out loud, with nothing on screen, and the Club is yours.'
          : left > 0
            ? /*
                THE BASICS, AND THE WARM-UP ONLY IF IT IS STILL OWED.

                This said "then N vibes of your own" against a toll of three that had
                already been removed, so the locked door asked for two things the product
                was not going to check. And a learner who had warmed up was still told to
                do it: the clause was unconditional.

                Named rather than counted, for the reason legend_vibes is: the warm-up is
                Top Gun or Bridget Jones, not any vibe off the shelf, and "one vibe of
                your own" sends somebody to pick the wrong thing.
              */
              (left === 1
                ? 'One more sitting of the basics'
                : left + ' more sittings of the basics') +
              (vibesLeft > 0 ? ', and a warm-up vibe.' : '.')
            : 'The basics are done. Take a warm-up vibe and it opens.'}
      </p>

      {/*
        WHAT IS BEHIND THE DOOR, named with real things rather than adjectives.

        Sam: the hard gate "stays the same after legend gating the club with added sell —
        but it doesn't move". So the gate is exactly where it was and this is the sell.

        A locked door with nothing on the far side of it is a wall, and this screen was
        one: it said what was shut and how far away the key was, and never once said what
        was inside. CLUB.door.inside has said it well all along and nothing rendered it.

        Counted rather than promised. `rooms` is the real number of Situations this
        learner's city and purpose would give them, and `drops` is whatever is genuinely
        live this week — so the sell cannot inflate, and on a quiet week it says fewer
        things because there ARE fewer things. A number somebody can check is worth more
        than an adjective they cannot.
      */}
      <div className="mt-3 flex flex-col gap-3 rounded border border-accent/40 bg-bg-elev px-4 py-6">
        <p className="eyebrow text-accent">INSIDE</p>
        <p className="text-sm leading-relaxed text-fg/85">{CLUB.door.inside}</p>
        <ul className="mt-1 flex flex-col gap-3">
          {inside.map((x) => (
            <li key={x} className="flex items-baseline gap-3 text-sm text-fg/85">
              <span aria-hidden className="text-accent">
                &middot;
              </span>
              <span className="min-w-0">{x}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {/*
          THE BUTTON GOES WHERE THE WORK IS.

          It always sent people to the shelf, which is right while there are still basics
          to play and wrong the moment the card is written and unspoken: the shelf has no
          Legend on it. ?run=1 is the run-through the deck's own button starts — see
          components/Legend.tsx — so the one thing standing between them and the Club is
          one tap away rather than somewhere they have to go and find.
        */}
        <Link
          href={open && toSay > 0 ? '/legend?run=1' : '/vibes'}
          data-testid="notyet-go"
          className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
        >
          {open && toSay > 0 ? 'SAY IT OUT LOUD' : 'GET GOING'}
        </Link>
        {/*
          Back, and it is a real back — router.back() returns the screen they came from
          rather than guessing at one. It falls to the vibes when there is no history,
          which is what happens on a cold open straight to /calendar.
        */}
        <button
          type="button"
          data-testid="notyet-back"
          onClick={() => {
            if (window.history.length > 1) router.back()
            else router.push('/vibes')
          }}
          className="tap-target eyebrow w-full rounded border border-line px-5 py-3 text-center text-muted"
        >
          BACK
        </button>
      </div>
    </main>
  )
}
