'use client'

import { MISSION_02 } from '@/content/missions'
import { MissionShell } from '@/components/MissionShell'
import { ScreenRouter } from '@/components/ScreenRouter'
import { HighlightProvider } from '@/engine/highlight'
import { MissionProvider } from '@/engine/session'

export default function Page() {
  return (
    <MissionProvider mission={MISSION_02}>
      <HighlightProvider>
        <MissionShell>
          <ScreenRouter />
        </MissionShell>
      </HighlightProvider>
    </MissionProvider>
  )
}
