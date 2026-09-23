import { Suspense } from 'react'
import { Club } from '@/components/Club'

export const metadata = { title: 'Dub Club — DUB' }

/**
 * Suspense because Club reads ?in=1 — the marker the front door adds so the showcase
 * stays reachable for somebody being shown the product, while the tab gets the explainer.
 * useSearchParams opts the route into client rendering and Next requires the boundary to
 * be explicit; without it the build fails rather than the page misbehaving.
 */
/*
THE FALLBACK IS THE GROUND THE CLUB ACTUALLY HAS.

  Sam: "there is a flash after tapping come in before first screen loads." This was
  `bg-bg` — sand — and it is what paints during the route transition, before Club
  mounts and before its own holding div exists. Measured: the html background sat at
  the sand token for ~260ms between the landing photograph and the feed, which are both
  dark. So the one frame nobody was meant to notice was the only light thing in the
  sequence.

  .on-dark is what the feed paints, and html:has(.on-dark) carries it to the canvas —
  so the transition is now dark-to-dark-to-dark and there is nothing to see.
*/
export default function ClubPage() {
  return (
    <Suspense fallback={<div className="min-h-svh on-dark" aria-hidden />}>
      <Club />
    </Suspense>
  )
}
