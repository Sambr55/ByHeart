'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { BAIRROS, KIND_LABEL, distanceM, visibleGems, type BairroId } from '@/content/gems'
import { GemCard } from './GemCard'
import { KnowHowCard } from './KnowHowCard'
import { knowHowNow } from '@/content/knowhow'
import { gemOfTheWeek } from '@/content/gems'
import { visibleWalks, walkProgress } from '@/content/walks'
import { useLearner } from '@/engine/useLearner'
import { useWhereAmI } from './useWhereAmI'

/* Leaflet reads `window` at import, so the map only ever renders in the browser. */
const CityMap = dynamic(() => import('./CityMap').then((m) => m.CityMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
})

/**
 * THE CITY TAB — Lisbon like a local (Sam, 2026-11-03: "maps and recommendations … not too
 * touristy … local knowledge, finding the gems and the people … and it all comes back to
 * language").
 *
 * A map of six bairros and their gems, a strip to pick a bairro, and the gems as cards: tap
 * a pin or a card and it opens with the line for walking in. "What's on" — the calendar —
 * is one tap away at the top, because the city tab is both: where to go, and when.
 */
export function City() {
  const gems = useMemo(() => visibleGems(), [])
  const [bairro, setBairro] = useState<BairroId | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const where = useWhereAmI()
  const learner = useLearner()
  const walks = useMemo(() => visibleWalks(gems), [gems])
  /* Read after mount: the week and the season are the phone's, not the server's. */
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])
  const weekly = useMemo(() => (now ? gemOfTheWeek(now, gems) : null), [now, gems])
  const knowhow = useMemo(() => (now ? knowHowNow(now) : []), [now])
  /* ?gem=<id> — from Near you on home — opens straight onto that gem. */
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('gem')
    const g = id ? gems.find((x) => x.id === id) : undefined
    if (g) {
      setBairro(g.bairro)
      setSelected(g.id)
    }
  }, [gems])

  const shown = useMemo(() => {
    const list = bairro ? gems.filter((g) => g.bairro === bairro) : gems
    if (!where.at) return list
    const at = where.at
    return [...list].sort((a, b) => distanceM(at, [a.lat, a.lng]) - distanceM(at, [b.lat, b.lng]))
  }, [gems, bairro, where.at])
  const open = gems.find((g) => g.id === selected) ?? null
  /* A pin tapped on a phone opens the card below the map — bring it into view. */
  useEffect(() => {
    if (!selected) return
    const id = requestAnimationFrame(() =>
      document.querySelector('[data-testid="gem-card"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
    )
    return () => cancelAnimationFrame(id)
  }, [selected])
  const b = BAIRROS.find((x) => x.id === bairro)

  return (
    <div data-stage="CITY" className="min-h-svh bg-bg text-fg">
      <header className="bar safe-top sticky top-0 z-30 px-5 py-3">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 md:max-w-6xl">
          <div className="leading-tight">
            <p className="eyebrow opacity-80">Lisboa</p>
            <p className="display text-lg">Like a local</p>
          </div>
          <Link href="/calendar" data-testid="city-whats-on" className="eyebrow tap-target inline-flex items-center rounded-full border border-[rgba(255,255,255,0.4)] px-3 py-1">
            What’s on →
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md md:max-w-6xl">
        {/* The bairros. */}
        <nav aria-label="Neighbourhoods" className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-3">
          <Chip on={!bairro} onClick={() => { setBairro(null); setSelected(null) }}>All of Lisbon</Chip>
          {BAIRROS.map((x) => (
            <Chip key={x.id} on={bairro === x.id} onClick={() => { setBairro(x.id); setSelected(null) }}>
              {x.name}
            </Chip>
          ))}
        </nav>

        <div className="md:grid md:grid-cols-[minmax(0,1fr)_26rem] md:gap-6 md:px-5">
          <div className="relative h-[46svh] overflow-hidden border-y border-line md:sticky md:top-20 md:h-[75svh] md:rounded-3xl md:border">
            <CityMap gems={shown} selected={selected} focus={bairro} me={where.at} onSelect={setSelected} />
            <button
              type="button"
              data-testid="city-near-me"
              onClick={where.ask}
              className="tap-target eyebrow absolute left-3 top-3 z-[500] rounded-full bg-bg-elev/95 px-3 py-2 text-[0.65rem] text-accent shadow-md"
            >
              {where.state === 'asking' ? 'Finding you…' : where.at ? '● Near you' : 'Show what’s near me'}
            </button>
          </div>

          <section className="flex flex-col gap-4 px-5 py-5 md:px-0 md:py-0">
            {where.state === 'denied' ? (
              <p className="text-sm text-muted">No location — that is fine. Pick a neighbourhood above instead.</p>
            ) : null}
            {open ? (
              <div className="scroll-mt-20"><GemCard gem={open} metres={where.at ? distanceM(where.at, [open.lat, open.lng]) : undefined} onClose={() => setSelected(null)} /></div>
            ) : (
              <>
                <div>
                  <p className="eyebrow text-telha">{b ? b.name : 'Six neighbourhoods, the local way'}</p>
                  <p className="mt-1 text-base leading-relaxed">
                    {b ? b.feel : 'Not the sights — the places people who live here go, who you will meet there, and the line for walking in.'}
                  </p>
                </div>
                {/*
                  GEM OF THE WEEK (2026-11-03) — a different bairro every Monday, so the tab
                  has something new to say every time it is opened in a new week.
                */}
                {!bairro && weekly ? (
                  <button
                    type="button"
                    data-testid="gem-of-week"
                    onClick={() => {
                      setBairro(weekly.bairro)
                      setSelected(weekly.id)
                    }}
                    className="tap-target flex flex-col gap-1 rounded-2xl border-2 border-telha/40 bg-telha/5 px-4 py-3 text-left"
                  >
                    <span className="eyebrow text-[0.6rem] text-telha">Gem of the week · {BAIRROS.find((x) => x.id === weekly.bairro)?.name}</span>
                    <span className="display text-lg leading-tight">{weekly.name}</span>
                    <span className="lang text-sm text-accent" lang="pt-PT">“{weekly.line.pt}”</span>
                  </button>
                ) : null}

                {/*
                  LANGUAGE WALKS (2026-11-03) — a bairro, a few hours, one line at every
                  stop. All of them on the whole-city view; the neighbourhood's own when one
                  is picked. content/walks.ts.
                */}
                {(bairro ? walks.filter((w) => w.walk.bairro === bairro) : walks).length ? (
                  <div className="flex flex-col gap-2" data-testid="city-walks">
                    <p className="eyebrow text-muted">Language walks</p>
                    <div className={bairro ? 'flex flex-col gap-2' : 'no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1'}>
                      {(bairro ? walks.filter((w) => w.walk.bairro === bairro) : walks).map((v) => {
                        const pr = walkProgress(v, learner.walk_stops ?? [])
                        return (
                          <Link
                            key={v.walk.id}
                            href={'/walk/' + v.walk.id}
                            data-testid="walk-card"
                            className={
                              'tap-target flex shrink-0 flex-col gap-1 rounded-2xl border-2 px-4 py-3 transition ' +
                              (bairro ? '' : 'w-64 ') +
                              (pr.complete ? 'border-[#c9973b] bg-[#c9973b]/10' : 'border-accent/30 bg-bg-elev hover:border-accent')
                            }
                          >
                            <span className="eyebrow text-[0.6rem] text-telha">
                              {BAIRROS.find((x) => x.id === v.walk.bairro)?.name} · {v.stops.length} stops · ~{v.minutes} min
                            </span>
                            <span className="display text-lg leading-tight">{v.walk.title}</span>
                            <span className="text-xs text-muted">
                              {pr.complete ? 'Walked ✓' : pr.done ? pr.done + ' of ' + pr.total + ' lines said' : v.walk.when}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                {shown.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-muted" data-testid="city-empty">
                    The gems are being checked by somebody who lives here. They will appear on this map as each one is confirmed.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {shown.map((g) => (
                      <li key={g.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(g.id)}
                          data-testid="gem-row"
                          className="tap-target flex w-full items-start gap-3 rounded-2xl border border-line bg-bg-elev px-4 py-3 text-left transition hover:border-accent/50"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="eyebrow block text-[0.6rem] text-telha">
                              {KIND_LABEL[g.kind]}
                              {where.at ? ' · ' + Math.round(distanceM(where.at, [g.lat, g.lng]) / 70) + ' min' : ''}
                              {g.verified ? '' : ' · draft'}
                            </span>
                            <span className="display block text-lg leading-tight">{g.name}</span>
                            <span className="lang mt-1 block text-sm text-accent" lang="pt-PT">“{g.line.pt}”</span>
                          </span>
                          <span aria-hidden className="mt-2 text-muted">›</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/*
                  LOCAL KNOW-HOW (2026-11-03) — the things nobody tells you, each with its line.
                  What is in season leads. content/knowhow.ts.
                */}
                {knowhow.length ? (
                  <div className="mt-2 flex flex-col gap-2" data-testid="city-knowhow">
                    <p className="eyebrow text-muted">Local know-how</p>
                    {knowhow.map((k) => (
                      <KnowHowCard key={k.id} k={k} />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
        <BottomNavSpace />
      </main>
      <BottomNav />
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={
        'tap-target shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ' +
        (on ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-bg-elev text-fg')
      }
    >
      {children}
    </button>
  )
}
