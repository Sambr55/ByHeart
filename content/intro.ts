/**
 * The sequence a stranger swipes through, which IS the showcase rather than a corridor
 * before it.
 *
 * WHY THESE ARE NOT PHOTOGRAPHS. There are two visual languages in DUB and they were doing
 * different jobs without anybody saying so. The Club is full-bleed photography with a dark
 * scrim and white type — that is a card SHOWING you something. The intro screens were sand
 * and type — that is a card ARGUING something. Making the argument cards look like content
 * cards would need eleven photographs the bank does not have, and would flatten the
 * difference between "here is Lisbon" and "here is what we do".
 *
 * So the sequence alternates deliberately: argument, argument, then the demo, which is a
 * photograph and plays. The change of ground is the rhythm, and it means the whole thing
 * needs no new pictures at all.
 *
 * WHY THE GESTURE CARDS ARE IN IT. Two of these teach the grammar — left sends a card back,
 * tap opens it — and they are the only cards in the product that describe an interaction
 * rather than the language. They earn their place because the grammar changed: left used to
 * open a card and now it sends it away, so even somebody who has used DUB before is holding
 * a different product. And they teach by being: the card you are told to swipe is the card
 * that responds.
 *
 * THE FIVE LEGEND EXAMPLES ARE SPECIMENS, NOT ANYBODY'S. Worth saying out loud in the file
 * that holds them, because the rule that a Legend contains somebody's children by name,
 * their age and their marital status, and must never leave the device, is enforced in one
 * place (engine/showable.ts) with a check behind it. A screen full of "example Legends" is
 * exactly where somebody would later be tempted to show a real one.
 */

export interface IntroCard {
  id: string
  /** Max 14 characters, like every eyebrow in the product. */
  eyebrow: string
  headline: string
  body: string
  /**
   * Specimen lines, where the card is better shown than described.
   *
   * Only the Legend card has these today. They are examples of the SHAPE of an answer, and
   * every one of them is invented.
   */
  examples?: string[]
  /**
   * The gesture this card is about, where it is about one.
   *
   * Drives an illustration rather than copy — an arrow you can look at beats a sentence
   * describing an arrow, and these two cards exist because the grammar changed under
   * people who already knew the old one.
   */
  gesture?: 'up' | 'away' | 'in'
}

export const INTRO_CARDS: IntroCard[] = [
  {
    id: 'intro_how',
    eyebrow: 'HOW IT WORKS',
    headline: 'Portuguese you already half-know, from things you already love.',
    /*
      The media are not named, which the vocabulary lint enforces and which is right.

      DUB teaches from vibes, and a vibe is a thing you already know rather than a category
      of thing. Listing the formats makes it sound like a syllabus with better sources; the
      point is that you have already done the work without noticing.
    */
    body: 'Things you have known for years, and the city you are going to. Nothing to memorise and no lessons — you swipe, and you keep what sticks.',
    gesture: 'up',
  },
  {
    /*
      The reject card, and the promise is the whole of it.

      "Not now" only works as a gesture if people believe the card comes back. Somebody who
      thinks swiping left destroys something will stop swiping, and a feed nobody swipes is
      a list.
    */
    id: 'intro_away',
    eyebrow: 'NOT THIS ONE',
    headline: 'Swipe left and it goes to the back of the pile.',
    body: 'Not gone — behind the rest, for later. Change your mind and the rewind arrow brings it straight back.',
    gesture: 'away',
  },
  {
    id: 'intro_in',
    eyebrow: 'THIS ONE',
    headline: 'Tap a card to open it. Or swipe right.',
    body: 'Inside is the Portuguese: what to say, when to say it, and somebody saying it.',
    gesture: 'in',
  },
  {
    id: 'intro_vibes',
    eyebrow: 'VIBES',
    headline: 'Learn from what you have already seen a hundred times.',
    body: 'Top Gun, Bond, Bridget Jones. You do not learn the line — you recognise it, and keep a word out of it that works everywhere.',
  },
  {
    id: 'intro_legend',
    eyebrow: 'YOUR LEGEND',
    headline: 'Build your legend out of what you have learned.',
    body: 'Seven things about yourself, said in Portuguese with nothing on screen. It is what a stranger asks you, in the order they ask it.',
    examples: [
      'Chamo-me Sam.',
      'Sou inglês.',
      'Trabalho aqui.',
      'Estou cá há dois anos.',
      'Quero aprender português.',
    ],
  },
  {
    id: 'intro_drops',
    eyebrow: 'DROPS',
    headline: 'What is actually on in Lisbon, and what to say when you get there.',
    body: 'A gig, a match, a holiday that shuts the city. It arrives when the thing is close and it goes the morning after.',
  },
  {
    /*
      The 4 R's, and the copy is careful about "daily" on purpose.

      Revision genuinely can be daily — it draws on what somebody already owns and never
      runs out. Drops cannot: they are pegged to real events and can be weeks apart. So
      this card promises every day and the drops card does not, which is the split between
      what each thing can actually keep.
    */
    id: 'intro_revision',
    eyebrow: 'THE FOUR RS',
    headline: 'Regular, relevant revision reminders.',
    body: 'Every day, a handful of the words you own come back round — the ones you are closest to losing, not the ones you learned last.',
  },
  {
    id: 'intro_ask',
    eyebrow: 'ASK',
    headline: 'The sentence we have not taught you yet.',
    body: 'Ask for it, anywhere, any time, and get it back in the Portuguese they actually speak here. It goes into your own library.',
  },
  {
    id: 'intro_share',
    eyebrow: 'WITH MATES',
    headline: 'Show somebody three things you can say.',
    body: 'They can show you theirs. Learning the same city at the same time as somebody you know is the difference between a habit and a chore.',
  },
]

/** The two cards that are woven into the sequence rather than declared in it. */
export const INTRO_DEMO_AFTER = 'intro_vibes'
export const INTRO_SETUP_AFTER = 'intro_legend'
