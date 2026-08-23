'use client'

import { useSyncExternalStore } from 'react'
import { emptyLearner, getLearner, subscribeLearner, type LearnerState } from './learner'

/**
 * One stable snapshot for the server and for hydration. Minting a fresh learner per
 * call makes the snapshot change identity on every render, which React treats as an
 * infinite update — and the first client paint must match the server anyway, since
 * localStorage does not exist there.
 */
const EMPTY = emptyLearner()
const server = () => EMPTY

/** Re-renders whenever the persistent learner changes. */
export function useLearner(): LearnerState {
  return useSyncExternalStore(
    (cb) => subscribeLearner(cb),
    () => getLearner(),
    server,
  )
}
