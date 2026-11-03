'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { CLUB } from '@/content/club'
import { dropsFor, roomsFor } from '@/content/feed'
import { FREE_ROOMS } from '@/lib/entitlements'
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
 * The door is SET-UP — `clubOpen` in content/legend.ts, asked through useClub so all four
 * tabs ask it once and in one place. It was the Legend, said cold, and this screen spent
 * most of its length counting sittings of the basics and sentences left to say. Sam moved
 * the door when DUB became about the city: the Club opens the moment somebody has said
 * where they are going, and the Legend is an optional card inside. So the only thing this
 * screen now has to say is "you have not set up yet", and the way on is set-up.
 *
 * TWO WAYS OUT. Back, for somebody who tapped by mistake and wants the screen they were
 * on; and the way on, which is the front door's sequence (`/club?in=1`) — it ends at the
 * set-up card, which is the thing that opens this. A screen that explains a locked door
 * and then offers nothing is the dead end `forward-check` exists to catch.
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
      /* The starter set, counted from the one list rather than typed. */
      FREE_ROOMS.length + ' of them free from the first day, with the survival kit',
    ]
    if (drops > 0) out[1] = drops + ' things on in Lisbon right now, and what to say there'
    return out
  }, [learner.chapter, learner.purpose])

  return (
    <main data-stage="CHOICE" className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-5 pb-10 pt-6">
      {/*
        THE WHITE CARD ON THE LOCKED HALF TOO, so the screen is two cards and not one.

        INSIDE already had a card, and it is the SELL — the half that says what is behind
        the door. The half that says what the door IS, which is the tab's name, the
        headline and the two sentences explaining the distance, had nothing: eyebrow,
        3xl headline and two grey paragraphs loose on the sand above a bordered box.

        That ordering reads backwards. The thing the person tapped and the reason they
        cannot have it is the answer to their question; the sell is the consolation. One
        of the two being an object and the other being loose type made the consolation
        look like the content.

        Both carded, the screen is: here is what you asked for and why it is shut; here is
        what is behind it. Two cards, in that order, which is the order it happens in.
      */}
      <div className="flex flex-col gap-6 rounded-2xl border border-line bg-bg-elev px-5 py-6">
      <p className="eyebrow text-accent">{what}</p>
      <h1 className="display text-balance text-3xl">Not yet — this opens once you are set up.</h1>
      <p className="text-sm leading-relaxed text-muted">{line}</p>
      <p className="text-sm leading-relaxed text-muted">
        {/*
          ONE STEP, NAMED. This was two paragraphs of arithmetic — sittings of the basics, a
          warm-up vibe, Legend sentences left to say — because the door was the Legend and
          the Legend was a long way off. The door is set-up now: where you are going and why,
          which takes a minute. So that is all this says, and the Legend is not mentioned,
          because it no longer stands between anybody and anything.
        */}
        Tell us where you are going and why — it takes a minute — and the Club opens on the
        rooms you will need first.
      </p>
      </div>

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
      {/*
        rounded-2xl and px-5, matching its new neighbour and every other card in DUB.

        It was `rounded` — a 4px radius — with px-4, which is the shape Proof's note calls
        out: the radius is most of what makes a rectangle read as a card rather than a box.
        Beside a rounded-2xl card it read as a different kind of thing, and it is not.
        The accent border stays: this one is the sell and is allowed to be the warmer of
        the two.
      */}
      <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-accent/40 bg-bg-elev px-5 py-6">
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
          THE BUTTON GOES TO SET-UP, which is what opens the door.

          It went to the shelf, or to the Legend run-through (`/legend?run=1`) once the card
          was written — both were the work the old door asked for. `/club?in=1` is the front
          door's sequence and it ends at the set-up card, so one tap here is the whole way in.
        */}
        <Link
          href="/club?in=1"
          data-testid="notyet-go"
          className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
        >
          SET ME UP
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
            else router.push('/club')
          }}
          className="tap-target eyebrow w-full rounded border border-line px-5 py-3 text-center text-muted"
        >
          BACK
        </button>
      </div>
    </main>
  )
}
