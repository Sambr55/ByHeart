'use client'

import { SayButton, useCanListen } from '@/components/SayButton'
import { bandFor, missedWords, type Heard } from '@/engine/listen'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CRATES, PIECES, ROOTS, ROOTS_BY_FAMILY } from '@/content/roots'
import { DOORWAY, LEGEND_CARD, LEGEND_COPY, LEGEND_FRAMES, LEGEND_PARTS, askFor, frameReady, nameFor, cardDone, cardFor, doorwayRoots, doorwayToGo, fillEnglish, fillFrame, frameApplies, frameForPurpose, frameFor, isAnswered, legendStatus, parseChildren, metIn,
  provenanceOf, knownValues, readableFrame, type Child, type LegendFrame, type LegendSlot } from '@/content/legend'
import { PICKER } from '@/content/front-door'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { AudioButton } from '@/components/AudioButton'
import { CopyButton } from '@/components/CopyButton'
import { NumberPicker } from '@/components/NumberPicker'
import { Back } from '@/components/Back'
import { Dock, Framed } from '@/components/Dock'
import { MiniBuild } from '@/components/Journey'
import { Wordmark } from '@/components/Wordmark'
import { slugFor } from '@/content/audio-manifest'
import { track } from '@/engine/analytics'
import {
  acquirePiece,
  answerLegend,
  answerLegendFromLesson,
  clearRough,
  markRough,
  recordProof,
} from '@/engine/learner'
import { wordsIn } from '@/content/numbers'
import { useLearner } from '@/engine/useLearner'
import { useRestore } from '@/engine/useRestore'

/**
 * Your Legend.
 *
 * A deck of answers to the questions you will actually be asked, not a monologue —
 * because nobody delivers a paragraph at a bar, and a memorised speech collapses the
 * moment somebody asks you something slightly different. Answers survive contact.
 *
 * It is never a blank form. It starts at whatever the learner's language already reaches,
 * which after one crate is one or two cards, and grows as the crates feed it. And no card
 * is required: some people have no children and some will not say why they left, so an
 * empty card simply is not in the run-through — never a gap, never a prompt to complete
 * it.
 */
type Mode = 'deck' | { build: string } | 'rehearse' | 'cold'

export function Legend() {
  const learner = useLearner()
  /* Signed in on another surface? Pull it back. See useRestore. */
  useRestore()
  const [mode, setMode] = useState<Mode>('deck')
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    // ?cold=1 lands straight in a cold open — from the Club, from the daily line, from a
    // notification. Read from the URL after mount rather than useSearchParams, so this
    // page needs no Suspense boundary.
    const q = new URLSearchParams(window.location.search)
    if (q.get('cold') === '1') setMode('cold')
    /* ?run=1 is the same run-through the deck's own button starts, reachable from Yours —
       where the daily practice is actually offered. Same mode, one entry point nearer. */
    if (q.get('run') === '1') setMode('rehearse')
    /*
      ?build=<frame> lands straight on one question, and it has one caller: the screen at
      the end of a vibe that says this question just opened. ANSWER IT has to arrive at
      the question it named — sending somebody to the deck to hunt for it would undo the
      whole point of announcing it.

      Checked against the frames that exist, so a stale link degrades to the deck rather
      than to a build screen for nothing.
    */
    const build = q.get('build')
    if (build && LEGEND_FRAMES.some((f) => f.id === build)) setMode({ build })
  }, [])

  const owned = useMemo(
    () => Object.keys(learner.inventory ?? {}).filter((id) => PIECES[id]),
    [learner.inventory],
  )
  const answers = learner.legend ?? []

  /*
    WHAT THE LESSONS ALREADY LEARNED, WRITTEN ONTO THE CARD.

    Sam: "the first question of the legend is still coming through not populated when the
    user has already asked these questions." His screenshot is the origin card, blank,
    with both halves of the answer sitting on his profile.

    The lessons DO write the Legend — answerLegendFromLesson, on the tap that answers —
    but only when the tap happens. AskOrigin collapses to a one-line confirmation the
    moment the profile holds a nationality and a town, which set-up can fill before that
    lesson is ever reached, so the button that writes is never drawn. The profile is
    answered and the card is not.

    That is fixed in the lesson too, and this is the half that matters to somebody
    standing in front of the card today: a learner who already walked past it does not get
    their answer back by being sent to walk it again.

    ONLY WHAT THE RECORD ACTUALLY HOLDS, and only where the card is empty —
    answerLegendFromLesson refuses to overwrite a real answer, so an edited card stands.
    knownValues is the same reader the Legend-open screen uses, so the two cannot disagree
    about what is known.
  */
  useEffect(() => {
    for (const frame of LEGEND_FRAMES) {
      const known = knownValues(frame, learner)
      if (!readableFrame(frame, known)) continue
      answerLegendFromLesson(frame.id, known)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learner.profile?.nationality, learner.profile?.from_place, learner.profile?.age, learner.display_name])
  const valuesFor = (id: string) => {
    const given = answers.find((a) => a.frame_id === id)?.values
    /*
      THE INTERESTS FRAME IS ALREADY ANSWERED, in the lesson that taught gosto de.

      Asking the same eight chips again on the deck would be the Legend forgetting what the
      learner just told it — and the whole argument for this frame is the opposite: it says
      back something they have already said, in a sentence they can now produce.

      Seeded rather than written, so an explicit answer on the deck still wins. Somebody
      who edits it here is changing their Legend, not their profile, and the two are
      allowed to differ — the profile is what DUB knows, the card is what they choose to
      say out loud.
    */
    /*
      NO SEEDING HERE ANY MORE, and that is the point.

      This used to fill four frames from the profile so the deck LOOKED answered — and it
      left a seam, because cardOpen and onCard read `legend` directly. A card showed filled
      and counted empty, so the header offered to find seven missing questions above two
      visibly answered ones.

      The lessons write the real answer now (see answerLegendFromLesson), so there is one
      record of what somebody has said and everything downstream counts it without being
      told. A display-only seed would now hide the one failure worth seeing: a lesson that
      collected an answer and did not store it.
    */
    return given
  }
  /*
    The Legend opens on crates done, not on owning specific words.

    Every one of the eighteen words it used to depend on was taught in exactly one crate,
    so "unlock your Legend" quietly meant "play these eight particular vibes" — and two
    cards hung on a word that only exists inside a drop, and is therefore unobtainable
    for most of the year. Counting crates deletes that whole class of problem instead of
    patching it, and five is more than the free tier allows, so arriving here means
    somebody decided DUB was worth paying for.

    Every card is then open at once. The words are not a precondition any more; building
    a card teaches them.
  */
  const played = learner.roots_played ?? []
  const sections = learner.sections_completed ?? []
  /*
    The same function every other screen uses.

    This called legendUnlocked directly while the session screen called legendStatus, and
    that screen counted the vibe in progress — so at four recorded plus the one being
    finished, one said "your Legend is open, fill them in" and this one, a tap later,
    showed ten dashed cards. Both correct, different questions.
  */
  const unlocked =
    mounted &&
    legendStatus({
      rootsPlayed: played,
      sectionsCompleted: sections,
      sittings: learner.sittings ?? 0,
      purpose: learner.purpose ?? null,
    }).open
  const toGo = doorwayToGo(played, learner.purpose ?? null)
  /*
    THE DOORWAY'S OWN LENGTH, not the whole vibe's.

    This was every root in the basics — sixteen — while `toGo` counts only the six that
    carry the card's vocabulary. So the readout subtracted one set from the other and
    called the result progress: "11 of 16 of the basics played" to somebody with four
    doorway roots left, and the two numbers could never meet.
  */
  const basicsTotal = doorwayRoots().length
  /* And the same distance in the unit the shelf and the tile use. */
  const doorStatus = legendStatus({
    rootsPlayed: played,
    sectionsCompleted: sections,
    sittings: learner.sittings ?? 0,
    purpose: learner.purpose ?? null,
  })
  /* The card is the seven at depth 'card'; the deeper frames are a bonus. */
  const myCard = cardFor(learner.purpose ?? null)
  /*
    THE ONES STILL BETWEEN THIS LEARNER AND THE CLUB.

    Not every unanswered frame — only the card ones. A deeper question is unanswered too
    and opens nothing, which is exactly the confusion the `extra` chip exists to end; a
    button that counted them would put it straight back.
  */
  /*
    HOW MANY OF THE SEVEN HAVE BEEN SAID COLD — the half of the door this page never read.

    The card being written and the card being SAID are two different states, and until now
    this screen only knew the first. So it announced the Club on a finished card while the
    door was still waiting, and Sam tapped GO IN and was turned away.

    Counted the same way clubOpen counts it — proof rows with source 'legend' and clean —
    so the screen and the door cannot disagree about what is left.
  */
  const saidCold = (learner.proof ?? []).filter(
    (p) => p.source === 'legend' && p.clean,
  ).length

  const cardOpen = myCard.filter(
    (f) => !answers.some((a) => a.frame_id === f.id && Object.keys(a.values).length > 0),
  )
  const onCard = answers.filter(
    (a) => Object.keys(a.values).length > 0 && myCard.some((f) => f.id === a.frame_id),
  )
  /*
    THIS LEARNER'S FRAMES, NOT EVERY FRAME THERE IS.

    `reachable` was LEGEND_FRAMES whole, and the only filter anywhere near the deck was
    frameApplies — which reads `frame.requires`, and NO FRAME DECLARES `requires`. So the
    filter returned true for everything and cardFor, already computed on the line above as
    `myCard`, was never applied to the deck at all.

    The consequence is not cosmetic. `staying_for` is scoped to visitors and its longest
    option is A MONTH; `first_time` is scoped to somebody here for a season. Answer "I am
    moving there" at set-up and the deck dealt you both anyway, so the product asked how
    long you were staying and offered you nothing longer than a month — reported exactly
    that way, by somebody staying a year. Worse, `nextAfter` hands the next card over
    automatically, so a contradictory question arrives without anybody choosing it, and the
    rehearsal then reads the answers back as though they were all true of one person.

    The purpose-scoped frames are one each by design — a visitor is asked how long they are
    staying, somebody here for a season whether it is their first time, a mover how long
    they have been here. Filtering by the learner's own card is what makes that design real
    rather than a comment.

    frameApplies stays in the queue below: `requires` is unused today and is the mechanism
    for a frame that depends on an ANSWER rather than on a purpose, which is a different
    question from this one.
  */
  const reachable = useMemo(
    () =>
      mounted && unlocked
        ? /*
            BY PURPOSE, NOT BY CARD — and the first attempt at this got it wrong.

            Filtering to `myCard` removed the wrong-purpose frames correctly and also
            removed `children`, which is rung 5: a legitimate deeper question that is simply
            at depth 'deeper' and therefore not one of the seven. The deck is meant to hold
            the card PLUS the bonus frames — the comment two lines up says so — and
            legend-flow caught it immediately by finding that card disabled.

            frameForPurpose is the right test, because the question being asked here is "is
            this frame for this learner", not "is it on their card". A mover keeps children
            and loses staying_for; a visitor keeps children and loses moved_when.
          */
          /*
            AND THE WORDS, which is what makes an unlock mean something.

            This was purpose only, so every question read `ready` the instant five vibes
            were done — the `not yet` chip and the whole Missing row below were unreachable
            code, and a question could not become answerable because it already was.

            Per-question readiness was deleted once and the reason is on record in
            content/legend.ts: it quietly meant "play these eight particular vibes", because
            every word was taught in exactly one place. That is fixed — every word the card
            needs is now in the basics too — so what a word decides is whether the DEEPER
            questions are ready, never whether the card can be finished.

            frameReady is the single source: the deck renders from it and the end of a vibe
            announces from it, so the two cannot disagree the way they did before.
          */
          LEGEND_FRAMES.filter(
            (f) => frameForPurpose(f, learner.purpose ?? null) && frameReady(f, owned),
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mounted, unlocked, learner.purpose, owned],
  )
  /*
    ANSWERED, AND STILL TRUE — the same two predicates the deck applies.

    This was the whole library with no purpose filter, sitting directly under `reachable`,
    which has one. Purpose is changeable from Yours, and set-up asks it once, so a learner
    who arrives as a visitor and later moves has answers on file for questions that are no
    longer theirs.

    The deck greys those out. Rehearsal and COLD OPEN did not: `answered` feeds RunThrough,
    which shuffles and deals one card, so a mover could be asked how long they are staying
    and told the answer is "uma semana". That is the one path in the Legend that reaches a
    learner's mouth, and it was drilling them on a sentence about a life they had left.

    The long note above `reachable` diagnoses exactly this class of bug and fixes it in
    three places. Not here, which is the fourth.

    frameApplies as well as frameForPurpose, because a conditional frame — one whose
    `requires` points at another card's answer — can stop applying when that answer changes,
    and a rehearsal of a sentence whose premise is gone is the same failure in a quieter
    form.
  */
  const answered = useMemo(
    () =>
      LEGEND_FRAMES.filter(
        (f) =>
          isAnswered(f, valuesFor(f.id)) &&
          frameForPurpose(f, learner.purpose ?? null) &&
          frameApplies(f, answers),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers, learner.purpose],
  )

  /*
    The next question, rather than the deck.

    Answering one card sent you back to a list of ten to choose the next from, which turned
    seven questions into seven decisions about which question to answer — and building your
    Legend into an errand. Nobody choosing between "Do you have children?" and "What do you
    do?" is making a meaningful choice; they are being asked to do the app's filing.

    So it runs on. Finish a card and the next unanswered one that applies opens itself, in
    the order the questions come in a real conversation. The deck is still there, still
    reachable, still how you go back and change one — it stops being the thing you have to
    pass through between every answer.
  */
  const nextAfter = (id: string): string | null => {
    const queue = LEGEND_FRAMES.filter(
      (f) => frameApplies(f, answers) && reachable.some((r) => r.id === f.id),
    )
    const from = queue.findIndex((f) => f.id === id)
    return (
      queue.slice(from + 1).find((f) => !isAnswered(f, valuesFor(f.id)))?.id ??
      // Nothing after it, so pick up anything skipped earlier before giving up.
      queue.slice(0, Math.max(from, 0)).find((f) => !isAnswered(f, valuesFor(f.id)))?.id ??
      null
    )
  }

  /*
    A BUILD CARD NEEDS THE DOOR OPEN, like every other way into the deck.

    Sam: "I was still in basics and somehow I managed to open up my legend, which I
    completed, but because somehow I had got in through the back door it didn't save."

    ?build= validated that the frame EXISTS and nothing else — no unlocked check — so any
    link carrying it rendered a build card whatever the door said. Reproduced from a
    mid-basics record: door shut, five doorway roots outstanding, and the question opened
    anyway.

    The note under the run-through branch below describes exactly this fix and was never
    applied here: "both are now reachable by URL — ?run=1 and ?cold=1 — and a typed or
    stale link with an empty Legend would render a run-through of nothing at all. Falling
    back to the deck is the honest answer." Same rule, third deeplink.

    AND THE SAVE DID WORK, which is the half worth saying plainly. answerLegend writes
    unconditionally, so the answers were kept — they were hidden behind the locked screen,
    which showed the wall and nothing underneath it. That is fixed separately below.
  */
  /*
    Not a redirect and not an error. The deck is the screen that says how far the door is,
    which is the question somebody arriving by a stale link actually has — and it shows
    the answers they already gave, so nothing they did looks lost.

    In an effect rather than during render: setState while rendering is a React warning at
    best and a loop at worst, and the branch below already declines to draw the card.
  */
  useEffect(() => {
    /*
      ALL THREE DEEPLINKS, not only ?build=.

      This tested `typeof mode === 'object'`, which is true for {build} and false for the
      two string modes — so the guard covered one of the three ways in, while the note
      above it named the other two by name. ?run=1 and ?cold=1 walked straight past it
      into a run-through of answers given through the back door, with the door still shut.
    */
    /*
      MEASURED ON WHAT THEY HAVE, not on what they were required to do to get it.

      This read `!unlocked`, which is legendStatus().open — the doorway plus three vibes —
      and it is the other half of the RUN IT THROUGH bug: even once the branch below agreed
      to render, this effect would have reset the mode on the next pass. Two places asking
      the same wrong question.

      THE TWO MODES ARE GUARDED SEPARATELY, because they need different things.

      The first version of this fix reset ANY non-deck mode on `answered.length < 2`, which
      broke building: {build} is how you answer your FIRST card, and a learner answering
      their first card has zero answers by definition. legend-flow caught it immediately —
      it seeds `legend: []`, clicks a card and waits for the ask beat that never came.

      So: a run-through needs cards to run (two filled ones), and building needs the door
      to have been walked, which is what `unlocked` legitimately measures and what the
      branch below already asks. Each mode is held to its own precondition rather than to
      one test that is wrong for one of them.
    */
    if (mounted && mode !== 'deck') {
      const runnable = mode === 'rehearse' || mode === 'cold'
      if (runnable ? answered.length < 2 : !unlocked) setMode('deck')
    }
  }, [mounted, unlocked, answered.length, mode])

  if (typeof mode === 'object' && (!mounted || unlocked)) {
    const frame = LEGEND_FRAMES.find((f) => f.id === mode.build)!
    return (
      <Shell>
        <BuildCard
          key={frame.id}
          frame={frame}
          values={valuesFor(frame.id) ?? {}}
          gender={learner.profile?.gender ?? null}
          owned={owned}
          onDone={() => {
            const next = nextAfter(frame.id)
            setMode(next ? { build: next } : 'deck')
          }}
          onStop={() => setMode('deck')}
          remaining={
            LEGEND_FRAMES.filter(
              (f) => frameApplies(f, answers) && reachable.some((r) => r.id === f.id),
            ).filter((f) => !isAnswered(f, valuesFor(f.id))).length
          }
        />
      </Shell>
    )
  }

  /*
    A run-through needs something to run through.

    The deck only offers these at two answers or more and Yours asks the same question, but
    both are now reachable by URL — ?run=1 and ?cold=1 — and a typed or stale link with an
    empty Legend would render a run-through of nothing at all. Falling back to the deck is
    the honest answer to that: it is the screen that says what to do next.
  */
  /*
    ?cold=1 AND ?run=1 ARE THE SAME RUN NOW, and both still work.

    They were two modes describing one thing — see RunThrough. The parameter stays because
    it has callers outside this page (the Club's move, the daily line, a notification) and
    a link that has been sent to somebody must not stop working because the screens behind
    it were merged.
  */
  /*
    RUN IT THROUGH DID NOTHING, and the extra test in this condition is why.

    Sam, on the Legend screen inside the Club: "this run it through button doesnt do
    anything." Reproduced exactly — the button renders, the click fires, setMode('rehearse')
    lands, and this branch declines to render it.

    `unlocked` is legendStatus().open, which answers "has this learner EARNED the right to
    start a Legend" — the doorway roots plus three vibes. It is the right question on the
    deck below, where a locked learner is shown what is behind the door. It is the wrong
    question here, because `answered.length >= 2` has already settled the only thing that
    matters: you cannot have two filled cards without having a Legend, however you came by
    it. So the condition asked one question twice and a different one once, and the
    different one is the one that failed.

    It is reachable in the product, not only through a testing tool: anybody whose Legend
    was answered before the doorway rules changed, anybody restored from a server record
    that predates `sittings`, and anybody who arrives with a merged record from a second
    device. All of them have a full card and an unusable button.

    The `mode` reset at the top of this component keeps the other half honest — a learner
    who genuinely has no Legend is bounced back to 'deck' before they can reach this.
  */
  if (mode === 'rehearse' || mode === 'cold') {
    /*
      THE RUN IS THE WHOLE CARD, IN ORDER, ANSWERED OR NOT.

      Sam: "The legend run through needs to run through from the top (chamo-te) and step
      the user through each question and when it is not pre-populated to go and get the
      word or words required."

      THIS IS A REDESIGN, NOT ANOTHER FILTER, and the filters are why we were going in
      circles. The run took `answered` — the frames with values on them — which made three
      faults inevitable and I fixed them one at a time:

        · it could include a DEEPER frame, so the run opened on "Are you with somebody?"
        · I filtered to depth 'card', which needed a fallback when fewer than two were
          answered — and the fallback put the deeper frames straight back. Sam then met
          "Gostas" first, which is the same bug wearing my fix.
        · and a frame with no answer was simply ABSENT, so the run could never be the
          seven, could never step somebody through their card, and had nothing to say
          about the questions that were actually holding them up.

      Every one of those is the same root cause: the run was assembled from what had been
      answered rather than from what the card IS. So it is now cardFor(purpose) — the
      identical call the gate and the countdown make — and a frame with no answer is a
      STEP in the run rather than a hole in it.

      No shuffle any more either. The shuffle argued that a fixed order is a recital, and
      that is true of a rehearsal you have already earned; it is wrong for a walk-through
      whose job is to take somebody from the top and show them what is missing. Sam asked
      for the top, and the card's own order starts at the name.
    */
    const run = cardFor(learner.purpose ?? null).filter((f) => frameApplies(f, answers))
    if (run.length) {
      return (
        <Shell>
          <RunThrough
            cards={run}
            gender={learner.profile?.gender ?? null}
            valuesFor={valuesFor}
            owned={owned}
            onDone={() => setMode('deck')}
          />
        </Shell>
      )
    }
  }

  /*
    The Legend does NOT ask why you are here. Set-up already did.

    It asked here for good reasons — five vibes done, seven things about to be said, and
    what a stranger asks you genuinely differs by whether you are for four days or for good
    — and those reasons were sound while this was the FIRST place the question appeared.
    It is not any more. Set-up carries where, why and who before any content is tailored,
    which is the whole argument for asking there, so a second ask on the way into the deck
    is the same question twice with a different screen around it.

    Somebody who never answered still gets a Legend: cardFor(null) is the universal seven
    and the Club shows everything on a null purpose. An unanswered question costs a slightly
    less pointed card, and that is a far smaller price than a form standing in front of the
    thing the whole product is for.

    Changing it later is still a setting, in Yours.
  */
  return (
    <Shell>
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-accent">YOUR LEGEND</p>
        <h1 className="display text-balance text-2xl">{LEGEND_COPY.what}</h1>
        {/* One line of spy framing, then it gets out of the way. Dry, not jokey — the
            learner is doing something genuinely difficult — and it says plainly that
            theirs is true, or the metaphor curdles. */}
        <p className="text-sm leading-relaxed text-muted">{LEGEND_COPY.spy}</p>
        {/*
          Seven, because seven is what every other screen promises.

          This said "of 9" — the number of frames in the library — while the explainer, the
          old door and this spec all say the card is seven questions. Two of the nine are
          past the card's rung and are a bonus rather than a requirement, so counting them
          in the denominator quietly moved the finish line and contradicted the only
          promise the product makes about how long this takes.
        */}
        {mounted && onCard.length ? (
          <p className="text-xs tabular-nums text-muted">
            {onCard.length} of {myCard.length} on your card
          </p>
        ) : null}
        {/*
          AND WHAT IS STILL IN THE WAY, WHEN THE CARD IS FULL AND THE DOOR IS NOT.

          Sam: "I got to Esta La (all done - 7/7) it then took me to two more numbers
          questions 1,2,3,4 etc before opening my legend."

          Both facts were true and the screen only ever said one of them. A visiting
          learner's card completes on sitting three — measured — while the doorway needs
          four, because tb_1234 teaches the numbers `oito dias` is built from and answers
          no card question itself. So the product said 7 of 7, the learner reasonably
          concluded they were finished, and the next screen asked them to count to four.

          The road is not wrong and the count is not wrong. What was missing is the
          sentence that reconciles them, so the one remaining sitting reads as the last
          step of something rather than as a door that moved.
        */}
        {mounted && !cardOpen.length && !doorStatus.open ? (
          <p data-testid="card-full-road-left" className="text-xs leading-relaxed text-accent">
            Your card is written. {doorStatus.toGo === 1 ? 'One more basics step' : doorStatus.toGo + ' more basics steps'}{' '}
            and the words behind it are yours too — then your Legend opens.
          </p>
        ) : null}
      </div>

      {/*
        THE WAY TO THE THING THAT IS ACTUALLY IN THE WAY.

        The count at the top says "6 of 7 on your card" and the seventh is somewhere in a
        list of eight, below the fold, looking identical to the ones already done. Sam,
        with his Legend built and the Club shut: "I cant get from here to teh Club even
        though I ahve done my Legend" — and then, on this screen, asking for a button that
        finds them.

        It names the count rather than the question. Which one is missing depends on the
        learner and there can be more than one, so the button takes them to the list and
        the list — with `extra` on the frames that do not count — says the rest.

        Above RUN IT THROUGH deliberately: rehearsing is what you do with a finished card,
        and offering it first to somebody who cannot finish theirs is the wrong order.
      */}
      {/*
        Shown to anybody with a card to finish, not only to anybody the ladder approves of.

        `unlocked` here was the same wrong question as in the two places above — it asks
        whether the doorway has been walked, and this button is about whether there is an
        unanswered card to walk TO. A learner holding a part-built Legend whose record does
        not satisfy legendStatus (merged from a second device, restored from a row written
        before `sittings` existed, or opened through the Club) saw a list of cards with no
        way to find the one in their way, which is the exact complaint that put this button
        here in the first place.

        `cardOpen.length` is the real precondition and it was already in the condition.
      */}
      {mounted && cardOpen.length ? (
        <button
          type="button"
          data-testid="legend-find-missing"
          onClick={() => {
            const el = document.querySelector('[data-testid="legend-card-' + cardOpen[0].id + '"]')
            if (!el) return
            /* The same courtesy the city selector takes — see components/Choose.tsx. */
            const still =
              typeof window !== 'undefined' &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches
            el.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' })
          }}
          className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink"
        >
          {cardOpen.length === 1
            ? 'FIND YOUR MISSING QUESTION'
            : 'FIND YOUR ' + cardOpen.length + ' MISSING QUESTIONS'}
        </button>
      ) : null}

      {mounted && answered.length >= 2 ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            data-testid="legend-rehearse"
            onClick={() => {
              track('legend_rehearse', { cards: answered.length })
              setMode('rehearse')
            }}
            /* Outline while a card question is outstanding, so the two do not compete
               for the one filled slot — finding the missing one comes first. */
            className={
              'tap-target eyebrow w-full rounded px-5 py-3 ' +
              (cardOpen.length ? 'border border-line text-fg' : 'bg-accent text-accent-ink')
            }
          >
            RUN IT THROUGH
          </button>
          {/*
            COLD OPEN was here as a second button and it is gone. It ran a single shuffled
            card with the I SAID IT claim; RUN IT THROUGH ran all of them with none. Every
            card, shuffled, with the claim on each is both of those and reads as one thing
            rather than two names for it — see RunThrough.
          */}
        </div>
      ) : null}

      {/*
        THE CARDS AND THE REPAIR KIT ARE GONE FROM THIS SCREEN.

        Sam: "this entire screen is redundant other than the practise run and the repair
        kit, as everything is now handled by the Legend board and the practise your legend
        button. So move the repair kit into Hacks and remove everything on this screen
        other than run it through and associated text."

        He is right, and the duplication was the whole problem. This page grew when it was
        the ONLY place a Legend existed: it listed every card, drew the unanswered ones,
        offered GO AND GET IT on the blocked ones, and announced the Club. The Legend Board
        in Yours now does all of that — with pictures, in one grid, reachable from the nav —
        and this page is reached BY the board, through PRACTISE YOUR LEGEND. Two screens
        showing the same cards is how they came to disagree about what was answered.

        So this is Legend Practise now, in Sam's words: the headline, the count, and the
        run. The repair kit moved to content/cheats.ts as repair_hack, where it is a card
        somebody can collect rather than a list at the foot of a page nobody scrolls to.
      */}
    </Shell>
  )
}

/**
 * The English a pick option already carries, keyed by the Portuguese it belongs to.
 *
 * `lint-content` exempts pick options from the taught-or-glossed rule on the grounds that
 * an option shows its English beside it. That is true in the build beat and false in the
 * cold beat, where the option has been shredded into tiles with no English attached — so
 * this carries the option's own gloss across, rather than leaving the hole the exemption
 * assumed could not exist.
 *
 * Multi-word options are split, because the cold beat works in tiles: "Uns dias" becomes
 * two tiles and each wants its own line. A single English gloss cannot be divided
 * honestly between them, so it is attached to the whole phrase and to nothing else — a
 * tile that has no gloss still shows, it simply shows without one, which is what the
 * frame's own helpers already do for words like `e`.
 */
function pickGlosses(
  shape: { slots: LegendSlot[] },
  draft: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const slot of shape.slots) {
    if (slot.kind !== 'pick' || !slot.options) continue
    const chosen = draft[slot.key]
    if (!chosen) continue
    const option = slot.options.find((o) => o.value === chosen || o.f === chosen)
    if (option?.en) out[chosen] = option.en
  }
  return out
}

/**
 * What is missing, said as one word and a way to go and get it.
 *
 * The blocked Legend card was the one place in the product that named a thing you needed
 * and did not link to it — while /vibes?open= already had six working callers elsewhere.
 * So the caption is now the invitation: the word, what it means, and the vibe that hands
 * it over.
 */
function Missing({ frame, owned }: { frame: LegendFrame; owned: string[] }) {
  const need = missingFrom(frame, owned)
  if (!need) {
    /*
      Reachable but not open, and no word outstanding. Rare — it means the frame is held
      by something other than vocabulary — and the honest line says so rather than
      inventing a reason.
    */
    return <p className="mt-1 px-4 text-xs text-muted">Not open yet.</p>
  }
  const line = (
    <>
      One more word — <span className="pt text-fg">{need.word}</span>, {need.gloss}
    </>
  )
  if (!need.crate) return <p className="mt-1 px-4 text-xs text-muted">{line}</p>
  /*
    A BUTTON, because it is the only thing on a blocked card that does anything.

    It was an underlined caption in the smallest type on the screen, sitting under a
    disabled card and reading as a footnote about it. Sam: "Mak eteh Go Get It against
    unopend questions a clear button."

    The word and its gloss stay above it rather than inside it: they say WHY this card is
    shut, which is a different sentence from the one the control needs to carry. A button
    reading "One more word — anos, years old — go and get it" is a paragraph somebody has
    to parse before they can tap it.
  */
  return (
    <div className="mt-1 flex flex-col gap-1 px-4">
      <p className="text-xs text-muted">{line}</p>
      <Link
        /*
          AND IT SAYS WHERE IT CAME FROM, so there is a door back.

          Sam: "I tried to select a missing word — Gosto — and it linked me through to
          this screen, with no way out." The screenshot showed the vibe's own header,
          which has a back arrow and a VIBES link — and neither leaves /vibes: `back`
          steps within the sitting and `goHome` jumps to the picker inside it. Both are
          right for somebody who chose a vibe and wrong for somebody sent on an errand,
          because an errand has a place it is supposed to return to.

          `from=legend` is that place, read by the journey's header — see useJourney. It
          is in the URL rather than in state for the reason ?door=1 is: it survives a
          reload, it is honest in a shared link, and it cannot get stuck on.
        */
        href={
          '/vibes?open=' +
          need.crate +
          (need.root ? '&root=' + need.root : '') +
          '&from=legend'
        }
        data-testid={'legend-need-' + frame.id}
        className="tap-target eyebrow inline-flex w-full items-center justify-center rounded border border-accent px-4 py-3 text-center text-accent transition hover:bg-accent hover:text-accent-ink"
      >
        GO AND GET IT
      </Link>
    </div>
  )
}

/**
 * The word a learner still needs, and where it lives.
 *
 * THIS RETURNED CRATE TITLES, and that is the whole of what made a blocked card feel like
 * a wall. It mapped each missing piece through PIECES[p].family to a crate title and threw
 * the piece away, so a card read "Needs Duran Duran song titles and Bridget Jones cringe
 * moments" — naming two cultural artefacts the learner has no reason to care about, in
 * place of the one word they actually lack.
 *
 * The generic line, "a word you have not met yet", was the FALLBACK for when nothing is
 * missing — so the nicer sentence was the unreachable one, and the more Portuguese you
 * knew the more likely you were to see it.
 *
 * Now it names the piece. `tenho` carries {gloss: 'I have'} and PIECES has a `family` that
 * resolves to a crate id, so the caption can say what the word is and the link can go
 * straight to the vibe that teaches it — /vibes?open= is a live route with six existing
 * callers. One word, not two crates: a debt with an address is something you can settle,
 * and a list of two is a shopping trip.
 *
 * AND IT IS THE FIX THAT SURVIVES SPANISH. A crate title is a licensing artefact and is
 * different in every market. `gloss` is a field on every piece in every language.
 */
function missingFrom(
  frame: LegendFrame,
  owned: string[],
): { word: string; gloss: string; crate: string | null; root: string | null } | null {
  const have = new Set(owned)
  const short = frame.built_from.filter((p) => !have.has(p))
  if (!short.length) return null
  /*
    The first one, in the order the frame declares its own words. Not "the rarest" or "the
    nearest" — the frame's order is the order the sentence needs them, which is the only
    ordering that means anything to somebody reading the question above it.
  */
  const id = short[0]
  const piece = PIECES[id]
  if (!piece) return null
  return {
    word: piece.target,
    gloss: piece.gloss,
    crate: CRATES.find((c) => c.id === piece.family)?.id ?? null,
    /*
      WHICH ROOT ACTUALLY TEACHES IT, not just which crate holds it.

      Sam: "when I click gosto de which is a missing word in my legend it takes me to a
      session that has nothing to do with learning gosto de." It did. This returned the
      CRATE and threw the root away, so GO AND GET IT opened the basics at its first root
      — counting, or hello — and the word that sent them there was five sittings down the
      queue with nothing on screen saying so.

      A crate is a place; a root is the lesson. The errand is about one word, so it has to
      name the lesson that hands it over.
    */
    root: ROOTS.find((r) => r.extracts.some((e) => e.id === short[0]))?.root_id ?? null,
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-stage="REAL WORLD"
      /* safe-top: no .bar on this screen, so the notch is its own to clear. */
      /* app-frame: one scrolling region, dock beneath it. See components/Dock.tsx. */
      className="app-frame safe-top bg-bg text-fg"
    >
      <Framed className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 pb-10 pt-6">
      <div className="flex items-center gap-3">
        <Back />
        <span className="flex-1" />
      </div>
      {children}
      </Framed>
      <BottomNav />
    </div>
  )
}

/**
 * One card, three beats — ask, build, cold. The same rhythm as a root, which is what
 * stops it feeling like
 * a form.
 *
 *   1  the question, heard first, in Portuguese
 *   2  the frame, with the gaps visible
 *   3  where its words came from
 *   4  make it yours
 *   5  say it cold
 *
 * Beat 3 is the one that makes this DUB. Every card names the crates its own words came
 * from — the collision mechanic, on the learner's own family — and it writes itself from
 * built_from.
 */
function BuildCard({
  frame,
  values,
  gender,
  owned,
  onDone,
  onStop,
  remaining,
}: {
  frame: LegendFrame
  values: Record<string, string>
  gender: 'm' | 'f' | null
  owned: string[]
  /** Finished with this one — the next question opens itself. */
  onDone: () => void
  /** Enough for now. Back to the deck, with what has been answered kept. */
  onStop: () => void
  /** How many still unanswered, including this one. Said as a sentence, never a score. */
  remaining: number
}) {
  const me = useLearner()
  const [draft, setDraft] = useState<Record<string, string>>(values)
  const [beat, setBeat] = useState<'ask' | 'build' | 'cold'>('ask')


  /*
    The word coming back from the translator.

    Addressed rather than broadcast: the detail carries the id this card sent, so a panel
    opened from somewhere else cannot drop a word into a slot that did not ask for one. The
    id encodes the frame and the slot, which is enough to be unambiguous without holding a
    reference to anything.

    It goes into `draft` exactly as a chip would, so everything downstream — the sentence
    preview, `filled`, SAVE IT — carries on as if the word had been on the list all along.
  */
  useEffect(() => {
    const took = (e: Event) => {
      const d = (e as CustomEvent<{ for: string; pt: string }>).detail
      if (!d?.for || !d.pt) return
      const [scope, frameId, slotKey] = d.for.split(':')
      if (scope !== 'legend' || frameId !== frame.id) return
      /*
        Cleaned HERE, where the word lands, not only where it was sent.

        The frame supplies its own punctuation — "Trabalho com {thing}." — and Portuguese
        likes an article in front of a bare noun, so a model answering "a publicidade."
        produced "Trabalho com a publicidade..". Doing this in the translator's button as
        well would be two places to keep in step, and this is the one that cannot be
        bypassed: every route into the slot passes through it.
      */
      const word = d.pt
        .trim()
        .replace(/[.!?]+$/, '')
        .replace(/^(?:o|a|os|as|um|uma)\s+/i, '')
        .trim()
      if (!word) return
      setDraft((was) => ({ ...was, [slotKey]: word }))
    }
    window.addEventListener('dub:word', took)
    return () => window.removeEventListener('dub:word', took)
  }, [frame.id])
  /*
    The shape follows the answer.

    A variant is a different sentence, not the same one with a word swapped — "I have one
    son. He is called…" has a different verb ending from "I have three." So the slots on
    screen change the moment the count is picked, and `filled` judges the sentence they
    are actually building rather than the one this card started as.
  */
  const shape = frameFor(frame, draft)
  /*
    THE LINE THIS LEARNER HAS ALREADY EARNED, if they have.

    `values` is whatever the road wrote — see answerLegendFromLesson — so a card whose
    every slot is filled is one the learner has answered somewhere else, in a lesson,
    without being marched through a form to do it. Built from the frame's own template so
    the sentence is the one the card teaches rather than a second phrasing of it.
  */
  /*
    `every` ON AN EMPTY LIST IS TRUE, which would call a slotless card answered.

    Vacuous truth is the right maths and the wrong answer here: a frame with no slots has
    nothing to fill, so "every slot is filled" holds trivially and the card would open on
    a sentence with no learner in it. The length check is the whole guard.
  */
  const answered =
    shape.slots.length > 0 && shape.slots.every((s2) => String(values[s2.key] ?? '').trim())
  const answeredLine = useMemo(() => {
    const put = (t: string) => t.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? '___')
    return { pt: put(frame.frame), en: put(frame.en) }
  }, [frame, values])
  /*
    FILLED MEANS THE SENTENCE SAYS SOMETHING THEY MEANT, not that the buffer is non-empty.

    The children slot's value is a JSON string, so `[{"name":"","g":"m"}]` — a child added
    and the name not yet typed — is non-empty and passed `.trim()`. filled went true,
    isAnswered went true, SAVE IT lit, and fillFrame returned "Não tenho filhos."

    So: tap MAKE IT MINE on "Tens filhos?", add a child, pick boy, get distracted before
    typing the name, press the lit button. The cold beat then asks you to say, tile by
    tile, that you are childless, and banks it to your proof card. On the card the content
    file calls the showcase card.

    A children slot is filled when at least one child has a name, which is the same
    question parseChildren already answers — it trims names on the way through, so an
    entry that is only whitespace does not count.
  */
  const filled = shape.slots.every((s) =>
    s.kind === 'children'
      ? parseChildren(draft[s.key]).some((c) => c.name.length > 0)
      : draft[s.key]?.trim(),
  )
  const sentence = fillFrame(frame, draft, gender)
  /* Where THIS learner met each word — see provenanceOf, which was naming the crate
     a word is authored in rather than the one they played. */
  const provenance = provenanceOf(frame, metIn(me.evidence ?? []))
  /*
    Did they already have these words, or is this card handing them over?

    Both are fine and the line says which. Requiring the first was the old gate, and it
    is what made two cards permanently unreachable.
  */
  const allOwned = frame.built_from.every((p) => owned.includes(p))

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="eyebrow text-muted">THEY ASK</p>
        <div className="flex items-center gap-3">
          <AudioButton slug={slugFor(askFor(frame, gender))} text={askFor(frame, gender)} size="sm" />
          <span className="min-w-0">
            <span data-testid="legend-ask" className="pt block text-xl text-accent">
              {askFor(frame, gender)}
            </span>
            <span className="block text-xs text-muted">{frame.ask_en}</span>
          </span>
        </div>
      </div>

      {beat === 'ask' ? (
        <>
          {/*
            YOUR SENTENCE, WHERE THERE IS ONE, RATHER THAN A PATTERN WITH HOLES IN IT.

            Sam: "you are literally building the legend as you learn, rather than getting
            to the legend and then building it from scratch. So the legend part really
            comes more about learning it, than building it."

            The road now answers cards as it goes — the name from set-up, where you are
            from in the lesson that asks — so a learner reaching this card has in several
            cases already said the thing. Showing them "Chamo-me ___" at that point is the
            Legend forgetting, and it turns an arrival into a form.

            So an answered card opens on the finished line, in their own words, with the
            English under it: this is what you can say, now learn to say it. An unanswered
            one still shows the pattern, because there the blanks ARE the question.
          */}
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-muted">{answered ? 'YOU CAN SAY' : 'THE PATTERN'}</p>
            <p className="pt text-balance text-lg">
              {answered ? (
                <>
                  <AudioButton slug={slugFor(answeredLine.pt)} text={answeredLine.pt} size="sm" />{' '}
                  {answeredLine.pt}
                </>
              ) : (
                frame.frame.replace(/\{(\w+)\}/g, '___')
              )}
            </p>
            <p className="text-xs text-muted">
              {answered ? answeredLine.en : frame.en.replace(/\{(\w+)\}/g, '___')}
            </p>
          </div>

          {/*
            THE LESSON, and it is why this is not a form.

            The card used to require you to own the words before it would open, which
            made it two text inputs and a set of chips. Now it teaches — and the moment
            you need to say how old you are is exactly the right moment to learn that
            Portuguese HAS an age rather than being one. Written like a semantic bridge,
            because that is what it is.
          */}
          <div className="flex flex-col gap-1 rounded border border-line bg-bg-elev px-4 py-3">
            <p className="eyebrow text-accent">WHY IT LANDS</p>
            <p className="text-sm leading-relaxed">{frame.teaches}</p>
          </div>

          {/* The delightful beat, and it costs nothing to generate. */}
          {provenance.length ? (
            <div className="flex flex-col gap-1 rounded border-l-2 border-accent/50 bg-surface px-3 py-3">
              <p className="eyebrow text-muted">YOU KNOW THESE</p>
              {provenance.map((p) => (
                <p key={p.piece} className="text-xs leading-relaxed text-fg/85">
                  <span className="pt owned">{p.piece}</span> came out of{' '}
                  {CRATES.find((c) => c.id === p.family)?.title ?? 'another vibe'}.
                </p>
              ))}
              <p className="mt-1 text-xs text-muted">
                {allOwned
                  ? 'None of it was ever about you.'
                  : 'Some of that is new — it is yours now either way.'}
              </p>
            </div>
          ) : null}

          {/*
            DOCKED, because "under the words that earned it" put it mid-screen.

            Sam, with a screenshot of this card: "the CTA buttons need to be anchored to the
            bottom with a few pixels padding. They are still causing scrolling." The rule
            this replaces is a good one and it is the third place it has been wrong — the
            proof card and the session-done screen both gave it up for the same reason. On
            a card whose body is a pattern, a bridge and a provenance note, the words that
            earned the button are longer than the screen, so the button floats with dead
            space under it and the page scrolls past the only control on it.

            Dock is the product's own answer and it is already used three times in this
            file: sticky at var(--bar-room), which is the measured height of the nav, with
            the ground behind it so nothing shows through as it passes.
          */}
          <Dock>
            <button
              type="button"
              data-testid="legend-make-mine"
              /*
                Straight to the cold beat when the line is already theirs: the build beat
                is a form for assembling a sentence, and there is nothing to assemble.
                What is left is the part that matters — saying it without the words in
                front of you.
              */
              onClick={() => setBeat(answered ? 'cold' : 'build')}
              className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink"
            >
              {/*
                The button says what happens next. "MAKE IT MINE" is right for a blank
                card and wrong for one already in the learner's own words — there the work
                is learning to say it, which is what the Legend is now for.
              */}
              {answered ? 'LEARN TO SAY IT' : 'MAKE IT MINE'}
            </button>
          </Dock>
        </>
      ) : null}

      {beat === 'build' ? (
        <>
          <div className="flex flex-col gap-3">
            {shape.slots.map((slot) => (
              <div key={slot.key} className="flex flex-col gap-1">
                <label htmlFor={slot.key} className="text-xs text-muted">
                  {slot.hint}
                </label>
                {slot.kind === 'children' ? (
                  <ChildRows
                    value={draft[slot.key] ?? ''}
                    onChange={(next) => setDraft((d) => ({ ...d, [slot.key]: next }))}
                  />
                ) : slot.kind === 'number' ? (
                  /*
                    A number you can say. It was a text box with inputMode="numeric", so
                    the card came out "Tenho 56 anos" — readable, unpronounceable, and
                    useless on the one question it exists to answer.
                  */
                  <NumberPicker
                    value={draft[slot.key] ?? ''}
                    max={100}
                    onChange={(n) => setDraft((d) => ({ ...d, [slot.key]: n }))}
                  />
                ) : slot.kind === 'pick' ? (
                  <div className="flex flex-wrap items-start gap-1">
                    {/*
                      Both endings while the gender is not yet known.

                      A gendered adjective has to agree with the speaker, so guessing
                      masculine would put the wrong word in somebody's mouth every time
                      they said it. Where it is known, one chip per option in the right
                      ending; where it is not, both, and the learner picks the word they
                      would actually say.

                      IT IS NO LONGER SKIPPABLE, and this branch is still load-bearing.
                      "Show me both, every time" is gone — it promised something only this
                      one screen delivered, while every other surface fell back to the
                      masculine, which is the exact harm it claimed to prevent. But the
                      answer is collected at step 3 of the road, so the first two steps run
                      without it, and a record written before the skip was removed can
                      still carry a null. Both are real learners, and neither should be
                      handed a word that does not agree with them.
                    */}
                    {slot.options?.flatMap((o) => {
                      /*
                        AND BOTH ENDINGS ALWAYS, when the ending is about somebody else.

                        The filter above assumes `f` agrees with the speaker. On
                        `namorado`/`namorada` it does not — it names the partner — so
                        filtering by the learner's own gender both removed a true answer
                        and printed the wrong English against the one it left: a woman was
                        shown "Tenho namorada" labelled "I have a boyfriend".
                      */
                      const namesTheOther = slot.gendered_names_the_other?.includes(o.value)
                      const forms =
                        !slot.gendered || !o.f
                          ? [o.value]
                          : namesTheOther
                            ? [o.value, o.f]
                            : gender === 'f'
                              ? [o.f]
                              : gender === 'm'
                                ? [o.value]
                                : [o.value, o.f]
                      return forms.map((form) => {
                        const on = draft[slot.key] === form
                        return (
                          <button
                            key={form}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setDraft({ ...draft, [slot.key]: on ? '' : form })}
                            /*
                              A CHIP THAT WRAPS LIKE A LABEL, not like centred prose.

                              A button centres its text, and these two spans were inline —
                              so an option that is a whole sentence ("Falo pouco, mas estou
                              a tentar. I speak little, but I am trying.") broke mid-phrase
                              and left the tail floating in the middle of the row, with the
                              Portuguese and the English running together on the same line.
                              Reported as the layout being a mess, and it only showed on the
                              long picks — "computadores computers" never had to wrap.

                              text-left stops the centring, and the English goes on its own
                              line so the two languages are never mistaken for one sentence.
                              items-start on the row keeps chips of different heights
                              aligned at the top rather than stretched to match the tallest.
                            */
                            className={
                              'tap-target flex flex-col items-start gap-1 rounded border px-3 py-1 text-left text-sm transition ' +
                              (on ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted')
                            }
                          >
                            <span className="pt">{form}</span>
                            {/* The feminine form's own English where it has one. */}
                            <span className="text-xs text-muted">
                              {form === o.f && o.f_en ? o.f_en : o.en}
                            </span>
                          </button>
                        )
                      })
                    })}
                    {/*
                      NOT ON THE LIST, ASK FOR IT.

                      Sits inside the chip row and looks like a chip, because it is the same
                      choice: one of these ten, or the one you are about to fetch. A link
                      under the row would read as navigation, and this does not navigate —
                      the translator is mounted at the root and opens over this card, so the
                      half-built Legend is still here when the word arrives.
                    */}
                    {slot.open ? (
                      <button
                        type="button"
                        data-testid={'slot-ask-' + slot.key}
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent('dub:ask-word', {
                              detail: {
                                for: 'legend:' + frame.id + ':' + slot.key,
                                hint: slot.open,
                              },
                            }),
                          )
                        }
                        className="tap-target rounded border border-dashed border-line px-3 py-1 text-sm text-muted transition hover:border-accent/50"
                      >
                        Not here? Ask for it
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <input
                    id={slot.key}
                    value={draft[slot.key] ?? ''}

                    onChange={(e) => setDraft({ ...draft, [slot.key]: e.target.value })}
                    className="tap-target rounded border border-line bg-surface px-4 py-3 text-base text-fg"
                  />
                )}
              </div>
            ))}
          </div>

          {filled ? (
            <div className="flex flex-col gap-1 rounded border border-accent bg-accent/10 px-4 py-3">
              <p className="eyebrow text-muted">YOURS</p>
              <p className="pt text-base text-accent">{sentence}</p>
            </div>
          ) : null}

          {frame.helpers ? (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
              {Object.entries(frame.helpers).map(([k, v]) => (
                <li key={k}>
                  <span className="pt">{k}</span> — {v}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Skippable, always. Some people have no children and some will not say why
              they left, so leaving it empty is a real answer rather than an omission. */}
          {/* The same dock as everywhere else — see .dock in globals.css. */}
          <Dock>
            <button
              type="button"
              data-testid="legend-save"
              disabled={!filled}
              onClick={() => {
                answerLegend(frame.id, draft)
                /*
                  THE NUMBER WORDS TOO, wherever a card was built out of one.

                  The same rule as the age lesson: choosing in the picker names cinquenta
                  and seis, says them, and shows the number coming apart, so the words are
                  taught and belong in the inventory. Banked here as well as there because
                  a learner can meet the picker at either end — the lesson that asks their
                  age, or the card that asks how long they have been here — and which one
                  they happened to reach first should not decide whether they own the word.
                */
                for (const slot of frame.slots) {
                  if (slot.kind !== 'number') continue
                  const n = Number(draft[slot.key])
                  if (!Number.isFinite(n)) continue
                  for (const id of wordsIn(n)) acquirePiece(id, 'the_basics')
                }
                track('legend_card_answered', { card: frame.id })
                setBeat('cold')
              }}
              className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink disabled:border disabled:border-line-strong disabled:bg-transparent disabled:text-muted"
            >
              SAVE IT
            </button>
            {/*
              THE TWO WAYS OUT SIT BESIDE EACH OTHER, NOT UNDER THE BUTTON.

              They were two more full-width rows stacked below SAVE IT, which made the dock
              three deep — and on this screen the keyboard is open, so three rows of dock
              pushed the one button that matters off the bottom and the whole thing had to
              be scrolled to reach. Reported with a photograph of exactly that.

              Side by side they are one row instead of two, which is the height back. It is
              also the truer shape: these are alternatives to each other — skip this one, or
              stop for now — rather than two separate afterthoughts to the save.

              Running on still needs a way to stop, or it is a form with the exits removed.
              Said as a sentence rather than a counter: "two more after this" is a shape,
              and "2/7" is a score with a progress bar implied behind it.
            */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                data-testid="legend-skip"
                onClick={() => {
                  answerLegend(frame.id, {})
                  track('legend_card_skipped', { card: frame.id })
                  onDone()
                }}
                className="tap-target text-xs text-muted underline underline-offset-4"
              >
                Leave this one empty
              </button>
              <button
                type="button"
                data-testid="legend-stop"
                onClick={onStop}
                className="tap-target text-right text-xs text-muted underline underline-offset-4"
              >
                {remaining > 1 ? 'Stop here — ' + (remaining - 1) + ' more' : 'Back to your deck'}
              </button>
            </div>
          </Dock>
        </>
      ) : null}

      {beat === 'cold' ? (
        <ColdSay
          ask={askFor(frame, gender)}
          answer={sentence}
          english={fillEnglish(frame, draft)}
          /*
            THE WORDS ON SCREEN, GLOSSED — including the ones that came from a chip.

            This sent `frame.helpers`, which describes the BASE frame. frameFor may have
            swapped in a variant, so answering "Quanto tempo ficas?" with "Uns dias" gave
            two tiles and no gloss at all: the helpers were {uma: 'a', semana: 'week'},
            which belong to a chip the learner did not pick. "Não, venho todos os anos"
            produced zero glosses across four words.

            A variant carries no helpers of its own to fall back to, and inventing them
            would be authoring content in a component. What the picks DO carry is their
            English, right there on the option — so the chosen option's own gloss is added
            under its Portuguese. It is the same pairing the build beat shows two beats
            earlier, which is the point: the cold beat should not introduce a word the
            learner has not just seen explained.
          */
          helpers={{ ...frame.helpers, ...pickGlosses(shape, draft) }}
          onSolved={(clean) => {
            /*
              THE ENGLISH THAT WAS ON SCREEN, not the template it came from.

              This banked `frame.en` — the raw pattern — while the correct value is
              computed three lines above and handed to ColdSay. So the proof card stored
              "Chamo-me Sam." against "My name is {name}." and, for the children variant,
              a sentence about two daughters against "I do not have children." — because
              frameFor swaps the whole frame and frame.en is then the no-children base.

              It renders on the proof card and in the share image, and recordProof dedupes
              on `pt` and only ever upgrades `clean`, so a bad row never self-heals on a
              re-say. Rows banked before this fix need the one-off repair below.
            */
            recordProof({ pt: sentence, en: fillEnglish(frame, draft), source: 'legend', clean })
          }}
          onNext={onDone}
        />
      ) : null}
    </div>
  )
}

/**
 * Say it with nothing on screen.
 *
 * The same MiniBuild the release beat uses, so a Legend answer said clean counts on the
 * proof card on exactly the same terms as everything else — because it is exactly the
 * same thing: a sentence produced with no cue.
 */
/**
 * Your children, one row each.
 *
 * The card asked "how many" from a fixed list and then only knew names for one son or one
 * daughter — so anybody with two got a sentence with no names in it, and anybody with two
 * girls got the masculine plural. A count is not who they are.
 *
 * A name, a boy or a girl, and an age if they want to give one. Age is optional and stays
 * optional: a child with no age is somebody who did not want to say, not an incomplete
 * record, and the sentence simply leaves that clause out.
 */
function ChildRows({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const kids = parseChildren(value)
  const write = (next: Child[]) => onChange(JSON.stringify(next))
  const set = (i: number, patch: Partial<Child>) =>
    write(kids.map((k, j) => (i === j ? { ...k, ...patch } : k)))

  return (
    <div className="flex flex-col gap-3">
      {kids.map((k, i) => (
        <div key={i} className="flex flex-col gap-1 rounded border border-line bg-bg-elev px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              value={k.name}
              onChange={(e) => set(i, { name: e.target.value })}
              placeholder="name"
              aria-label={'Child ' + (i + 1) + ' name'}
              data-testid={'kid-name-' + i}
              className="min-w-0 flex-1 border-b border-line bg-transparent py-1 text-base text-fg outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => write(kids.filter((_, j) => j !== i))}
              aria-label={'Remove ' + (k.name || 'this child')}
              className="tap-target shrink-0 px-2 text-muted transition hover:text-fg"
            >
              ×
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            {/* Boy or girl, because the Portuguese needs it: filho or filha, and duas
                filhas rather than dois filhos when they are all girls. */}
            {(['m', 'f'] as const).map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={k.g === g}
                data-testid={'kid-' + g + '-' + i}
                onClick={() => set(i, { g })}
                className={
                  'tap-target rounded border px-3 py-1 text-sm transition ' +
                  (k.g === g ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted')
                }
              >
                {g === 'm' ? 'boy' : 'girl'}
              </button>
            ))}
            <span className="flex-1" />
            <label className="flex items-center gap-1 text-xs text-muted">
              age
              <input
                value={k.age ?? ''}
                onChange={(e) => set(i, { age: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                inputMode="numeric"
                placeholder="—"
                aria-label={'Age of ' + (k.name || 'child ' + (i + 1))}
                data-testid={'kid-age-' + i}
                className="w-10 border-b border-line bg-transparent py-1 text-center text-base tabular-nums text-fg outline-none focus:border-accent"
              />
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        data-testid="kid-add"
        onClick={() => write([...kids, { name: '', g: 'm' }])}
        className="tap-target rounded border border-dashed border-line-strong px-4 py-3 text-sm text-muted transition hover:border-accent hover:text-accent"
      >
        {kids.length ? 'Add another' : 'Add a child'}
      </button>
      {/* Nobody has to have any, and saying so beats an empty list that looks unfinished. */}
      {!kids.length ? (
        <p className="text-xs leading-relaxed text-muted">
          Leave it empty and the card says you have none, which is a real answer.
        </p>
      ) : null}
    </div>
  )
}

function ColdSay({
  ask,
  answer,
  english,
  helpers,
  onSolved,
  onNext,
}: {
  ask: string
  answer: string
  /** What they are being asked to say, in English. See below. */
  english: string
  helpers?: Record<string, string>
  /** Banked the moment it is right, so leaving here cannot cost the sentence. */
  onSolved: (clean: boolean) => void
  /** Moving on, which is the learner's decision and not a consequence of being right. */
  onNext: () => void
}) {
  const [done, setDone] = useState(false)
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="eyebrow text-muted">NO CLUES</p>
        <p className="pt text-balance text-xl text-accent">{ask}</p>
        {/*
          WHAT THEY ARE BEING ASKED TO SAY, which was nowhere on this screen.

          It showed the Portuguese question and a pile of Portuguese tiles and nothing else,
          so somebody was asked to build a sentence with no statement of what the sentence
          meant. On "tens filhos?" that is guessable. On "falas português?", where the
          answer is a shape nobody would predict, it is a memory test with the question
          taken out — and this is the moment the product asks somebody to perform.

          NO CLUES still holds: the English is the ASK, not the answer in disguise. Knowing
          you are trying to say "I am learning. A little, but I try." is the task; producing
          it in Portuguese with nothing on screen to copy is still entirely on them.
        */}
        <p className="mt-1 text-sm leading-relaxed text-muted">{english}</p>
      </div>
      {/*
        Getting it right is not the same event as moving on.

        This called the parent's onDone straight out of onSolved, and the parent navigated
        — so the screen left in the same frame the sentence was completed. MiniBuild's done
        state, the banked row with the answer and its audio button, was rendered and
        replaced too fast to read. Nobody ever heard their own Legend sentence said back to
        them, on the one screen in the product where the sentence is theirs.

        Auto-check made it worse rather than causing it: the last tile now settles the line,
        so there was not even a tap on CHECK between finishing and the screen vanishing.

        The proof is still recorded at the instant it is right — leaving without pressing
        CONTINUE must not cost somebody a sentence they said.
      */}
      <MiniBuild
        target={answer}
        helpers={helpers}
        onSolved={({ clean }) => {
          setDone(true)
          onSolved(clean)
        }}
      />
      {done ? (
        <Dock>
          <button
            type="button"
            data-testid="legend-cold-next"
            onClick={onNext}
            className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink"
          >
            CONTINUE
          </button>
        </Dock>
      ) : (
        <div className="mt-auto" />
      )}
    </div>
  )
}

/**
 * The run-through, and the cold open.
 *
 * Rehearsal is the existing no-cue mechanic pointed at the learner's own sentences. The
 * cold open is one question with no warning and a beat of silence before the answer is
 * available — which is the exact half-second in a bar where you either have it or you do
 * not, and the only way to practise the thing that actually goes wrong.
 *
 * Never scored, never timed. A cold open you get wrong shows the answer and moves on: the
 * moment there is a score attached to being put on the spot, the feature becomes the
 * anxiety it exists to remove.
 */
/**
 * HOW MANY GOES BEFORE THE SCREEN STOPS ASKING.
 *
 * Sam: "after 5 goes they need to be given a we'll try again later message." Five, named
 * once, because it is asserted in scripts and read in two places on the card.
 *
 * It is not a limit and nothing is withheld at it: SHOW ME, LISTEN, COPY and NEXT all
 * still work, the Legend still opens, and the microphone is still there for anybody who
 * wants a sixth. What changes is that the product stops pretending the next attempt is
 * likely to be the one — see LEGEND_COPY.run_enough_head.
 */
const ENOUGH_GOES = 5

function RunThrough({
  cards,
  gender,
  valuesFor,
  owned,
  onDone,
}: {
  cards: LegendFrame[]
  gender: 'm' | 'f' | null
  valuesFor: (id: string) => Record<string, string> | undefined
  /** The pieces this learner has, so an unanswered card can say what it needs. */
  owned: string[]
  onDone: () => void
}) {
  /*
    ONE RUN, WHICH IS WHAT THE TWO BUTTONS WERE ALWAYS DESCRIBING.

    Yours offered SAY IT ALL, OUT LOUD and COLD, WITH NOTHING ON SCREEN, and Sam: "they are
    almost identical". They read that way because the words are about the same thing — you,
    out loud, from memory — while the actual difference was never in the words at all:

      SAY IT ALL   every card, in order, SHOW ME each time, nothing recorded
      COLD         slice(0, 1) — ONE card, shuffled, with the I SAID IT claim

    So one was the whole card and taught nothing, and the other was a single question
    wearing the name of the harder thing. And the claim the cold run existed to record —
    a `said_cold` counter, since deleted — was written and displayed nowhere, so the only
    outcome distinguishing the two was invisible to the person choosing between them.

    The run is now the union of what each was for: every card, shuffled, and the honest
    fork on every one. Shuffled because a run in the order you built them is a recital of a
    list; the whole claim is that you can say these things when they are asked, and they
    are not asked in your order.
  */
  /*
    THE CARD'S OWN ORDER, FROM THE TOP.

    Sam: "The legend run through needs to run through from the top (chamo-te) and step the
    user through each question."

    This shuffled, and the argument was that a run in the order you built them is a recital
    of a list. That argument is right about a REHEARSAL — somebody who has their seven and
    wants to prove it should be asked out of order, because a stranger will. It is wrong
    about the thing this screen actually has to be first: a walk through your card that
    shows you what is done and what is missing. You cannot step somebody through their
    Legend in a random order and call it stepping through.

    So the order is cardFor's, which starts at the name because that is how the card is
    authored and how every conversation this rehearses opens. Shuffling is worth bringing
    back as a SECOND mode once the card is complete — a "test me" to the walk-through's
    "show me" — but not at the cost of the walk, and not before the walk exists.
  */
  const order = cards

  const [i, setI] = useState(0)
  const [shown, setShown] = useState(false)
  /*
    WHAT THE MICROPHONE HEARD, AND HOW IT WENT.

    Sam: "I click say it out loud, the mic opens, but there is no call and response
    mechanic that says it has registered or checked what I have said. just a I said it
    button. It needs to mark my work."

    listenFor already returns all of this — the words it caught, whether they are close
    enough, and a score — and the screen threw the whole object away, keeping only
    `if (h.close) setShown(true)`. So the one part of the product that CAN check the
    learner's work silently declined to tell them the answer.

    Held here rather than inside SayButton because it is the screen's to render: the button
    is a 40px control that can afford a tick, and marking somebody's Portuguese needs the
    sentence they said, the sentence they meant, and a verdict in words.
  */
  const [heard, setHeard] = useState<Heard | null>(null)
  /*
    HOW MANY GOES AT THIS ONE, and what happens when it is plainly not working.

    Sam: "what happens if a user tries multiple times and keeps failing? after 5 goes they
    need to be given a we'll try again later message, but not block the legend opening. We
    need to flag to test again later."

    Nothing did. The microphone accepted attempt eleven with the same feedback as attempt
    one, which is a screen that has stopped paying attention to the person using it. Five
    is the point at which continuing to ask is no longer encouragement.

    COUNTED PER SENTENCE, NOT PER RUN — reset in the NEXT handler below alongside `shown`
    and `heard`, because a fresh question is a fresh five. A successful attempt resets it
    too: somebody who misses four times, lands it, and then misses again is not one go
    away from being told to give up.
  */
  const [goes, setGoes] = useState(0)
  /* For the come-back-to list on the done screen. Subscribed, so clearRough is seen. */
  const mine = useLearner()
  /* Hidden where the device cannot listen — see useCanListen. */
  const canSay = useCanListen()
  const frame = order[i]

  if (!frame) {
    /*
      WHAT THE RUN SET DOWN, named at the end of it.

      Sam: "we need to flag to test again later." The flag is written by markRough, and
      this is where the promise is visible — on the screen that exists precisely because
      the run is over, rather than as a panel on Legend Practise. Sam stripped that screen
      to the run and its text on purpose ("this entire screen is redundant other than the
      practise run"), and a list of outstanding sentences is exactly the kind of thing that
      regrew it last time.

      It is never a failure tally. No count, no score, and the line under it says plainly
      that nothing is blocked — because nothing is: the door reads the card, not the
      microphone.
    */
    const rough = mine.rough ?? []
    return (
      <div className="flex flex-1 flex-col justify-center gap-3">
        <p className="eyebrow text-accent">DONE</p>
        <p className="display text-balance text-2xl">All the way through, out loud.</p>
        {rough.length ? (
          <div
            data-testid="run-rough"
            className="mt-3 flex flex-col gap-2 rounded-2xl border border-line bg-bg-elev px-4 py-4"
          >
            <p className="eyebrow text-muted">{LEGEND_COPY.run_again_later}</p>
            {rough.map((r) => (
              <p key={r.pt} className="pt text-base text-fg">
                {r.pt}
              </p>
            ))}
            <p className="text-sm leading-relaxed text-muted">
              {LEGEND_COPY.run_again_later_note}
            </p>
          </div>
        ) : null}
        <Dock>
          <button
            type="button"
            onClick={onDone}
            className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink"
          >
            MY LEGEND
          </button>
        </Dock>
      </div>
    )
  }

  /*
    IS THIS ONE ANSWERED, and if not, what is holding it up?

    The run used to contain only answered frames, so neither question could arise. Now the
    card is walked whole and an unanswered step is the POINT of walking it — Sam: "when it
    is not pre-populated to go and get the word or words required."

    Two different reasons a frame can be unanswered, and they need different screens:
      · the words are not owned yet → Missing says which word and links to the vibe that
        teaches it, which is the GO AND GET IT that already exists on the deck
      · the words are owned, nobody has answered → it is answerable now, so the screen
        sends them to the card to answer it
  */
  const values = valuesFor(frame.id)
  const isDone = isAnswered(frame, values)
  const answer = fillFrame(frame, values ?? {}, gender)

  if (!isDone) {
    const ready = frameReady(frame, owned)
    return (
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-1 flex-col justify-center gap-3">
          <p className="eyebrow text-muted">
            {i + 1} OF {order.length}
          </p>
          <div className="flex items-center gap-3">
            <AudioButton
              slug={slugFor(askFor(frame, gender))}
              text={askFor(frame, gender)}
              size="sm"
            />
            <span className="pt min-w-0 text-xl text-accent">{askFor(frame, gender)}</span>
          </div>
          <p className="text-sm leading-relaxed text-muted">{frame.ask_en}</p>
          {/*
            NOT SILENTLY SKIPPED. A question the learner cannot yet answer is the most
            useful screen in the run — it is the only one that tells them what to do next.
          */}
          <p data-testid="run-unanswered" className="mt-2 text-sm leading-relaxed text-fg/85">
            {ready
              ? 'You have the words for this one. It just has not been answered yet.'
              : 'This one is not open yet — here is what it needs.'}
          </p>
          {!ready ? <Missing frame={frame} owned={owned} /> : null}
        </div>
        <Dock>
          {ready ? (
            <button
              type="button"
              data-testid="run-answer-it"
              onClick={onDone}
              className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink"
            >
              ANSWER IT
            </button>
          ) : null}
          {/* The walk continues either way: a blocked card does not end the run. */}
          <button
            type="button"
            data-testid="run-next"
            onClick={() => {
              setShown(false)
              /* Last question's verdict must not survive onto the next one. */
              setHeard(null)
              setI((n) => n + 1)
            }}
            className={
              'tap-target eyebrow w-full rounded px-5 py-3 text-center ' +
              (ready ? 'border border-line text-muted' : 'bg-accent text-accent-ink')
            }
          >
            {i + 1 < order.length ? 'NEXT QUESTION' : 'THAT IS THE CARD'}
          </button>
        </Dock>
      </div>
    )
  }

  /*
    ONE CARD, THREE STATES — which is what Sam asked for after looking at Hinge.

    Sam: "This first screen is very confusing and there is no visible relationship between
    say it loud and said it. The say it loud gives no indication it is listening or has
    heard or has any feedback. Then when you click I said it, everything looks clearer and
    I think maybe the first card completely redundant."

    He is right on all three. It was TWO screens — an ask with a tiny mic and two buttons,
    then a reveal — and the first did nothing the second could not do better. The mic was a
    40px circle beside a full-width button called I SAID IT, so the thing that can actually
    check your Portuguese looked like a decoration next to the thing that merely claims you
    said it.

    Now: the question at the size Hinge gives a question, a microphone that IS the control
    rather than an ornament beside one, and the answer revealed on the same card. No second
    screen, so there is nothing for the relationship between them to be unclear about.

    AND NOT EVERYBODY WANTS TO SPEAK. Sam: "bearing in mind a user may not want to say it
    loud but just see the correct response." SHOW ME is always there and always one tap. It
    reveals without recording, which is the honest trade — the microphone marks your work,
    this just shows you the answer.
  */
  /*
    ONE HANDLER FOR BOTH MICROPHONES.

    There are two SayButtons on this card — the big one before the answer is revealed and
    the small one beside it afterwards — and they were carrying two copies of the same
    four lines. The copies had already drifted once: only the first set `shown`. Attempt
    counting, the rough flag and the proof row all have to behave identically whether
    somebody spoke before looking or after, so they are written once here.
  */
  const took = (h: Heard, reveal: boolean) => {
    setHeard(h)
    if (reveal && h.said) setShown(true)
    if (h.close) {
      /* Landed, so it is no longer one to come back to, whenever it was flagged. */
      setGoes(0)
      clearRough(answer)
      recordProof({
        pt: answer,
        en: fillEnglish(frame, valuesFor(frame.id) ?? {}),
        source: 'legend',
        clean: true,
      })
      return
    }
    /*
      A REFUSED MICROPHONE IS NOT AN ATTEMPT, and SayButton does not call this for one —
      see the `blocked` branch there. What reaches this line is a real go at saying it,
      including a silent one, because silence on the fifth try is the same signal.
    */
    const next = goes + 1
    setGoes(next)
    if (next === ENOUGH_GOES) {
      markRough({
        pt: answer,
        en: fillEnglish(frame, valuesFor(frame.id) ?? {}),
        goes: next,
      })
    }
  }

  /*
    WHAT THE PANEL SAYS, derived rather than branched at the point of use.

    The old panel had the verdict inline as a nested ternary over `heard.close` and
    `heard.said` — two conditions for what is really one four-way question, which is why
    adding bands to it in place would have produced a ternary nobody could read.
  */
  const band = heard ? bandFor(heard) : null
  const verdict =
    band === 'got'
      ? LEGEND_COPY.run_got_it
      : band === 'nearly'
        ? LEGEND_COPY.run_nearly
        : band === 'some'
          ? LEGEND_COPY.run_some
          : band === 'no' && heard?.said
            ? LEGEND_COPY.run_not_quite
            : LEGEND_COPY.run_missed
  /*
    The words to aim at, shown only where they are useful. On a miss this bad the list
    would be the whole sentence, which is not feedback — that case gets SHOW ME instead.
  */
  const aim =
    heard && !heard.close && heard.said && (band === 'nearly' || band === 'some')
      ? missedWords(heard.said, answer)
      : []
  /* Said five times with nothing landing. The screen stops asking — see ENOUGH_GOES. */
  const enough = goes >= ENOUGH_GOES && !heard?.close

  return (
    /*
      ONE WHITE CARD ON THE SAND. Sam: "I also want to see this whole page on a white card
      with rounded corners on the sand background."

      The run-through is the one screen in DUB where everything on it belongs to a single
      question — the asking, the microphone, the marking and the answer — and it was laid
      out as four things stacked on the page background, each with its own border. Lifting
      the lot onto one surface says what the border could not: this is a card, there is one
      of them, and it is replaced when you move on.

      `bg-bg-elev` is the L*99 surface, which is the white in this palette; the shell
      behind it is `bg-bg`, the sand. Both flip together in dark mode, so the card stays a
      lift rather than becoming a bright hole — see the tokens in app/globals.css.
    */
    <div className="flex flex-1 flex-col rounded-2xl border border-line bg-bg-elev px-5 py-6 gap-6">
      <p className="eyebrow text-muted">
        {i + 1} OF {order.length}
      </p>

      {/*
        THE QUESTION, AT THE SIZE A QUESTION DESERVES. `t-ask` is 2.5rem and has been in
        globals.css since before today; this screen asked at text-xl, which is a caption.
      */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <AudioButton
            slug={slugFor(askFor(frame, gender))}
            text={askFor(frame, gender)}
            size="sm"
          />
          <h1 className="pt t-ask min-w-0 flex-1 text-accent">{askFor(frame, gender)}</h1>
        </div>
        <p className="text-base leading-relaxed text-muted">{frame.ask_en}</p>
      </div>

      {shown ? (
        /* The answer, in place, at the scale this product reserves for produced language. */
        <div className="animate-bank flex flex-col gap-3">
          <p className="eyebrow text-muted">YOURS</p>
          <p className="pt t-said">{answer}</p>
          {/*
            LISTEN, COPY, SAY — all three, on the answer too.

            Sam: "dont forget listen and copy - still totally valid routes." They are, and
            the say button was disappearing the moment the answer showed: a learner who
            tapped SHOW ME to see it, then wanted to try saying it, had nothing to press.
            Revealing is not a decision to stop speaking.

            Still marks the work. Saying it correctly after looking records the proof the
            same way — the gate asks for the sentence produced, and producing it with the
            answer on screen a moment ago is what rehearsal IS.
          */}
          <div className="flex items-center gap-3">
            <AudioButton slug={slugFor(answer)} text={answer} size="sm" />
            <CopyButton text={answer} size="sm" />
            {canSay ? (
              <SayButton want={answer} onHeard={(h) => took(h, false)} />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          {canSay ? (
            <>
              <SayButton want={answer} size="lg" onHeard={(h) => took(h, true)} />
              <p className="text-base text-muted">{LEGEND_COPY.run_say}</p>
            </>
          ) : (
            <p className="text-base leading-relaxed text-muted">{LEGEND_COPY.run_no_mic}</p>
          )}
        </div>
      )}

      {/*
        WHAT IT HEARD — the feedback that did not exist. Sam tapped the microphone and
        nothing on the page changed. Never a score: the words it caught, and whether that
        counted.
      */}
      {heard ? (
        <div
          data-testid="run-heard"
          /*
            On `surface` rather than `bg-elev` now, because the card underneath IS bg-elev
            — a panel the same colour as the thing it sits on is not a panel. `surface` is
            the inset token, which is the right read: this is a well in the card holding
            what came back.
          */
          className={
            'animate-bank rounded-xl border px-4 py-3 ' +
            (heard.close ? 'border-accent bg-accent/10' : 'border-line bg-surface')
          }
        >
          <p className={'eyebrow ' + (heard.close ? 'text-accent' : 'text-muted')}>{verdict}</p>
          {heard.said ? <p className="pt mt-1 text-lg text-fg">“{heard.said}”</p> : null}
          {/*
            AND WHICH WORDS TO AIM AT — the part a verdict cannot carry. Sam: "is there any
            way we can get the feedback a bit more advanced on the audio? at the moment it
            says just not quite." Only on the two middle bands: see `aim` above for why a
            bad miss gets SHOW ME instead of a list of the whole sentence.
          */}
          {aim.length ? (
            <p data-testid="run-aim" className="mt-2 text-sm leading-relaxed text-muted">
              {LEGEND_COPY.run_aim(aim)}
            </p>
          ) : null}
        </div>
      ) : null}

      {/*
        FIVE GOES, AND THEN THE PRODUCT ADMITS IT. Sam: "after 5 goes they need to be given
        a we'll try again later message, but not block the legend opening."

        Nothing below this is disabled by it. The microphone stays, SHOW ME stays, NEXT
        stays, and the Legend's door does not consult it — the sentence is written down
        with markRough so it can come round again, and that is the whole mechanism. See
        LEGEND_COPY.run_enough_head on why it blames the room before the learner.
      */}
      {enough ? (
        <div
          data-testid="run-enough"
          className="animate-bank flex flex-col gap-1 rounded-xl border border-line bg-surface px-4 py-3"
        >
          <p className="eyebrow text-fg">{LEGEND_COPY.run_enough_head}</p>
          <p className="text-sm leading-relaxed text-muted">{LEGEND_COPY.run_enough_body}</p>
        </div>
      ) : null}

      <Dock>
        {shown ? (
          <button
            type="button"
            data-testid="legend-next"
            onClick={() => {
              setShown(false)
              setHeard(null)
              /* A fresh question is a fresh five — see the note on `goes`. */
              setGoes(0)
              setI(i + 1)
            }}
            className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink"
          >
            {i + 1 < order.length ? LEGEND_COPY.run_next : LEGEND_COPY.run_last}
          </button>
        ) : (
          <button
            type="button"
            data-testid="legend-show"
            onClick={() => setShown(true)}
            className="tap-target eyebrow w-full rounded border border-line-strong px-5 py-3 text-center"
          >
            {LEGEND_COPY.run_show}
          </button>
        )}
        <button
          type="button"
          data-testid="legend-run-stop"
          onClick={onDone}
          className="tap-target text-center text-xs text-muted underline underline-offset-4"
        >
          Stop here — back to your Legend
        </button>
      </Dock>
    </div>
  )
}
