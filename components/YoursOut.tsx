'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { visibleWalks, walkProgress } from '@/content/walks'
import { gemById } from '@/content/gems'
import { placeKeysToGems } from '@/content/yours'
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
    /* And places marked straight from a venue card ("Said it here", 2026-11-04). */
    for (const id of placeKeysToGems(said)) {
      const g = gemById(id)
      if (g && !out.some((o) => o.name === g.name)) out.push({ name: g.name, walk: '' })
    }
    return out
  }, [said])
  const walksDone = useMemo(() => visibleWalks().filter((w) => walkProgress(w, said).complete).length, [said])
  const sat = learner.tables_sat?.length ?? 0
  const tableLines = learner.table_lines?.length ?? 0

  /*
    ONLY WITH SOMETHING IN IT (2026-11-04, the review of Yours). Both cards used to show to
    everybody — "Host one", "Nowhere yet" — above the learner's own work. The invitations now
    live where they make sense: "Host a table here" and "Said it here" on every venue card in
    City, and a table nudge on the Path after level 2. See HOMES in content/yours.ts.
  */
  const hasPlaces = places.length > 0 || sat > 0
  if (!next && !hasPlaces) return null

  return (
    <section className="flex flex-col gap-3" data-testid="yours-out">
      <p className="eyebrow text-accent">Your Lisbon</p>
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
      ) : null}

      {hasPlaces ? (
        <Link
          href="/city"
          data-testid="yours-places"
          className="tap-target flex flex-col gap-2 rounded-2xl border border-line bg-bg-elev px-5 py-5"
        >
          <span className="eyebrow text-telha">Where you’ve said it</span>
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
        </Link>
      ) : null}
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
