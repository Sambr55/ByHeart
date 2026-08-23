import type { MissionId } from './types'

/**
 * Tester feedback.
 *
 * ⚠️ PLACEHOLDER SET. The questions Sam attached did not come through with the
 * request, so this is seeded from the facilitator interview script in the Mission 02
 * spec (Appendix B) plus the roast-test questions in §11. Replace `QUESTIONS` with
 * the attached set — the capture screen, the API, the store and the collation table
 * are all driven from this array, so swapping it changes everything downstream.
 *
 * Design rules carried over from §11, because they are what make the answers worth
 * collecting at all:
 *   - never open with "did you like it?"
 *   - never supply the desired answer inside the question
 *   - ask for the strongest argument against, not for reassurance
 *   - capture performance before opinion, which the mission flow already does
 */

export type QuestionKind = 'text' | 'scale' | 'choice'

export interface Question {
  id: string
  prompt: string
  /** Shown under the prompt in small type. */
  hint?: string
  kind: QuestionKind
  required?: boolean
  /** scale only */
  points?: { value: number; label: string }[]
  /** choice only */
  options?: { id: string; label: string }[]
}

export const FEEDBACK_VERSION = 'placeholder-appendix-b-v1'

export const QUESTIONS: Question[] = [
  {
    id: 'what_is_it_for',
    prompt: 'Without anyone explaining it, what do you think this is trying to do?',
    kind: 'text',
    required: true,
  },
  {
    id: 'what_learned',
    prompt: 'What do you believe you learned?',
    kind: 'text',
    required: true,
  },
  {
    id: 'unprompted_recall',
    prompt: 'Type as much Portuguese as you can remember right now.',
    hint: 'Do not scroll back. Whatever comes out is the answer.',
    kind: 'text',
    required: true,
  },
  {
    id: 'strongest_argument_against',
    prompt: 'What is the strongest argument that this does not work?',
    hint: 'This is the most useful box on the page.',
    kind: 'text',
    required: true,
  },
  {
    id: 'culture_helped',
    prompt: 'Where did the culture genuinely help your memory, and where was it just decoration?',
    kind: 'text',
  },
  {
    id: 'switch_point',
    prompt: 'At what point, if any, did you stop thinking about the films and start thinking in Portuguese?',
    kind: 'text',
  },
  {
    id: 'second_helped_first',
    prompt: 'Did the second world make anything from the first world feel easier? Give a concrete example.',
    kind: 'text',
  },
  {
    id: 'weak_or_fake',
    prompt: 'What felt weak, fake, childish, over-designed or too easy?',
    kind: 'text',
  },
  {
    id: 'remove_entirely',
    prompt: 'What part would you remove entirely?',
    kind: 'text',
  },
  {
    id: 'unfamiliar_culture',
    prompt: 'Would this still work with culture you do not know well? Why?',
    kind: 'text',
  },
  {
    id: 'stop_after_three_days',
    prompt: 'What would make you stop using this after three days?',
    kind: 'text',
  },
  {
    id: 'would_open_tomorrow',
    prompt: 'If I sent you a five-minute deck tomorrow, would you open it?',
    kind: 'choice',
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'probably', label: 'Probably' },
      { id: 'probably_not', label: 'Probably not' },
      { id: 'no', label: 'No' },
    ],
    required: true,
  },
  {
    id: 'would_miss',
    prompt: 'Imagine this prototype is deleted tonight. What, if anything, would you actually miss?',
    hint: 'If the honest answer is "nothing", say nothing.',
    kind: 'text',
    required: true,
  },
]

export interface FeedbackSubmission {
  submission_id: string
  learner_id: string
  submitted_at: string
  feedback_version: string
  /** Which missions this tester had actually done when they answered. */
  missions_completed: MissionId[]
  test_variant: string
  cohort_tag: string
  answers: Record<string, string | number>
  /** Performance travels with the opinion, or the opinion cannot be read. */
  performance: Record<string, unknown>
  user_agent: string
}
