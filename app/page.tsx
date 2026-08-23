'use client'

import { SessionProvider, useSession } from '@/engine/session'
import { HighlightProvider } from '@/engine/highlight'
import { MissionShell } from '@/components/MissionShell'
import { ChoiceExercise } from '@/components/ChoiceExercise'
import { TileBuilder } from '@/components/TileBuilder'
import { RecallBurst } from '@/components/RecallBurst'
import {
  BriefingView,
  CultureSelectView,
  FamiliarityView,
  PromiseView,
} from '@/components/screens/Onboarding'
import {
  BlockIntroView,
  InventoryView,
  MatchView,
} from '@/components/screens/Teaching'
import {
  ContinuationView,
  GenerativityView,
  PreferenceView,
  ResultView,
} from '@/components/screens/Outro'

/**
 * The whole ten minutes is one client-side state machine over SCREENS.
 * Every branch below dispatches on screen.type — no lesson copy lives in here.
 */
function Router() {
  const { screen } = useSession()
  switch (screen.type) {
    case 'promise':
      return <PromiseView key={screen.id} screen={screen} />
    case 'culture-select':
      return <CultureSelectView key={screen.id} screen={screen} />
    case 'familiarity':
      return <FamiliarityView key={screen.id} screen={screen} />
    case 'briefing':
      return <BriefingView key={screen.id} screen={screen} />
    case 'block-intro':
      return <BlockIntroView key={screen.id} screen={screen} />
    case 'choice':
      return <ChoiceExercise key={screen.id} screen={screen} />
    case 'tiles':
      return <TileBuilder key={screen.id} screen={screen} />
    case 'match':
      return <MatchView key={screen.id} screen={screen} />
    case 'recall-burst':
      return <RecallBurst key={screen.id} screen={screen} />
    case 'inventory':
      return <InventoryView key={screen.id} screen={screen} />
    case 'result':
      return <ResultView key={screen.id} screen={screen} />
    case 'generativity':
      return <GenerativityView key={screen.id} screen={screen} />
    case 'preference':
      return <PreferenceView key={screen.id} screen={screen} />
    case 'continuation':
      return <ContinuationView key={screen.id} screen={screen} />
  }
}

export default function Page() {
  return (
    <SessionProvider>
      <HighlightProvider>
        <MissionShell>
          <Router />
        </MissionShell>
      </HighlightProvider>
    </SessionProvider>
  )
}
