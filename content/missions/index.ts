import type { BlockId, Mission, MissionId, Screen } from '../types'
import { MISSION_01 } from './mission-01'
import { MISSION_02 } from './mission-02'

export { MISSION_01, MISSION_02 }

export const MISSIONS: Record<MissionId, Mission> = {
  mission_01: MISSION_01,
  mission_02: MISSION_02,
}

export const MISSION_ORDER: MissionId[] = ['mission_01', 'mission_02']

export function missionOf(screenId: string): Mission | undefined {
  return Object.values(MISSIONS).find((m) => m.screens.some((s) => s.id === screenId))
}

export function allScreens(): Screen[] {
  return Object.values(MISSIONS).flatMap((m) => m.screens)
}

/** Every block a mission touches, taught or re-used. */
export function blocksIn(mission: Mission): BlockId[] {
  return [...mission.targets_new, ...mission.targets_reinforced]
}
