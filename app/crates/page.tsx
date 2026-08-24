'use client'

import { Journey } from '@/components/Journey'
import { JourneyProvider } from '@/engine/journey'

/**
 * The picker, addressable.
 *
 * The menu, a bookmark and the back button all want somewhere to point that means
 * "my crates" rather than "start DUB from the beginning". Guarded rather than open:
 * arriving here without having accepted the deal lands on the deal, not the picker.
 */
export default function CratesPage() {
  return (
    <JourneyProvider enter="crates">
      <Journey />
    </JourneyProvider>
  )
}
