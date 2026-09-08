'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { setAvatarFromFile } from '@/engine/avatar'
import { chapterById } from '@/content/chapters'
import { roomsFor } from '@/content/feed'
import { CLUB } from '@/content/club'
import { EXPLAINER_CTA } from '@/content/explainers'
import { PAIR_STEP } from '@/content/front-door'
import { GOAL_QUESTION } from '@/content/profile'
import { track } from '@/engine/analytics'
import {
  acceptDeal,
  loadLearner,
  resetLearnerCache,
  setDisplayName,
  setProfile,
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
/*
  Where left. It is card three now, in components/Destination.tsx.

  Asking it here meant eight screens of argument were written about a city nobody had
  chosen — the drops card could not say what was on, the rooms card could not name rooms.
  Asked early it costs one tap and makes every card after it true of somewhere specific.
*/
type Step = 'why' | 'who'

export function SetUp({ onDone }: { onDone?: () => void } = {}) {
  const [step, setStep] = useState<Step>('why')
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  /*
    MOUNTED FIRST, because the server cannot know any of this.

    `typeof window !== 'undefined'` inside a render is a hydration bug wearing a guard. The
    server has no localStorage, so it rendered the WHY question; the browser hydrated a
    frame later with the answer to hand and swapped to the done state. The question appeared
    and vanished — reported, exactly, as "these missing screens may be flashing up and
    disappearing". Feed already answers this the right way (`if (!mounted) return []`) and
    this card should answer it the same way rather than invent a second habit.
  */
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  /*
    ALREADY MEANS ASKED, not merely agreed.

    This read the deal and nothing else, and the deal is the oldest of the three marks —
    every record written before why and who moved into this card carries it. So a learner
    who had never been asked anything was shown the answer screen: "Then this is your
    Lisbon", over a room list built from a null purpose, which is why it offered a
    launderette and a table for two in the same breath. Those rooms were the tell. A card
    may only claim to be finished about questions it actually put.
  */
  const already = useMemo(() => {
    if (!mounted) return false
    const me = loadLearner()
    /*
      ASKED, not filtered.

      This read `purpose`, which was the same thing while every answer set one. It is not
      any more: "no reason, I just like it" deliberately sets no purpose, because somebody
      who has made no claim about the city should see all of it. Measured on purpose, that
      learner would be asked the question again forever.

      `goal` is written by all five answers, so it is the honest record of "this was asked
      and answered".
    */
    return Boolean(me.deal_accepted_at) && Boolean(me.profile?.goal)
  }, [mounted])

  /*
    Five of them, and five is a judgement rather than a round number.

    Fewer than four reads as a thin product; more than five stops being a promise and starts
    being an inventory somebody has to read. They are taken from the front of the filtered
    list, which is the order the feed will actually show them in — so this is a preview, not
    a sample.
  */
  const topics = useMemo(() => {
    if (!mounted) return []
    const me = loadLearner()
    if (!me.deal_accepted_at && !done) return []
    return roomsFor(me.chapter ?? undefined, me.purpose ?? null)
      .filter((c) => c.kind === 'situation')
      .slice(0, 5)
      .map((c) => (c.kind === 'situation' ? c.situation.title : ''))
      .filter(Boolean)
  }, [done, mounted])

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

  /*
    Nothing at all until the record has been read.

    Rendering the question and then withdrawing it IS the flash. A card that is one frame
    late is never noticed; a card that asks who you are and snatches it back is the only
    thing anybody remembers about it.
  */
  if (!mounted) return <div className="flex flex-col gap-6" />

  /*
    The learner's city, so the question names the place they are actually going.

    It was typed into the copy, in two files, which is two places to forget the day Porto
    opens. chapterById falls back to the default — Lisbon, and the only open chapter — so
    this reads correctly before anybody has chosen as well as after.

    Read HERE and not at the top, because the top is before mount and reading the record
    during a render the server also performs is the bug this file just fixed.
  */
  const city = chapterById(loadLearner().chapter).city

  if (already || done) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-accent">{PAIR_STEP.eyebrow}</p>
          <h2 className="display text-balance text-2xl">{'Then this is your ' + city + '.'}</h2>
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
        {step === 'why' ? (
          <>
            <h2 className="display text-balance text-2xl">{CLUB.welcome.ask_headline(city)}</h2>
            {/*
              The orphan's framing, which was the better half of it.

              "There is no wrong answer, and the last one is a real one" exists because the
              fifth option is "no reason, I just like it" and somebody scanning five reasons
              needs telling that one counts. It arrived with the question; it comes with it.
            */}
            <p className="text-sm italic leading-relaxed text-muted">{GOAL_QUESTION.askerLine}</p>
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
        WHY. The three, described by what they contain rather than by how long somebody is
        staying — "a season" means nothing until you know it means the café that starts
        recognising you.
      */}
      {step === 'why' ? (
        <ul className="flex flex-col gap-3">
          {GOAL_QUESTION.options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                data-testid={'setup-why-' + o.id}
                onClick={() => {
                  /*
                    ONE ANSWER, TWO RECORDS, and that is the whole merge.

                    `purpose` is what the product runs on — feedFor builds the Club from it,
                    cardFor picks the seven Legend frames from it. `goal` is what the proof
                    card reads. They were collected by two different questions on two
                    different screens, both of them asking why you are here.

                    Writing both here means nothing downstream changes and nothing gets
                    asked twice: nextProfileQuestion sees goal answered and never orphans
                    this question at the end of a vibe again.
                  */
                  if (o.purpose) setPurpose(o.purpose)
                  setProfile('goal', o.id)
                  track('purpose_chosen', { purpose: o.purpose ?? 'none', goal: o.id })
                  setStep('who')
                }}
                className="tap-target flex w-full flex-col gap-1 rounded border border-line px-4 py-3 text-left transition hover:border-accent/50"
              >
                <span className="display text-lg">{o.label}</span>
                {o.sub ? (
                  <span className="text-sm leading-relaxed text-muted">{o.sub}</span>
                ) : null}
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
          {/*
            Why it is worth giving, next to the fact that it costs nothing.

            "Optional and stays on this phone" is a reassurance and nothing else, so the
            honest answer to it is to skip. A reason to say yes belongs in the same breath
            as the reason not to worry.
          */}
          <p className="text-xs leading-relaxed text-muted">
            The photo is optional and stays on this phone. It will be useful when you start
            sharing with friends.
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

      {/*
        THE INVITATION TO SKIP IS GONE, and a reminder to answer stands where it was.

        "Keep swiping if you would rather look around first" sat under both questions, and
        it was the last thing on the screen — so the final word on the one card that shapes
        every other card was permission to ignore it. Purpose is what filters the Club and
        the name is what the Legend is built out of; a screen that shrugs at its own
        question gets shrugged at back.

        Nothing about the gate has changed. The card can still be swiped past, every call to
        action that needs an answer still routes back here, and this is still not a wall.
        What changed is that the product now says which answer it is waiting for instead of
        offering to do without it.
      */}
      {step === 'why' ? (
        <p className="text-xs leading-relaxed text-muted">
          Pick one to start. It is what decides which rooms the Club puts in front of you.
        </p>
      ) : null}
    </div>
  )
}
