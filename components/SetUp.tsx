'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CHAPTERS } from '@/content/chapters'
import { CLUB } from '@/content/club'
import { EXPLAINER_CTA } from '@/content/explainers'
import { PAIR_STEP } from '@/content/front-door'
import { PURPOSES } from '@/content/situations'
import { track } from '@/engine/analytics'
import {
  acceptDeal,
  loadLearner,
  resetLearnerCache,
  setChapter,
  setDisplayName,
  setPurpose,
} from '@/engine/learner'
import { setPair } from '@/engine/pair'
import { DEFAULT_PAIR } from '@/content/pairs'

/**
 * Set-up: who, where and why, asked before any content is tailored to them.
 *
 * WHY ALL THREE, AND WHY HERE. This card asked for a language and nothing else, and the
 * three questions that actually shape the product were scattered — the city was a
 * parameter with no question attached, the purpose was a full screen at the top of the
 * Legend five vibes later, and the name was an onBlur on a text field in Yours that
 * nothing links to. So the Club could not tailor anything, because at the moment it
 * builds a feed it knows none of it.
 *
 * That was my error and it is worth writing down: the note that produced this design read
 * "you are assuming the person is planning to learn Portuguese and visit Lisbon before we
 * have asked them anything", and I took it to mean DO NOT ASK. It means DO NOT ASSUME —
 * ask. The generic feed in front of this card is generic precisely because these three
 * questions have not been answered yet; answering them is what turns it into somebody's.
 *
 * WHY IT IS STILL NOT A WALL. Nothing gates the scroll. The card sits seventh, can be
 * swiped past forever, and every call to action that needs an answer routes back here.
 * You may browse as long as you like; you cannot start a vibe sideways.
 *
 * WHY THE LANGUAGE QUESTION WENT. It was the one question whose answer was already
 * determined: every chapter in CHAPTERS carries the same pair, so choosing Lisbon chooses
 * pt-PT. Asking twice for one answer is a form, not a decision.
 */
type Step = 'where' | 'why' | 'who'

export function SetUp() {
  const [step, setStep] = useState<Step>('where')
  const [name, setName] = useState('')
  const [done, setDone] = useState(false)

  const already = typeof window !== 'undefined' && Boolean(loadLearner().deal_accepted_at)

  const finish = () => {
    /*
      The pair, derived rather than asked.

      Every chapter is on DEFAULT_PAIR today. Setting it explicitly rather than relying on
      the default keeps the record self-describing — a learner row should say what it is
      teaching, not leave it to be inferred from a constant that may gain siblings.
    */
    setPair(DEFAULT_PAIR)
    /*
      The record to read has just changed, so the cached one goes.

      Without this the next read returns whatever was in memory from the default pair, and
      the learner's work lands in the wrong record.
    */
    resetLearnerCache()
    if (name.trim()) setDisplayName(name.trim())
    /*
      And the deal, with the decision it qualifies.

      It was a screen of its own that nobody could reach except by being routed to it. What
      it actually asks — may we keep what you do — is a sentence, and a sentence belongs
      next to the thing it is about.
    */
    acceptDeal()
    setDone(true)
  }

  if (already || done) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-accent">{PAIR_STEP.eyebrow}</p>
          <h2 className="display text-balance text-2xl">You are set up.</h2>
          <p className="text-sm leading-relaxed text-muted">
            Three vibes are waiting. Nothing else to decide.
          </p>
        </div>
        <Link
          href="/vibes"
          data-testid="setup-go"
          className="tap-target eyebrow mt-10 block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
        >
          {/*
            The shared constant, not a second copy of the same sentence.

            Written out here it was flagged as a 26-character eyebrow — which it is not, it
            is a full-width button that happens to use the eyebrow's typography. The right
            fix is not to appease the rule but to stop having two spellings of the one call
            to action: every explainer already points here with this exact string.
          */}
          {EXPLAINER_CTA}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-accent">{PAIR_STEP.eyebrow}</p>
        {step === 'where' ? (
          <>
            <h2 className="display text-balance text-2xl">Where do you want DUB to take you?</h2>
            <p className="text-sm leading-relaxed text-muted">
              One is built. The other is honest about not being — nothing here will take your
              email and promise to let you know.
            </p>
          </>
        ) : step === 'why' ? (
          <>
            <h2 className="display text-balance text-2xl">{CLUB.welcome.ask_headline}</h2>
            <p className="text-sm leading-relaxed text-muted">{CLUB.welcome.ask_body}</p>
          </>
        ) : (
          <>
            <h2 className="display text-balance text-2xl">And what do they call you?</h2>
            <p className="text-sm leading-relaxed text-muted">
              The first thing you will say in Portuguese is your own name. This is the answer
              to it.
            </p>
          </>
        )}
      </div>

      {/*
        WHERE. Two chapters, one open, and the closed one named honestly as closed.

        Listed rather than hidden because somebody deciding whether this is for them is owed
        the shape of the plan — and a disabled row must never become an email capture.
      */}
      {step === 'where' ? (
        <ul className="flex flex-col gap-3">
          {CHAPTERS.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                data-testid={'setup-where-' + c.id}
                disabled={!c.open}
                onClick={() => {
                  setChapter(c.id)
                  track('chapter_chosen', { chapter: c.id })
                  setStep('why')
                }}
                className={
                  'tap-target flex w-full items-center justify-between gap-3 rounded border px-4 py-3 text-left transition ' +
                  (c.open ? 'border-line hover:border-accent/50' : 'border-line/40 bg-surface/30 opacity-40')
                }
              >
                <span className="flex flex-col gap-1">
                  <span className="display text-lg">{c.city}</span>
                  <span className="text-sm text-muted">{c.country}</span>
                </span>
                {c.open ? null : <span className="eyebrow shrink-0 text-muted">NOT OPEN</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/*
        WHY. The three, described by what they contain rather than by how long somebody is
        staying — "a season" means nothing until you know it means the café that starts
        recognising you.
      */}
      {step === 'why' ? (
        <ul className="flex flex-col gap-3">
          {PURPOSES.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                data-testid={'setup-why-' + p.id}
                onClick={() => {
                  setPurpose(p.id)
                  track('purpose_chosen', { purpose: p.id })
                  setStep('who')
                }}
                className="tap-target flex w-full flex-col gap-1 rounded border border-line px-4 py-3 text-left transition hover:border-accent/50"
              >
                <span className="display text-lg">{p.label}</span>
                <span className="text-sm leading-relaxed text-muted">{p.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/*
        WHO. A name, and the only one of the three that is optional.

        Where and why decide what the Club shows; a name decides nothing, it is simply
        yours. So this one may be left blank and the button still says GO — asking somebody
        to type before they have seen a single vibe is the kind of friction the whole
        restructure exists to remove.
      */}
      {step === 'who' ? (
        <>
          <input
            type="text"
            inputMode="text"
            autoComplete="given-name"
            data-testid="setup-who"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="tap-target w-full rounded border border-line bg-bg-elev px-4 py-3 text-base text-fg placeholder:text-muted"
          />
          <button
            type="button"
            data-testid="setup-commit"
            onClick={finish}
            className="tap-target eyebrow mt-10 w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            THAT IS ME
          </button>
        </>
      ) : null}

      <p className="text-xs leading-relaxed text-muted">
        Keep swiping if you would rather look around first. This will be here.
      </p>
    </div>
  )
}
