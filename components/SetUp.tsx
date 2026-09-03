'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { setAvatarFromFile } from '@/engine/avatar'
import { CHAPTERS } from '@/content/chapters'
import { roomsFor } from '@/content/feed'
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

export function SetUp({ onDone }: { onDone?: () => void } = {}) {
  const [step, setStep] = useState<Step>('where')
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const already = typeof window !== 'undefined' && Boolean(loadLearner().deal_accepted_at)

  /*
    Five of them, and five is a judgement rather than a round number.

    Fewer than four reads as a thin product; more than five stops being a promise and starts
    being an inventory somebody has to read. They are taken from the front of the filtered
    list, which is the order the feed will actually show them in — so this is a preview, not
    a sample.
  */
  const topics = useMemo(() => {
    if (typeof window === 'undefined') return []
    const me = loadLearner()
    if (!me.deal_accepted_at && !done) return []
    return roomsFor(me.chapter ?? undefined, me.purpose ?? null)
      .filter((c) => c.kind === 'situation')
      .slice(0, 5)
      .map((c) => (c.kind === 'situation' ? c.situation.title : ''))
      .filter(Boolean)
  }, [done])

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
          <h2 className="display text-balance text-2xl">Then this is your Lisbon.</h2>
          <p className="text-sm leading-relaxed text-muted">
            {topics.length
              ? 'Rooms you will get because of what you just said.'
              : 'Three vibes are waiting. Nothing else to decide.'}
          </p>
        </div>

        {/*
          WHAT THE ANSWER BOUGHT, said back in the learner's own Club.

          Purpose filtered the feed in total silence: somebody answered "I am here for a few
          days", the Club quietly became a different Club, and nothing told them. This is the
          moment the question visibly pays, and it is the only place in the product where a
          person can see that answering did anything at all.

          THE TITLES ARE REAL. They come from roomsFor with this learner's own chapter and
          purpose — the same call the feed makes — so they are not a promise about content,
          they are the content, listed. Inventing topic names would make this the one screen
          in DUB that could go out of date without anybody editing it.
        */}
        {topics.length ? (
          <ul data-testid="setup-topics" className="flex flex-col gap-1">
            {topics.map((t) => (
              <li
                key={t}
                className="rounded border border-line bg-bg-elev px-4 py-3 text-sm"
              >
                {t}
              </li>
            ))}
          </ul>
        ) : null}
        {/*
          Continue in place when the journey is asking, navigate when the Club is.

          The same card serves both, because the alternative was two components asking one
          question and that is the thing this whole change removed. Inside /vibes there is
          nowhere to go — they are already where the link points.
        */}
        {onDone ? (
          <button
            type="button"
            data-testid="setup-go"
            onClick={onDone}
            className="tap-target eyebrow mt-10 block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            {EXPLAINER_CTA}
          </button>
        ) : (
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
        )}
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
              to it. A photo if you want one.
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
          <div className="flex items-center gap-3">
            {/*
              The photograph, and it never leaves this phone.

              engine/avatar.ts keeps it in its own storage key rather than on the learner,
              because the learner blob is posted to /api/session and merged across every row
              somebody owns — putting a face on it would quietly ship that face to a server
              with no use for it. Nothing in DUB needs this off the device, so nothing takes
              it off the device.

              The consequence is worth knowing rather than hiding: it does not survive a new
              phone. That is the honest trade for not holding somebody's face.
            */}
            <label
              className="tap-target relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-line bg-bg-elev"
              aria-label="Add a photo"
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs text-muted">
                  PHOTO
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                data-testid="setup-photo"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (f) setPhoto(await setAvatarFromFile(f))
                }}
              />
            </label>
            <input
              type="text"
              inputMode="text"
              autoComplete="given-name"
              data-testid="setup-who"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="tap-target min-w-0 flex-1 rounded border border-line bg-bg-elev px-4 py-3 text-base text-fg placeholder:text-muted"
            />
          </div>
          <p className="text-xs leading-relaxed text-muted">
            The photo is optional and stays on this phone.
          </p>
          <button
            type="button"
            data-testid="setup-commit"
            onClick={() => {
              finish()
              onDone?.()
            }}
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
