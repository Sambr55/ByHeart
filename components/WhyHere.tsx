'use client'

import { Back } from '@/components/Back'
import { BottomNav } from '@/components/BottomNav'
import { Framed } from '@/components/Dock'
import { Wordmark } from '@/components/Wordmark'
import { CLUB } from '@/content/club'
import { PURPOSES } from '@/content/situations'
import { track } from '@/engine/analytics'
import { setPurpose } from '@/engine/learner'

/**
 * What brings you to Lisbon, asked at the top of the Legend.
 *
 * One tap, no skip, and no "prefer not to say" — because unlike every other question DUB
 * asks, this one has no wrong answer and nothing is done with it except choosing what to
 * show. A skip here would produce a learner the Club cannot serve well while looking like
 * it is serving them, which is worse for them than an answer they can change in Yours.
 *
 * The three are described by what they contain rather than by how long somebody is
 * staying, because "a season" means nothing until you know it means the café that starts
 * recognising you.
 */
export function WhyHere({ onDone }: { onDone: () => void }) {
  return (
    <div data-stage="REAL WORLD" className="app-frame safe-top bg-bg text-fg">
      {/*
        A question, not a gate, so it is not a dead end.

        This shipped with no bar and no way back, which made the first screen of the Legend
        the only screen in DUB somebody could not leave. It is a decision worth making but
        nothing downstream requires it — purpose shapes what is offered, it does not unlock
        anything — so somebody who would rather get on with it can, and is asked again next
        time they open the deck.
      */}
      <Framed className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 pb-10 pt-6">
        <div className="flex items-center gap-3">
          <Back />
          <span className="flex-1" />
        </div>
        <Wordmark mark="club" className="h-8" />
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-accent">{CLUB.welcome.ask_eyebrow}</p>
          <h1 className="display text-balance text-2xl">{CLUB.welcome.ask_headline}</h1>
          <p className="text-sm leading-relaxed text-muted">{CLUB.welcome.ask_body}</p>
        </div>

        <ul className="flex flex-col gap-3">
          {PURPOSES.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                data-testid={'purpose-' + p.id}
                onClick={() => {
                  setPurpose(p.id)
                  track('purpose_chosen', { purpose: p.id })
                  onDone()
                }}
                className="tap-target flex w-full flex-col gap-1 rounded border border-line bg-bg-elev px-4 py-3 text-left transition hover:border-accent/50"
              >
                <span className="display text-lg">{p.label}</span>
                <span className="text-sm leading-relaxed text-muted">{p.blurb}</span>
              </button>
            </li>
          ))}
        </ul>

        <p className="text-xs leading-relaxed text-muted">{CLUB.welcome.ask_footnote}</p>
      </Framed>
      <BottomNav />
    </div>
  )
}
