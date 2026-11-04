'use client'

import Link from 'next/link'
import { track } from '@/engine/analytics'
import { markWalkStop } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'
import { TABLE_KINDS } from '@/content/table-night'
import { visibleWalks } from '@/content/walks'
import type { Gem } from '@/content/gems'

/**
 * At the place: "I said it here", and "host a table here" where it is a place to sit.
 * See content/yours.ts (HOMES) — these are the invitations Yours no longer carries empty.
 */
export function GemHere({ gem }: { gem: Gem }) {
  const learner = useLearner()
  const keys = learner.walk_stops ?? []
  const viaWalk = visibleWalks().some((w) => w.stops.some((s) => s.g.id === gem.id && keys.includes(s.key)))
  const said = viaWalk || keys.includes('gem:' + gem.id)
  const sit = (TABLE_KINDS as readonly string[]).includes(gem.kind)

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4" data-testid="gem-here">
      {said ? (
        <p className="flex items-center gap-2 text-sm text-correct" data-testid="gem-said">
          <span aria-hidden>✓</span> You’ve said it here. It’s on Yours, under Your Lisbon.
        </p>
      ) : (
        <button
          type="button"
          data-testid="gem-said-here"
          onClick={() => {
            markWalkStop('gem:' + gem.id)
            track('gem_said_here', { id: gem.id })
          }}
          className="tap-target eyebrow w-full rounded-2xl border border-correct/50 bg-correct/5 px-4 py-3 text-center text-correct"
        >
          I said it here
        </button>
      )}
      {sit ? (
        <Link
          href={'/table/new?gem=' + gem.id}
          data-testid="gem-host-table"
          className="tap-target self-center py-1 text-sm text-muted underline-offset-4 hover:underline"
        >
          Bring friends here: <span className="font-semibold text-accent">host a table →</span>
        </Link>
      ) : null}
    </div>
  )
}
