/**
 * Every piece of brand-level copy in the product, in one file.
 *
 * The name changed once already (BY HEART → DUB). It will change again, and the
 * positioning lines will change more often than that. Nothing downstream should
 * hard-code a name or a tagline: flowing a new deck's copy through the product
 * should be an edit to this file and nothing else.
 */
export const BRAND = {
  /** Product name, as it appears in wordmarks and page titles. */
  name: 'DUB',
  /** One-line positioning. */
  line: 'Learn a language through things you already know.',
  /** The onboarding question the whole product hangs off. */
  prompt: 'What do you know by heart?',
  /** Browser tab / metadata. */
  title: 'DUB — Portuguese through culture you already know',
  description: 'Learn a language through things you already know.',
  /** Named objects inside the product. */
  deckName: 'DUB DECK',
  inventoryName: 'Your Portuguese',
} as const

/**
 * Mission-level labels. Kept beside the brand because a deck rename usually renames
 * these too.
 */
export const LABELS = {
  missionWord: 'MISSION',
  sessionComplete: 'SESSION COMPLETE',
  facilitator: 'FACILITATOR',
} as const
