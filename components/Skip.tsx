'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cardFor } from '@/content/legend'
import { ROOTS_BY_FAMILY } from '@/content/roots'
import { Dock, Framed } from '@/components/Dock'
import { Wordmark } from '@/components/Wordmark'
import { DEFAULT_PAIR } from '@/content/pairs'
import { chosenPair, setPair } from '@/engine/pair'
import { fastForward, loadLearner, provideSeedContent } from '@/engine/learner'

/**
 * STRAIGHT TO THE CLUB, without playing the whole game to get there.
 *
 * Sam: "I need a way of testing club without having to reset and redo the legend."
 *
 * The Club opens on one field — club_welcomed_at, the first line of clubOpen — and
 * everything between a fresh device and that field is six basics sittings, three vibes and
 * seven Legend answers. That is the product working as designed and it is twenty minutes
 * every time somebody wants to look at a feed card.
 *
 * THE SIBLING OF /reset, and deliberately shaped like it. A URL you have to know, not in
 * any menu, saying what it is about to do before it does it. The two are a pair: this one
 * stands a learner up at the door, that one puts them back on the pavement.
 *
 * IT DOES NOT FAKE AN INVENTORY, and that is the one thing worth being strict about. The
 * stages on Yours are driven by banked pieces, and a fabricated inventory would put a
 * number there that no lesson produced — the one number in this product that is supposed
 * to be real. So a skipped learner gets a Club full of content and a stage of BASICS: they
 * have not learned anything, they have just been let in. Which is exactly the state worth
 * testing the Club in.
 */
export function Skip() {
  const [state, setState] = useState<'reading' | 'ready' | 'already' | 'done'>('reading')
  const [name, setName] = useState('Sam')

  useEffect(() => {
    /*
      The content graph, handed to the engine rather than imported by it.

      engine/learner.ts cannot import content/roots.ts — roots imports PieceId back out of
      it — so fastForward takes its two content lookups through a setter. This is the only
      caller, and a client component is allowed to know both.
    */
    provideSeedContent(
      () => ROOTS_BY_FAMILY['the_basics'] ?? [],
      (p) => cardFor((p ?? null) as Parameters<typeof cardFor>[0]),
    )
    const me = loadLearner()
    if (me.display_name) setName(me.display_name)
    setState(me.club_welcomed_at ? 'already' : 'ready')
  }, [])

  if (state === 'reading') return <Frame>{null}</Frame>

  if (state === 'done' || state === 'already') {
    return (
      <Frame>
        <div className="flex flex-1 flex-col justify-center gap-3">
          <p className="eyebrow text-accent">{state === 'done' ? 'DONE' : 'ALREADY IN'}</p>
          <h1 className="display text-balance text-3xl">
            {state === 'done' ? 'The door is open.' : 'You are already a member.'}
          </h1>
          <p className="text-sm leading-relaxed text-muted">
            {state === 'done'
              ? 'The Club, the calendar and Yours all work. Your stage still says BASICS, because nothing here pretends you have learned words you have not — that number only moves in a lesson.'
              : 'This device already has club_welcomed_at set, so the Club is open and there is nothing for this page to do. /reset puts you back to a blank device if you want the whole run again.'}
          </p>
        </div>
        <Dock>
          <Link
            href="/club"
            className="tap-target eyebrow block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            GO TO THE CLUB
          </Link>
          <Link
            href="/reset"
            className="tap-target eyebrow block w-full rounded border border-line px-5 py-3 text-center text-fg"
          >
            START AGAIN
          </Link>
        </Dock>
      </Frame>
    )
  }

  return (
    <Frame>
      <div className="flex flex-1 flex-col justify-center gap-6">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-accent">TESTING ONLY</p>
          <h1 className="display text-balance text-3xl">Skip to the Club.</h1>
          <p className="text-sm leading-relaxed text-muted">
            For looking at the Club without playing six sittings to reach it. It writes the
            state a learner has when they arrive there and nothing else.
          </p>
        </div>

        {/*
          What it is about to write, itemised — the same courtesy /reset pays in the other
          direction. A tool that changes your record without saying what it changed is a
          tool you cannot trust the next time a screen looks wrong.
        */}
        <ul className="flex flex-col gap-1 rounded border border-line bg-bg-elev p-4 text-sm leading-relaxed">
          <li>The deal accepted, and Lisbon as your chapter.</li>
          <li>Moving, as why you are here.</li>
          <li>The basics played and marked done.</li>
          <li>Your seven Legend answers, filled in.</li>
          <li>One line of proof, so the proof card is not empty.</li>
          <li className="mt-3 text-muted">
            Not your inventory. The stage on Yours counts words you actually banked, and
            this will not lie to it.
          </li>
        </ul>

        <label className="flex flex-col gap-1">
          <span className="eyebrow text-muted">YOUR NAME</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="tap-target rounded border border-line bg-bg px-4 py-3 text-base"
            placeholder="Sam"
          />
        </label>
      </div>
      <Dock>
        <button
          type="button"
          data-testid="skip-go"
          onClick={() => {
            /*
              THE PAIR FIRST, because without it the front door will not send them on.

              app/page.tsx returns early on `!chosenPair()` before it ever asks whether the
              learner is returning — the pair decides which learner record is even read, so
              it is checked first, exactly as the deal gate does it. A skipped learner had
              every other field and no pair, so reopening the app dropped them on the
              landing screen with COME IN, as though they had never been here. Found by
              asking what a returning user sees.

              It is also the honest thing for the tool to write: no real learner reaches the
              Club without having chosen a language, and this page claims to produce the
              state somebody has when they arrive there.
            */
            if (!chosenPair()) setPair(DEFAULT_PAIR)
            fastForward({ name })
            setState('done')
          }}
          className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink"
        >
          OPEN THE CLUB
        </button>
      </Dock>
    </Frame>
  )
}

/** The same chrome /reset wears: a mark, and a column that fills the screen. */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div data-stage="CHOICE" className="app-frame safe-top bg-bg text-fg">
      <Framed className="flex flex-col">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-6">
          <Wordmark mark="dub" className="h-6" title="DUB" />
          {children}
        </div>
      </Framed>
    </div>
  )
}
