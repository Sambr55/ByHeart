'use client'

import { useEffect, useState } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { Dock } from '@/components/Dock'
import { CopyButton } from '@/components/CopyButton'
import { SayButton, useCanListen } from '@/components/SayButton'
import { bandFor, missedWords, type Heard } from '@/engine/listen'
import { clearRough, markRough } from '@/engine/learner'
import { LEGEND_COPY } from '@/content/legend'
import { slugFor } from '@/content/audio-manifest'

/**
 * ONE CARD THAT ASKS FOR A SENTENCE AND MARKS IT.
 *
 * Sam, on the run-through this is lifted out of: "I really like the size and clarity of
 * the text… overall, I feel much of our text, especially the explanatory text is too small
 * and perhaps too detailed." Then, after it was built: "do revise first."
 *
 * WHY IT IS A COMPONENT RATHER THAN A SECOND IMPLEMENTATION. DUB has two cold beats — the
 * Legend run-through and revision — and they are the same act: a question with nothing on
 * screen, a microphone, and whether you still have it. The run-through got four verdict
 * bands, a green tick, the words to aim at, a five-goes limit and a success ping;
 * revision got `if (!h.close) return`, which means a miss changed nothing on screen at
 * all. Writing the bands again in Revise would have made two definitions of what "nearly"
 * means, and they would have drifted — the same fault as `profile` and `legend[].values`
 * holding one answer in two places, which cost most of a day.
 *
 * WHAT IT DOES NOT OWN. Not the question's source, not what a success records, and not
 * where it goes next: a revision line records `source: 'release'` and advances the card,
 * the Legend records `source: 'legend'` and feeds the Club's door. Those are the callers'
 * to decide, so they arrive as props. This owns the asking, the marking and the reveal.
 *
 * AND NOT THE AUTO-ADVANCE, deliberately. The run-through moves on two seconds after a
 * tick because it is walking a fixed card of seven; revision is a pile of lines where the
 * caller decides what follows. `onClose` fires and the caller chooses — see Revise, which
 * advances, and the run-through, which keeps its own timer because it also has to reset
 * three pieces of state this component cannot see.
 */
export function SayItCard({
  ask,
  askEn,
  answer,
  answerEn,
  onClose,
  onShown,
  onNext,
  onBack,
  reveal = true,
  askIsPortuguese = true,
  buildFirst = false,
  children,
}: {
  /** The question, in whichever language this beat asks in. */
  ask: string
  /** The gloss under it, where the ask is Portuguese. Omitted where the ask is English. */
  askEn?: string
  /**
   * WHETHER THE QUESTION CAN BE HEARD, which depends on what language it is in.
   *
   * The Legend asks in Portuguese — "Como te chamas?" — so the question has audio and a
   * listen button beside it. The lesson's transfer prompt asks in ENGLISH ("Come with
   * me.") and the answer is the Portuguese. Drawing a listen button there would hand
   * slugFor an English string, which falls through to slugify and asks the speech engine
   * to read English in a Portuguese voice.
   *
   * It also decides the FACE. --accent is the Portuguese colour everywhere in this
   * product, and on the release beat the English cue is the thing being taken away — so
   * colouring it like the language would say the cue is what to learn.
   *
   * A prop rather than a guess: nothing here can reliably detect the language of a
   * string, and a heuristic that got it wrong would mispronounce the question on one beat
   * in twenty. Asserted in scripts/say-check.mts.
   */
  askIsPortuguese?: boolean
  /** What they are being asked to say. */
  answer: string
  /** For the proof row the caller writes, and nothing else here. */
  answerEn?: string
  /**
   * Said close enough. The caller records the proof and decides what happens next —
   * see the note above on why this component does not.
   */
  onClose: () => void
  /** Revealed, by SHOW ME or by having spoken. Lets a caller free a locked scroll. */
  onShown?: () => void
  /**
   * Whether SHOW ME is offered. False where the answer must not be given away — the
   * tile build in revision is the fallback, so the sentence is still reachable there.
   */
  reveal?: boolean
  /**
   * THE WORD PICKER FIRST, AND THE MICROPHONE AS THE REWARD FOR IT.
   *
   * Sam: "I think we need to reverse these so they do the word picker first, when that is
   * successful it reveals the Say it loud mechanic."
   *
   * WHY THE REVERSAL IS RIGHT ON A LESSON AND WRONG ON THE LEGEND. On the Legend you
   * already know the sentence — it is about you, you wrote it — so the microphone is the
   * whole point and tiles would be busywork. On a release beat you have just met the
   * words, and being asked to produce them from nothing is a wall: the learner who cannot
   * do it has no way to find out what they were supposed to say except by failing at the
   * microphone five times. The tiles teach it, and THEN saying it means something.
   *
   * It also fixes what the old order did to the proof number. Mic-first meant a learner
   * could say it correctly having never seen it, which is the best outcome — but the
   * common path was five misses and then tiles, so the beat's record of "said cold" was
   * mostly built out of tile taps. Build first, say second: the proof row is written by
   * somebody who has just demonstrated they know the sentence.
   */
  buildFirst?: boolean
  /**
   * The way on, once this sentence is done — and what the two-second wait calls.
   *
   * Absent means the beat has its own CONTINUE and this card draws no dock. Present means
   * the card owns the whole footer: back, the way on, and the arrow that overrides the
   * wait. See the dock below.
   */
  onNext?: () => void
  /** Back, where there is anywhere to go. Hidden rather than disabled when absent. */
  onBack?: () => void
  /**
   * Anything the beat puts under the card: a tile build, a link, a second route.
   *
   * On a buildFirst beat this is where the word picker goes, and it STAYS there after it
   * is solved — see `built`. The caller tells this card the picker succeeded by calling
   * the function it is handed.
   */
  children?: React.ReactNode | ((api: { solved: () => void; built: boolean }) => React.ReactNode)
}) {
  const [shown, setShown] = useState(false)
  const [heard, setHeard] = useState<Heard | null>(null)
  const [goes, setGoes] = useState(0)
  /*
    WHETHER THE WORD PICKER HAS BEEN SOLVED, where it comes first.

    Sam: "when that is successful it reveals the Say it loud mechanic." So on a buildFirst
    beat the microphone does not exist until this is true — and once it is, it stays true:
    NOTHING IS TAKEN AWAY. Sam, immediately after: "but dont drop the word picker or copy
    / listen." The tiles stay on screen with the sentence they built still in them, and
    the listen and copy controls arrive alongside the microphone rather than instead of
    anything. The card only ever gains.
  */
  const [built, setBuilt] = useState(false)
  const canSay = useCanListen()

  /*
    A NEW SENTENCE IS A NEW CARD. The caller re-keys this component per line, which resets
    all of it — but a caller that forgets would carry a tick from the last sentence onto
    the next one, so the reset is here as well and costs nothing.
  */
  useEffect(() => {
    setShown(false)
    setHeard(null)
    setGoes(0)
    setBuilt(false)
  }, [answer])

  /*
    TWO SECONDS AFTER A TICK, IT MOVES ON — the Legend run's behaviour, in the one place
    both screens read it from. Sam: "same two seconds swipe right after success or swipe
    right override if they are quicker, removing continue CTA's."

    The reading pause is deliberately NOT on the 120/260/420/620 motion scale: those are
    durations of movement and this is time to look at what you produced. The longest step
    is 620ms, which would take the card away before the eye had finished with it.

    Cancelled by any manual move, because `onNext` identity changes with the beat and the
    cleanup clears the timer — without that a learner who taps the arrow is advanced
    twice, once by the tap and once by the timer still running.
  */
  const closed = heard?.close ?? false
  useEffect(() => {
    if (!closed || !onNext) return
    const t = window.setTimeout(() => onNext(), 2000)
    return () => window.clearTimeout(t)
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- onNext is per-beat */
  }, [closed, answer])

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
    The words to aim at, on the two middle bands only. On a worse miss the list would be
    the whole sentence, which is not feedback — that case wants the answer instead.
  */
  const aim =
    heard && !heard.close && heard.said && (band === 'nearly' || band === 'some')
      ? missedWords(heard.said, answer)
      : []
  const enough = goes >= ENOUGH_GOES && !heard?.close
  /*
    THE THIRD GO, where somebody decides whether this is worth continuing.

    Sam: "as soon as they get to their third attempt they need some encouraging text." Five
    had a line and the middle had nothing, so attempts three and four were the same silent
    repetition as attempt one — which is exactly where a learner concludes the microphone
    is broken. Shown FROM the third until the fifth takes over, rather than on three alone:
    a notice that appears and vanishes while the situation has not changed reads as a
    glitch. See LEGEND_COPY.run_third_head.
  */
  const stubborn = goes >= 3 && goes < ENOUGH_GOES && !heard?.close
  /*
    IS THE MICROPHONE OFFERED YET? On a buildFirst beat, not until the tiles are solved —
    that is the reversal. Everywhere else, immediately.
  */
  const sayable = canSay && (!buildFirst || built)

  const took = (h: Heard, reveals: boolean) => {
    setHeard(h)
    if (reveals && h.said) {
      setShown(true)
      onShown?.()
    }
    if (h.close) {
      setGoes(0)
      clearRough(answer)
      onClose()
      return
    }
    /*
      A refused microphone is not an attempt — SayButton does not call this for one. What
      reaches here is a real go, including a silent one, because silence on the fifth try
      is the same signal.
    */
    const next = goes + 1
    setGoes(next)
    if (next === ENOUGH_GOES) markRough({ pt: answer, en: answerEn ?? ask, goes: next })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 rounded-2xl border border-line bg-bg-elev px-5 py-6">
      {/* The question, at the size a question deserves rather than at caption size. */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          {askIsPortuguese ? <AudioButton slug={slugFor(ask)} text={ask} size="sm" /> : null}
          <h1
            data-testid="say-ask"
            className={
              't-ask min-w-0 flex-1 ' + (askIsPortuguese ? 'pt text-accent' : 'text-fg')
            }
          >
            {ask}
          </h1>
        </div>
        {askEn ? <p className="text-base leading-relaxed text-muted">{askEn}</p> : null}
      </div>

      {/*
        THE VERDICT SITS ABOVE THE MICROPHONE, NOT UNDER IT.

        Sam: "i tried this audio about 10 times and it failed - my pronunciation isnt that
        bad!" and "We have lost the feedback panel."

        It was never lost. It rendered after the microphone and after the word picker, so
        on a 390px screen it was two blocks below the fold — he pressed the button ten
        times and every answer the product gave him was off screen. A verdict nobody sees
        is the same as no verdict, and worse, because the product believes it has spoken.

        Above, because the eye is already there: the control that was just pressed is what
        somebody is looking at, and the answer belongs in the same place.
      */}
      {/* What it heard: the verdict, the words it caught, and where to aim. */}
      {heard ? (
        <div
          data-testid="say-heard"
          className={
            'animate-bank rounded-xl border px-4 py-3 ' +
            (heard.close ? 'border-accent bg-accent/10' : 'border-line bg-surface')
          }
        >
          <p className={'eyebrow ' + (heard.close ? 'text-accent' : 'text-muted')}>{verdict}</p>
          {heard.said ? <p className="pt mt-1 text-lg text-fg">“{heard.said}”</p> : null}
          {aim.length ? (
            <p data-testid="say-aim" className="mt-2 text-sm leading-relaxed text-muted">
              {LEGEND_COPY.run_aim(aim)}
            </p>
          ) : null}
          {/*
            THE WAY BACK IN. Sam: "add a try again message to failed spoken audio." The
            verdict diagnosed and stopped; this names the control to press. Hidden once
            five goes have been reached, where the screen has deliberately stopped asking
            — see run_try_again.
          */}
          {!heard.close && !enough ? (
            <p data-testid="say-again" className="eyebrow mt-2 text-accent">
              {LEGEND_COPY.run_try_again}
            </p>
          ) : null}
        </div>
      ) : null}

      {/*
        THE THIRD GO. Sam: "as soon as they get to their third attempt they need some
        encouraging text." It names the instrument rather than the learner — see
        run_third_head — and gives way to the five-goes notice rather than stacking with it.
      */}
      {stubborn ? (
        <div
          data-testid="say-stubborn"
          className="animate-bank flex flex-col gap-1 rounded-xl border border-line bg-surface px-4 py-3"
        >
          <p className="eyebrow text-fg">{LEGEND_COPY.run_third_head}</p>
          <p className="text-sm leading-relaxed text-muted">{LEGEND_COPY.run_third_body}</p>
        </div>
      ) : null}

      {/*
        Five goes and the screen stops asking. Nothing is withheld by it — the microphone,
        the reveal and whatever the caller puts below all still work. See run_enough_head.
      */}
      {enough ? (
        <div
          data-testid="say-enough"
          className="animate-bank flex flex-col gap-1 rounded-xl border border-line bg-surface px-4 py-3"
        >
          <p className="eyebrow text-fg">{LEGEND_COPY.run_enough_head}</p>
          <p className="text-sm leading-relaxed text-muted">{LEGEND_COPY.run_enough_body}</p>
        </div>
      ) : null}

      {shown || built ? (
        /*
          THE SENTENCE, AND EVERY ROUTE THROUGH IT — nothing replaced.

          Sam: "but dont drop the word picker or copy / listen." So this block is additive:
          it appears when the answer is revealed OR when the tiles have been solved, and in
          the buildFirst case the tiles themselves are still below with the sentence the
          learner assembled still in them. Listen, copy and the microphone sit together,
          which is the "listen, copy or say" triple the product has offered since the
          feature was asked for.

          `t-said` only where the learner has not built it, because on a buildFirst beat
          the sentence is already large in the tiles and printing it again at 2.975rem
          directly above them is the same words twice in two sizes.
        */
        <div className="animate-bank flex flex-col gap-3">
          <p className="eyebrow text-muted">{built && !shown ? 'YOU BUILT IT' : 'THE ANSWER'}</p>
          {shown ? (
            <p data-testid="say-answer" className="pt t-said">
              {answer}
            </p>
          ) : (
            <p data-testid="say-answer" className="pt text-2xl">
              {answer}
            </p>
          )}
          <div className="flex items-center gap-3">
            <AudioButton slug={slugFor(answer)} text={answer} size="sm" />
            <CopyButton text={answer} size="sm" />
            {/*
              THE MICROPHONE, AT FULL SIZE WHERE IT IS THE POINT.

              On a buildFirst beat this is the moment it arrives — Sam: "when that is
              successful it reveals the Say it loud mechanic" — so it is the large control
              rather than a 48px circle in a row of three, with the words under it. On a
              reveal it stays small, because there the learner has already had the big one.
            */}
            {sayable && shown ? <SayButton want={answer} onHeard={(h) => took(h, false)} /> : null}
          </div>
          {sayable && !shown ? (
            <div className="flex flex-col items-center gap-3 pt-2">
              <SayButton want={answer} size="lg" onHeard={(h) => took(h, false)} />
              <p className="text-base text-muted">{LEGEND_COPY.run_say}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          {sayable ? (
            <>
              <SayButton want={answer} size="lg" onHeard={(h) => took(h, true)} />
              <p className="text-base text-muted">{LEGEND_COPY.run_say}</p>
            </>
          ) : buildFirst ? (
            /*
              BEFORE THE TILES ARE SOLVED, nothing is said about speaking at all — the
              microphone is not yet earned and naming it here would be an instruction to
              do something impossible. The tiles below are the whole screen at this point.
            */
            null
          ) : (
            /*
              WHAT A LEARNER WITH NO MICROPHONE IS TOLD, and it depends on whether this
              beat has a reveal. run_no_mic sends them to SHOW ME; a revision has none, so
              it points at the fallback the caller put below instead. Asserted in
              scripts/say-check.mts — see the note on run_no_mic_build.
            */
            <p className="text-base leading-relaxed text-muted">
              {reveal ? LEGEND_COPY.run_no_mic : LEGEND_COPY.run_no_mic_build}
            </p>
          )}
        </div>
      )}

      {/*
        SHOW ME, for anybody who does not want to speak — and only where this card has no
        dock. With a dock it moves into it, beside the arrow, exactly as the Legend run
        has it.
      */}
      {reveal && !shown && !onNext ? (
        <button
          type="button"
          data-testid="say-show"
          onClick={() => {
            setShown(true)
            onShown?.()
          }}
          className="tap-target eyebrow w-full rounded border border-line-strong px-4 py-3 text-center"
        >
          {LEGEND_COPY.run_show}
        </button>
      ) : null}

      {/*
        THE PICKER LEAVES WHEN THE AUDIO TEST ARRIVES.

        Sam: "The previous screen is the word picker of ola bom dia, we dont need to repeat
        it in this screen. Sequence: Word picker, success message, two second auto swipe
        with optional swipe button loads audio test only - remove word picker."

        It used to stay. That came from his own earlier instruction — "but dont drop the
        word picker or copy / listen" — which was right about the REVEAL and wrong once the
        picker is solved: the tiles are then a finished puzzle sitting above a microphone,
        and on a 390px screen they pushed the feedback panel below the fold. So he pressed
        the microphone ten times and never saw what it heard. "We have lost the feedback
        panel" is exactly that: not lost, just under the thing it was meant to replace.

        Listen and copy do not go — they move up beside the answer, which is where he
        wanted them and where they are now.

        On a beat with no picker (the Legend run, a revision) nothing changes: `built` is
        only ever set by a caller that has one.
      */}
      {buildFirst && built
        ? null
        : typeof children === 'function'
          ? children({ solved: () => setBuilt(true), built })
          : children}

      {/*
        THE DOCK, AND IT IS THE LEGEND RUN'S DOCK. Sam: "use what we built in legend as
        your template… same two seconds swipe right after success or swipe right override
        if they are quicker, removing continue CTA's."

        ONE ROW: back at one edge, the way on at the other, and the only worded control in
        the middle. Three stacked full-width buttons is the scrolling the Legend redesign
        existed to remove, and a CONTINUE bar under a card that has just grown a question,
        an answer, a verdict panel and sometimes two notices is what pushes it over.

        Drawn only where the beat hands over `onNext`. A beat that keeps its own CONTINUE
        gets no dock from here, because two docks portal into one slot and the second wins.
      */}
      {onNext ? (
        <Dock>
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                type="button"
                data-testid="say-back"
                aria-label="Back to the one before"
                onClick={onBack}
                className="tap-target flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line text-muted"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              /* Holds the arrow at the edge, so it does not jump inwards on the first one. */
              <span className="h-12 w-12 shrink-0" />
            )}

            {reveal && !shown ? (
              <button
                type="button"
                data-testid="say-show"
                onClick={() => {
                  setShown(true)
                  onShown?.()
                }}
                className="tap-target eyebrow flex-1 rounded border border-line-strong px-4 py-3 text-center"
              >
                {LEGEND_COPY.run_show}
              </button>
            ) : (
              <span className="flex-1" />
            )}

            {/*
              FORWARD, NUDGING WHILE THE CLOCK RUNS. The animation is the override signal:
              it moves only during the two seconds, so it reads as "or now, if you like"
              rather than as decoration. Green at that moment because it is continuing a
              success; outlined otherwise, when it is just the way on.
            */}
            <button
              type="button"
              data-testid="say-next"
              aria-label="Next"
              onClick={onNext}
              className={
                'tap-target flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ' +
                (closed ? 'border-correct bg-correct text-correct-ink' : 'border-line text-muted')
              }
            >
              <svg
                viewBox="0 0 24 24"
                className={'h-5 w-5' + (closed ? ' nudge-right' : '')}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </Dock>
      ) : null}
    </div>
  )
}

/**
 * HOW MANY GOES BEFORE THE SCREEN STOPS ASKING.
 *
 * Sam: "after 5 goes they need to be given a we'll try again later message." Five, and it
 * is not a limit: nothing is withheld at it and no door consults it. What changes is that
 * the product stops pretending the next attempt is likely to be the one.
 */
const ENOUGH_GOES = 5
