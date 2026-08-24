'use client'

import { useEffect, useState } from 'react'
import { FREE_ENTITLEMENTS, type Entitlements } from '@/lib/entitlements'

export interface Access {
  entitlements: Entitlements
  signedIn: boolean
  comped: boolean
  billingReady: boolean
  /** False until the server has answered. Nothing may lock before this is true. */
  known: boolean
}

const ASSUME: Access = {
  entitlements: FREE_ENTITLEMENTS,
  signedIn: false,
  comped: false,
  billingReady: false,
  known: false,
}

let cached: Access | null = null
let inflight: Promise<Access> | null = null
const listeners = new Set<() => void>()

async function fetchAccess(): Promise<Access> {
  try {
    const res = await fetch('/api/entitlements', { headers: { accept: 'application/json' } })
    if (!res.ok) return { ...ASSUME, known: true }
    const body = (await res.json()) as Partial<Access>
    return {
      entitlements: body.entitlements ?? FREE_ENTITLEMENTS,
      signedIn: Boolean(body.signedIn),
      comped: Boolean(body.comped),
      billingReady: Boolean(body.billingReady),
      known: true,
    }
  } catch {
    // Offline, or no billing configured. Assume free and let them carry on — the
    // routes that cost money check again for themselves.
    return { ...ASSUME, known: true }
  }
}

/**
 * What this learner can reach.
 *
 * Two rules the gating depends on:
 *
 *   - It starts UNKNOWN, not free. A gate that fires before the server has answered
 *     would lock a paying subscriber out of their own crates for the first second of
 *     every page load, which is a worse bug than not gating at all.
 *   - It is read after mount. Entitlements come from a cookie the server render does
 *     not have, so branching on them during render is the /line hydration mismatch
 *     again.
 */
export function useEntitlements(): Access {
  const [access, setAccess] = useState<Access>(cached ?? ASSUME)

  useEffect(() => {
    let alive = true
    const sync = () => {
      if (alive && cached) setAccess(cached)
    }
    listeners.add(sync)
    if (cached) {
      setAccess(cached)
    } else {
      inflight ??= fetchAccess().then((a) => {
        cached = a
        listeners.forEach((l) => l())
        return a
      })
      void inflight.then((a) => {
        if (alive) setAccess(a)
      })
    }
    return () => {
      alive = false
      listeners.delete(sync)
    }
  }, [])

  return access
}

/** After a comp code is redeemed, or a checkout returns. */
export function forgetEntitlements() {
  cached = null
  inflight = null
  listeners.forEach((l) => l())
}
