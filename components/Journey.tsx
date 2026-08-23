'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { FAMILIES, PIECES, ROOTS_BY_FAMILY, rootById, type CultureFamily, type Root } from '@/content/roots'
import { CLOSE, DEMO_BEATS, DEMO_CLOSE, LANDING, NO_CUE_PROMPTS, PICKER } from '@/content/front-door'
import { COLLISIONS } from '@/content/roots'
import { slugFor } from '@/content/audio-manifest'
import { track } from '@/engine/analytics'
import { acquirePiece, setAffinity, setTester, voiceLean } from '@/engine/learner'
import { capabilities, useJourney, type WhereNext } from '@/engine/journey'
import { useLearner } from '@/engine/useLearner'
import { AudioButton } from './AudioButton'

/**
 * The journey UI.
 *
 * §16 asks for a cultural platform rather than a school product: the root gets space,
 * the Portuguese arrives as a transformation rather than a subtitle, pieces are pulled
 * physically out of the line, and the no-cue beats strip the styling away entirely
 * because the absence of culture is the point.
 */

function Shell({
  stage,
  children,
  eyebrow,
}: {
  stage: string
  eyebrow?: string
  children: React.ReactNode
}) {
  return (
    <div data-stage={stage} className="flex min-h-dvh flex-col bg-bg text-fg transition-colors duration-700">
      {eyebrow ? (
        <header className="sticky top-0 z-10 border-b border-line bg-bg/90 px-5 py-3 backdrop-blur">
          <p className="eyebrow mx-auto w-full max-w-md text-accent">{eyebrow}</p>
        </header>
      ) : null}
      <main className="flex-1">
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md flex-col px-5 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}

function Cta({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      data-testid="continue"
      onClick={onClick}
      disabled={disabled}
      className="tap-target eyebrow mt-auto w-full rounded-xl mt-6 bg-accent px-5 py-4 text-accent-ink transition active:scale-[0.99] disabled:bg-chip disabled:text-muted"
    >
      {label}
    </button>
  )
}

/** A piece, rendered the same way in every cultural world (§16 extraction). */
function Piece({ pt, gloss }: { pt: string; gloss: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-accent/60 bg-accent/10 px-3 py-1.5">
      <span className="pt text-sm font-semibold text-accent">{pt}</span>
      <span className="text-xs text-muted">{gloss}</span>
    </span>
  )
}

export function Journey() {
  const { step } = useJourney()
  if (!step) return null
  switch (step.kind) {
    case 'landing':
      return <Landing />
    case 'demo':
      return <Demo i={step.i} />
    case 'freetext':
      return <FreeText />
    case 'picker':
      return <Picker />
    case 'root':
      return <RootBeatView key={step.rootId + step.beat} rootId={step.rootId} beat={step.beat} />
    case 'wherenext':
      return <WhereNextView />
    case 'collision':
      return <CollisionView key={step.collisionId} id={step.collisionId} />
    case 'nocue':
      return <NoCueView key={step.i} i={step.i} />
    case 'cansay':
      return <CanSay />
    case 'close':
      return <Close />
  }
}

// --------------------------------------------------------------- front door

function Landing() {
  const { next } = useJourney()
  return (
    <Shell stage="LANDING">
      <div className="flex flex-1 flex-col justify-center">
        <p className="display text-5xl tracking-tight">{LANDING.wordmark}</p>
        <p className="mt-2 text-balance text-xl text-accent">{LANDING.line}</p>
        <div className="mt-10 space-y-6">
          <p className="display text-balance text-2xl">{LANDING.lines[0]}</p>
          <p className="text-pretty text-sm text-muted">{LANDING.lines[1]}</p>
          <p className="display whitespace-pre-line text-balance text-xl leading-snug">
            {LANDING.lines[2]}
          </p>
          <p className="text-balance text-base font-semibold">{LANDING.lines[3]}</p>
        </div>
      </div>
      <Cta label={LANDING.cta} onClick={() => { track('landing_cta_tap', {}); next() }} />
    </Shell>
  )
}

function Demo({ i }: { i: number }) {
  const { next } = useJourney()
  const beat = DEMO_BEATS[i]
  const last = i === DEMO_BEATS.length - 1
  const [revealed, setRevealed] = useState(false)

  return (
    <Shell stage="DEMO">
      <div className="flex flex-1 flex-col justify-center">
        <p className="display text-balance text-3xl sm:text-4xl">{beat.display}</p>
        {beat.gloss ? <p className="mt-3 text-sm text-muted">{beat.gloss}</p> : null}

        {beat.key === 'translation' ? (
          <div className="mt-6 flex items-center gap-3">
            <AudioButton slug={slugFor('Fala comigo.')} text="Fala comigo, Goose." />
            <span className="text-xs text-muted">Hear it</span>
          </div>
        ) : null}

        {beat.branches ? (
          <ul className="mt-6 space-y-3">
            {beat.branches.map((b) => (
              <li key={b.pt} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                <AudioButton slug={slugFor(b.pt)} text={b.pt} size="sm" />
                <span>
                  <span className="pt block text-lg text-accent">{b.pt}</span>
                  <span className="mt-0.5 block text-xs text-muted">{b.en}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {beat.release ? (
          <div className="mt-6">
            <p className="eyebrow text-muted">{beat.release.context}</p>
            <p className="display mt-2 text-2xl">“{beat.release.ask}”</p>
            {revealed ? (
              <div className="animate-bank mt-4 flex items-center gap-3 rounded-xl border border-correct/40 bg-correct/10 px-4 py-3">
                <AudioButton slug={slugFor(beat.release.answer)} text={beat.release.answer} size="sm" />
                <span className="pt text-xl">{beat.release.answer}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="tap-target eyebrow mt-4 w-full rounded-xl border border-accent bg-accent/10 px-4 py-3 text-accent"
              >
                SAY IT, THEN TAP
              </button>
            )}
          </div>
        ) : null}

        {last && revealed ? (
          <p className="mt-8 text-balance text-sm font-semibold">{DEMO_CLOSE}</p>
        ) : null}
      </div>
      <Cta
        label={beat.cta}
        disabled={Boolean(beat.release) && !revealed}
        onClick={next}
      />
    </Shell>
  )
}

function FreeText() {
  const { next } = useJourney()
  const [text, setText] = useState('')
  return (
    <Shell stage="CHOICE">
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="display text-balance text-2xl">{PICKER.headline}</h1>
        <p className="mt-3 text-sm text-muted">{PICKER.sub}</p>
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PICKER.placeholder}
          className="pt mt-6 w-full rounded-xl border border-line bg-surface p-4 text-xl text-fg outline-none focus:border-accent"
        />
      </div>
      <Cta
        label={PICKER.cta}
        onClick={() => {
          setAffinity({ free_text_favourite: text.trim() })
          track('culture_free_text', { text: text.trim() })
          next()
        }}
      />
    </Shell>
  )
}

function Picker() {
  const { chooseFamily } = useJourney()
  const [picked, setPicked] = useState<CultureFamily | null>(null)
  return (
    <Shell stage="CHOICE">
      <p className="display text-balance text-xl">{PICKER.fallback}</p>
      <p className="mt-1 text-sm text-muted">{PICKER.cardsHeadline}</p>
      <div className="mt-5 space-y-2">
        {FAMILIES.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={picked === f.id}
            onClick={() => setPicked(f.id)}
            className={
              'tap-target w-full rounded-xl border px-4 py-4 text-left transition ' +
              (picked === f.id
                ? 'border-accent bg-accent/10'
                : 'border-line bg-surface hover:border-accent/50')
            }
          >
            <span className="display block text-base">{f.title}</span>
            <span className="mt-0.5 block text-xs text-muted">{f.blurb}</span>
          </button>
        ))}
      </div>
      <Cta
        label="START HERE"
        disabled={!picked}
        onClick={() => picked && chooseFamily(picked)}
      />
    </Shell>
  )
}

// ------------------------------------------------------------------ a root

/** Build one branch from its own words. Production, not recognition. */
function MiniBuild({
  target,
  distractor,
  onSolved,
}: {
  target: string
  distractor?: string
  onSolved: () => void
}) {
  const tiles = useMemo(() => {
    const words = target.split(' ')
    const extra = distractor?.split(' ').find((w) => !words.includes(w))
    const all = extra ? [...words, extra] : words
    return all
      .map((text, i) => ({ id: text + i, text }))
      .sort(() => Math.random() - 0.5)
  }, [target, distractor])

  const answer = target.split(' ')
  const [placed, setPlaced] = useState<{ id: string; text: string }[]>([])
  const [state, setState] = useState<'open' | 'wrong' | 'done'>('open')
  const pool = tiles.filter((t) => !placed.some((p) => p.id === t.id))

  function check() {
    const built = placed.map((p) => p.text)
    const right = built.length === answer.length && built.every((w, i) => w === answer[i])
    track('build_attempt', { target, correct: right })
    if (right) {
      setState('done')
      onSolved()
    } else {
      setState('wrong')
    }
  }

  return (
    <div className="mt-5">
      <div
        data-testid="tile-line"
        /* A seam for the walkthrough. The tile pool is shuffled, so without this the
           harness can only brute-force permutations, which is slow and flaky. */
        data-answer={target}
        className="min-h-[3.5rem] rounded-xl border border-dashed border-line bg-surface/60 p-2"
      >
        {placed.length ? (
          <div className="flex flex-wrap gap-2">
            {placed.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={state === 'done'}
                onClick={() => setPlaced((cur) => cur.filter((x) => x.id !== p.id))}
                className={
                  'tap-target rounded-lg border px-3 py-2 ' +
                  (state === 'done' ? 'border-correct/50 bg-correct/10' : 'border-accent/50 bg-chip')
                }
              >
                <span className="pt">{p.text}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-1 py-2 text-xs text-muted">Tap the pieces in order.</p>
        )}
      </div>

      {state === 'done' ? null : (
        <div data-testid="tile-pool" className="mt-3 flex flex-wrap gap-2">
          {pool.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPlaced((cur) => [...cur, t])}
              className="tap-target rounded-lg border border-line bg-surface px-3 py-2 hover:border-accent/50"
            >
              <span className="pt">{t.text}</span>
            </button>
          ))}
        </div>
      )}

      {state === 'wrong' ? (
        <p className="mt-3 text-sm text-coach">
          Not the order Portuguese wants. Try moving the first piece.
        </p>
      ) : null}

      {state === 'done' ? (
        <div className="animate-bank mt-3 flex items-center gap-3 rounded-xl border border-correct/40 bg-correct/10 px-4 py-3">
          <AudioButton slug={slugFor(target)} text={target} size="sm" />
          <span className="pt text-lg">{target}</span>
        </div>
      ) : (
        <button
          type="button"
          disabled={!placed.length}
          onClick={check}
          className="tap-target eyebrow mt-3 w-full rounded-lg border border-accent bg-accent/10 px-4 py-3 text-accent disabled:border-line disabled:bg-transparent disabled:text-muted"
        >
          CHECK
        </button>
      )}
    </div>
  )
}

/** Highlight the extracted piece where it sits inside the natural Portuguese. */
function Highlighted({ line, piece }: { line: string; piece: string }) {
  const at = line.toLowerCase().indexOf(piece.toLowerCase().replace('…', '').trim())
  if (at < 0) return <>{line}</>
  const len = piece.replace('…', '').trim().length
  return (
    <>
      {line.slice(0, at)}
      <span className="font-semibold text-accent underline decoration-accent/40 underline-offset-4">
        {line.slice(at, at + len)}
      </span>
      {line.slice(at + len)}
    </>
  )
}

function RootBeatView({ rootId, beat }: { rootId: string; beat: string }) {
  const { next, recordVoice } = useJourney()
  const root = rootById(rootId)!
  const family = FAMILIES.find((f) => f.id === root.culture_family)!
  const [done, setDone] = useState(false)
  const [choice, setChoice] = useState<string | null>(null)

  const stage = beat === 'release' ? 'REAL WORLD' : 'ROOT'

  if (beat === 'recognise') {
    return (
      <Shell stage={stage} eyebrow={family.title}>
        <div className="flex flex-1 flex-col justify-center">
          <p className="display text-balance text-3xl sm:text-4xl">
            {root.root_type === 'quote' ? '“' + root.root_display + '”' : root.root_display}
          </p>
          {root.freebie_flag ? (
            <p className="mt-4 text-xs uppercase tracking-wider text-muted">A freebie. No puzzle.</p>
          ) : null}
        </div>
        <Cta label="WHAT IS THAT IN PORTUGUESE?" onClick={next} />
      </Shell>
    )
  }

  if (beat === 'translate') {
    return (
      <Shell stage={stage} eyebrow={family.title}>
        <p className="text-xs text-muted">“{root.root_display}”</p>
        <p className="pt mt-3 text-balance text-3xl text-accent">{root.pt_natural}</p>
        <div className="mt-3">
          <AudioButton slug={slugFor(root.pt_natural)} text={root.pt_natural} />
        </div>
        {/* The bridge is mandatory: the learner must be able to trace root -> Portuguese
            before anything is pulled out of it (§10). */}
        <div className="mt-6 rounded-xl border border-line bg-surface p-4">
          <p className="eyebrow text-accent">WHY IT LANDS THIS WAY</p>
          <p className="mt-2 text-sm leading-relaxed">{root.semantic_bridge}</p>
        </div>
        {root.literal_note ? (
          <p className="mt-3 text-xs text-muted">{root.literal_note}</p>
        ) : null}
        <div className="mt-4 rounded-xl border border-line/70 bg-surface/50 p-4">
          <p className="eyebrow text-muted">HOW IT FEELS</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{root.subtext}</p>
        </div>
        <Cta label="TAKE THE USEFUL BIT" onClick={next} />
      </Shell>
    )
  }

  if (beat === 'extract') {
    return (
      <Shell stage={stage} eyebrow={family.title}>
        <p className="pt text-balance text-2xl text-fg/70">
          <Highlighted line={root.pt_natural} piece={root.extracts[0].pt} />
        </p>
        <p className="eyebrow mt-8 text-accent">YOURS NOW</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {root.extracts.map((e) => (
            <Piece key={e.id} pt={e.pt} gloss={e.gloss} />
          ))}
        </div>
        {root.reinforces.length ? (
          <p className="mt-6 text-xs text-muted">
            This also strengthens{' '}
            {root.reinforces
              .filter((r) => PIECES[r])
              .map((r) => PIECES[r].pt)
              .join(', ') || 'something you already have'}
            .
          </p>
        ) : null}
        <Cta
          label="WHAT CAN I DO WITH IT?"
          onClick={() => {
            for (const e of root.extracts) acquirePiece(e.id, root.culture_family)
            next()
          }}
        />
      </Shell>
    )
  }

  if (beat === 'branch') {
    return (
      <Shell stage={stage} eyebrow={family.title}>
        <p className="display text-balance text-2xl">
          One {root.root_type === 'title' ? 'title' : 'line'}. {root.branches.length} things you can say.
        </p>
        <ul className="mt-6 space-y-3">
          {root.branches.map((b, i) => (
            <li
              key={b.pt}
              style={{ animationDelay: i * 90 + 'ms' }}
              className="animate-bank flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
            >
              <AudioButton slug={slugFor(b.pt)} text={b.pt} size="sm" />
              <span>
                <span className="pt block text-lg text-accent">{b.pt}</span>
                <span className="mt-0.5 block text-xs text-muted">{b.en}</span>
              </span>
            </li>
          ))}
        </ul>
        <Cta label="YOUR TURN" onClick={() => { track('branch_reveal', { root: root.root_id, n: root.branches.length }); next() }} />
      </Shell>
    )
  }

  if (beat === 'build') {
    const target = root.branches[0]
    return (
      <Shell stage={stage} eyebrow={family.title}>
        <p className="eyebrow text-muted">YOUR TURN</p>
        <p className="display mt-2 text-balance text-2xl">“{target.en}”</p>
        <MiniBuild
          target={target.pt}
          distractor={root.branches[1]?.pt}
          onSolved={() => setDone(true)}
        />
        {done ? <Cta label="CONTINUE" onClick={next} /> : <div className="mt-auto" />}
      </Shell>
    )
  }

  if (beat === 'voice' && root.voice_options?.length) {
    return (
      <Shell stage={stage} eyebrow={family.title}>
        <p className="display text-balance text-2xl">Which would you actually say?</p>
        <p className="mt-2 text-sm text-muted">Both are correct. Neither is scored.</p>
        <div className="mt-6 space-y-3">
          {root.voice_options.map((o) => (
            <button
              key={o.pt}
              type="button"
              aria-pressed={choice === o.pt}
              onClick={() => {
                setChoice(o.pt)
                recordVoice(o.signal, o.pt)
              }}
              className={
                'tap-target w-full rounded-xl border px-4 py-4 text-left transition ' +
                (choice === o.pt ? 'border-accent bg-accent/10' : 'border-line bg-surface')
              }
            >
              <span className="pt block text-lg text-accent">{o.pt}</span>
              <span className="mt-0.5 block text-xs text-muted">{o.en}</span>
            </button>
          ))}
        </div>
        <VoiceReflection />
        {choice ? <Cta label="CONTINUE" onClick={next} /> : <div className="mt-auto" />}
      </Shell>
    )
  }

  // release — the cue is gone
  return (
    <Shell stage="REAL WORLD">
      <p className="eyebrow text-muted">NO FILM. NO CLUES.</p>
      <p className="mt-3 text-sm font-semibold">{root.transfer_prompt.context}</p>
      <p className="display mt-2 text-balance text-2xl">“{root.transfer_prompt.ask}”</p>
      <MiniBuild target={root.transfer_prompt.answer} onSolved={() => setDone(true)} />
      {done ? (
        <>
          <p className="mt-5 text-sm text-muted">
            That one no longer needs the original cue.
          </p>
          <Cta label="CONTINUE" onClick={next} />
        </>
      ) : (
        <div className="mt-auto" />
      )}
    </Shell>
  )
}

/** §12 — tentative and useful, never psychological. Only after three signals. */
function VoiceReflection() {
  const learner = useLearner()
  const lean = useMemo(() => voiceLean(), [learner.voice_signals.length])
  if (!lean) return null
  const words: Record<string, string> = {
    direct: 'direct, unhedged language',
    softened: 'softened, careful language',
    dry: 'dry, understated language',
    warm: 'warm, open language',
    casual: 'casual language',
    polite: 'more formal language',
  }
  return (
    <div className="animate-bank mt-6 rounded-xl border border-accent/40 bg-accent/5 p-4">
      <p className="eyebrow text-accent">WE ARE BEGINNING TO GET YOU</p>
      <p className="mt-2 text-sm">
        You tend to choose {words[lean.lean] ?? lean.lean}. We will lean that way when
        there is a choice.
      </p>
    </div>
  )
}

// ------------------------------------------------------- agency and payoff

/**
 * §08 — after each root, hand the choice back. The recommendation engine can optimise
 * coverage underneath, but the card must read as a cultural choice, never as a
 * syllabus step, so no grammar rationale appears here.
 */
function WhereNextView() {
  const { chooseNext, state } = useJourney()
  const current = state.family ? FAMILIES.find((f) => f.id === state.family) : null
  const options: { id: WhereNext; title: string; blurb: string }[] = [
    {
      id: 'stay',
      title: 'STAY CLOSE',
      blurb: current ? 'More from ' + current.title.toLowerCase() + '.' : 'More of the same.',
    },
    { id: 'mood', title: 'CHANGE THE MOOD', blurb: 'Somewhere that feels completely different.' },
    { id: 'surprise', title: 'SURPRISE ME', blurb: 'Somewhere you would not have picked.' },
  ]
  return (
    <Shell stage="CHOICE">
      <div className="flex flex-1 flex-col justify-center">
        <p className="display text-balance text-2xl">Where next?</p>
        <div className="mt-6 space-y-3">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              data-testid={'wherenext-' + o.id}
              onClick={() => chooseNext(o.id)}
              className="tap-target w-full rounded-xl border border-line bg-surface px-4 py-4 text-left transition hover:border-accent/50"
            >
              <span className="display block text-base">{o.title}</span>
              <span className="mt-0.5 block text-xs text-muted">{o.blurb}</span>
            </button>
          ))}
        </div>
      </div>
    </Shell>
  )
}

/** §11 — pieces from unrelated memories behaving like one language. */
function CollisionView({ id }: { id: string }) {
  const { next } = useJourney()
  const collision = COLLISIONS.find((c) => c.id === id)!
  const [done, setDone] = useState(false)
  return (
    <Shell stage="REAL WORLD">
      <p className="eyebrow text-accent">TWO WORLDS, ONE SENTENCE</p>
      <p className="mt-3 text-sm font-semibold">{collision.context}</p>
      <p className="display mt-2 text-balance text-2xl">“{collision.ask}”</p>
      <MiniBuild
        target={collision.answer}
        onSolved={() => {
          track('collision_attempt', { collision: collision.id, correct: true })
          setDone(true)
        }}
      />
      {done ? (
        <>
          <div className="animate-bank mt-5 rounded-xl border border-line bg-surface p-4">
            <p className="text-sm leading-relaxed text-muted">{collision.provenance}</p>
          </div>
          <Cta label="CONTINUE" onClick={next} />
        </>
      ) : (
        <div className="mt-auto" />
      )}
    </Shell>
  )
}

/**
 * §09 (7:30–8:35) — the no-cue sequence. No family label, no quote, no styling. Only
 * prompts for language this learner actually owns, or it measures surprise rather than
 * transfer.
 */
function NoCueView({ i }: { i: number }) {
  const { next, owned } = useJourney()
  const prompts = useMemo(
    () => NO_CUE_PROMPTS.filter((p) => owned.includes(p.requires)),
    [owned],
  )
  const prompt = prompts[i % Math.max(prompts.length, 1)]
  const [done, setDone] = useState(false)

  if (!prompt) {
    return (
      <Shell stage="REAL WORLD">
        <div className="flex flex-1 flex-col justify-center">
          <p className="display text-balance text-2xl">Out in the world.</p>
          <p className="mt-3 text-sm text-muted">
            Nothing here needs a film any more.
          </p>
        </div>
        <Cta label="CONTINUE" onClick={next} />
      </Shell>
    )
  }

  return (
    <Shell stage="REAL WORLD">
      <p className="eyebrow text-muted">{i + 1} OF {Math.min(3, prompts.length)}</p>
      <p className="mt-4 text-sm font-semibold">{prompt.context}</p>
      <p className="display mt-2 text-balance text-2xl">“{prompt.ask}”</p>
      <MiniBuild
        target={prompt.answer}
        onSolved={() => {
          track('no_cue_attempt', { piece: prompt.requires, correct: true })
          setDone(true)
        }}
      />
      {done ? <Cta label="CONTINUE" onClick={next} /> : <div className="mt-auto" />}
    </Shell>
  )
}

/** §13 — progress as expressive power. What you can do, not how many words. */
function CanSay() {
  const { next, owned, state } = useJourney()
  const acts = capabilities(owned)
  const families = useMemo(
    () => new Set(state.rootsPlayed.map((id) => rootById(id)?.culture_family).filter(Boolean)),
    [state.rootsPlayed],
  )
  return (
    <Shell stage="REAL WORLD">
      <p className="eyebrow text-accent">THINGS YOU CAN SAY</p>
      <p className="display mt-3 text-balance text-2xl">
        You can now {acts.slice(0, 3).join(', ')}
        {acts.length > 3 ? ' — and more.' : '.'}
      </p>

      {acts.length > 3 ? (
        <ul className="mt-5 space-y-1.5">
          {acts.slice(3).map((a) => (
            <li key={a} className="text-sm text-muted">
              · {a}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-7 text-xs uppercase tracking-wider text-muted">Your Portuguese</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {owned.filter((p) => PIECES[p]).map((p) => (
          <Piece key={p} pt={PIECES[p].pt} gloss={PIECES[p].gloss} />
        ))}
      </div>

      <p className="mt-6 text-sm text-muted">
        Gathered from {families.size} different {families.size === 1 ? 'world' : 'worlds'}.
        None of it needs them any more.
      </p>

      <Cta
        label="CONTINUE"
        onClick={() => {
          track('capability_view', { acts, pieces: owned.length, families: families.size })
          next()
        }}
      />
    </Shell>
  )
}

function Close() {
  const { finish } = useJourney()
  return (
    <Shell stage="REAL WORLD">
      <div className="flex flex-1 flex-col justify-center">
        <p className="display text-balance text-3xl">{CLOSE.eyebrow}</p>
        <p className="mt-4 text-sm text-muted">
          Five questions and you are done. Be as critical as you like — the sharpest thing
          you say is the most useful.
        </p>
      </div>
      <Link
        href="/feedback"
        data-testid="continue"
        onClick={() => finish()}
        className="tap-target eyebrow mt-auto block w-full rounded-xl mt-6 bg-accent px-5 py-4 text-center text-accent-ink"
      >
        {CLOSE.cta}
      </Link>
    </Shell>
  )
}
