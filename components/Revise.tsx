'use client'

import { SayItCard } from '@/components/SayItCard'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MiniBuild } from '@/components/Journey'
import { BottomNav } from '@/components/BottomNav'
import { Dock, Framed } from '@/components/Dock'
import { useLearner } from '@/engine/useLearner'
import { recordProof } from '@/engine/learner'
import { revisionFor, revisionTitle } from '@/content/revision'
import type { CardKind } from '@/content/collection'

/**
 * REVISION — a finished card, asked back.
 *
 * Sam: "clicking on a panel should be a revision of what has been learned, not the
 * original walk through cards."
 *
 * The panel used to link at the lesson, which replays the whole sitting: recognition,
 * bridge, pieces, build. Right the first time and wrong every time after, because what is
 * being revisited is not the lesson but what it left behind.
 *
 * So this is the release beat and nothing else — the English, the tiles, and whether you
 * still have it. See content/revision.ts for what each kind offers back.
 *
 * NOTHING IS LOST BY GETTING IT WRONG. A clean answer records a proof line, exactly as a
 * first release does; a wrong one records nothing and the card stays on the grid. A
 * revision that could empty a slot would make the shelf a thing to be afraid of, which is
 * the opposite of a collection.
 */
export function Revise() {
  const params = useSearchParams()
  const learner = useLearner()
  const kind = (params.get('kind') ?? 'vibe') as CardKind
  const id = params.get('id') ?? ''
  const [at, setAt] = useState(0)
  const [done, setDone] = useState(false)
  /*
    Whether the device can listen is SayItCard's business now, not this screen's — it
    draws the microphone or the line that replaces it. See components/SayItCard.tsx.
  */

  const lines = useMemo(
    () =>
      revisionFor(kind, id, {
        legend: learner.legend ?? [],
        gender: learner.profile?.gender ?? null,
        /* The words deck asks only for what this learner owns — see revisionFor. */
        inventory: learner.inventory ?? {},
        /* And the asked deck's content lives on the record and nowhere else. */
        asked: learner.asked ?? [],
      }),
    [kind, id, learner.legend, learner.profile?.gender, learner.inventory, learner.asked],
  )
  const line = lines[at]

  /*
    Nothing to ask is a real state — a sheet whose members are all glossed rather than
    taught — and it says so rather than rendering an empty build. See revisionFor.
  */
  if (!lines.length) {
    return (
      <Shell title={revisionTitle(kind, id)}>
        <p className="text-sm leading-relaxed text-muted">
          Nothing to say back on this one yet — it is a reference rather than a sentence.
        </p>
        <Dock>
          <Link
            href="/profile"
            className="tap-target eyebrow block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            BACK TO YOURS
          </Link>
        </Dock>
      </Shell>
    )
  }

  if (done || !line) {
    return (
      <Shell title={revisionTitle(kind, id)}>
        <p className="eyebrow text-accent">STILL YOURS</p>
        <h1 className="display text-balance text-2xl">
          {lines.length === 1 ? 'That is still there.' : 'All ' + lines.length + ' still there.'}
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          Nothing on this card can be lost by getting it wrong. It is here whenever you want it
          again.
        </p>
        <Dock>
          <Link
            href="/profile"
            className="tap-target eyebrow block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            BACK TO YOURS
          </Link>
        </Dock>
      </Shell>
    )
  }

  return (
    <Shell title={revisionTitle(kind, id)}>
      <div className="flex items-baseline gap-3">
        <p className="eyebrow min-w-0 text-accent">SAY IT BACK</p>
        <span className="h-px flex-1 bg-line" />
        {/* A position on the card, not a score. */}
        <span className="eyebrow shrink-0 tabular-nums text-muted">
          {at + 1} of {lines.length}
        </span>
      </div>
      {/*
        THE HINGE CARD, ON THE OTHER COLD BEAT. Sam: "do revise first."

        WHAT THIS SCREEN WAS. The question at text-2xl — a caption, on the screen whose
        whole job is to ask it — then a 48px microphone beside a line of small grey text
        reading "Say it out loud, or build it below", then the tiles. And the marking was
        `if (!h.close) return`: a miss changed NOTHING on screen. Which is the exact fault
        Sam reported on the run-through before it was rebuilt — "the say it loud gives no
        indication it is listening or has heard or has any feedback" — still live here,
        on the same act, a day after being fixed there.

        So it is the same card now: the question at t-ask with a listen button, a 96px
        microphone, four verdict bands with the words to aim at, the green tick, the ping,
        the five-goes limit, and listen/copy/say on the answer once it is shown.

        THE TILES STAY, AND STAY BELOW. Recognition is approximate and absent on some
        browsers, so the build is the path that always works — speaking is offered first
        and the tiles are what it falls back to. Passed as children so the card owns the
        asking and this screen owns what follows.

        AND SHOW ME IS OFF HERE, which is the one real difference from the run-through. The
        Legend is yours and you may simply look at it; a revision is asking whether you
        still have the sentence, and handing it over on a tap would answer its own
        question. The tiles are the way through without speaking — they teach, which is
        what someone who cannot produce it needs.
      */}
      <SayItCard
        key={line.answer}
        ask={line.ask}
        answer={line.answer}
        answerEn={line.ask}
        reveal={false}
        /*
          PICKER FIRST HERE TOO. Sam: "reverse these so they do the word picker first, when
          that is successful it reveals the Say it loud mechanic."

          Revision is asking whether you still have a sentence you met some time ago, which
          is exactly the case where being handed a microphone and nothing else is a wall:
          a learner who cannot remember it had no way to find out what it was except by
          missing five times. The tiles remind, and then saying it proves something.
        */
        buildFirst
        /*
          And the dock rather than a CONTINUE — Sam: "removing continue CTA's." A revision
          advances on its own when a line is done, so the arrow is the override and `at`
          is what moves.
        */
        onNext={() => {
          if (at + 1 < lines.length) setAt(at + 1)
          else setDone(true)
        }}
        onBack={at > 0 ? () => setAt(at - 1) : undefined}
        onClose={() => {
          /*
            Recorded exactly as a first release is. The proof card counts sentences
            produced with nothing on screen, and a revision said cold is one of those.
          */
          recordProof({ pt: line.answer, en: line.ask, source: 'release', clean: true })
          if (at + 1 < lines.length) setAt(at + 1)
          else setDone(true)
        }}
      >
        {({ solved }) => (
          <MiniBuild
            key={line.answer}
            target={line.answer}
            helpers={line.helpers}
            onSolved={({ clean }) => {
              /*
                Only when it was cold: a helped answer teaches and proves nothing, which is
                what `clean` already means everywhere else.
              */
              if (clean) {
                recordProof({ pt: line.answer, en: line.ask, source: 'release', clean: true })
              }
              /*
                AND IT NO LONGER JUMPS. Solving the picker used to advance the card
                immediately, which is what made the microphone unreachable on this screen:
                the line it belonged to was already gone. Now the picker hands over the
                microphone and the learner decides — say it, or press on with the arrow.
              */
              solved()
            }}
          />
        )}
      </SayItCard>
    </Shell>
  )
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="app-frame bg-bg text-fg">
      <header className="bar sticky top-0 z-30 px-5 py-3">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          <Link href="/profile" className="tap-target shrink-0" aria-label="Back to Yours">
            ‹
          </Link>
          <p className="eyebrow min-w-0 flex-1 truncate">{title.toUpperCase()}</p>
        </div>
      </header>
      <Framed className="flex flex-col">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pb-6 pt-3">
          {children}
        </div>
      </Framed>
      <BottomNav />
    </div>
  )
}
