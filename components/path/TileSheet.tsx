'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef } from 'react'
import { SpokenLine } from '@/components/Opener'
import { saveSentence } from '@/content/blocks/lisbon-save'
import { CRATES, PIECES, roomPieceIds, sourceOf } from '@/content/roots'
import type { PathNode } from './progress'
import { voiced } from '@/content/speaker'

/**
 * A LAID TILE, OPENED (the Wall, Sam approved 2026-11-02; kept for the Panel the same day).
 *
 * Tapping a tile you have not laid opens the room, as the path always did. Tapping one you
 * HAVE laid used to do the same — replay the whole room — which is the fault Sam named on
 * the board months ago: "clicking on a panel should be a revision of what has been learned,
 * not the original walk through cards." So a laid tile opens this sheet instead, with the
 * three things a finished room is still good for:
 *
 *   REMIND       the line you walk in with (its first line), the line it asked of you cold
 *                (the release), and the save — the rescue card's own layout pieces
 *                (SpokenLine, components/Opener.tsx), with the same listen button.
 *   SAY IT COLD  /revise?kind=room — the release and the room's words, asked back. Saying
 *                them is what glazes the tile and puts a drifted one back.
 *   WHERE IT CAME FROM
 *                for each word the room handed over that a film or a song taught first,
 *                the crate it came from — "comigo — from Top Gun". The point of DUB is that
 *                the Portuguese you have hangs off things you already know; this is the
 *                one place on the home screen that shows the hook.
 *
 * WHERE IT CAME FROM IS THE CRATE'S TITLE AND THE LINE, NEVER `source_label`. The Root
 * type's own note says why: source_label is sometimes attribution and sometimes an
 * editorial note to ourselves ("DUB-authored cringe moment"), and rendering it would put
 * production notes on a teaching screen. So: the crate (CRATES, by culture_family) and the
 * root_display the learner actually saw — "desculpe — Bridget Jones cringe moments:
 * “Sorry. Sorry. Sorry.”" — which is the hook itself.
 *
 * And "Open the room again", for somebody who does want the whole thing.
 *
 * A DRIFTED TILE'S SHEET LEADS WITH "PUT IT BACK" (the Panel, 2026-11-02). When the tile has
 * slid out of its place (`slipping`, components/path/Panel.tsx DRIFT), the first thing on
 * the sheet is the one thing that fixes it — the same /revise?kind=room as "Say it cold",
 * named for what it does to the panel. Sam's sliding puzzle: "only one square was empty and
 * you had to move all the others around" — here it is one tile, and one tap moves it home.
 * The remind lines are still under it, for a look before you try.
 */
export function TileSheet({
  node,
  gender,
  onClose,
}: {
  node: PathNode
  gender: 'm' | 'f' | null
  onClose: () => void
}) {
  const { cold, slipping } = node
  /* The tile's lines in this learner's own endings — obrigada for a woman (content/speaker.ts). */
  const room = voiced(node.room, gender)
  const first = room.lines[0] ?? null
  const save = saveSentence(gender)
  const close = useRef<HTMLButtonElement>(null)
  const coldHref = '/revise?kind=room&id=' + encodeURIComponent(room.id)

  /* Escape closes; focus starts on the close button so a keyboard user is inside the sheet. */
  useEffect(() => {
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const sources = useMemo(() => {
    const out: { word: string; from: string; line: string }[] = []
    for (const id of roomPieceIds(room)) {
      const root = sourceOf(id)
      if (!root) continue
      const from = CRATES.find((c) => c.id === root.culture_family)?.title
      if (!from) continue
      /* The line itself as the learner first saw it — the hook, not the bookkeeping. */
      out.push({ word: PIECES[id]?.target ?? id, from, line: root.root_display })
    }
    return out
  }, [room])

  /* The save room's release IS the save: say it once, not twice. */
  const showSave = save.pt !== room.release.answer && room.id !== 'lisbon_save'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" data-testid="tile-sheet">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/45" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tile-sheet-title"
        className="sheet-up relative flex max-h-[88svh] w-full max-w-md flex-col gap-6 overflow-y-auto rounded-t-3xl bg-bg-elev px-5 pt-4 text-fg"
        style={{ paddingBottom: 'calc(2rem + var(--safe-bottom, 0px))' }}
      >
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="eyebrow text-muted">
              {cold ? 'Laid and glazed' : 'Laid'}
              {slipping ? ' · slid out of place' : ''}
            </p>
            <h2 id="tile-sheet-title" className="display text-balance text-2xl">
              {room.title}
            </h2>
          </div>
          <button
            ref={close}
            type="button"
            onClick={onClose}
            className="tap-target eyebrow shrink-0 rounded-full border border-line px-3 py-1 text-muted"
          >
            Close
          </button>
        </div>

        {slipping ? (
          <div className="flex flex-col gap-3" data-testid="sheet-put-back">
            <Link
              href={coldHref}
              className="tap-target eyebrow block w-full rounded-full bg-accent px-6 py-3 text-center text-accent-ink"
            >
              Put it back
            </Link>
            <p className="text-center text-sm text-muted">Say the room cold once and the tile goes back in its place.</p>
          </div>
        ) : null}

        <section aria-labelledby="sheet-remind" className="flex flex-col gap-4">
          <p id="sheet-remind" className="eyebrow text-accent">
            Remind me
          </p>
          {first ? (
            <div className="flex flex-col gap-2" data-testid="sheet-first">
              <p className="eyebrow text-muted">Walking in</p>
              <SpokenLine pt={first.pt} en={first.en} size="md" />
            </div>
          ) : null}
          {first?.pt !== room.release.answer ? (
            <div className="flex flex-col gap-2" data-testid="sheet-release">
              <p className="eyebrow text-muted">The one to have cold</p>
              <SpokenLine pt={room.release.answer} en={room.release.ask} size="md" />
            </div>
          ) : null}
          {showSave ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-line px-4 py-3" data-testid="sheet-save">
              <p className="eyebrow text-muted">If it goes past you</p>
              <SpokenLine pt={save.pt} en={save.en} size="md" />
            </div>
          ) : null}
        </section>

        {/* Drifted: "Put it back" above already is this, so it is not asked twice. */}
        {slipping ? null : (
          <Link
            href={coldHref}
            data-testid="sheet-cold"
            className="tap-target eyebrow block w-full rounded-full bg-accent px-6 py-3 text-center text-accent-ink"
          >
            Say it cold
          </Link>
        )}

        {sources.length ? (
          <section aria-labelledby="sheet-source" className="flex flex-col gap-2" data-testid="sheet-source">
            <p id="sheet-source" className="eyebrow text-muted">
              Where it came from
            </p>
            <ul className="flex flex-col gap-1 text-sm leading-snug">
              {sources.map((s) => (
                <li key={s.word}>
                  <span lang="pt-PT" className="pt font-semibold text-accent">
                    {s.word}
                  </span>{' '}
                  <span className="text-muted">
                    — from {s.from}: “{s.line}”
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Link href={'/errand/' + room.id} className="eyebrow self-center text-accent underline-offset-4 hover:underline">
          Open the whole room again
        </Link>
      </div>
    </div>
  )
}
