'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { setAvatarFromFile } from '@/engine/avatar'
import { chapterById } from '@/content/chapters'
import { IMAGE_BANK } from '@/content/images'
import { roomsFor } from '@/content/feed'
import { CLUB } from '@/content/club'
import { CONSENT } from '@/content/consent'
import { DOOR_CTA, EXPLAINER_CTA } from '@/content/explainers'
import { PAIR_STEP } from '@/content/front-door'
import { GOAL_QUESTION } from '@/content/profile'
import { track } from '@/engine/analytics'
import {
  acceptDeal,
  answerLegendFromLesson,
  loadLearner,
  resetLearnerCache,
  setChapter,
  setDisplayName,
  setProfile,
  setPurpose,
  rememberSetUp,
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
type Step = 'why' | 'who'

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
    WHICH REASON WAS TAPPED, held for as long as it takes to see it.

    The five reasons were a list of outlined rows that advanced the moment one was pressed,
    so the answer was never shown to the person who gave it — the screen simply changed.
    Sam, on the screenshot: the selected button should turn blue and the card should then
    fire to the next screen on its own.

    Both, in that order, which is the only order in which the first one means anything. The
    row goes blue, and 260ms later — the product's own settle duration, not a number picked
    here — the step advances. Long enough to register as acknowledgement, short enough that
    nobody waits for it.

    Null while nothing is chosen, and it stays set through the transition rather than being
    cleared, so the row does not flicker back to its outline on the way out.
  */
  const [chosenWhy, setChosenWhy] = useState<string | null>(null)
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
  useEffect(() => {
    setMounted(true)
  }, [])

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
      {step === 'why' ? (
        <div className="relative -mx-5 -mt-6 overflow-hidden on-dark">
          <Image
            src={IMAGE_BANK.intro_arrival.src}
            alt={IMAGE_BANK.intro_arrival.alt}
            width={896}
            height={504}
            sizes="(max-width: 448px) 100vw, 448px"
            className="h-full w-full object-cover"
            style={{ position: 'absolute', inset: 0 }}
            priority
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgb(0 0 0 / 0.30) 0%, rgb(0 0 0 / 0.68) 100%)',
            }}
          />
          <div
            className="relative flex flex-col gap-3 px-5 py-6 text-white"
            style={{ textShadow: '0 1px 12px rgb(0 0 0 / 0.5)' }}
          >
            <p className="eyebrow text-white/80">{PAIR_STEP.eyebrow}</p>
            <h2 className="display text-balance text-2xl">{CLUB.welcome.ask_headline(city)}</h2>
            <p className="text-sm italic leading-relaxed text-white/85">
              {GOAL_QUESTION.askerLine}
            </p>
            <p className="text-sm leading-relaxed text-white/85">{CLUB.welcome.ask_body}</p>
          </div>
        </div>
      ) : null}
      {/*
        The who step keeps the plain heading. Its header is a form, and the photograph
        above belongs to the question that earns one — see the note on it.

        The orphan's framing that used to sit here — "there is no wrong answer, and the
        last one is a real one" — has moved onto the photograph with the rest of the why
        step, where the question it belongs to is.
      */}
      {step === 'why' ? null : (
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-accent">{PAIR_STEP.eyebrow}</p>
          <h2 className="display text-balance text-2xl">And what do they call you?</h2>
          <p className="text-sm leading-relaxed text-muted">
            The first thing you will say in Portuguese is your own name. This is the answer
            to it. A photo if you want one.
          </p>
        </div>
      )}

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
                    The answer is shown before it is acted on — see chosenWhy above.
                  */
                  setChosenWhy(o.id)
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
                  /*
                    260ms is the settle on the product's motion scale, so the acknowledgement
                    lasts exactly as long as every other thing that settles here.
                  */
                  window.setTimeout(() => setStep('who'), 260)
                }}
                className={
                  'tap-target flex w-full flex-col gap-1 rounded border px-4 py-3 text-left transition ' +
                  (chosenWhy === o.id
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-line hover:border-accent/50')
                }
              >
                <span className="display text-lg">{o.label}</span>
                {o.sub ? (
                  <span
                    className={
                      'text-sm leading-relaxed ' +
                      (chosenWhy === o.id ? 'opacity-80' : 'text-muted')
                    }
                  >
                    {o.sub}
                  </span>
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
          <div className="flex flex-col gap-3 rounded border border-line bg-bg-elev p-4">
            <p className="eyebrow text-accent">{CONSENT.eyebrow}</p>
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
          </div>
          <button
            type="button"
            data-testid="setup-commit"
            onClick={() => {
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
              if (onDone) onDone()
              else router.push('/vibes')
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
