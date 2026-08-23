'use client'

import { Journey } from '@/components/Journey'
import { JourneyProvider } from '@/engine/journey'

/**
 * The front door. Fixed for exactly two beats — the proposition and the Goose demo —
 * and then the learner chooses (§20.16). Top Gun lives at /tg like every other world;
 * it is not privileged by being the thing that opens (§20.13).
 */
export default function Page() {
  return (
    <JourneyProvider>
      <Journey />
    </JourneyProvider>
  )
}
