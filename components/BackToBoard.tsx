'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLearner } from '@/engine/useLearner'

/**
 * ONE TAP BACK TO THE BOARD, FROM ANYWHERE THE BOARD SENT YOU (Sam, 2026-11-09: "the Graça card
 * quickly wanders off into walks, and you can't get back to path without using bottom nav…
 * you must always be able to get back to the board in one tap").
 *
 * Leaving the Path through anything on it — a square, a sheet's link, a chip on the Panel or
 * the Road — marks this tab (PathHome's click capture calls markFromBoard). Until the Path is
 * open again, every screen shows a "‹ Back to board" pill just above the tab bar, however far
 * the learner wanders: the place, then its walk, then a stop on the walk. Arriving on the Path
 * clears it. Session-only, and it lapses after an hour, so a tab left overnight does not still
 * carry a way back to somewhere it has forgotten.
 */
const KEY = 'dub.fromBoard'
const TTL = 60 * 60 * 1000

export function markFromBoard(): void {
  try {
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    /* no storage: the bottom bar is still there */
  }
}

/**
 * Whether this screen was reached from the board, so its own back control can say "‹ Board"
 * and go there rather than to wherever it would otherwise lead.
 */
export function useFromBoard(): boolean {
  const path = usePathname()
  const [from, setFrom] = useState(false)
  useEffect(() => {
    try {
      if (path === '/club') {
        sessionStorage.removeItem(KEY)
        setFrom(false)
        return
      }
      const at = Number(sessionStorage.getItem(KEY) ?? 0)
      setFrom(at > 0 && Date.now() - at < TTL)
    } catch {
      setFrom(false)
    }
  }, [path])
  return from
}

/*
  WHERE THE PILL DOES NOT SHOW, though the way back stays marked (review, 2026-11-10).
  Screens with their own way back to the board — a room's header says "← Board", a vibe's
  "‹ Board", the Who you are questions "← Board", the trip so far "‹ Board", a test goes back
  to them — so a second control only sat on their play, say and docked buttons. And the
  screens before there is a board at all: the front door, set-up, sign-in, the tour (and after a reset there is no set-up, so no pill).
*/
const OWN_WAY_BACK = ['/level/', '/errand/', '/vibes', '/revise', '/legend']
const BEFORE_A_BOARD = ['/start', '/walkthrough', '/get', '/come', '/signin']

export function BackToBoard() {
  const path = usePathname()
  const from = useFromBoard()
  const learner = useLearner()
  if (!from || !learner.set_up_at) return null
  if (path === '/' || [...OWN_WAY_BACK, ...BEFORE_A_BOARD].some((p) => path.startsWith(p))) return null
  return (
    <Link
      href="/club"
      data-testid="back-to-board"
      /*
        Above the tab bar AND above any docked button (--dock-h, set by DockSlot), so it never
        covers the thing to press; under full-screen overlays (z-50), not over them.
      */
      className="tap-target eyebrow fixed left-3 z-40 inline-flex items-center gap-1 rounded-full border border-line bg-bg-elev px-4 py-2 text-[0.7rem] text-accent shadow-lg"
      style={{ bottom: 'calc(var(--bar-h, 64px) + var(--dock-h, 0px) + 12px)' }}
    >
      ‹ Back to board
    </Link>
  )
}
