import { Suspense } from 'react'
import { Club } from '@/components/Club'

export const metadata = { title: 'Dub Club — DUB' }

/**
 * Suspense because Club reads ?in=1 — the marker the front door adds so the showcase
 * stays reachable for somebody being shown the product, while the tab gets the explainer.
 * useSearchParams opts the route into client rendering and Next requires the boundary to
 * be explicit; without it the build fails rather than the page misbehaving.
 */
export default function ClubPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-bg" aria-hidden />}>
      <Club />
    </Suspense>
  )
}
