'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { CHEATS, cheatUnlocked } from '@/content/cheats'
import { milestoneHref } from './progress'

/**
 * SHORTCUTS — what was the Vibes loop, folded into the Path (Sam, 2026-11-03). Called
 * Shortcuts on screen, because the Panel already has a Foundation (the words, → /vocab)
 * directly above, and two things called foundation on one screen is the maze again.
 *
 * The review that retired Vibes as a second app found its lasting value was the shapes:
 * NÃO + VERB, -TION → -ÇÃO, POSSO …?, the bluffs. They were a whole separate journey with
 * its own picker, sections and sittings; here they are one row of tiles under the path,
 * each opening the same practice the keystones use (/revise?kind=cheat).
 *
 * A tile opens when the rooms have handed over the words it needs (cheatUnlocked — the
 * same rule the Yours deck uses), and turns gold once it has been used. Locked ones say
 * what opens them rather than what is missing.
 */
const KIND_LABEL = { cheat: 'Cheat', hack: 'Hack', bluff: 'Bluff' } as const

export function Foundations({
  inventory,
  used,
}: {
  inventory: Record<string, unknown>
  used: string[]
}) {
  const tiles = useMemo(() => {
    const did = new Set(used)
    return CHEATS.map((c) => ({
      c,
      open: cheatUnlocked(c, inventory),
      done: did.has(c.id),
    })).sort((a, b) => Number(b.open) - Number(a.open) || Number(a.done) - Number(b.done))
  }, [inventory, used])
  const shown = tiles.filter((t) => t.open)
  const waiting = tiles.length - shown.length

  return (
    <section aria-labelledby="shortcuts" className="flex flex-col gap-3" data-testid="foundations">
      <div className="flex flex-col gap-1">
        <h2 id="shortcuts" className="eyebrow text-muted">
          Shortcuts
        </h2>
        <p className="text-sm text-muted">
          Shapes that turn a few words into hundreds of sentences. Use one cold and it turns gold.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {shown.map(({ c, done }) => (
          <li key={c.id}>
            <Link
              href={milestoneHref(c.id)}
              data-state={done ? 'done' : 'open'}
              className={
                'tap-target flex h-full flex-col gap-1 rounded-2xl border px-3 py-3 ' +
                (done ? 'border-[#c9973b] bg-[#c9973b]/10' : 'border-line bg-bg-elev')
              }
            >
              <span className="eyebrow text-[0.65rem] text-telha">{KIND_LABEL[c.kind]}</span>
              <span className="display text-base leading-tight">{c.shape}</span>
              <span className="line-clamp-2 text-xs text-muted">{c.does}</span>
            </Link>
          </li>
        ))}
      </ul>
      {waiting > 0 ? (
        <p className="text-xs text-muted" data-testid="shortcuts-waiting">
          {waiting} more open as your rooms give you their words.
        </p>
      ) : null}
    </section>
  )
}
