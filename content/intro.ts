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
  /**
   * A REAL specimen from the product, shown rather than described.
   *
   * The sequence is not a trailer for the lookaround — it IS the lookaround, because the
   * wall is the Legend and everything before it is free. Which means an argument card that
   * only argues is the one thing this sequence cannot afford: somebody deciding whether DUB
   * is worth their afternoon is deciding on these cards, and a promise reads exactly like a
   * promise.
   *
   * 'root' names a root by id and shows its actual line, with its audio. 'drop' resolves to
   * whatever is genuinely live and says its real date and venue — so the card is empty when
   * nothing is on, which is honest and is the point. 'legend' derives its examples from
   * LEGEND_FRAMES, so the specimens cannot drift from the questions the product asks.
   */
  /**
   * This card asks for something, so a component renders it rather than the copy above.
   *
   * The copy is still declared, because the sequence's order should be readable in one list
   * and because a card with no headline cannot be found by a check.
   */
  asks?: 'where'
  /**
   * A foundational pillar: the eyebrow arrives as a headline rather than a label.
   *
   * Five of them — VIBES, DROPS, THE FOUR RS, ASK, WITH MATES — and they are what the
   * product IS. They were eleven-point labels doing a headline's job.
   */
  pillar?: true
  /** The gesture that is the ONLY way off this card. Locks the scroll until it is made. */
  only?: 'away' | 'in'
  shows?:
    | { kind: 'root'; root_id: string }
    | { kind: 'drop' }
    | { kind: 'legend' }
    | { kind: 'lines'; lines: { pt: string; en: string }[] }
    | { kind: 'exchange'; exchange: { asked: string; pt: string; en: string }[] }
}

export const INTRO_CARDS: IntroCard[] = [
  {
    id: 'intro_how',
    eyebrow: 'HOW IT WORKS',
    headline: 'DUB — your travel companion.',
    /*
      The media are not named, which the vocabulary lint enforces and which is right.

      DUB teaches from vibes, and a vibe is a thing you already know rather than a category
      of thing. Listing the formats makes it sound like a syllabus with better sources; the
      point is that you have already done the work without noticing.
    */
    body: 'Learn a language and immerse yourself in its local culture.',
  },
  {
    /*
      Where, third, and it is interactive rather than an argument.

      The card kind carries no copy of its own — components/Destination.tsx renders it —
      because the choice is the content. Declared here so the ORDER stays one readable list
      rather than a chain of spreads in the component.
    */
    id: 'intro_where',
    eyebrow: 'WHERE TO',
    headline: 'Where do you want DUB to take you?',
    body: 'One is built. The other is honest about not being.',
    asks: 'where',
  },
  {
    /*
      The swipe-up card, which is its own screen now rather than a footnote on the first.

      Three gestures, three cards, in the order somebody needs them: up to move on, left to
      send a card back, tap to go in. It was a chevron under the opening argument, which is
      where an instruction goes to be ignored.
    */
    id: 'intro_up',
    eyebrow: 'KEEP GOING',
    headline: 'Swipe up for the next card.',
    body: 'That is the whole of it. The feed goes on as long as you do.',
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
    only: 'away',
    eyebrow: 'NOT THIS ONE',
    headline: 'Swipe left and it goes to the back of the pile.',
    body: 'Not gone — behind the rest, for later. Change your mind and the rewind arrow brings it straight back.',
    gesture: 'away',
  },
  {
    id: 'intro_in',
    only: 'in',
    eyebrow: 'THIS ONE',
    headline: 'Tap a card to open it. Or swipe right.',
    body: 'Inside is the Portuguese: what to say, when to say it, and somebody saying it.',
    gesture: 'in',
  },
  {
    id: 'intro_vibes',
    pillar: true,
    eyebrow: 'VIBES',
    headline: 'Learn from what you have already seen a hundred times.',
    body: 'Top Gun, Bond, Bridget Jones. You do not learn the line — you recognise it, and keep a word out of it that works everywhere.',
    /*
      The Goose line, because it is the one the whole product rests on.

      It was a Bond line, which is a real specimen and the wrong one: this card is the claim
      that you already know more than you think, and "Talk to me, Goose" is the only line in
      the library that proves it to somebody who has never heard of DUB. The demo follows
      immediately and does it properly — this is the trailer for the thing one card later.
    */
    shows: { kind: 'root', root_id: 'tg_goose' },
  },
  {
    id: 'intro_legend',
    eyebrow: 'YOUR LEGEND',
    headline: 'Build your legend out of what you have learned.',
    body: 'Seven things about yourself, said in Portuguese with nothing on screen. It is what a stranger asks you, in the order they ask it.',
    /*
      Derived from LEGEND_FRAMES rather than typed here.

      Five hand-written specimens drift the moment a frame changes, and this is the card
      that tells somebody what the Legend IS — a wrong example here is a promise about the
      wrong product. Deriving them means they cannot go stale without the questions going
      stale too.

      They are still specimens. Nobody's real Legend leaves the device.
    */
    shows: { kind: 'legend' },
  },
  {
    id: 'intro_drops',
    pillar: true,
    eyebrow: 'DROPS',
    headline: 'What is actually on in Lisbon, and what to say when you get there.',
    body: 'A gig, a match, a holiday that shuts the city. It arrives when the thing is close and it goes the morning after.',
    /*
      Whatever is genuinely on, with its real date.

      Empty when nothing is live, which is the honest outcome and the one worth having: a
      card promising live events while showing none is the exact failure this whole sequence
      is meant to avoid.
    */
    shows: { kind: 'drop' },
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
    pillar: true,
    eyebrow: 'THE FOUR RS',
    headline: 'Regular, relevant revision reminders.',
    body: 'Every day, a handful of the words you own come back round — the ones you are closest to losing, not the ones you learned last.',
    // A real word out of a real root, which is what would actually come back round.
    shows: { kind: 'root', root_id: 'ah_enjoy' },
  },
  {
    id: 'intro_ask',
    pillar: true,
    eyebrow: 'ASK',
    headline: 'The sentence we have not taught you yet.',
    body: 'Ask for it, anywhere, any time, and get it back in the Portuguese they actually speak here. It goes into your own library.',
    /*
      A real answer to a real question, written out rather than resolved from a root.

      The translator's own output needs a key and a round trip, and a card that sometimes
      shows nothing would be worse than one that shows a true example of what comes back.
      These two are the register the translator is built to produce — European, and the
      thing somebody would actually need on a Tuesday.
    */
    /*
      The translator as an exchange rather than as two sentences.

      A pair of lines reads as vocabulary. What this card has to show is the ACT: somebody
      asked for something in English and got European Portuguese back, which is the thing
      no other card in the sequence demonstrates.
    */
    shows: {
      kind: 'exchange',
      exchange: [
        { asked: 'How do I ask them to split the bill?', pt: 'Pode partir a conta em dois?', en: 'Could you split the bill in two?' },
        { asked: 'Does this have gluten in it?', pt: 'Isto leva glúten?', en: 'Does this have gluten in it?' },
      ],
    },
  },
  {
    id: 'intro_share',
    pillar: true,
    eyebrow: 'WITH MATES',
    headline: 'Show somebody three things you can say.',
    body: 'They can show you theirs. Learning the same city at the same time as somebody you know is the difference between a habit and a chore.',
    // The shape of a showing: three sentences somebody has said cold.
    shows: {
      kind: 'lines',
      lines: [
        { pt: 'Uma bica, se faz favor.', en: 'An espresso, please.' },
        { pt: 'A fila é aqui?', en: 'Is the queue here?' },
        { pt: 'Pode repetir mais devagar?', en: 'Could you say that again more slowly?' },
      ],
    },
  },
]

/**
 * The two cards woven into the sequence rather than declared in it.
 *
 * SET-UP MOVED TO THE END. It sat after the Legend card, on the reasoning that the Legend
 * is the first moment somebody has been told what the answers are for — which was true, and
 * left four arguments stranded behind a commitment. Drops, revision, ask and share are the
 * reasons to bother, and asking somebody to decide before they have heard them is asking
 * early to no purpose.
 *
 * Last means last: they have seen everything the product does, chosen a city, watched the
 * demo, and read what a Legend is. Then one decision.
 */
export const INTRO_DEMO_AFTER = 'intro_vibes'
export const INTRO_SETUP_AFTER = 'intro_share'
