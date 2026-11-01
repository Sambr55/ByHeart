import { Suspense } from 'react'
import { Club } from '@/components/Club'

export const metadata = { title: "What's on — DUB" }

/**
 * The Club's swipe feed — drops, rooms, vibes — now that /club itself is the path home.
 * Same Club component, same stages and welcome; only the inside view differs.
 * Suspense for the same reason as /club: Club reads search params.
 */
export default function ClubFeedPage() {
  return (
    <Suspense fallback={<div className="min-h-svh on-dark" aria-hidden />}>
      <Club view="feed" />
    </Suspense>
  )
}
