'use client'

import { useEffect, useState } from 'react'

/**
 * The current time, and only after mount.
 *
 * Every screen that shows a drop, a countdown or a day needs "now", and the server does
 * not have the same one — so branching on it during render is the /line hydration
 * mismatch again. Null until mounted, and null means "do not decide yet": nothing may
 * render as expired, locked or overdue before the browser has a clock.
 *
 * Lifted out of Journey.tsx, where it was defined privately, because the Club needs the
 * same discipline and a second copy is how two copies drift.
 */
export function useNowAfterMount(): Date | null {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])
  return now
}
