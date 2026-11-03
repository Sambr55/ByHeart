'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * WHERE THE LEARNER IS — only when they ask, and only on this phone (2026-11-03).
 *
 * Never requested on load: a location prompt nobody asked for is the fastest way to a "no"
 * that is then permanent. The first tap on "Show what's near me" asks; after a yes, this
 * device remembers the choice and refreshes quietly next time. The position is used to sort
 * and to draw a dot, and is never stored or sent anywhere.
 */
const KEY = 'dub.near.ok'

export function useWhereAmI() {
  const [at, setAt] = useState<[number, number] | null>(null)
  const [state, setState] = useState<'idle' | 'asking' | 'ok' | 'denied' | 'none'>('idle')

  const ask = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return setState('none')
    setState('asking')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setAt([p.coords.latitude, p.coords.longitude])
        setState('ok')
        try {
          localStorage.setItem(KEY, '1')
        } catch {
          /* Then it asks again next time, which is fine. */
        }
      },
      () => setState('denied'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 },
    )
  }, [])

  /* Somebody who said yes before gets their position without another tap. */
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === '1') ask()
    } catch {
      /* No storage, no memory of the yes. */
    }
  }, [ask])

  return { at, state, ask }
}
