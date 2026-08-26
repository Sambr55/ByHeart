'use client'

import { Suspense } from 'react'
import { Journey } from '@/components/Journey'
import { JourneyProvider } from '@/engine/journey'

/**
 * The picker, addressable.
 *
 * The menu, a bookmark and the back button all want somewhere to point that means
 * "my vibes" rather than "start DUB from the beginning". Guarded rather than open:
 * arriving here without having accepted the deal lands on the deal, not the picker.
 *
 * Suspended because the picker reads ?open= — the library links straight at a vibe,
 * and useSearchParams needs a boundary or the whole route opts out of static rendering.
 */
export default function VibesPage() {
  return (
    <Suspense fallback={null}>
      <JourneyProvider enter="vibes">
        <Journey />
      </JourneyProvider>
    </Suspense>
  )
}
