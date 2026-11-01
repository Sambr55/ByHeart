'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEntitlements } from '@/engine/useEntitlements'
import { canOpenRoom } from '@/lib/entitlements'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'

/**
 * The paid line, at the room itself.
 *
 * The path and the feed both draw a padlock on a paid room, but a room is also a URL —
 * shared, bookmarked, opened from an invite — and a lock that only exists on the map is
 * not a lock. So /errand asks the same question the map does (canOpenRoom: free starter
 * set, or full access) and, if the answer is no, says what the room is and where the
 * door is rather than playing it.
 *
 * Before the server has answered, hasFullAccess says yes, so a paying member never sees
 * this flash on load; the cost is that a non-member might glimpse the room for a moment.
 * That is the right way round.
 */
export function RoomGate({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const access = useEntitlements()
  if (canOpenRoom(id, access) || access.comped) return <>{children}</>
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-5 bg-bg px-6 text-fg">
      <p className="eyebrow text-muted">Dub Club · Lisboa</p>
      <h1 className="display text-3xl">{title}</h1>
      <p className="leading-relaxed text-muted">
        This room comes with DUB Pro. The first-day rooms — the airport, checking in, a coffee,
        the bill, asking the way — and the survival kit are free.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/pro" className="tap-target eyebrow inline-flex rounded-full bg-accent px-6 py-3 text-accent-ink">
          Unlock
        </Link>
        <Link href="/club" className="tap-target eyebrow inline-flex rounded-full border border-line px-6 py-3">
          Back to the trip
        </Link>
      </div>
      <BottomNavSpace />
      <BottomNav />
    </main>
  )
}
