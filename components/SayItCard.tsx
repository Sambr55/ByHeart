'use client'

import { useEffect, useState } from 'react'
import { AudioButton } from '@/components/AudioButton'
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
  reveal = true,
  askIsPortuguese = true,
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
  /** Anything the beat puts under the card: a tile build, a link, a second route. */
  children?: React.ReactNode
}) {
  const [shown, setShown] = useState(false)
  const [heard, setHeard] = useState<Heard | null>(null)
  const [goes, setGoes] = useState(0)
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
  }, [answer])

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

      {shown ? (
        /* The answer, in place, at the scale reserved for produced language. */
        <div className="animate-bank flex flex-col gap-3">
          <p className="eyebrow text-muted">THE ANSWER</p>
          <p data-testid="say-answer" className="pt t-said">
            {answer}
          </p>
          {/*
            LISTEN, COPY, SAY — all three, on the answer too. Sam: "dont forget listen and
            copy - still totally valid routes." Revealing is not a decision to stop
            speaking, and saying it after looking still marks the work.
          */}
          <div className="flex items-center gap-3">
            <AudioButton slug={slugFor(answer)} text={answer} size="sm" />
            <CopyButton text={answer} size="sm" />
            {canSay ? <SayButton want={answer} onHeard={(h) => took(h, false)} /> : null}
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

      {/* SHOW ME, for anybody who does not want to speak. */}
      {reveal && !shown ? (
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

      {children}
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
