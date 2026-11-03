'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SayButton } from '@/components/SayButton'
import { AudioButton } from '@/components/AudioButton'
import { slugFor } from '@/content/audio-manifest'
import { LIFELINES, ROUNDS, arriveLine, houseRule, questionAt, starterFor, type Line, type Question } from '@/content/table-night'
import { markTableSat } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'
import { track } from '@/engine/analytics'
import { Avatars, SayLine, type TableView } from './bits'
import { myIntroLines } from './TableInvite'

const POLL_MS = 4000

/**
 * /t/[code]/live — THE TABLE, ON THE NIGHT (2026-11-03).
 *
 * Every phone at the table shows the same round; the host's phone moves it on and the rest
 * follow within a few seconds. Each round: its name in Portuguese, what to do, who starts
 * (the same name on every phone — content/table-night.ts `starterFor`), and the lines, each
 * with a voice. Questions are drawn on each phone separately. Lifelines and ASK are on every
 * round. The last round ends with each person ticking what they actually said, which goes
 * into Yours.
 *
 * Dark, because it is on a table at night and nobody wants a white screen in the middle of it.
 */
export function TableLive({ code }: { code: string }) {
  const learner = useLearner()
  const [t, setT] = useState<TableView | null | 'missing'>(null)
  const [moving, setMoving] = useState(false)
  const [drawn, setDrawn] = useState(0)
  const [asked, setAsked] = useState<Question[]>([])
  const [ticked, setTicked] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const pending = useRef<number | null>(null)

  const load = useCallback(
    () =>
      fetch('/api/hosted/' + code, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : 'missing'))
        .then((d: TableView | 'missing') => {
          /* While the host's own move is in flight, do not let an older poll pull them back. */
          if (d !== 'missing' && pending.current !== null && d.round !== pending.current) return
          pending.current = null
          setT(d)
        })
        .catch(() => {}),
    [code],
  )
  useEffect(() => {
    load()
    const id = window.setInterval(load, POLL_MS)
    return () => window.clearInterval(id)
  }, [load])

  const round = t && t !== 'missing' ? t.round : 0
  const r = round > 0 ? ROUNDS[round - 1] : null
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [round])

  const intro = useMemo(() => myIntroLines(learner), [learner])
  const seed = code + ':' + learner.learner_id
  const question = questionAt(seed, drawn)

  /* Everything said tonight that could be ticked at the end, without repeats. */
  const sayable: Line[] = useMemo(() => {
    const keep = ROUNDS.flatMap((x) => (x.id === 'intro' || x.id === 'questions' ? [] : x.lines)).filter((l) => l.pt.split(' ').length > 1)
    const all: Line[] = [...intro, ...keep, ...asked]
    const seen = new Set<string>()
    return all.filter((l) => !l.pt.includes('…') && !seen.has(l.pt) && seen.add(l.pt))
  }, [intro, asked])

  async function move(to: number) {
    if (!t || t === 'missing') return
    setMoving(true)
    pending.current = to
    setT({ ...t, round: to })
    track('table_round', { round: to })
    try {
      await fetch('/api/hosted/' + code, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'round', round: to }),
      })
    } finally {
      setMoving(false)
      load()
    }
  }

  if (t === null) return <div className="booker min-h-svh" />
  if (t === 'missing' || !t.on || !(t.in || t.hosting)) {
    return (
      <main className="booker flex min-h-svh flex-col items-start justify-center gap-4 px-6 text-[#f4ead6]">
        <p className="display text-3xl">{t === 'missing' || !t.on ? 'This table isn’t on.' : 'Say you’re in first.'}</p>
        <Link href={'/t/' + code} className="eyebrow rounded-2xl bg-[#e5b04a] px-5 py-3 text-[#0f1f33]">
          Back to the invite
        </Link>
      </main>
    )
  }

  const rule = houseRule(t.rule)
  const starter = r?.picksStarter ? starterFor(code, round, t.people) : null
  const me = learner.display_name?.trim()
  const lines: Line[] = r ? (r.id === 'intro' && intro.length ? intro : r.id === 'arrive' ? [arriveLine(t.host, t.sitsAt), ...r.lines] : r.lines) : []
  const tryLine = lines.find((l) => !l.pt.includes('…'))

  return (
    <div data-stage="TABLE-LIVE" className="booker min-h-svh text-[#f4ead6]">
      <header className="safe-top sticky top-0 z-30 border-b border-white/10 bg-[#0f1f33]/90 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Link href={'/t/' + code} className="eyebrow text-white/70" aria-label="Back to the invite">
            ←
          </Link>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="eyebrow truncate text-[0.6rem] text-[#e5b04a]">{rule.name} · {t.place}</p>
            <div className="mt-1 flex gap-1" aria-label={'Round ' + round + ' of ' + ROUNDS.length}>
              {ROUNDS.map((x, i) => (
                <span key={x.id} className={'h-1.5 flex-1 rounded-full ' + (i < round ? 'bg-[#e5b04a]' : 'bg-white/20')} />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('dub:ask'))}
            className="eyebrow rounded-full border border-white/30 px-3 py-1.5 text-[0.65rem]"
            data-testid="live-ask"
          >
            Ask
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 py-6 pb-40">
        {!r ? (
          <section className="flex flex-col gap-4" data-testid="live-lobby">
            <p className="eyebrow text-[#e5b04a]">Who’s here</p>
            <h1 className="display text-4xl leading-tight">
              <span lang="pt-PT">Bem-vindos à mesa.</span>
            </h1>
            <p className="text-white/75">Welcome to the table. Everyone on their own phone, on this screen.</p>
            <Avatars names={t.people} dark />
            <p className="text-sm text-white/70">{t.people.join(' · ')}</p>
            <div className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3">
              <p className="eyebrow text-[0.6rem] text-[#e5b04a]">House rule</p>
              <p>{rule.rule}</p>
            </div>
            <p className="text-sm text-white/70">{t.hosting ? 'When everyone’s sitting down, start the first round.' : t.people[0] + ' will start the first round.'}</p>
          </section>
        ) : (
          <section className="animate-rise flex flex-col gap-4" data-testid="live-round" data-round={r.id}>
            <p className="eyebrow text-[#e5b04a]">
              Round {round} of {ROUNDS.length} · {r.en}
            </p>
            <h1 className="lang display text-4xl leading-tight" lang="pt-PT">
              {r.pt}
            </h1>
            <p className="text-base leading-relaxed text-white/85">{r.how}</p>
            {starter ? (
              <p className="w-fit rounded-full bg-[#e5b04a] px-4 py-1.5 text-sm font-semibold text-[#0f1f33]" data-testid="live-starter">
                {starter === me ? 'You start' : starter + ' starts'}
              </p>
            ) : null}

            {r.id === 'questions' ? (
              <div className="flex flex-col gap-3 rounded-3xl bg-[#f4ead6] p-5 text-[#1a2430]" data-testid="live-question">
                <p className="eyebrow text-[0.6rem] text-telha">
                  Card {drawn + 1}
                  {question.tier === 'stretch' ? ' · a stretch' : ''}
                </p>
                <div className="flex items-start gap-3">
                  <p className="lang display flex-1 text-2xl leading-tight text-accent" lang="pt-PT">
                    {question.pt}
                  </p>
                  <AudioButton slug={slugFor(question.pt)} text={question.pt} size="sm" />
                </div>
                <p className="text-sm text-[#1a2430]/70">{question.en}</p>
                <ul className="flex flex-col gap-2">
                  <SayLine line={question.start} />
                </ul>
                <button
                  type="button"
                  data-testid="live-draw"
                  onClick={() => {
                    setAsked((a) => (a.some((q) => q.pt === question.pt) ? a : [...a, question]))
                    setDrawn((n) => n + 1)
                  }}
                  className="tap-target eyebrow rounded-2xl bg-accent px-4 py-3 text-accent-ink"
                >
                  Draw the next card
                </button>
              </div>
            ) : null}

            {r.id === 'intro' && !intro.length ? (
              <p className="text-sm text-white/70">
                Fill in the gaps out loud. <Link href="/legend" className="underline">Your Legend</Link> makes these yours for next time.
              </p>
            ) : null}

            <ul className="flex flex-col gap-2">
              {lines.map((l) => (
                <SayLine key={l.pt} line={l} dark />
              ))}
            </ul>

            {tryLine && r.id !== 'questions' ? (
              <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/[0.05] py-3">
                <p className="eyebrow text-[0.6rem] text-white/60">Try it before it’s your turn</p>
                <SayButton want={tryLine.pt} />
              </div>
            ) : null}

            {r.id === 'toast' ? (
              <section className="flex flex-col gap-3 rounded-3xl border-2 border-[#e5b04a] bg-[#e5b04a]/10 p-5" data-testid="live-said">
                <p className="eyebrow text-[#e5b04a]">What did you say tonight?</p>
                <p className="text-sm text-white/75">Tick what you said out loud, to a person. It goes in Yours.</p>
                <ul className="flex flex-wrap gap-2">
                  {sayable.map((l) => {
                    const on = ticked.includes(l.pt)
                    return (
                      <li key={l.pt}>
                        <button
                          type="button"
                          disabled={saved}
                          onClick={() => setTicked((x) => (on ? x.filter((p) => p !== l.pt) : [...x, l.pt]))}
                          className={'rounded-full border px-3 py-1.5 text-left text-sm ' + (on ? 'border-[#e5b04a] bg-[#e5b04a] text-[#0f1f33]' : 'border-white/30 text-[#f4ead6]')}
                          aria-pressed={on}
                        >
                          <span className="lang" lang="pt-PT">
                            {on ? '✓ ' : ''}
                            {l.pt}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {saved ? (
                  <p className="rounded-2xl bg-[#e5b04a] px-4 py-3 text-center font-semibold text-[#0f1f33]" data-testid="live-saved">
                    <span lang="pt-PT">Até à próxima!</span> {ticked.length} lines saved to Yours.
                  </p>
                ) : (
                  <button
                    type="button"
                    data-testid="live-save"
                    onClick={() => {
                      markTableSat(code, ticked)
                      track('table_lines_saved', { n: ticked.length })
                      setSaved(true)
                    }}
                    className="tap-target eyebrow rounded-2xl bg-[#e5b04a] px-4 py-3 text-[#0f1f33]"
                  >
                    Save {ticked.length || ''} to Yours
                  </button>
                )}
              </section>
            ) : null}
          </section>
        )}

        <details className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3">
          <summary className="eyebrow cursor-pointer text-[0.65rem] text-white/80">Stuck? Lifelines</summary>
          <ul className="mt-3 flex flex-col gap-2">
            {LIFELINES.map((l) => (
              <SayLine key={l.pt} line={l} dark />
            ))}
          </ul>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('dub:ask'))}
            className="eyebrow mt-3 text-[0.65rem] text-[#e5b04a] underline underline-offset-4"
          >
            Ask DUB how to say it
          </button>
        </details>
      </main>

      {t.hosting ? (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0f1f33]/95 px-5 py-3 backdrop-blur" data-testid="live-host">
          <div className="mx-auto flex max-w-md items-center gap-2">
            <button
              type="button"
              disabled={moving || round === 0}
              onClick={() => move(round - 1)}
              className="tap-target eyebrow rounded-2xl border border-white/30 px-4 py-3 disabled:opacity-30"
            >
              Back
            </button>
            <button
              type="button"
              disabled={moving || round >= ROUNDS.length}
              onClick={() => move(round + 1)}
              data-testid="live-next"
              className="tap-target eyebrow flex-1 rounded-2xl bg-[#e5b04a] px-4 py-3 text-[#0f1f33] disabled:opacity-40"
            >
              {round === 0 ? 'Start the first round' : round >= ROUNDS.length ? 'Last round' : 'Next: ' + ROUNDS[round].en}
            </button>
          </div>
          <p className="mx-auto mt-1 max-w-md text-center text-[0.65rem] text-white/50">You’re the host — every phone at the table follows you.</p>
        </nav>
      ) : (
        <p className="safe-bottom fixed inset-x-0 bottom-0 bg-[#0f1f33]/90 py-2 text-center text-xs text-white/60">{t.people[0]} moves the table on — your screen follows.</p>
      )}
    </div>
  )
}
