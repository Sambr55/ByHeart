'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  CRATES,
  PIECES,
  RUNGS,
  linesFor,
  sourceOf,
  type Rung,
} from '@/content/roots'
import { Menu } from '@/components/Menu'
import { useLearner } from '@/engine/useLearner'

/**
 * The vocab library.
 *
 * One long undifferentiated wall of words is the thing this replaces. Two decisions
 * do most of the work:
 *
 *   - It is grouped by stage, not alphabetically and not by crate. Alphabetical order
 *     is information the learner does not have a use for; the stage says what the
 *     piece is FOR, which is the thing they are actually scanning for when they open
 *     this in a queue somewhere.
 *   - Nothing is expanded by default. A piece opens to show where it came from and
 *     what it lets you say — because a word on its own is a flashcard, and the whole
 *     argument of the product is that a word inside a sentence is not.
 */
export function Vocab() {
  const learner = useLearner()
  const [openPiece, setOpenPiece] = useState<string | null>(null)
  // Collapsed by default. With a real bank this page is sixty-odd rows, and the six
  // headings with their counts are the useful view — they say what you have got and
  // what you are short of, which is what somebody opens this to find out.
  const [openStage, setOpenStage] = useState<Rung | null>(null)

  const owned = useMemo(
    () => Object.keys(learner.inventory ?? {}).filter((id) => PIECES[id]),
    [learner.inventory],
  )

  const byStage = useMemo(() => {
    const map = new Map<Rung, string[]>()
    for (const id of owned) {
      const rung = PIECES[id].rung
      map.set(rung, [...(map.get(rung) ?? []), id])
    }
    // Inside a stage, keep the order they were met in rather than sorting: the list
    // then reads as a record of the session, which is the only ordering that means
    // anything to the person who built it.
    return map
  }, [owned])

  const crateTitle = (id: string) => CRATES.find((c) => c.id === id)?.title ?? ''

  return (
    <main
      data-stage="CHOICE"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-bg text-fg"
    >
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-bg/90 px-5 py-2.5 backdrop-blur">
        <Link href="/" className="eyebrow text-muted transition hover:text-fg">
          ← DUB
        </Link>
        <span className="eyebrow flex-1 text-accent">Vocab library</span>
        <Menu />
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 py-7">
        <div>
          <h1 className="display text-balance text-2xl">
            {owned.length} {owned.length === 1 ? 'piece' : 'pieces'}, yours to keep.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Grouped by what each one is for. Open a stage to see inside it, then tap any
            piece to be reminded where it came from and what it lets you say.
          </p>
        </div>

        {owned.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-5">
            <p className="text-sm leading-relaxed text-muted">
              Nothing in here yet. Open a crate and the pieces start arriving — one or two
              from every line.
            </p>
            <Link
              href="/"
              className="eyebrow mt-4 inline-block text-accent underline underline-offset-4"
            >
              Pick a crate
            </Link>
          </div>
        ) : null}

        {RUNGS.map((stage) => {
          const ids = byStage.get(stage.rung) ?? []
          if (!ids.length) return null
          const expanded = openStage === stage.rung
          return (
            <section key={stage.rung} className="flex flex-col gap-3">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpenStage(expanded ? null : stage.rung)}
                className="tap-target flex w-full items-center gap-3 text-left"
              >
                <span className="eyebrow shrink-0 text-accent">
                  {stage.rung} · {stage.name}
                </span>
                <span className="h-px flex-1 bg-line" />
                <span className="eyebrow shrink-0 tabular-nums text-muted">{ids.length}</span>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className={
                    'h-4 w-4 shrink-0 text-muted transition-transform ' +
                    (expanded ? 'rotate-180' : '')
                  }
                  fill="none"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {!expanded ? (
                <p className="-mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted">
                  {ids.slice(0, 6).map((id) => (
                    <span key={id} className="pt text-accent/70">
                      {PIECES[id].target}
                    </span>
                  ))}
                  {ids.length > 6 ? <span>+{ids.length - 6} more</span> : null}
                </p>
              ) : null}

              {expanded ? (
                <p className="-mt-1 text-xs leading-relaxed text-muted">{stage.what}</p>
              ) : null}

              <ul className={'flex-col gap-2 ' + (expanded ? 'flex' : 'hidden')}>
                {ids.map((id) => {
                  const piece = PIECES[id]
                  const isOpen = openPiece === id
                  const root = sourceOf(id)
                  const lines = isOpen ? linesFor(id) : []
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenPiece(isOpen ? null : id)}
                        className={
                          'tap-target flex w-full items-baseline justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ' +
                          (isOpen
                            ? 'border-accent bg-accent/10'
                            : 'border-line bg-surface hover:border-accent/50')
                        }
                      >
                        <span className="min-w-0">
                          <span className="pt block text-base text-accent">{piece.target}</span>
                          <span className="mt-0.5 block text-xs text-muted">{piece.gloss}</span>
                        </span>
                        <span className="shrink-0 text-[0.55rem] uppercase tracking-wider text-muted">
                          {isOpen ? 'close' : 'remind me'}
                        </span>
                      </button>

                      {isOpen ? (
                        <div className="mt-1.5 rounded-xl border border-line bg-bg-elev px-4 py-4">
                          {root ? (
                            <>
                              <p className="eyebrow text-muted">Where you met it</p>
                              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                                {crateTitle(root.culture_family)}
                              </p>
                              <p className="pt mt-1 text-sm">{root.target}</p>
                              <p className="mt-0.5 text-xs text-muted">{root.source}</p>
                            </>
                          ) : null}

                          {lines.length ? (
                            <>
                              <p className="eyebrow mt-4 text-muted">
                                {lines.length} {lines.length === 1 ? 'thing' : 'things'} you can say
                                with it
                              </p>
                              <ul className="mt-2 flex flex-col gap-2">
                                {lines.map((l) => (
                                  <li key={l.target}>
                                    <p className="pt text-sm">{l.target}</p>
                                    <p className="text-xs text-muted">{l.en}</p>
                                  </li>
                                ))}
                              </ul>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </main>
  )
}
