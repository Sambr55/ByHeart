'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { Tick } from '@/components/Tick'
import { slugFor } from '@/content/audio-manifest'
import { CopyButton } from '@/components/CopyButton'
import { Lens } from '@/components/Lens'
import { registerFor } from '@/content/roots'
import { track } from '@/engine/analytics'
import { keepAsk, loadLearner } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'
import { StatusBar } from '@/components/Native'

/* Things people need to say, for an empty pass. */
const TRIES = ['Can I have the bill, please?', 'Do you have a table for two?', 'Where is the nearest pharmacy?']

/**
 * "How do I say…", from anywhere, once you are in the Club.
 *
 * The gap this closes is the one every learning product leaves open: DUB decides what to
 * teach, and a person standing at a counter needs a sentence DUB has not got to yet. Until
 * now the only honest answer was to leave and open Google Translate — which is where a
 * learner discovers that the internet's Portuguese is Brazilian, and takes it back to a
 * conversation in Lisbon.
 *
 * Floating rather than a fifth tab, because the four tabs are places you go and this is
 * something you do while you are somewhere. A tab would also make it a destination, and a
 * translator you have to navigate to is a translator you use instead of DUB rather than
 * inside it.
 *
 * Gated on the Club for two reasons that happen to agree. It is a metered API and the gate
 * is the cheapest possible protection against a stranger spending money; and a learner in
 * their first twenty minutes is meant to be finding out that they can already say more
 * than they thought, which is exactly the discovery a translate box is best at ruining.
 */
type Result = { pt: string; en: string; note: string; id: number | null; left: number }

export function Translator() {
  const learner = useLearner()
  const [on, setOn] = useState(false)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'asking' | 'done' | 'failed'>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [why, setWhy] = useState('')
  const [kept, setKept] = useState(false)
  /** The camera, over the panel rather than instead of it — CLOSE goes back to the box. */
  const [lens, setLens] = useState(false)
  /*
    ASKED FOR ON SOMEBODY ELSE'S BEHALF.

    The Legend's work slot offers ten fields and a person whose job is not one of them —
    advertising, say — has nothing to pick. It cannot be a plain text box either: the frame
    is "Trabalho com {thing}" and a bare box asks the learner to do the translating, which
    is the exact complaint that turned this slot into a pick list in the first place.

    So the slot borrows the translator. `want` carries who asked and what for, and when it
    is set the panel offers USE THIS WORD alongside KEEP — the result goes back to the
    caller instead of only into the asked list.
  */
  const [want, setWant] = useState<{ for: string; hint: string } | null>(null)
  const box = useRef<HTMLTextAreaElement>(null)

  /*
    The server decides whether this exists.

    Only it knows whether an API key is configured, and a floating button that opens a
    panel which can only apologise is worse than no button — it costs a tap and teaches
    somebody the product is broken.
  */
  useEffect(() => {
    let live = true
    fetch('/api/translate')
      .then((r) => r.json())
      .then((d: { on?: boolean }) => {
        if (live) setOn(Boolean(d.on))
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])

  /*
    SET UP, NOT A MEMBER — and the promise in the sequence is why.

    This was gated on clubOpen: Legend finished and rung two reached. Which made ASK a
    member benefit, and coherent as one, right up until the intro sequence started selling
    it. A stranger now meets "the sentence we have not taught you yet" on card eleven, with
    a worked example, and then cannot find it for five crates. A card that promises a thing
    the product will not give you for a fortnight is the kind of small lie a person
    remembers.

    So it opens at set-up: chosen a city, said why they are here, agreed the deal. That is
    also the answer to what the free lookaround is FOR — of everything in the Club, the
    translator is the one thing that is useful to somebody on day one, because it works on
    whatever they happen to need rather than on what they have earned.

    THE SPEND IS BOUNDED, which is what makes this safe to do. Sixty asks a day per device,
    counted off rows in `translation` rather than held in a process a serverless platform is
    free to recycle between two requests — see app/api/translate/route.ts.
  */
  const setUp = Boolean(learner.deal_accepted_at)

  /*
    THE KEYBOARD NO LONGER COMES UP BY ITSELF.

    Focusing the box on open was right when typing was the only way to ask. There are two
    ways now, and forcing the keyboard up hides the lower half of the panel — including the
    camera button, which is the one somebody was told to look for. Reported with a
    screenshot of exactly that: a keyboard covering the thing the message pointed at.

    Tapping the box still opens it, which is the gesture everybody already has. What has
    gone is the product deciding on somebody's behalf which of its two doors they wanted.
  */

  /*
    Opened from elsewhere, because the feed asks from its own rail.

    A DOM event rather than context or a store: the translator is mounted once at the root
    and the rail is rendered per card, so threading a callback between them would mean
    passing it through every card in the feed to reach a button that already exists.
  */
  useEffect(() => {
    /* `detail.text`, when given, arrives typed in — the Vocab dead end sends its search. */
    const ask = (e: Event) => {
      const seed = (e as CustomEvent<{ text?: string } | undefined>).detail?.text
      setWant(null)
      if (seed) {
        setResult(null)
        setKept(false)
        setState('idle')
        setText(seed)
      }
      setOpen(true)
    }
    /*
      The same panel, asked for one word rather than a sentence.

      detail carries `for` (an id the caller listens back on) and `hint` (what to put in the
      box). Everything else about the panel is unchanged, which is the point: one translator,
      one API call, one set of rules about register — the difference is only what happens to
      the answer.
    */
    const want1 = (e: Event) => {
      const d = (e as CustomEvent<{ for: string; hint: string; seed?: string }>).detail
      if (!d?.for) return
      setResult(null)
      setKept(false)
      setState('idle')
      setText(d.seed ?? '')
      setWant({ for: d.for, hint: d.hint })
      setOpen(true)
    }
    window.addEventListener('dub:ask', ask)
    window.addEventListener('dub:ask-word', want1)
    return () => {
      window.removeEventListener('dub:ask', ask)
      window.removeEventListener('dub:ask-word', want1)
    }
  }, [])

  /*
    Going somewhere closes it, because going somewhere is what it stopped preventing.

    The panel is mounted at the root and survives a route change, so with the bar now
    reachable a tap on VIBES would leave it hanging over a screen nobody asked it to be on.
    Leaving IS the dismissal; there is no second gesture to learn.
  */
  const path = usePathname()
  useEffect(() => {
    setOpen(false)
    /*
      And the camera with it. The Lens unmounts either way — it lives inside this panel's
      tree — but saying so here means the camera is never left running by a code path
      somebody adds later that closes the panel a different way.
    */
    setLens(false)
  }, [path])

  // Esc closes, because a panel over the whole screen that only closes by aiming at a
  // small X is a panel people learn to avoid opening.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // The camera is on top, so it is what Escape means while it is open.
      if (lens) setLens(false)
      else setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, lens])

  if (!on || !setUp) return null

  async function ask() {
    const asking = text.trim()
    if (!asking || state === 'asking') return
    setState('asking')
    setWhy('')
    setKept(false)
    track('translate_ask', { chars: asking.length })
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: asking,
          // The same register the lessons are teaching this learner. A translator that
          // hands back você to somebody being taught tu contradicts the screen they were
          // on ninety seconds ago.
          register: registerFor(loadLearner().profile?.age_band),
          // And the ending they say: "I'm tired" is cansada from a woman (lib/translate.ts).
          speaker: loadLearner().profile?.gender ?? null,
        }),
      })
      const data = (await res.json()) as Result & { error?: string; why?: string }
      if (!res.ok || data.error) {
        setWhy(data.why ?? 'Could not reach the translator.')
        setState('failed')
        return
      }
      setResult(data)
      setState('done')
    } catch {
      setWhy('No connection. This one needs the internet.')
      setState('failed')
    }
  }

  function keep() {
    if (!result || kept) return
    keepAsk({ pt: result.pt, en: result.en, note: result.note })
    setKept(true)
    track('translate_kept', {})
    // Best-effort, and never blocking: the sentence is already on the learner's device.
    if (typeof result.id === 'number') {
      void fetch('/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ keep: result.id }),
      }).catch(() => {})
    }
  }

  function again() {
    setText('')
    setResult(null)
    setKept(false)
    setState('idle')
    box.current?.focus()
  }

  /*
    NO FLOATING BUTTON ANY MORE, because ASK is the door.

    This rendered a round accent button on every screen in the product — it lives in the
    root layout — and the bottom bar has carried an ASK tab that opens this same panel for
    some time. Two doors to one thing, one of them hovering over the corner of every
    screen in the app. Sam: "remove all instances of teh floating translater icon that is
    now in teh club nav."

    Nothing is lost: ASK dispatches `dub:ask`, which the effect above listens for, and
    `dub:ask-word` still opens it pre-filled from a word somewhere else in the product.
    Closed, this component now renders nothing at all and waits.
  */
  if (!open) return null

  const PLANE =
    'M14 0 Q13 -1.6 10 -1.6 L2 -1.6 L-5 -10 L-8.5 -10 L-3 -1.6 L-10 -1.6 L-13 -5.5 L-15.5 -5.5 L-14 -1 L-14 1 L-15.5 5.5 L-13 5.5 L-10 1.6 L-3 1.6 L-8.5 10 L-5 10 L2 1.6 L10 1.6 Q13 1.6 14 0 Z'
  const CAMERA = (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </>
  )
  /* The gold button from the booker and the boarding pass, so the three read as one journey. */
  const GOLD =
    'tap-target eyebrow flex w-full items-center justify-center gap-3 rounded-2xl bg-[#e5b04a] px-5 py-4 text-base text-[#14243a] shadow-[0_6px_0_0_rgba(0,0,0,0.35)] transition active:translate-y-[4px] active:shadow-none disabled:opacity-40 disabled:shadow-none'
  const QUIET =
    'tap-target eyebrow w-full rounded-2xl border border-white/25 px-5 py-3 text-center text-white/80 disabled:opacity-60'
  const empty = state === 'idle' && !text.trim() && !result

  return (
    /*
      THE BOARDING PASS (Sam, 2026-11-04): "This screen needs to be much sexier, designed with
      the same vibe as the airline screens. It's another crucial function."

      So it is one: the night ground of the booker, and a pass you write on. The top half is
      what you want to say (FROM · English), the perforation, and the bottom half is where
      the Portuguese lands (TO · Português) — the answer is the thing they came for, so it
      gets the pass's biggest type. The gold button is the booker's.

      THE GEOMETRY IS UNCHANGED, and it was hard won: the box stops above the bar so the bar
      stays tappable (it is how you leave), a fill covers the keyboard's strip so nothing
      shows through, z-50 is the bar's own layer, not a new one. Height comes from
      --bar-room and --keyboard, the values .app-frame uses. Not modal, so no aria-modal.
    */
    <div
      data-testid="translator"
      role="dialog"
      aria-label="How do I say"
      className="booker fixed inset-x-0 top-0 z-50 flex flex-col text-white"
      style={{ bottom: 'calc(var(--bar-room) + var(--keyboard))' }}
    >
      <StatusBar color="#0f1f33" />
      {/* The ground under the keyboard's strip: never a window onto the last screen. */}
      <span
        aria-hidden
        data-testid="translator-floor"
        className="pointer-events-none fixed inset-x-0 z-[1] bg-[#0f1f33]"
        style={{ top: 'auto', bottom: 'var(--bar-room)', height: 'var(--keyboard)' }}
      />

      <header className="safe-top flex items-center justify-between gap-3 px-5 pb-1 pt-3">
        <p className="eyebrow text-white/60">DUB · How do I say</p>
        <span className="flex-1" />
        {/* The camera lives with the translator because it IS the translator — the same
            question asked by pointing, metered from the same allowance. */}
        <button
          type="button"
          aria-label="Read something with the camera"
          data-testid="translator-lens"
          onClick={() => {
            track('lens_opened', {})
            setLens(true)
          }}
          className="tap-target px-2 text-white/80"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            {CAMERA}
          </svg>
        </button>
        <button
          type="button"
          data-testid="translator-close"
          onClick={() => setOpen(false)}
          className="tap-target eyebrow px-2 text-white/80"
        >
          CLOSE
        </button>
      </header>

      {lens ? <Lens onClose={() => setLens(false)} /> : null}

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 overflow-y-auto px-5 pb-6 pt-2">
        <h1 className="translator-title display shrink-0 text-3xl leading-tight">{want ? 'Find the word' : 'What do you need to say?'}</h1>

        {/*
          shrink-0 ON EVERYTHING IN THIS COLUMN (2026-11-04). The column is a flex scroller, and
          flex children shrink by default: when the keyboard opened and the panel got shorter,
          the pass — overflow-hidden — was squeezed to nothing, so tapping the box made the
          whole ticket vanish under the finger. Sam: "When you click in to translate from it
          immediately closes." Now they keep their height and the column scrolls.
        */}
        <div className="shrink-0 overflow-hidden rounded-3xl bg-[#fbf8f2] text-[#14243a] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]">
          {/* The route: EN ✈ PT, the same strip the check-in carries. */}
          <div className="flex items-center justify-between gap-3 bg-[#14243a] px-5 py-3 text-white">
            <span className="flex items-center gap-2">
              <span className="display text-xl leading-none">EN</span>
              <svg
                viewBox="-16 -11 31 22"
                className={'h-4 w-6 text-[#e5b04a] ' + (state === 'asking' ? 'translator-flying' : '')}
                aria-hidden="true"
              >
                <path d={PLANE} fill="currentColor" />
              </svg>
              <span className="display text-xl leading-none text-[#9cc6ea]">PT</span>
            </span>
            <span className="text-right text-xs text-white/70">Português de Portugal</span>
          </div>

          {/* FROM: what they want to say. Typed into the pass, not into a form field. */}
          <div className="flex flex-col gap-1 px-5 pb-4 pt-4">
            <label htmlFor="ask" className="eyebrow text-[0.6rem] text-[#14243a]/50">
              From · English, or Portuguese to check
            </label>
            <textarea
              id="ask"
              ref={box}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends. A translator is one line, and a newline in it means nothing.
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void ask()
                }
              }}
              rows={2}
              maxLength={300}
              data-testid="translator-input"
              /* What the caller asked for, when one did: "I'd like to pay by card" is the
                 wrong prompt when the answer has to be one noun. */
              placeholder={want ? want.hint : "I'd like to pay by card"}
              className="display w-full resize-none border-0 border-b-2 border-[#14243a]/15 bg-transparent px-0 pb-2 pt-1 text-2xl leading-snug text-[#14243a] outline-none placeholder:text-[#14243a]/30 focus:border-[#1f5c8f]"
            />
          </div>

          {/* The perforation, notched like the check-in pass. */}
          <div className="relative flex items-center" aria-hidden="true">
            <span className="absolute -left-3 h-6 w-6 rounded-full bg-[#0f1f33]" />
            <span className="mx-4 h-px flex-1 border-t-2 border-dashed border-[#14243a]/15" />
            <span className="absolute -right-3 h-6 w-6 rounded-full bg-[#0f1f33]" />
          </div>

          {/* TO: where the Portuguese lands. */}
          <div className="flex min-h-[8.5rem] flex-col gap-2 px-5 pb-5 pt-4" aria-live="polite">
            <p className="eyebrow text-[0.6rem] text-[#14243a]/50">To · Português</p>

            {state === 'asking' ? (
              <p className="display text-2xl text-[#14243a]/35" data-testid="translator-asking">
                Translating…
              </p>
            ) : state === 'failed' ? (
              <p data-testid="translator-why" className="text-sm text-[#a5432a]">
                {why}
              </p>
            ) : state === 'done' && result ? (
              <div data-testid="translator-result" className="animate-bank flex flex-col gap-3">
                {result.pt ? (
                  <>
                    <p className="pt display text-balance text-[1.9rem] font-semibold leading-tight text-[#1f5c8f]" lang="pt-PT">
                      {result.pt}
                    </p>
                    <div className="flex items-center gap-3">
                      <AudioButton slug={slugFor(result.pt)} text={result.pt} size="sm" />
                      {/* The commonest thing to do with a looked-up sentence is send it. */}
                      <CopyButton text={result.pt} size="sm" />
                      <span className="flex-1" />
                      <Tick className="text-correct" />
                    </div>
                    {result.note ? (
                      <p className="border-t border-[#14243a]/10 pt-3 text-sm leading-relaxed text-[#14243a]/65">
                        {result.note}
                      </p>
                    ) : null}
                  </>
                ) : (
                  /* The model refuses by returning no Portuguese and a reason, shown as written. */
                  <p className="text-sm text-[#a5432a]">{result.note || 'Nothing to translate there.'}</p>
                )}
              </div>
            ) : (
              <div className="flex items-end justify-between gap-4">
                <p className="display text-2xl text-[#14243a]/25">Your Portuguese lands here</p>
                <span aria-hidden className="booker-barcode h-10 w-16 shrink-0 rounded-sm opacity-30 invert" />
              </div>
            )}
          </div>
        </div>

        {/*
          THE CAMERA, SAID IN WORDS, under the thing it is the alternative to: type it, or
          point at it. The header icon stays for anybody who has learned it.
        */}
        <button
          type="button"
          data-testid="translator-lens-wide"
          onClick={() => {
            track('lens_opened', {})
            setLens(true)
          }}
          className="tap-target flex w-full shrink-0 items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/90 transition hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#e5b04a]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            {CAMERA}
          </svg>
          Or point the camera at a menu or a sign
        </button>

        {/*
          SOMETHING TO TRY, on an empty pass: three things people actually need to say,
          one tap to put them on the ticket. An empty box is the hardest thing to start.
        */}
        {empty && !want ? (
          <div className="flex shrink-0 flex-col gap-2" data-testid="translator-tries">
            <p className="eyebrow text-[0.6rem] text-white/45">Or try</p>
            <div className="flex flex-wrap gap-2">
              {TRIES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setText(t)
                    box.current?.focus()
                  }}
                  className="tap-target rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex shrink-0 flex-col gap-3 pt-2">
          {state === 'done' && result?.pt ? (
            <>
              {/*
                THE ANSWER GOES BACK TO WHOEVER ASKED, when somebody asked — first, in gold,
                because for a caller this IS the action. Sent as the model gave it; the
                caller trims the article and the stop, since it knows its own frame.
              */}
              {want ? (
                <button
                  type="button"
                  data-testid="translator-use"
                  onClick={() => {
                    const word = (result?.pt ?? '').trim()
                    if (!word) return
                    window.dispatchEvent(
                      new CustomEvent('dub:word', { detail: { for: want.for, pt: word, en: result?.en ?? '' } }),
                    )
                    track('translate_used', { for: want.for })
                    setOpen(false)
                    setWant(null)
                  }}
                  className={GOLD}
                >
                  USE THIS WORD
                </button>
              ) : null}
              <button
                type="button"
                data-testid="translator-keep"
                onClick={keep}
                disabled={kept}
                className={want ? QUIET : GOLD}
              >
                {kept ? 'KEPT' : 'KEEP THIS'}
              </button>
              <button type="button" data-testid="translator-again" onClick={again} className={QUIET}>
                ASK ANOTHER
              </button>
            </>
          ) : (
            <button
              type="button"
              data-testid="translator-ask"
              onClick={ask}
              disabled={!text.trim() || state === 'asking'}
              className={GOLD}
            >
              {state === 'asking' ? 'TRANSLATING' : want ? 'FIND THE WORD' : 'SAY IT IN PORTUGUESE'}
              <svg viewBox="-16 -11 31 22" className="h-5 w-7" aria-hidden="true">
                <path d={PLANE} fill="currentColor" />
              </svg>
            </button>
          )}
          {kept ? (
            <p className="text-center text-xs leading-relaxed text-white/60">
              Kept. It is with your sentences, and it will come back around.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
