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
  /**
   * THE strapline. Not one of several.
   *
   * There were five at once — "Learn Language You Love" on the door, "Find yourself in
   * another language" in the Club footer, "Learn a language through things you already
   * know" in the metadata, and two more variations on the share page and the tab title.
   * Every one of them was defensible and together they meant the product could not say
   * what it was twice running.
   *
   * Everything downstream reads this. A lint fails on any hard-coded variant, because
   * the way five happened was that each one was written on the screen it appeared on.
   */
  strapline: 'Find Yourself in Language',
  /** Kept as an alias so nothing downstream has to change to move. */
  line: 'Find Yourself in Language',
  /** The onboarding question the whole product hangs off. */
  prompt: 'What do you know by heart?',
  /** Browser tab / metadata. */
  title: 'DUB — Find Yourself in Language',
  /**
   * Not the strapline. A description is read by somebody deciding whether to click, and
   * by a search engine deciding what this is — it has to contain the actual nouns.
   */
  description:
    // The sanctioned list, verbatim: naming ONE medium narrows the product to it, which
    // is what the lint is for. Naming the range is the opposite and is already allowed.
    'Learn European Portuguese through films, music, books, TV, sport and culture you already know.',
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
