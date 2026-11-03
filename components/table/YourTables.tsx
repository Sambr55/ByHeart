'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { HOUSE_RULES, ROUNDS, houseRule } from '@/content/table-night'
import { useLearner } from '@/engine/useLearner'
import { shortWhen } from './bits'

interface Mine {
  code: string
  host: string
  place: string
  sitsAt: string
  rule: string
  hosting: boolean
  count: number
}

/**
 * /table — YOUR TABLES (2026-11-03). content/table-night.ts for the idea.
 *
 * The pitch to a host, what the evening is, and the tables this phone is hosting or sitting
 * at. One button: put one together.
 */
export function YourTables() {
  const learner = useLearner()
  const [mine, setMine] = useState<Mine[] | null>(null)
  useEffect(() => {
    fetch('/api/hosted')
      .then((r) => (r.ok ? r.json() : { tables: [] }))
      .then((d: { tables?: Mine[] }) => setMine(Array.isArray(d.tables) ? d.tables : []))
      .catch(() => setMine([]))
  }, [])
  const sat = learner.tables_sat?.length ?? 0
  const said = learner.table_lines?.length ?? 0

  return (
    <div data-stage="TABLE" className="min-h-svh bg-bg text-fg">
      <header className="booker safe-top px-5 pb-8 pt-6 text-[#f4ead6]">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <Link href="/profile" className="eyebrow w-fit text-white/70">
            ← Yours
          </Link>
          <p className="eyebrow text-[#e5b04a]">Your table</p>
          <h1 className="display text-4xl leading-[1.05]">
            You bring the friends.
            <br />
            We bring the Portuguese.
          </h1>
          <p className="text-base leading-relaxed text-white/80">
            Pick a real place, invite your own people, and run the night from your phone — five rounds, every line with a voice, everyone on their own app.
          </p>
          <Link
            href="/table/new"
            data-testid="table-host"
            className="tap-target eyebrow mt-2 rounded-2xl bg-[#e5b04a] px-5 py-4 text-center text-[#0f1f33]"
          >
            Host a table
          </Link>
          {sat ? (
            <p className="text-sm text-white/70" data-testid="table-record">
              {sat} {sat === 1 ? 'table' : 'tables'} so far · {said} lines said out loud at them
            </p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-6">
        {mine && mine.length ? (
          <section className="flex flex-col gap-2">
            <h2 className="eyebrow text-telha">Coming up</h2>
            {mine.map((t) => (
              <Link
                key={t.code}
                href={'/t/' + t.code}
                data-testid="table-mine"
                className="tap-target flex items-center gap-3 rounded-2xl border border-line bg-bg-elev px-4 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="eyebrow block text-[0.6rem] text-muted">
                    {t.hosting ? 'You’re hosting' : t.host + ' is hosting'} · {t.count} in
                  </span>
                  <span className="display block truncate text-lg leading-tight">{t.place}</span>
                  <span className="block text-sm text-muted">{shortWhen(t.sitsAt)} · {houseRule(t.rule).name}</span>
                </span>
                <span aria-hidden className="text-accent">→</span>
              </Link>
            ))}
          </section>
        ) : null}

        <section className="flex flex-col gap-3">
          <h2 className="eyebrow text-telha">How the night goes</h2>
          <ol className="flex flex-col gap-2">
            {ROUNDS.map((r, i) => (
              <li key={r.id} className="flex gap-3 rounded-2xl border border-line bg-bg-elev px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink">{i + 1}</span>
                <span className="min-w-0">
                  <span className="lang block font-semibold leading-tight text-accent" lang="pt-PT">{r.pt}</span>
                  <span className="block text-sm text-muted">{r.en} — {r.how}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="eyebrow text-telha">Three house rules — the host picks one</h2>
          {HOUSE_RULES.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-bg-elev px-4 py-3">
              <p className="font-semibold">{r.name}</p>
              <p className="text-sm text-muted">{r.rule}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-surface px-4 py-4 text-sm leading-relaxed text-muted">
          <p className="font-semibold text-fg">Friends only.</p>
          Nobody can find your table unless you send them the link. Friends join with a first name — no account needed — and DUB never sees your contacts. We don’t book the place or take any money: you pick it, you go.
        </section>
        <BottomNavSpace />
      </main>
      <BottomNav />
    </div>
  )
}
