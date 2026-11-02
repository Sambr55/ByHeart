'use client'

import { useEffect, useState } from 'react'

/**
 * EVERY PUT-BACK IS A WIN — the hand-off from /revise to the home screen (Sam, 2026-11-02).
 *
 * On the website, putting a tile back gets a gold flash, a burst of tile-chips, a "Back in
 * place" card with the line, and a count of tiles home; the last one sweeps gold across the
 * panel. In the app the putting-back happens on another screen (/revise?kind=room), so the
 * celebration is in two halves: the revise screen cheers when the recall comes back clean,
 * and the NEXT time the Panel or the Road is drawn, the tile animates home — once.
 *
 * What travels between them is only "this room just came home", kept on the device: it is
 * a fact about a screen still to be drawn, not about the learner, so it never syncs (the
 * same reasoning as the understood tally's MARKED_KEY). Whether the tile is actually back
 * in place is not stored here at all — it is roomSlipping, read from the record as ever.
 */
export const HOME_KEY = 'dub.panel.home'

/** /revise calls this when a drifted room's release comes back clean. */
export function markHomecoming(id: string): void {
  try {
    const now: string[] = JSON.parse(window.localStorage.getItem(HOME_KEY) ?? '[]')
    if (!now.includes(id)) window.localStorage.setItem(HOME_KEY, JSON.stringify([...now, id]))
  } catch {
    /* No storage: the tile is still home, it simply arrives without the flourish. */
  }
}

/**
 * The rooms to animate home on this draw. Read after mount and cleared once the flourish
 * has played — cleared on a timer rather than on read, so a Strict Mode double effect does
 * not spend the moment before anybody sees it (the lesson the understood cheer learned).
 */
export function useHomecoming(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    let list: string[] = []
    try {
      list = JSON.parse(window.localStorage.getItem(HOME_KEY) ?? '[]')
    } catch {
      return
    }
    if (!Array.isArray(list) || !list.length) return
    setIds(new Set(list))
    const t = window.setTimeout(() => {
      try {
        window.localStorage.removeItem(HOME_KEY)
      } catch {
        /* nothing to undo */
      }
      setIds(new Set())
    }, 2400)
    return () => window.clearTimeout(t)
  }, [])
  return ids
}
