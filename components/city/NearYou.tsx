'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { gemsNear, visibleGems, walkMinutes } from '@/content/gems'
import { useWhereAmI } from './useWhereAmI'

/**
 * NEAR YOU, ON HOME (2026-11-03) — what makes the app useful in the street, not only on
 * the sofa. With the learner's yes, the two gems closest to where they are standing and the
 * line for each; without it, one quiet way into the City tab. The position never leaves the
 * phone (useWhereAmI).
 */
export function NearYou() {
  const where = useWhereAmI()
  const all = useMemo(() => visibleGems(), [])
  const near = useMemo(() => (where.at ? gemsNear(where.at, 2, 1500, all) : []), [where.at, all])
  if (all.length === 0) return null

  return (
    <section aria-labelledby="near-you" className="needs-learner flex flex-col gap-3" data-testid="near-you">
      <h2 id="near-you" className="eyebrow text-muted">
        {where.at && near.length ? 'Near you' : 'Lisbon, like a local'}
      </h2>
      {where.at && near.length ? (
        <ul className="flex flex-col gap-2">
          {near.map((g) => (
            <li key={g.id}>
              <Link href={'/city?gem=' + g.id} className="tap-target flex flex-col gap-1 rounded-2xl border border-line bg-bg-elev px-4 py-3">
                <span className="eyebrow text-[0.6rem] text-telha">{walkMinutes(g.m)} min walk</span>
                <span className="display text-lg leading-tight">{g.name}</span>
                <span className="lang text-sm text-accent" lang="pt-PT">
                  “{g.line.pt}”
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-bg-elev px-4 py-4">
          <p className="text-sm leading-relaxed">
            {where.at
              ? 'Nothing within a short walk yet — the map has the places locals go across six neighbourhoods.'
              : 'The places locals go, who you will meet there, and the line for walking in.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {!where.at ? (
              <button type="button" onClick={where.ask} data-testid="near-you-ask" className="tap-target eyebrow rounded-full bg-accent px-4 py-2 text-[0.7rem] text-accent-ink">
                {where.state === 'asking' ? 'Finding you…' : 'Show what’s near me'}
              </button>
            ) : null}
            <Link href="/city" className="tap-target eyebrow rounded-full border border-line px-4 py-2 text-[0.7rem] text-fg">
              Open the map
            </Link>
          </div>
          {where.state === 'denied' ? <p className="text-xs text-muted">No location — the map works without it.</p> : null}
        </div>
      )}
    </section>
  )
}
