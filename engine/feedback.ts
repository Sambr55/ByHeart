'use client'

import type { FeedbackSubmission } from '@/content/feedback'
import { FEEDBACK_VERSION } from '@/content/feedback'
import { getLearner } from './learner'

const PENDING_KEY = 'dub.feedback.pending.v1'

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 's_' + Math.abs(Math.floor(performance.now() * 1000)).toString(36)
}

export function buildSubmission(
  answers: Record<string, string | number>,
  performance: Record<string, unknown> = {},
): FeedbackSubmission {
  const learner = getLearner()
  return {
    submission_id: uid(),
    learner_id: learner.learner_id,
    tester_label: learner.tester_label,
    submitted_at: new Date().toISOString(),
    feedback_version: FEEDBACK_VERSION,
    missions_completed: learner.missions_completed,
    test_variant: learner.experiment.test_variant,
    cohort_tag: learner.experiment.cohort_tag,
    answers,
    performance: {
      inventory: Object.fromEntries(
        Object.entries(learner.inventory).map(([k, v]) => [k, v.latest_state]),
      ),
      evidence_count: learner.evidence.length,
      affinity: learner.affinity,
      ...performance,
    },
    user_agent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
  }
}

/**
 * A tester's answers must not depend on a store existing. Every submission is kept
 * locally first, then pushed; anything that fails to send stays queued and is retried
 * the next time a page opens.
 */
export async function submitFeedback(
  submission: FeedbackSubmission,
): Promise<{ stored: boolean; reason?: string }> {
  queue(submission)
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(submission),
    })
    const body = (await res.json()) as { stored?: boolean; reason?: string }
    if (res.ok && body.stored) {
      unqueue(submission.submission_id)
      return { stored: true }
    }
    return { stored: false, reason: body.reason ?? 'server did not store it' }
  } catch (err) {
    return { stored: false, reason: err instanceof Error ? err.message : 'network error' }
  }
}

function readQueue(): FeedbackSubmission[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(PENDING_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeQueue(items: FeedbackSubmission[]) {
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(items))
  } catch {
    // Nothing to do; the in-flight submission still tries the network.
  }
}

function queue(s: FeedbackSubmission) {
  const items = readQueue().filter((x) => x.submission_id !== s.submission_id)
  writeQueue([...items, s])
}

function unqueue(id: string) {
  writeQueue(readQueue().filter((x) => x.submission_id !== id))
}

export function pendingFeedback(): FeedbackSubmission[] {
  return readQueue()
}

/** Retry anything stranded by an outage or an unconfigured store. */
export async function flushFeedback(): Promise<number> {
  let sent = 0
  for (const s of readQueue()) {
    const { stored } = await submitFeedback(s)
    if (stored) sent++
  }
  return sent
}

export function downloadFeedback(submission: FeedbackSubmission) {
  const blob = new Blob([JSON.stringify(submission, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'dub-feedback-' + submission.submission_id.slice(0, 8) + '.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
