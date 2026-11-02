'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { slugFor } from '@/content/audio-manifest'
import { PATH_NAMES, pathPurpose, pathUnits } from '@/content/path'
import { saveSentence } from '@/content/blocks/lisbon-save'
import { useLearner } from '@/engine/useLearner'
import { useEntitlements } from '@/engine/useEntitlements'
import { hasFullAccess } from '@/lib/entitlements'
import { pathView } from '@/components/path/progress'
import { roomLock } from '@/components/path/locks'

/**
 * MY OPENING LINE — the rescue card (Sam, 2026-11-02).
 *
 * "I love the idea of an app rescue/reminder button. Perhaps so you can remind yourself of
 * your planned opening sentence as you walk into a situation, on your home screen."
 *
 * So this is what you look at on the pavement outside the shop, phone at arm's length,
 * thirty seconds before you go in. Two things and nothing else:
 *
 *   the opening line of the next room on your path — its FIRST line, because the lines
 *   are ordered by the encounter and the first one is the one you walk in with; and
 *
 *   the save, underneath — "Desculpe, não percebo. Sou inglês." — for when the reply
 *   comes back faster than you expected. See content/blocks/lisbon-save.ts.
 *
 * BIG TYPE, NO CHROME. No bottom bar, no header, no tally: those are for sitting down.
 * The Portuguese is set at display size because it has to be read while walking, and the
 * English sits under it smaller, because by now you mostly know what it means.
 *
 * THE NEXT ROOM IS NEVER THE SAVE ITSELF. For a brand-new learner the save is literally
 * the next room on every path, which would print the same sentence twice. So the opener
 * skips it and takes the next room after — the save is already on the card.
 *
 * Its own route, /opener, so it can be a home-screen shortcut — see `shortcuts` in
 * app/manifest.ts. Long-press the DUB icon, tap "My opening line", and this is the screen.
 */
export function Opener() {
  const learner = useLearner()
  const access = useEntitlements()
  const member = hasFullAccess(access) || access.comped
  const purpose = learner.purpose ?? null
  const units = useMemo(() => pathUnits(undefined, undefined, purpose), [purpose])

  /*
    The same reading of the path PathHome makes — derived from the record, the same lock —
    so the room here is the room glowing on the home screen, except for the save (above).
  */
  const room = useMemo(() => {
    const view = pathView(learner, units, (id) => roomLock(id, member, purpose))
    if (view.next && view.next.room.id !== 'lisbon_save') return view.next.room
    const nodes = view.units.flatMap((u) => u.nodes)
    return (
      nodes.find((n) => n.room.id !== 'lisbon_save' && (n.state === 'next' || n.state === 'open'))?.room ?? null
    )
  }, [learner, units, member, purpose])

  const opening = room?.lines[0] ?? null
  const save = saveSentence(learner.profile?.gender ?? null)
  const name = PATH_NAMES[pathPurpose(purpose)]

  return (
    <div data-stage="LISBON" className="safe-top flex min-h-svh flex-col bg-bg text-fg">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 pb-10 pt-4">
        <div className="flex items-center justify-between">
          <Link
            href="/club"
            data-testid="back"
            className="tap-target eyebrow -ml-1 flex shrink-0 items-center gap-1 px-1 text-accent"
          >
            <span aria-hidden>←</span>
            {name.short.toUpperCase()}
          </Link>
          <p className="eyebrow text-muted">My opening line</p>
        </div>

        {/*
          The opening line. `needs-learner` because it is read from the device: the server
          has no path, and a wrong room flashing in for a frame is worse than a blank one.
        */}
        <section aria-labelledby="opener-room" className="needs-learner flex flex-1 flex-col justify-center gap-4" data-testid="opener-line">
          {opening && room ? (
            <>
              <p id="opener-room" className="eyebrow text-muted">
                Walking into · {room.title}
              </p>
              <p className="pt text-balance text-[2.6rem] font-semibold leading-[1.1] text-accent" lang="pt-PT">
                {opening.pt}
              </p>
              <p className="text-xl leading-snug text-fg">{opening.en}</p>
              <div className="flex items-center gap-4">
                <AudioButton slug={slugFor(opening.pt)} text={opening.pt} />
                <Link href={'/errand/' + room.id} className="eyebrow text-accent underline-offset-4 hover:underline">
                  The whole room
                </Link>
              </div>
            </>
          ) : (
            <p id="opener-room" className="display text-2xl">
              Every room on the path, played. Whatever you walk into, start with bom dia — and the save is
              underneath.
            </p>
          )}
        </section>

        {/* The save. Always here, whatever the path says. */}
        <section
          aria-labelledby="opener-save"
          className="needs-learner flex flex-col gap-3 rounded-3xl border border-line bg-bg-elev px-5 py-6"
          data-testid="opener-save"
        >
          <p id="opener-save" className="eyebrow text-muted">
            If it goes past you
          </p>
          <p className="pt text-balance text-[2rem] font-semibold leading-[1.15] text-accent" lang="pt-PT">
            {save.pt}
          </p>
          <p className="text-lg leading-snug text-fg">{save.en}</p>
          <div className="flex items-center gap-4">
            <AudioButton slug={slugFor(save.pt)} text={save.pt} />
            <p className="text-sm leading-snug text-muted">Then: Pode falar mais devagar?</p>
          </div>
        </section>
      </div>
    </div>
  )
}
