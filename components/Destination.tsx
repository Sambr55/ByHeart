'use client'

import { useState } from 'react'
import { CHAPTERS, DEFAULT_CHAPTER } from '@/content/chapters'
import { VISITING } from '@/content/front-door'
import { DEFAULT_PAIR } from '@/content/pairs'
import { GOAL_QUESTION } from '@/content/profile'
import { track } from '@/engine/analytics'
import { resetLearnerCache, setChapter, setProfile, setPurpose } from '@/engine/learner'
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
              {/*
                COMING, not NOT OPEN. The same fact, and the opposite feeling: one is a
                refusal and the other is a roadmap. Sam's brief is that a stranger should
                feel a product that knows where they are heading — a greyed row saying
                COMING says the ambition is real and Lisbon is simply first.
              */}
              {c.open ? null : <span className="eyebrow shrink-0 text-muted">COMING</span>}
            </button>
          </li>
        ))}
      </ul>


    </div>
  )
}

/**
 * "Visiting Lisbon?" — where and why in one answer, with yes as the lead.
 *
 * WHY IT IS ONE QUESTION NOW. Set-up asked a language (one is built), a city (one is open)
 * and then why, over five equal rows. Two of those were confirmations wearing the clothes
 * of a question, and the third buried the answer most people have under four that few do.
 * DUB is for people visiting Lisbon, so the question names the city and the yes is the
 * largest thing on the card; the other reasons are still here, one row underneath, because
 * somebody staying or moving needs a different Club and should not have to argue for it.
 *
 * ONE TAP WRITES EVERYTHING THE THREE USED TO. The pair and the chapter first, because the
 * pair decides which learner record is read — and the cached record is dropped between
 * them, which is the fault components/Choose.tsx records finding the hard way. Then the
 * purpose the Club filters on and the goal that says the question was answered, exactly as
 * SetUp's why step wrote them, so nothing downstream can tell the difference.
 *
 * THE TESTIDS FOLLOW THE REASON (`setup-why-trip`, `setup-why-moving`), as they always
 * did, so the checks that answer set-up keep answering it.
 *
 * NOTHING IS PRE-SELECTED. Leading is not choosing for somebody.
 */
export function Visiting({
  onDone,
  onSand = true,
}: {
  onDone?: () => void
  /* Whether this sits on the pane's sand or on the card face's photograph. */
  onSand?: boolean
} = {}) {
  const [chosen, setChosen] = useState<string | null>(null)
  const lead = GOAL_QUESTION.options.find((o) => o.purpose === 'visiting')
  const rest = GOAL_QUESTION.options.filter((o) => o !== lead)

  const pick = (o: (typeof GOAL_QUESTION.options)[number]) => {
    if (chosen) return
    setChosen(o.id)
    setPair(DEFAULT_PAIR)
    resetLearnerCache()
    setChapter(DEFAULT_CHAPTER)
    if (o.purpose) setPurpose(o.purpose)
    setProfile('goal', o.id)
    track('chapter_chosen', { chapter: DEFAULT_CHAPTER, locale: DEFAULT_PAIR.target_locale })
    track('purpose_chosen', { purpose: o.purpose ?? 'none', goal: o.id })
    /* Seen before it is acted on: the row goes blue, then the card moves on. 260ms is the settle. */
    window.setTimeout(() => onDone?.(), 260)
  }

  const row = (picked: boolean) =>
    'tap-target flex w-full flex-col gap-1 rounded border px-4 py-3 text-left transition ' +
    (picked
      ? 'border-accent bg-accent text-accent-ink'
      : 'border-line ' +
        (onSand ? 'bg-bg-elev text-fg hover:border-accent/50' : 'bg-[rgba(12,14,18,0.88)] text-white'))

  return (
    <div data-testid="visiting" className="flex flex-col gap-6">
      {lead ? (
        <button
          type="button"
          data-testid={'setup-why-' + lead.id}
          aria-pressed={chosen === lead.id}
          onClick={() => pick(lead)}
          /*
            THE YES IS SOLID BEFORE IT IS PRESSED, which is what leading means.

            Every other row is a choice drawn as an object; this one is drawn as the answer
            most people will give. Pressed, it gains the ring rather than changing colour,
            so the acknowledgement still reads.
          */
          className={
            'tap-target flex w-full flex-col gap-1 rounded border border-accent bg-accent px-4 py-6 text-left text-accent-ink transition ' +
            (chosen === lead.id ? 'ring-2 ring-white' : '')
          }
        >
          <span className="display text-2xl">{VISITING.yes}</span>
          <span className="text-sm opacity-80">{VISITING.yes_sub}</span>
        </button>
      ) : null}
      <div className="flex flex-col gap-3">
        <p className={'eyebrow ' + (onSand ? 'text-muted' : 'text-white/80')}>{VISITING.or}</p>
        <ul className="flex flex-col gap-1">
          {rest.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                data-testid={'setup-why-' + o.id}
                aria-pressed={chosen === o.id}
                onClick={() => pick(o)}
                className={row(chosen === o.id)}
              >
                <span className="display text-base">{o.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

