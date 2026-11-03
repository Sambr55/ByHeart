'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { SayButton } from '@/components/SayButton'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { slugFor } from '@/content/audio-manifest'
import { KIND_LABEL, bairroById } from '@/content/gems'
import { walkById, walkProgress, walkView } from '@/content/walks'
import { situationById } from '@/content/situations'
import { markWalkStop } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'
import { track } from '@/engine/analytics'

const WalkMap = dynamic(() => import('./WalkMap').then((m) => m.WalkMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
})

/**
 * ONE LANGUAGE WALK (2026-11-03) — content/walks.ts.
 *
 * The route on a map, then the stops in order. The current stop is open: what to do, the
 * line with a voice and a microphone to try it, directions on foot, and "I said it" — marked
 * when it was said there, to a person, which is the claim only the learner can make. The
 * next stop opens itself. Every stop said: the walk is stamped, and its rooms are offered
 * for anybody who wants to rehearse before the next one.
 */
export function WalkScreen({ id }: { id: string }) {
  const walk = walkById(id)
  const view = useMemo(() => (walk ? walkView(walk) : null), [walk])
  const learner = useLearner()
  const said = learner.walk_stops ?? []
  const [current, setCurrent] = useState(0)

  /* Open on the first stop not yet said, once the record is read. */
  const firstOpen = view ? Math.max(0, view.stops.findIndex((s) => !said.includes(s.key))) : 0
  const [placed, setPlaced] = useState(false)
  useEffect(() => {
    if (placed || !view) return
    setCurrent(firstOpen)
    setPlaced(true)
  }, [placed, view, firstOpen])

  /* The walk just finished: the stamp is at the top, so go up to it. */
  const complete = view ? walkProgress(view, said).complete : false
  const [wasComplete, setWasComplete] = useState<boolean | null>(null)
  useEffect(() => {
    if (wasComplete === null) return setWasComplete(complete)
    if (complete && !wasComplete) window.scrollTo({ top: 0, behavior: 'smooth' })
    setWasComplete(complete)
  }, [complete, wasComplete])

  if (!walk || !view) {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col gap-4 bg-bg px-5 py-10 text-fg">
        <p className="display text-2xl">This walk is not open yet.</p>
        <Link href="/city" className="eyebrow text-accent">
          ← Back to the city
        </Link>
      </main>
    )
  }

  const progress = walkProgress(view, said)
  const bairro = bairroById(walk.bairro)
  const stop = view.stops[current]
  const room = stop ? situationById(stop.g.room) : undefined

  return (
    <div data-stage="WALK" className="min-h-svh bg-bg text-fg">
      <header className="bar safe-top sticky top-0 z-30 px-5 py-3">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          <Link href="/city" className="eyebrow tap-target opacity-90" aria-label="Back to the city">
            ←
          </Link>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="eyebrow truncate opacity-80">Language walk · {bairro.name}</p>
            <p className="display truncate text-lg">{walk.title}</p>
          </div>
          <p className="eyebrow shrink-0 rounded-full bg-[rgba(255,255,255,0.14)] px-3 py-1" data-testid="walk-count">
            {progress.done}/{progress.total}
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md">
        <div className="relative h-[34svh] border-b border-line">
          <WalkMap
            points={view.stops.map((s) => ({ lat: s.g.lat, lng: s.g.lng, name: s.g.name }))}
            current={current}
            said={view.stops.map((s) => said.includes(s.key))}
            onPick={setCurrent}
          />
        </div>

        <div className="flex flex-col gap-5 px-5 py-5">
          {progress.complete ? (
            <section data-testid="walk-done" className="animate-rise flex flex-col gap-3 rounded-3xl border-2 border-[#c9973b] bg-[#c9973b]/10 p-5">
              <p className="eyebrow text-[#9a6b12]">Walked · {progress.total} lines said in {bairro.name}</p>
              <p className="display text-2xl leading-tight">{walk.finish}</p>
              <p className="text-sm text-muted">Every line from today, said again:</p>
              <ul className="flex flex-col gap-1">
                {view.stops.map((s) => (
                  <li key={s.key} className="lang text-accent" lang="pt-PT">
                    {s.g.line.pt}
                  </li>
                ))}
              </ul>
              <Link href="/city" className="tap-target eyebrow mt-2 rounded-2xl bg-accent px-4 py-3 text-center text-accent-ink">
                Find the next walk
              </Link>
            </section>
          ) : (
            <div>
              <p className="eyebrow text-telha">{walk.when} · about {view.minutes} min on foot</p>
              <p className="lang mt-1 text-sm text-muted" lang="pt-PT">
                {walk.pt}
              </p>
              <p className="mt-2 text-base leading-relaxed">{walk.intro}</p>
            </div>
          )}

          {/* THE STOPS — the open one in full, the rest as a line each. */}
          <ol className="flex flex-col gap-2">
            {view.stops.map((s, i) => {
              const done = said.includes(s.key)
              const isOpen = i === current
              return (
                <li key={s.key}>
                  {isOpen ? (
                    <article data-testid="walk-stop" className="flex flex-col gap-4 rounded-3xl border-2 border-accent bg-bg-elev p-5">
                      <header className="flex items-start gap-3">
                        <span className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ' + (done ? 'bg-[#c9973b] text-[#1a2430]' : 'bg-accent text-accent-ink')}>
                          {done ? '✓' : i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="eyebrow text-[0.6rem] text-telha">{KIND_LABEL[s.g.kind]} · {s.g.address}</p>
                          <h2 className="display text-xl leading-tight">{s.g.name}</h2>
                        </div>
                      </header>
                      <p className="text-base leading-relaxed">{s.do}</p>
                      <div className="flex items-center gap-3 rounded-2xl bg-accent/10 px-4 py-3">
                        <AudioButton slug={slugFor(s.g.line.pt)} text={s.g.line.pt} size="sm" />
                        <div className="min-w-0">
                          <p className="eyebrow text-[0.6rem] text-accent">Your line here</p>
                          <p className="lang text-lg leading-snug text-accent" lang="pt-PT">
                            {s.g.line.pt}
                          </p>
                          <p className="text-sm text-muted">{s.g.line.en}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="eyebrow text-[0.6rem] text-muted">Try it first</p>
                        <SayButton want={s.g.line.pt} />
                      </div>
                      <p className="text-sm text-muted">
                        <span className="font-semibold text-fg">You’ll meet:</span> {s.g.meet}
                      </p>
                      <div className="flex flex-col gap-2">
                        {done ? (
                          <p className="rounded-2xl bg-[#c9973b]/15 px-4 py-3 text-center text-sm font-semibold">Said here ✓</p>
                        ) : (
                          <button
                            type="button"
                            data-testid="walk-said"
                            onClick={() => {
                              markWalkStop(s.key)
                              track('walk_stop_said', { walk: walk.id, stop: i })
                              const next = view.stops.findIndex((x, j) => j > i && !said.includes(x.key))
                              if (next >= 0) setCurrent(next)
                            }}
                            className="tap-target eyebrow rounded-2xl bg-accent px-4 py-3 text-accent-ink"
                          >
                            I said it here
                          </button>
                        )}
                        <div className="flex gap-2">
                          <a
                            href={'https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=' + s.g.lat + ',' + s.g.lng}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tap-target eyebrow flex-1 rounded-2xl border border-line px-3 py-2.5 text-center text-[0.7rem]"
                          >
                            Walk here
                          </a>
                          {room ? (
                            <Link href={'/errand/' + room.id} className="tap-target eyebrow flex-1 rounded-2xl border border-line px-3 py-2.5 text-center text-[0.7rem]">
                              Rehearse the room
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCurrent(i)}
                      className="tap-target flex w-full items-center gap-3 rounded-2xl border border-line bg-bg-elev px-4 py-3 text-left"
                    >
                      <span className={'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ' + (done ? 'bg-[#c9973b] text-[#1a2430]' : 'bg-surface text-muted')}>
                        {done ? '✓' : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold leading-tight">{s.g.name}</span>
                        <span className="lang block truncate text-sm text-accent" lang="pt-PT">
                          {s.g.line.pt}
                        </span>
                      </span>
                    </button>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
        <BottomNavSpace />
      </main>
      <BottomNav />
    </div>
  )
}
