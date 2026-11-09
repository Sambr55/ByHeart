'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

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
 * Whether this screen was reached from the board, so its own back arrow can say "‹ Board" and
 * go there rather than to wherever it would otherwise lead.
 */
export function useFromBoard(): boolean {
  const path = usePathname()
  const [show, setShow] = useState(false)
  useEffect(() => {
    try {
      if (path === '/club') {
        sessionStorage.removeItem(KEY)
        setShow(false)
        return
      }
      const at = Number(sessionStorage.getItem(KEY) ?? 0)
      setShow(at > 0 && Date.now() - at < TTL)
    } catch {
      setShow(false)
    }
  }, [path])
  return show
}

export function BackToBoard() {
  const show = useFromBoard()
  if (!show) return null
  return (
    <Link
      href="/club"
      data-testid="back-to-board"
      className="tap-target eyebrow fixed left-3 z-[55] inline-flex items-center gap-1 rounded-full border border-line bg-bg-elev px-4 py-2 text-[0.7rem] text-accent shadow-lg"
      style={{ bottom: 'calc(var(--bar-h, 64px) + 12px)' }}
    >
      ‹ Back to board
    </Link>
  )
}
