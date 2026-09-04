'use client'

import { useState } from 'react'
import { CHAPTERS } from '@/content/chapters'
import { DEFAULT_PAIR } from '@/content/pairs'
import { track } from '@/engine/analytics'
import { loadLearner, setChapter } from '@/engine/learner'
import { setPair } from '@/engine/pair'

/**
 * Where, asked third — before anything is shown rather than after everything is.
 *
 * WHY IT LEFT SET-UP. It was the first step of a card seventh in the sequence, which meant
 * eight screens of argument were written about a city nobody had chosen. Asking early costs
 * one tap and makes every card after it true of somewhere specific: the drops card can say
 * what is on, the rooms card can name rooms, and the whole sequence stops being a brochure
 * for a product and becomes a look at one.
 *
 * WHY THE LANGUAGE IS NOT A SEPARATE QUESTION. Every chapter in CHAPTERS carries the same
 * pair, so choosing Lisbon chooses pt-PT. The card names the language it is handing over
 * rather than asking for it again — asking twice for one answer is a form.
 *
 * WHY IT IS NOT A GATE. Swipe past and the Club runs on the default chapter, which is the
 * only open one anyway. The sequence never stops a thumb; it only stops an action.
 */
export function Destination({ onDone }: { onDone?: () => void } = {}) {
  const [chosen, setChosen] = useState<string | null>(
    typeof window === 'undefined' ? null : (loadLearner().chapter ?? null),
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-accent">WHERE TO</p>
        <h2 className="display text-balance text-2xl">Where do you want DUB to take you?</h2>
        <p className="text-sm leading-relaxed text-muted">
          One is built. The other is honest about not being — nothing here will take your email
          and promise to let you know.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {CHAPTERS.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              data-testid={'where-' + c.id}
              disabled={!c.open}
              aria-pressed={chosen === c.id}
              onClick={() => {
                /*
                  The pair travels with the city, set explicitly rather than left to a
                  default. A learner record should say what it is teaching rather than
                  leave it to be inferred from a constant that may gain siblings.
                */
                setChapter(c.id)
                setPair(DEFAULT_PAIR)
                setChosen(c.id)
                track('chapter_chosen', { chapter: c.id })
                onDone?.()
              }}
              className={
                'tap-target flex w-full items-center justify-between gap-3 rounded border px-4 py-3 text-left transition ' +
                (!c.open
                  ? 'border-line/40 bg-surface/30 opacity-40'
                  : chosen === c.id
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line hover:border-accent/50')
              }
            >
              <span className="flex flex-col gap-1">
                <span className="display text-lg">{c.city}</span>
                <span className="text-sm text-muted">
                  {c.open ? c.country + ' · European Portuguese' : c.country}
                </span>
              </span>
              {c.open ? null : <span className="eyebrow shrink-0 text-muted">NOT OPEN</span>}
            </button>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-muted">
        Keep swiping if you would rather look around first. This will be here.
      </p>
    </div>
  )
}
