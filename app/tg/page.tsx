'use client'

import { MISSION_01 } from '@/content/missions'
import { MissionShell } from '@/components/MissionShell'
import { ScreenRouter } from '@/components/ScreenRouter'
import { HighlightProvider } from '@/engine/highlight'
import { MissionProvider } from '@/engine/session'

/** The original linear Top Gun mission, kept for comparison testing. Not the default. */
export default function Page() {
  return (
    <MissionProvider mission={MISSION_01}>
      <HighlightProvider>
        <MissionShell>
          <ScreenRouter />
        </MissionShell>
      </HighlightProvider>
    </MissionProvider>
  )
}
