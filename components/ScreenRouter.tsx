'use client'

import { useSession } from '@/engine/session'
import { ChoiceExercise } from './ChoiceExercise'
import { CompositeBuilder } from './CompositeBuilder'
import { RecallBurst } from './RecallBurst'
import { TileBuilder } from './TileBuilder'
import { MissionComplete } from './screens/Complete'
import {
  BriefingView,
  CultureSelectView,
  FamiliarityView,
  PromiseView,
} from './screens/Onboarding'
import { BlockIntroView, InventoryView, MatchView } from './screens/Teaching'
import {
  CompoundInventoryView,
  CrossoverResultView,
  CultureCategoriesView,
  ForcedChoiceView,
  FreeTextView,
  MeaningCheckView,
  PostIntentView,
  RetentionResultView,
  ScaleView,
} from './screens/Mission02'
import {
  ContinuationView,
  GenerativityView,
  PreferenceView,
  ResultView,
} from './screens/Outro'

/**
 * Every mission is one client-side state machine over its screens. This dispatches
 * on screen.type and holds no lesson copy of its own.
 */
export function ScreenRouter() {
  const { screen, state } = useSession()
  if (state.complete) return <MissionComplete />

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
    case 'meaning-check':
      return <MeaningCheckView key={screen.id} screen={screen} />
    case 'retention-result':
      return <RetentionResultView key={screen.id} screen={screen} />
    case 'culture-categories':
      return <CultureCategoriesView key={screen.id} screen={screen} />
    case 'free-text':
      return <FreeTextView key={screen.id} screen={screen} />
    case 'forced-choice':
      return <ForcedChoiceView key={screen.id} screen={screen} />
    case 'scale':
      return <ScaleView key={screen.id} screen={screen} />
    case 'composite':
      return <CompositeBuilder key={screen.id} screen={screen} />
    case 'compound-inventory':
      return <CompoundInventoryView key={screen.id} screen={screen} />
    case 'crossover-result':
      return <CrossoverResultView key={screen.id} screen={screen} />
    case 'post-intent':
      return <PostIntentView key={screen.id} screen={screen} />
  }
}
