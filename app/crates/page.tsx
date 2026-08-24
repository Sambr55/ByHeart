'use client'

import { Suspense } from 'react'
import { Journey } from '@/components/Journey'
import { JourneyProvider } from '@/engine/journey'

/**
 * The picker, addressable.
 *
 * The menu, a bookmark and the back button all want somewhere to point that means
 * "my crates" rather than "start DUB from the beginning". Guarded rather than open:
 * arriving here without having accepted the deal lands on the deal, not the picker.
 *
 * Suspended because the picker reads ?open= — the library links straight at a crate,
 * and useSearchParams needs a boundary or the whole route opts out of static rendering.
 */
export default function CratesPage() {
  return (
    <Suspense fallback={null}>
      <JourneyProvider enter="crates">
        <Journey />
      </JourneyProvider>
    </Suspense>
  )
}
