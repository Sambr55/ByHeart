'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { visibleWalks, walkProgress } from '@/content/walks'
import { houseRule } from '@/content/table-night'
import { useLearner } from '@/engine/useLearner'
import { shortWhen } from './table/bits'

interface Next {
  code: string
  host: string
  place: string
  sitsAt: string
  rule: string
  hosting: boolean
  count: number
}

/**
 * YOURS, OUT IN THE CITY (2026-11-03).
 *
 * Sam asked whether Yours still has a role. It does, and it is this: Yours is YOUR LISBON —
 * not only what you can say, but where you have said it and who with. So the top of the
 * screen is the two things that happened out there: your table (the next one, or the door
 * to hosting one) and the places where you said a line to a real person. The library of
 * what you can say follows (components/Collection.tsx).
 */
export function YoursOut() {
  const learner = useLearner()
  const [next, setNext] = useState<Next | null | undefined>(undefined)
  useEffect(() => {
    fetch('/api/hosted')
      .then((r) => (r.ok ? r.json() : { tables: [] }))
      .then((d: { tables?: Next[] }) => {
        const soon = (d.tables ?? []).filter((t) => new Date(t.sitsAt).getTime() > Date.now() - 4 * 3600000)
        setNext(soon[0] ?? null)
      })
      .catch(() => setNext(null))
  }, [])

  const said = learner.walk_stops ?? []
  const places = useMemo(() => {
    const out: { name: string; walk: string }[] = []
    for (const w of visibleWalks()) for (const s of w.stops) if (said.includes(s.key) && !out.some((o) => o.name === s.g.name)) out.push({ name: s.g.name, walk: w.walk.id })
    return out
  }, [said])
  const walksDone = useMemo(() => visibleWalks().filter((w) => walkProgress(w, said).complete).length, [said])
  const sat = learner.tables_sat?.length ?? 0
  const tableLines = learner.table_lines?.length ?? 0

  return (
    <section className="flex flex-col gap-3" data-testid="yours-out">
      {next ? (
        <Link
          href={'/t/' + next.code}
          data-testid="yours-table"
          className="booker tap-target flex flex-col gap-2 rounded-2xl px-5 py-5 text-[#f4ead6]"
        >
          <span className="eyebrow text-[#e5b04a]">{next.hosting ? 'Your table' : next.host + '’s table'} · {shortWhen(next.sitsAt)}</span>
          <span className="display text-2xl leading-tight">{next.place}</span>
          <span className="flex items-center justify-between gap-3">
            <span className="text-sm text-white/75">{next.count} coming · {houseRule(next.rule).name}</span>
            <span className="eyebrow text-[0.65rem] text-[#e5b04a]">Your lines →</span>
          </span>
        </Link>
      ) : (
        <Link
          href="/table"
          data-testid="yours-table"
          className="booker tap-target flex flex-col gap-2 rounded-2xl px-5 py-5 text-[#f4ead6]"
        >
          <span className="eyebrow text-[#e5b04a]">Your table</span>
          <span className="display text-2xl leading-tight">Gather your friends. Speak Portuguese. Have fun doing it.</span>
          <span className="flex items-center justify-between gap-3">
            <span className="text-sm text-white/75">A real place, your own people, five rounds on everyone’s phone.</span>
            <span className="eyebrow shrink-0 text-[0.65rem] text-[#e5b04a]">Host one →</span>
          </span>
        </Link>
      )}

      <Link
        href="/city"
        data-testid="yours-places"
        className="tap-target flex flex-col gap-2 rounded-2xl border border-line bg-bg-elev px-5 py-5"
      >
        <span className="eyebrow text-telha">Where you’ve said it</span>
        {places.length || sat ? (
          <>
            <span className="grid grid-cols-3 gap-2 text-center">
              <Stat n={places.length} label={places.length === 1 ? 'place' : 'places'} />
              <Stat n={walksDone} label={walksDone === 1 ? 'walk' : 'walks'} />
              <Stat n={sat} label={sat === 1 ? 'table' : 'tables'} />
            </span>
            {places.length ? (
              <span className="text-sm text-muted">
                {places
                  .slice(-4)
                  .map((p) => p.name)
                  .join(' · ')}
              </span>
            ) : null}
            {tableLines ? <span className="text-sm text-muted">{tableLines} lines said out loud at a table.</span> : null}
          </>
        ) : (
          <span className="text-base leading-relaxed">
            Nowhere yet. Every line you say to a real person — on a walk, at a gem, at your table — gets its place here.{' '}
            <span className="text-accent">Find a walk →</span>
          </span>
        )}
      </Link>
    </section>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span className="rounded-xl bg-surface py-2">
      <span className="display block text-2xl leading-none">{n}</span>
      <span className="eyebrow block text-[0.55rem] text-muted">{label}</span>
    </span>
  )
}
