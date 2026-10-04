'use client'

import { Suspense } from 'react'
import { Journey } from '@/components/Journey'
import { JourneyProvider } from '@/engine/journey'

/**
 * The picker itself, split out so the route can be a server component.
 *
 * This was all of app/vibes/page.tsx, which carried 'use client' — and a client page
 * cannot export route config, so there was nowhere to say "do not cache this". See the
 * note on the page for why that mattered.
 *
 * Suspended because the picker reads ?open= — the library links straight at a vibe, and
 * useSearchParams needs a boundary or the whole route opts out of static rendering.
 */
export function VibesView() {
  return (
    <Suspense fallback={null}>
      <JourneyProvider enter="vibes">
        <Journey />
      </JourneyProvider>
    </Suspense>
  )
}
