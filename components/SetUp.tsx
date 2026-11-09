'use client'

import { Ground } from '@/components/Native'

import { Booker } from '@/components/Booker'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AVATARS, setAvatarFromFile, setAvatarFromPick } from '@/engine/avatar'
import { chapterById } from '@/content/chapters'
import { roomsFor } from '@/content/feed'
import { CONSENT } from '@/content/consent'
import { DOOR_CTA, EXPLAINER_CTA } from '@/content/explainers'
import { PAIR_STEP } from '@/content/front-door'
import {
  acceptDeal,
  answerLegendFromLesson,
  loadLearner,
  resetLearnerCache,
  setChapter,
  setDisplayName,
  rememberSetUp,
  syncSession,
  getLearner,
} from '@/engine/learner'
import { setPair } from '@/engine/pair'
import { applyBookingFromUrl } from '@/engine/booking'
import { useLearner } from '@/engine/useLearner'
import { MorningLineStep, canOfferPush } from '@/components/PushChoices'
import { pathLine } from '@/lib/push-plan'
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
  WHERE CAME BACK, and it is a write rather than a question again.

  It was moved out to a card of its own — WHERE TO, components/Destination.tsx — on the
  argument that eight screens of argument were being written about a city nobody had
  chosen. The fix map's eight screens do not include it: the sequence opens on the gesture
  tutorial and every card after it is about Lisbon, which is the only open chapter, so the
  tap was buying nothing.

  What matters is that the chapter is still RECORDED, because the feed reads it. Removing
  the card took `setChapter` with it and left the field null, which chapterById quietly
  falls back to Lisbon for — correct today and wrong the day a second city opens. finish()
  writes it explicitly now.

  THE QUESTION IS BACK, AND IT IS FIRST — because why and who both depend on it.

  It returned as a screen of its own after ONE DECISION, which put it in the right place in
  the sequence and the wrong place in the logic: the card's own form asks why and who
  BEFORE the sequence reaches it. So a person committed, answered two questions, and only
  then chose the language those answers were written in.

  The dependency is not theoretical. `ask_headline(city)` interpolates the city — "What
  brings you to Lisbon?" — and the who step says "the first thing you will say in
  Portuguese is your own name". Both name an answer the learner has not given.

  So it is a STEP rather than a screen: choose, then why, then who, inside one card. Sam:
  "move language selector to its logical slot so its dependants follow."
*/
/*
  AND NOW IT IS ONE QUESTION, "Visiting Lisbon?", with yes as the lead.

  The owner's call: DUB is for people visiting Lisbon, so visiting is the default and
  set-up should be short. The language and the city were confirmations of the only open
  answer, and the five reasons buried the common one. components/Destination.tsx `Visiting`
  writes all of it in one tap — pair, chapter, purpose, goal — and the same component sits
  on the set-up card's face in the feed, so the why step here is only met by somebody who
  reached set-up another way (the journey at /vibes).
*/
type Step = 'why' | 'who' | 'line'

export function SetUp({ onDone }: { onDone?: () => void } = {}) {
  const router = useRouter()
  /*
    Starts on `choose` unless the pair is already settled.

    A returning learner who has chosen once should not be asked again — `chosenPair()` is
    null only before the first answer, which is exactly the population this step is for.
    Read inside the initialiser rather than in an effect: it is a device fact, and the
    card already gates its whole render on `mounted`, so there is no hydration hazard.
  */
  const [step, setStep] = useState<Step>('why')
  /* The longer consent answer, open or folded. Starts folded — see the block that uses it. */
  const [terms, setTerms] = useState(false)
  /*
    THE CONSENT TICK, and it starts false because that is the whole point.

    Sam: "There is no actual positive consent action." GDPR recital 32 rules out silence,
    inactivity and PRE-TICKED boxes, so this can never be initialised true and can never be
    set by anything but the learner's own tap.
  */
  const [agreed, setAgreed] = useState(false)
  /* Shown only after somebody presses commit with something missing — never pre-emptively. */
  const [nudge, setNudge] = useState(false)
  const [name, setName] = useState('')
  /*
    THE TWO THINGS THIS SCREEN ACTUALLY NEEDS, named once so the button, the dimming and
    the message cannot disagree about what is outstanding.
  */
  const named = name.trim().length > 0
  const ready = named && agreed
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
  const [skipWhy, setSkipWhy] = useState(false)
  useEffect(() => {
    /*
      AND THE BOOKING PASS-THROUGH (2026-11-02), for a link that lands on set-up directly:
      ?purpose=visiting|staying|moving&depart=…&ret=… is written to the record here, before
      the first real render, so `shown` below reads the goal and opens on the name. /get
      does the same. Validated, and never over an answer — see engine/booking.ts.
    */
    applyBookingFromUrl()
    setSkipWhy(Boolean(getLearner().profile?.goal))
    setMounted(true)
  }, [])
  /*
    ANSWERED ON THE FACE, so the pane opens on the name.

    The feed's set-up card asks "Visiting Lisbon?" on its face and opens this pane once it
    is answered — and the pane is mounted with the card, long before the tap. So this reads
    the live record rather than a snapshot taken at mount: the moment the goal is written,
    the why step is behind us. Asking it again here would be the very repeat the face
    exists to remove.
  */
  const learner = useLearner()
  /*
    AND THE TRIP (2026-11-03): why · when & who with · name, the website's booking header in
    the same order. Answered on the website (dates or who with arrived on the link), it is
    behind us too.
  */
  /*
    ANSWERED BEFORE THIS SCREEN OPENED — on the website, or on an earlier visit — skips the
    booker. Read once at mount, not live: the booker writes the goal the moment "Find my
    route" is pressed, and a live read swapped it for the name step before the plane had
    left the ground (2026-11-03).
  */
  const shown: Step = step === 'why' && skipWhy ? 'who' : step

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
      AND THE CITY, which nothing was writing any more.

      The destination card wrote it — `setChapter(c.id)` next to `setPair` — and that card
      is not one of the eight screens. Removing it took the write with it silently: every
      other part of the record was still being set here, so set-up looked complete, and the
      chapter simply stayed null. A null chapter is not a crash, it is worse — chapterById
      falls back to Lisbon, so the product behaves correctly for the only open city and
      would start handing people the wrong one the moment a second city opens.

      Lisbon explicitly rather than the fallback, for the reason the pair is set explicitly
      one line above: a learner record should say what it is teaching rather than leave it
      to be inferred from a constant that may gain siblings. When there is a second open
      city this is where the question goes — on the card that already asks why and who,
      which is where the fix map moved it.
    */
    setChapter('lisbon')
    /*
      The record to read has just changed, so the cached one goes.

      Without this the next read returns whatever was in memory from the default pair, and
      the learner's work lands in the wrong record.
    */
    resetLearnerCache()
    if (name.trim()) {
      setDisplayName(name.trim())
      /*
        And the Legend's first card, which asks exactly this.

        Sam: "I am now asked my name, where I am from and age twice." The name is collected
        here, on the set-up screen, and the Legend's `name` frame asked for it again a few
        sittings later — so the deck opened on a blank where the product already knew the
        answer. See answerLegendFromLesson, which never overwrites a deliberate edit.
      */
      answerLegendFromLesson('name', { name: name.trim() })
    }
    /*
      And the deal, with the decision it qualifies.

      It was a screen of its own that nobody could reach except by being routed to it. What
      it actually asks — may we keep what you do — is a sentence, and a sentence belongs
      next to the thing it is about.
    */
    acceptDeal()
    /* And that this form has been answered, which is what ends the showcase. */
    rememberSetUp()
    setDone(true)
  }

  /*
    INTO THE PRODUCT: the record written, the server told, and through the door. Shared by
    the boarding button and, when it is offered, the morning-line step after it.
  */
  const board = () => {
    finish()
    void syncSession('set_up')
    if (onDone) onDone()
    else router.push('/club')
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
  /* The whole chapter, because consent names the COUNTRY and its own minimum age too. */
  const chapter = chapterById(loadLearner().chapter)
  const city = chapter.city

  /*
    `done` NO LONGER RENDERS THIS SCREEN, because nobody is meant to see it.

    Sam: "Just before you enter vibes for the first time an old screen that starts with a
    phone number that is yours pops up for a second then disappears."

    That is this branch. It is the "Rooms you will get because of what you just said"
    screen — the one removed from the button because it "reads as another decision at the
    exact moment the deciding is over" — and removing it from the button is all that
    happened. finish() still sets `done`, `done` still renders it, and the navigation that
    follows is a tick later: so the screen somebody asked to be rid of appears for exactly
    one frame on the way out, titled with whichever room the learner's answer put first.
    On `moving` that is "A phone number that is yours".

    `already` keeps it and that is a different screen doing a different job: somebody who
    has answered before meets this card in the feed and needs to be told they are done
    rather than asked again. Nothing about that flashes, because nothing navigates.

    So the condition loses the half that only ever renders on the way to somewhere else.
  */
  if (already) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-accent">{PAIR_STEP.eyebrow}</p>
          {/*
            THEN YOU START, where this card ends the intro.

            The two contexts want different sentences and it took the fix map to make that
            obvious. Inside /vibes the learner has just answered the purpose question and
            "Then this is your Lisbon." is the answer landing — it names the city back at
            them, which is the whole payoff of having asked.

            At the end of the intro nobody has answered anything. It is the eighth screen
            of a sequence somebody has swiped through, and the only thing left is to begin:
            the sentence has to be about them starting, not about a city they were never
            asked to choose. `onDone` is the tell — it exists only when the journey is
            asking — so the branch that navigates is the branch that closes the intro.

            The city line is not lost; it is still what /vibes says.
          */}
          <h2 className="display text-balance text-2xl">
            {onDone ? 'Then this is your ' + city + '.' : 'Then you start.'}
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            {topics.length
              ? 'Rooms you will get because of what you just said.'
              : 'The Club is waiting. Nothing else to decide.'}
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
          href="/club"
          data-testid="setup-go"
          className="tap-target eyebrow mt-10 block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
        >
          {/*
            INTO THE CLUB, because that is where a new member lands now.

            It said BUILD YOUR LEGEND and pointed at /vibes, back when the Legend was the
            price of the Club. The Legend is an optional card inside the Club now, and the
            Club opens on the visitor path — so the button goes there and says so.

            IT NAMES WHAT HAPPENS NEXT, rather than naming the door.

            This said OPEN, on the argument that the eighth screen of eight has finished
            arguing and one word is enough. What OPEN does not say is what is on the other
            side — and the other side is the basics, the first rung of the Legend, which is
            the thing the previous card has just promised gets you into the Club. Sam:
            change the CTA text to "Build Your Legend".

            EXPLAINER_CTA — "IT'S ALL ABOUT BUILDING YOUR LEGEND" — still serves the
            explainers, where a button has to argue. Here the argument is over and the
            button is an instruction, so it is the short imperative form of the same idea.
          */}
          {DOOR_CTA}
        </Link>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/*
        THE QUESTION GETS A PICTURE, because it is the one that decides the product.

        "What brings you to Lisbon?" chooses the purpose that feedFor builds the whole Club
        from, and it was five rows of text under a small eyebrow — the plainest screen in
        the intro carrying its largest consequence. Sam: add a header image behind the top
        section, the headline and the subtext.

        Behind rather than above: the eyebrow, the headline and both lines of body sit ON
        the photograph, which is what makes it a header rather than a decoration with a
        question underneath. The scrim is the same gradient the drop rooms use, for the
        same reason — white letters on a picture whose brightness nobody authored.

        `-mx-5 -mt-6` to reach the edges of the pane, which is padded; the photograph is
        full-bleed or it is a panel, and a panel would be the decoration again.

        WHY only. The who step is a name field and a photo picker, and a header image over
        a form is a header image in the way of a form.
      */}
      {/* The photograph header that asked "Visiting Lisbon?" went with the card it headed (2026-11-03). */}
      {/* The who step's header now lives on its own check-in card below (2026-11-03). */}

      {/*
        WHY. The three, described by what they contain rather than by how long somebody is
        staying — "a season" means nothing until you know it means the café that starts
        recognising you.
      */}
      {/*
        WHY, as one question with yes as the lead — see `Visiting` in Destination.tsx, which
        also sits on the set-up card's face. The 260ms settle and the testids moved with it.
      */}
      {/*
        THE BOOKER, not the "Visiting Lisbon?" card (Sam, 2026-11-03): why, when and who with
        on one boarding pass — components/Booker.tsx. Answered on the website, it is skipped.
      */}
      {shown === 'why' ? <Booker onDone={() => setStep('who')} /> : null}

      {/*
        WHO. A name, and the only one of the three that is optional.

        Where and why decide what the Club shows; a name decides nothing, it is simply
        yours. So this one may be left blank and the button still says GO — asking somebody
        to type before they have seen a single vibe is the kind of friction the whole
        restructure exists to remove.
      */}
      {shown === 'who' ? (
        /*
          CHECK-IN, AFTER THE BOOKER (Sam, 2026-11-03: "this screen looks really old hat now,
          let's elevate its design so it follows on naturally from the booking screen"). The
          same night ground and the same pass: the route they just booked rides along at the
          top, the name is the passenger name, the picture is the passport photo, and the
          consent is the last thing on the card before boarding. Consent is unchanged in
          substance — an unticked box only the learner's tap can tick — just set in the pass.
        */
        <div data-testid="checkin" className="booker -mx-5 -mt-6 min-h-svh px-5 pb-10 text-white" style={{ paddingTop: 'calc(2rem + var(--safe-top, env(safe-area-inset-top, 0px)))' }}>
          {/* Below the clock, and navy to the glass — the same as Booker and the morning-line step. */}
          <Ground color="#0f1f33" />
          <p className="eyebrow text-white/60">DUB · Check-in</p>
          <h1 className="display mt-2 text-3xl leading-tight">Passenger details</h1>
          <p className="mt-2 text-sm text-white/70">
            The first thing you will say in Portuguese is your own name. Tell us what to call you.
          </p>
          <div className="mt-6 overflow-hidden rounded-3xl bg-[#fbf8f2] text-[#14243a] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]">
            <RouteStrip />
            <div className="flex flex-col gap-5 px-5 pb-6 pt-5">
          <div className="flex items-end gap-4">
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
              className="tap-target relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-[#14243a]/25 bg-white"
              aria-label="Add a photo"
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="eyebrow flex h-full w-full flex-col items-center justify-center gap-1 text-center text-[0.6rem] text-[#14243a]/50">
                  <span aria-hidden className="text-lg leading-none">+</span>
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
              onChange={(e) => {
                setName(e.target.value)
                /* Typing answers the complaint, so the complaint goes. */
                if (e.target.value.trim()) setNudge(false)
              }}
              /*
                KEEP THE FIELD ON SCREEN WHEN THE KEYBOARD ARRIVES.

                Sam, with a screenshot of a wall of azulejo and the keyboard: "when I enter
                my name it pushes up to this half screen."

                iOS opens the keyboard and scrolls the page itself to reveal the focused
                field — and it is scrolling a page that got a lot taller when the consent
                block landed above this input, so it overshot and left the form off-screen
                entirely with the tiled ground filling the gap.

                One frame late on purpose: the browser does its own scroll first, and doing
                this in the same tick means fighting it rather than correcting it. `center`
                rather than `nearest` because the visual viewport has just halved and
                nearest is satisfied by a field at the very bottom edge, under the AutoFill
                bar.
              */
              onFocus={(e) => {
                const el = e.currentTarget
                window.setTimeout(() => {
                  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
                }, 260)
              }}
              /*
                THE PLACEHOLDER ASKS, rather than labelling the box.

                Sam: "Your name" → "What shall we call you?". The old one named the field,
                which a field that is plainly a name field under a heading that plainly
                asks for a name did not need. What it cost was the tone: everything else on
                this screen is somebody speaking to the person, and the one place they are
                asked to answer was a form label.

                It is also the more honest question of the two. What goes in here is what
                DUB will call them for as long as they use it — not their legal name, not
                the one on the card — and "what shall we call you" is the only phrasing
                that says so.
              */
              placeholder="Your first name"
              aria-label="Passenger name — what shall we call you?"
              className="tap-target display min-w-0 flex-1 border-0 border-b-2 border-[#14243a]/20 bg-transparent px-0 pb-2 pt-6 text-2xl text-[#14243a] placeholder:text-[#14243a]/30 focus:border-[#1f5c8f] focus:outline-none"
            />
          </div>
          {/*
            OR PICK ONE, which is the half of this question that was never offered.

            Sam, with an arrow at the photo circle: "Add Avatar selector option and provide
            a selection to choose from."

            The screen asked for a photograph and said it was optional, so the real choice
            on offer was a picture of your own face or nothing — and a great many people
            decline a camera on a product they met four minutes ago. The sentence
            underneath already explains what the picture is for, "useful when you start
            sharing with friends", and a blank circle is the one outcome that makes it
            untrue.

            Six marks rather than six people: see the note on AVATARS in engine/avatar.ts
            for why none of them is a face.

            UNDER THE FIELD, not beside it. The row above is one question — who are you —
            and the picture is how it is answered, so a second control inside that row
            would read as a second question. Here it reads as the alternative to the circle
            immediately above it, which is what it is.
          */}
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-[0.6rem] text-[#14243a]/50">No photo? Pick a mark</p>
            <ul data-testid="setup-avatars" className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    data-testid={'avatar-' + a.id}
                    aria-label={a.label}
                    aria-pressed={photo === a.svg}
                    onClick={() => setPhoto(setAvatarFromPick(a.id))}
                    className={
                      'tap-target h-11 w-11 overflow-hidden rounded-full border-2 transition ' +
                      (photo === a.svg ? 'border-[#1f5c8f] ring-2 ring-[#1f5c8f]/30' : 'border-transparent')
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.svg} alt="" className="h-full w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {/*
            Why it is worth giving, next to the fact that it costs nothing.

            "Optional and stays on this phone" is a reassurance and nothing else, so the
            honest answer to it is to skip. A reason to say yes belongs in the same breath
            as the reason not to worry.
          */}
          <p className="text-xs leading-relaxed text-[#14243a]/55">
            The picture is optional and stays on this phone. It will be useful when you
            start sharing with friends.
          </p>
        {/*
            WHAT THE BUTTON BELOW ACTUALLY AGREES TO, said before it is pressed.

            acceptDeal() has always fired inside finish(), and nothing on the screen said so.
            That is the one part of this that a lesson cannot carry: consent has to be
            informed and freely given BEFORE the thing it permits (GDPR Article 7), and a
            permission recorded by a button labelled BUILD YOUR LEGEND is neither.

            Four sentences and a way to read more, rather than a policy. The law asks for
            intelligible and easily accessible, not exhaustive — and a wall of text is the
            same as no text, because nobody reads it and everybody clicks through.

            Everything it claims is checked against what the code does: lib/store.ts strips
            the profile and the Legend on delete rather than orphaning them, and
            app/api/account/export already returns the lot. See content/consent.ts.
          */}
          </div>
          <div className="relative flex items-center" aria-hidden="true">
            <span className="absolute -left-3 h-6 w-6 rounded-full bg-[#0f1f33]" />
            <span className="mx-4 h-px flex-1 border-t-2 border-dashed border-[#14243a]/15" />
            <span className="absolute -right-3 h-6 w-6 rounded-full bg-[#0f1f33]" />
          </div>
          <div className="flex flex-col gap-3 px-5 pb-6 pt-4">
            <p className="eyebrow text-[0.6rem] text-[#14243a]/50">{CONSENT.eyebrow}</p>
            <p className="text-sm font-semibold">{CONSENT.headline}</p>
            {/*
              THE FIRST SENTENCE, AND THE REST BEHIND THE TAP.

              All four paragraphs plus the age line made this block taller than the form it
              sits under — measured at 300px of scroll on an iPhone 13, with the commit
              button below the fold before the keyboard was even open. Sam, with a
              screenshot of a wall of azulejo: "when I enter my name it pushes up to this
              half screen."

              Consent still has to be informed and given before the thing it permits, and
              it still is: the headline names what this is about, the first line is the
              load-bearing fact — nothing leaves the phone until you sign in — and the rest
              is one tap away on the same screen. An unreadable form is not more informed
              than a readable one.
            */}
            <p className="text-xs leading-relaxed text-muted">{CONSENT.body[0]}</p>
            {terms ? (
              <div className="animate-bank flex flex-col gap-3">
                {CONSENT.body.slice(1).map((line) => (
                  <p key={line} className="text-xs leading-relaxed text-muted">
                    {line}
                  </p>
                ))}
                <p className="text-xs leading-relaxed text-muted">
                  {CONSENT.age(chapter.country, chapter.consent_age)}
                </p>
              </div>
            ) : null}
            {/*
              The longer answer, folded away rather than linked away.

              A privacy policy behind a link is a page nobody opens and a tab that loses the
              set-up they were in the middle of. Opened in place it costs one tap and the
              screen is still there underneath.
            */}
            <button
              type="button"
              data-testid="consent-more"
              onClick={() => setTerms((t) => !t)}
              aria-expanded={terms}
              className="tap-target self-start text-xs text-accent underline"
            >
              {terms ? 'Fold that away' : CONSENT.more}
            </button>
            {terms ? (
              <div className="animate-bank flex flex-col gap-3">
                {CONSENT.detail.map((d) => (
                  <div key={d.q} className="flex flex-col gap-1">
                    <p className="text-xs font-semibold">{d.q}</p>
                    <p className="text-xs leading-relaxed text-muted">{d.a}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {/*
              THE AFFIRMATIVE ACT ITSELF.

              Sam: "There is no actual positive consent action." Before this, acceptDeal()
              fired inside finish() — so the permission was recorded by a button that says
              THAT IS ME, which is an affirmative act about the learner's NAME and not about
              their data. GDPR Article 4(11) wants a statement or a clear affirmative
              action, and recital 32 rules out silence, inactivity and pre-ticked boxes.

              A real checkbox, unticked, that the commit button waits for. It sits INSIDE
              the consent block rather than next to the button, so what is being agreed to
              is the thing directly above it.
            */}
            <label className="tap-target flex cursor-pointer items-start gap-3 pt-1">
              <input
                type="checkbox"
                data-testid="consent-tick"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked)
                  /* Only clears the complaint if it was the LAST thing outstanding. */
                  if (e.target.checked && named) setNudge(false)
                }}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#1f5c8f]"
              />
              <span className="text-sm font-semibold leading-snug">{CONSENT.tick}</span>
            </label>
          </div>
          {/*
            SAID ONLY AFTER A REFUSED PRESS. A message that appears before anybody has done
            anything wrong is an error message about nothing.
          */}
          </div>
          {nudge && !ready ? (
            <p
              id="consent-wait"
              data-testid="consent-nudge"
              role="status"
              className="animate-bank mt-4 text-center text-sm text-[#e5b04a]"
            >
              {/* Which one is missing, rather than a single message for two faults. */}
              {!named && !agreed
                ? CONSENT.bothNudge
                : !named
                  ? CONSENT.namelessNudge
                  : CONSENT.untickedNudge}
            </p>
          ) : null}
          <button
            type="button"
            data-testid="setup-commit"
            /*
              NOT aria-disabled, WHICH MADE THIS A WALL.

              aria-disabled="true" was here to say "not yet" to a screen reader, and the
              intent was the comment below: dimmed, not disabled, so the press still lands
              and still explains itself. But browsers and assistive tech treat
              aria-disabled as disabled — the click never reached the handler, so the
              nudge never rendered and the button was simply dead. A learner who had not
              spotted the tick box had no way off the name screen at all, which is worse
              than the missing consent it was added to fix.

              aria-describedby instead: the button is real, it works, and the reason it is
              waiting is announced with it.
            */
            aria-describedby={ready ? undefined : 'consent-wait'}
            onClick={() => {
              /*
                TWO GATES, NOT ONE. Pressing with either missing says which, rather than
                doing nothing — a dead button teaches nobody anything.

                The name was never gated at all: finish() wrote it only `if (name.trim())`
                and let an empty one straight through, so a learner arrived with
                display_name "" and an empty legend. See CONSENT.namelessNudge.
              */
              if (!ready) {
                setNudge(true)
                return
              }
              /*
                THE MORNING LINE FIRST, where this phone can have it (Sam, 2026-11-04): one
                more screen on the pass, then board. See MorningLineStep.
              */
              if (canOfferPush()) {
                setStep('line')
                window.scrollTo(0, 0)
                return
              }
              finish()
              /*
                STRAIGHT INTO THE PRODUCT, with no confirmation screen in between.

                Sam, on the screen this used to land on: "remove this screen, it confuses."
                It showed "Then you start." over a list of room titles under the line
                "Rooms you will get because of what you just said" and an OPEN button —
                which reads as another decision at the exact moment the deciding is over.
                Worse, it repeats the headline of the card the person is already on, so it
                looks as though the tap did nothing.

                The rooms are not lost. They ARE the feed the learner lands in, which is a
                better way of showing what the answer bought than a list of their names.

                `onDone` still wins where it exists: inside /vibes the journey owns what
                happens next and there is nowhere to navigate to.
              */
              /*
                AND THE SERVER FINDS OUT SOMEBODY STARTED.

                Sam: "My real concern is that they see value in the ongoing club content."
                You cannot answer that without knowing who came back, and you cannot know
                who came back without knowing who arrived.

                MEASURED: this component had NO syncSession call at all. `set_up_at` was
                written to the phone by finish() and reached Postgres only if the learner
                later tapped into a vibe — engine/journey.tsx fires culture_chosen there.
                So the drop-off that matters most, the people who finish set-up and never
                start, was the one population invisible to the server. A hundred strangers
                at a festival could finish this screen and the record would show nothing.

                `void` and not awaited, for the same reason every other call site does it:
                this runs on the tap that leaves the screen, and a learner must never wait
                on a network round trip to start learning. It fails silently offline, which
                is correct — the blob syncs again on the next beat that calls this.
              */
              void syncSession('set_up')
              /*
                INTO THE CLUB, not the shelf. A new member lands on the visitor path —
                arrive, coffee and food, get about, see the city, when it goes wrong — and
                the vibes are a side door from there rather than the first thing they meet.
              */
              if (onDone) onDone()
              else router.push('/club')
            }}
            className={
              'tap-target eyebrow mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#e5b04a] px-5 py-4 text-base text-[#14243a] shadow-[0_6px_0_0_rgba(0,0,0,0.35)] transition active:translate-y-[4px] active:shadow-none ' +
              /* Dimmed, not disabled: it still takes the press and says what is missing. */
              (ready ? '' : 'opacity-50')
            }
          >
            Board · that is me
          </button>
        </div>
      ) : null}

      {shown === 'line' ? <MorningLineStep line={pathLine(learner, [], true)} onDone={board} /> : null}
    </div>
  )
}

/**
 * The route just booked, riding along at the top of the check-in card, so the second
 * screen reads as the same journey as the first: EN ✈ LIS, and what the booker heard.
 */
const REASON_SHORT: Record<string, string> = {
  trip: 'A trip',
  someone: 'Someone I love',
  moving: 'Moving there',
  work: 'Work',
  curious: 'Just because',
}
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function RouteStrip() {
  const learner = useLearner()
  const p = learner.profile
  const d = (iso: string) => {
    const x = new Date(iso + 'T12:00:00Z')
    return x.getUTCDate() + ' ' + MONTHS_SHORT[x.getUTCMonth()]
  }
  const bits = [
    p?.goal ? REASON_SHORT[p.goal] : null,
    p?.here_from ? d(p.here_from) + (p.here_to ? ' – ' + d(p.here_to) : '') : null,
  ].filter(Boolean)
  return (
    <div data-testid="checkin-route" className="flex items-center justify-between gap-3 bg-[#14243a] px-5 py-3 text-white">
      <span className="flex items-center gap-2">
        <span className="display text-xl leading-none">EN</span>
        <svg viewBox="-16 -11 31 22" className="h-4 w-6 text-[#e5b04a]" aria-hidden="true">
          <path d="M14 0 Q13 -1.6 10 -1.6 L2 -1.6 L-5 -10 L-8.5 -10 L-3 -1.6 L-10 -1.6 L-13 -5.5 L-15.5 -5.5 L-14 -1 L-14 1 L-15.5 5.5 L-13 5.5 L-10 1.6 L-3 1.6 L-8.5 10 L-5 10 L2 1.6 L10 1.6 Q13 1.6 14 0 Z" fill="currentColor" />
        </svg>
        <span className="display text-xl leading-none text-[#9cc6ea]">{chapterById(learner.chapter).code}</span>
      </span>
      <span className="truncate text-right text-xs text-white/70">{bits.join(' · ') || chapterById(learner.chapter).pt}</span>
    </div>
  )
}
