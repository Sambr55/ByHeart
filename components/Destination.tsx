'use client'

import { useState } from 'react'
import { CHAPTERS } from '@/content/chapters'
import { DEFAULT_PAIR } from '@/content/pairs'
import { track } from '@/engine/analytics'
import { setChapter } from '@/engine/learner'
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
  /*
    NOTHING IS PRE-SELECTED, ever, including on a device that has chosen before.

    It read the stored chapter, so anybody who had been through set-up once met this card
    with Lisbon already highlighted — which turns a question into a confirmation and makes
    the one action the card wants look as though it has already been taken.
  */
  const [chosen, setChosen] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      {/*
        NO HEADING HERE. The card face carries it.

        This rendered its own eyebrow and headline while the face rendered the same ones, so
        WHERE TO appeared twice, one above the other. Two components each doing half a card
        is how that happens; the face owns the words and this owns the choice.
      */}
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
                /*
                  Solid grounds, because this list sits over a photograph now.

                  The closed rows were bg-surface/30 with opacity-40 — legible on sand and
                  a smear on a picture. Greyed has to mean "not available", not "hard to
                  read": a row somebody has to squint at reads as a rendering fault.
                */
                (!c.open
                  ? 'border-line/60 bg-bg-elev/70 text-muted'
                  : chosen === c.id
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-line bg-bg-elev text-fg')
              }
            >
              <span className="flex flex-col gap-1">
                <span className="display text-lg">{c.city}</span>
                <span className={'text-sm ' + (chosen === c.id ? 'opacity-80' : 'text-muted')}>
                  {c.open ? c.country + ' · European Portuguese' : c.country}
                </span>
              </span>
              {c.open ? null : <span className="eyebrow shrink-0 text-muted">NOT OPEN</span>}
            </button>
          </li>
        ))}
      </ul>


    </div>
  )
}
