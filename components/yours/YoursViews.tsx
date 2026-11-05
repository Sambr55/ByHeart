'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Collection } from '@/components/Collection'
import { CanSay } from '@/components/yours/CanSay'
import { searchYours, yoursIndex } from '@/content/yours-search'
import { track } from '@/engine/analytics'
import { useClub } from '@/engine/useClub'
import { useLearner } from '@/engine/useLearner'

/**
 * YOURS, TWO WAYS ROUND, AND A SEARCH (Sam, 2026-11-05).
 *
 * BY LEVEL is the Path, kept: every level you have laid, its lines, its recap and its test,
 * and what its board showed you. BY KIND is the library as it was — Hacks, Words, Lost in
 * translation. The same things, sorted two ways, because somebody looking for "the café
 * level" and somebody looking for "that hack about -mente" are asking different questions.
 *
 * PROCURAR. The search is a word as well as a box: every question DUB asks teaches some
 * Portuguese, so the field is labelled with the verb, and every result shows the
 * Portuguese beside the English. A miss goes to the translator, like the Vocab search.
 */
const VIEW_KEY = 'dub.yours.view'
type View = 'level' | 'kind'

export function YoursViews({ hasLevels }: { hasLevels: boolean }) {
  const learner = useLearner()
  const club = useClub()
  const router = useRouter()
  const [view, setView] = useState<View>('level')
  const [focus, setFocus] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const logged = useRef('')

  /* ?level= (from a recap) opens that level; otherwise the last choice on this phone. */
  useEffect(() => {
    const level = new URLSearchParams(window.location.search).get('level')
    if (level) {
      setView('level')
      setFocus(level)
      window.setTimeout(() => document.getElementById('level-' + level)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
      return
    }
    try {
      if (window.localStorage.getItem(VIEW_KEY) === 'kind') setView('kind')
    } catch {
      /* the default, then */
    }
  }, [])
  const choose = (v: View) => {
    setView(v)
    track('yours_view', { view: v })
    try {
      window.localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* lasts as long as the screen */
    }
  }

  const index = useMemo(() => yoursIndex(learner), [learner])
  const hits = useMemo(() => searchYours(index, q), [index, q])
  const searching = q.trim().length >= 2
  useEffect(() => {
    if (!searching) return
    const t = window.setTimeout(() => {
      if (logged.current === q) return
      logged.current = q
      track('yours_search', { query: q, hits: hits.length })
    }, 800)
    return () => window.clearTimeout(t)
  }, [q, hits.length, searching])

  const levels = hasLevels && view === 'level'

  return (
    <section className="flex flex-col gap-4" data-testid="yours-views">
      {/*
        IT HAS TO LOOK LIKE A SEARCH (Sam, 2026-11-05: "make it more obvious that the search box
        is a search box (across all your content)"). A pill with a magnifier, the word SEARCH in
        the box, and what it searches said in the box itself. Procurar stays above it as the
        Portuguese for what the box does.
      */}
      <label className="flex flex-col gap-2" data-testid="yours-search-label">
        <span className="eyebrow text-[0.65rem] text-muted">
          <span lang="pt-PT" className="pt text-accent">
            Procurar
          </span>{' '}
          · search · everything in Yours
        </span>
        <span className="relative block">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-accent"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4.2-4.2" />
          </svg>
          <input
            type="search"
            enterKeyHint="search"
            aria-label="Search everything in Yours, in Portuguese or English"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search lines, words, places…"
            data-testid="yours-search"
            /* Inline, because the global focus ring (app/globals.css) squares every focused control's corners and beats a class. */
            style={{ borderRadius: 9999 }}
            className="w-full rounded-full border-2 border-accent/40 bg-bg-elev py-3 pl-12 pr-4 text-base shadow-sm outline-none placeholder:text-muted focus:border-accent"
          />
        </span>
        {!searching ? (
          <span className="text-xs text-muted">
            In Portuguese or English — try <span lang="pt-PT" className="pt text-accent">café</span>,{' '}
            <span lang="pt-PT" className="pt text-accent">a conta</span> or “thank you”.
          </span>
        ) : null}
      </label>

      {searching ? (
        hits.length ? (
          <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-bg-elev px-4" data-testid="yours-search-results">
            {hits.map((f) => (
              <li key={(f.pt ?? '') + f.en + f.where}>
                <Link href={f.href} className="tap-target flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    {f.pt ? (
                      <span lang="pt-PT" className="pt block text-base leading-snug text-accent">
                        {f.pt}
                      </span>
                    ) : null}
                    <span className={'block leading-snug ' + (f.pt ? 'text-sm text-muted' : 'text-base')}>{f.en}</span>
                    <span className="eyebrow mt-1 block text-[0.55rem] text-telha">{f.where}</span>
                  </span>
                  <span aria-hidden className="text-muted">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-5" data-testid="yours-search-miss">
            <p className="text-base leading-relaxed">
              Nothing in Yours for “{q.trim()}” yet. <span lang="pt-PT" className="pt text-accent">Ainda não</span> — not yet.
            </p>
            <button
              type="button"
              data-testid="yours-search-ask"
              onClick={() => {
                track('vocab_search_ask', { query: q.trim() })
                /* The same door as the bar's ASK: the panel for members, the explainer otherwise. */
                if (club.open) window.dispatchEvent(new CustomEvent('dub:ask', { detail: { text: q.trim() } }))
                else router.push('/ask')
              }}
              className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
            >
              ASK DUB: “{q.trim()}”
            </button>
          </div>
        )
      ) : (
        <>
          {hasLevels ? (
            <div role="tablist" aria-label="Sort Yours" className="grid grid-cols-2 gap-1 rounded-full border border-line bg-bg-elev p-1">
              {(['level', 'kind'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={view === v}
                  data-testid={'yours-view-' + v}
                  onClick={() => choose(v)}
                  className={'tap-target eyebrow rounded-full px-3 py-2 text-[0.65rem] ' + (view === v ? 'bg-accent text-accent-ink' : 'text-muted')}
                >
                  {v === 'level' ? 'By level' : 'By kind'}
                </button>
              ))}
            </div>
          ) : null}
          {levels ? <CanSay focus={focus} /> : <Collection />}
        </>
      )}
    </section>
  )
}
