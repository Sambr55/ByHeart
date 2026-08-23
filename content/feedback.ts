import type { MissionId } from './types'

/**
 * The five questions. §19, with §18A explaining why each exists: every one closes a
 * loop the product itself opened. None of it is satisfaction research.
 *
 * The spec is emphatic that this stays at exactly five — no NPS, no demographics, no
 * "what next?" (that signal is captured through the in-product cultural choices before
 * the form), no optional "why?" fields, no extra diagnostics. Delayed recall runs as a
 * separate research follow-up rather than being bolted on here.
 */

export type QuestionKind = 'text' | 'scale'

export interface Question {
  id: string
  prompt: string
  hint?: string
  kind: QuestionKind
  required: boolean
  points?: { value: number; label: string }[]
  /** The product beat this closes the loop on (§18A). Facilitator-facing. */
  closes: string
}

export const FEEDBACK_VERSION = 'v0.6-five-question-spine'

export const QUESTIONS: Question[] = [
  {
    id: 'what_is_it',
    prompt: 'In one sentence, what do you think this product is?',
    kind: 'text',
    required: true,
    closes: 'Landing proposition — is DUB a recognisably different way to learn?',
  },
  {
    id: 'what_you_remember',
    prompt: 'Without looking back, what Portuguese words or phrases can you remember?',
    hint: 'Don’t scroll back. Whatever comes out is the answer.',
    kind: 'text',
    required: true,
    closes: 'Demo and roots — does familiar culture create memorable hooks?',
  },
  {
    id: 'familiarity_helped',
    prompt:
      'Did starting with something culturally familiar make the Portuguese easier to understand and remember?',
    kind: 'scale',
    required: true,
    points: [
      { value: 1, label: 'Not at all' },
      { value: 2, label: 'A little' },
      { value: 3, label: 'Somewhat' },
      { value: 4, label: 'Quite a lot' },
      { value: 5, label: 'Enormously' },
    ],
    closes: 'Learner-chosen starting point — does personal familiarity help?',
  },
  {
    id: 'real_conversation_confidence',
    prompt:
      'How confident do you feel that you could use something you just learned in a real conversation?',
    kind: 'scale',
    required: true,
    points: [
      { value: 1, label: 'Not at all confident' },
      { value: 2, label: 'Slightly' },
      { value: 3, label: 'Moderately' },
      { value: 4, label: 'Quite confident' },
      { value: 5, label: 'Very confident' },
    ],
    closes: 'Build → collision → no-cue release — does the language escape its source?',
  },
  {
    id: 'why_not_return',
    prompt:
      'Be brutal: what is the biggest reason you would NOT come back and use this again?',
    hint: 'This is the most useful box on the page.',
    kind: 'text',
    required: true,
    closes: 'The whole experience — is the difference enough to earn another session?',
  },
]

export interface FeedbackSubmission {
  submission_id: string
  learner_id: string
  /** Who this was, for multi-user testing. */
  tester_label: string
  submitted_at: string
  feedback_version: string
  missions_completed: MissionId[]
  test_variant: string
  cohort_tag: string
  answers: Record<string, string | number>
  performance: Record<string, unknown>
  user_agent: string
}
