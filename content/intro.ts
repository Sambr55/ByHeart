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
   * A slug in IMAGE_BANK, where this card has a photograph.
   *
   * Optional and always will be. The sequence was built to read on sand precisely so it
   * could ship before any of these existed, and a card whose picture has not been made yet
   * is a card that still works rather than a hole.
   */
  image?: string
  /**
   * A foundational pillar: the eyebrow arrives as a headline rather than a label.
   *
   * Five of them — VIBES, DROPS, THE FOUR RS, ASK, WITH MATES — and they are what the
   * product IS. They were eleven-point labels doing a headline's job.
   */
  pillar?: true
  /**
   * The one gesture that moves you off this card. Nothing else does anything.
   *
   * THE INTRO IS A RAIL, not a feed you can wander. Each of these cards teaches exactly one
   * movement and then asks for it, in order — choose, up, left, right — so that by the time
   * somebody reaches real content they have made every gesture the product uses rather than
   * read about them. A person who swipes past an instruction has been told a gesture and
   * never performed it, which is the same as not being told.
   *
   * 'choose' is the destination card: picking a city is the gesture, and it advances by
   * itself. The other three are the movements themselves.
   *
   * The required gesture ADVANCES rather than doing its usual job. Swiping right here does
   * not open a pane, it moves you on — because on these cards there is nothing behind the
   * face worth opening, and the lesson is the movement rather than the destination.
   */
  /*
    ONE FIELD, AND THE ARROW IS DERIVED FROM IT.

    This was `only`, beside a second field `gesture` that named the arrow to draw. Across
    all eleven cards the two always agreed — every card declaring an exit declared the same
    value twice — so they were one fact wearing two names, and the conditions reading them
    (`only !== 'in' || gesture`, `Boolean(only) || gesture === 'up'`) were disjunctions
    whose second term could never decide anything. They read as choices and were not, which
    is the whole of why this felt like conflicting logic.

    `exit` rather than `only` because `only` reads as a quantifier — `only === 'in'` looks
    like a test of how many, not of which. This is the one way off the card.

    It also closes a hole in the language story: the arrow is derived, so a Spanish intro
    file cannot declare a rail that differs from the one the engine enforces.
  */
  exit?: 'choose' | 'up' | 'away' | 'in'
  shows?:
    /*
      ONE LINE BECOMING THREE — the demonstration the product is built on and has never
      shown a stranger.

      `root` renders the line alone, which is an advert for the trick rather than the
      trick. `unpack` renders the descent: the line you already know, the Portuguese it
      becomes, the word that did the work, and the three sentences that word now builds.
      All four are already on every root — 306 branches across 98 roots — so this is a
      renderer, not content.

      Resolved from ROOTS rather than restated here. DEMO_BEATS in front-door.ts
      hand-copies tg_goose's three branches, which is one edit away from a demo that
      disagrees with the lesson it is advertising.
    */
    | { kind: 'unpack'; root_id: string }
    /*
      TWO VIBES MAKING ONE SENTENCE. The strongest proof in the codebase, and until now
      visible only mid-session to somebody who already owned both words — which is to say,
      locked behind the commitment it exists to earn.

      68 authored collisions, every one spanning two or more vibes, each carrying its own
      provenance line: "A Beatles single and a Bridget Jones disaster, in one order."
    */
    | { kind: 'collision'; id: string }
    | { kind: 'root'; root_id: string }
    | { kind: 'drop' }
    | { kind: 'legend' }
    | { kind: 'lines'; lines: { pt: string; en: string }[] }
    | { kind: 'exchange'; exchange: { asked: string; pt: string; en: string }[] }
}

export const INTRO_CARDS: IntroCard[] = [
  {
    /*
      CARD ONE IS THE TRICK, not a description of the trick.

      This read "DUB — your travel companion. Learn a language and immerse yourself in its
      local culture." — a category description, true of forty apps, showing nothing. It was
      the first thing a stranger met, and the five cards after it were gesture instructions
      and more description. The six cards that actually demonstrated something came
      SEVENTH onwards.

      Sam: "I want people to come in and be blown away by how you can unpack royale with
      cheese and talk to me goose into useable phrases… we need to SHOW it in the app."

      The line is one everybody knows, so the recognition is free and instant. The claim
      underneath is the oldest sentence in the product and still the best one: you already
      understand more than you can say. Then the unpack proves it in the same breath —
      `comigo` comes out, and three sentences a person would actually use come with it.
    */
    id: 'intro_how',
    /*
      SAND, NOT A PHOTOGRAPH — and this was caught by looking at it rather than reasoning.

      With `image: 'intro_arrival'` the unpack rendered accent-blue Portuguese and muted
      English over a sunlit Lisbon street. The shape was right and the words were close to
      unreadable, which on the one card that has to land is fatal.

      The rule the sequence already follows: a card that SHOWS LANGUAGE takes the sand
      ground (intro_ask, intro_share), and a card that sets a mood takes a photograph. This
      is now the most language-dense card in the product.
    */
    eyebrow: 'SIXTY SECONDS',
    headline: 'You already understand more than you can say.',
    body: 'One line you have known for forty years, and the Portuguese hiding inside it.',
    shows: { kind: 'unpack', root_id: 'tg_goose' },
  },
  {
    /*
      Where, third, and it is interactive rather than an argument.

      The card kind carries no copy of its own — components/Destination.tsx renders it —
      because the choice is the content. Declared here so the ORDER stays one readable list
      rather than a chain of spreads in the component.
    */
    id: 'intro_where',
    // Calçada: the pavement, which is the most Portuguese surface there is.
    image: 'calcada',
    exit: 'choose',
    eyebrow: 'WHERE TO',
    headline: 'Where do you want DUB to take you?',
    body: 'Pick the one you are going to.',
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
    exit: 'up',
    eyebrow: 'KEEP GOING',
    headline: 'Swipe up for the next card.',
    body: 'That is the whole of it. The feed goes on as long as you do.',
  },
  {
    /*
      The reject card, and the promise is the whole of it.

      "Not now" only works as a gesture if people believe the card comes back. Somebody who
      thinks swiping left destroys something will stop swiping, and a feed nobody swipes is
      a list.
    */
    id: 'intro_away',
    image: 'intro_away_card',
    exit: 'away',
    eyebrow: 'NOT THIS ONE',
    headline: 'Swipe left and it goes to the back of the pile.',
    body: 'Not gone — behind the rest, for later. Change your mind and the rewind arrow brings it straight back.',
  },
  {
    id: 'intro_in',
    image: 'intro_in_card',
    exit: 'in',
    eyebrow: 'THIS ONE',
    headline: 'Tap a card to open it. Or swipe right.',
    body: 'Inside is the Portuguese: what to say, when to say it, and somebody saying it.',
  },
  {
    id: 'intro_vibes',
    /* Sand, for the same reason as card one: this shows an unpack now, not a mood. */
    // Tap or swipe right, and it goes to the demo — which is the thing it is describing.
    exit: 'in',
    /*
      The gesture is drawn, not offered as a button.

      This card had TAP TO OPEN under it, which is the fallback every intro card without a
      declared gesture gets. On the one card whose whole job is to hand somebody the demo,
      a static button teaches the wrong thing: the rail is a swipe product, and the arrow
      that moves is what says so. `gesture: 'in'` renders the right-pointing arrow with the
      nudge-right animation and the label "Tap, or swipe right" — the same affordance the
      other guided cards use, so the instruction is consistent across the sequence rather
      than being a button here and an arrow three cards earlier.

      Tapping still works: reveal() is bound to the card, not to the button that was here.
    */
    pillar: true,
    eyebrow: 'VIBES',
    headline: 'Learn from what you have already seen a hundred times.',
    body: 'Top Gun, Bridget Jones, Bond. You don’t learn the line — you recognise it, and keep a word or two that works everywhere.',
    /*
      ROYALE, BECAUSE ONE UNPACK IS A TRICK AND TWO IS A SYSTEM.

      This showed tg_goose — correct when card one was an advert and this was the first
      specimen anybody met. Card one IS the Goose unpack now, so repeating it here proves
      nothing and looks like the product only has one example.

      Pulp Fiction is the other line Sam names, it comes from a different film and a
      different vibe, and `com` builds a different set of sentences — so the second unpack
      says the thing the first one cannot: this happens to every line, not just that one.
    */
    shows: { kind: 'unpack', root_id: 'pf_royale' },
  },
  {
    /*
      TWO VIBES, ONE SENTENCE — the strongest thing DUB does, shown for the first time.

      Every collision in the product combines pieces from DIFFERENT vibes, and until now
      they were visible only mid-session to a learner who already owned both words. So the
      clearest proof of the whole thesis was locked behind the commitment it exists to earn.

      `ola` comes out of a Beatles single in the basics; `vinho` out of a Bridget Jones
      disaster. Neither was about ordering a drink. Together they are the sentence somebody
      needs at a table on their first evening, and the collision's own provenance line says
      exactly that — authored, not written here.
    */
    id: 'intro_collision',
    eyebrow: 'TWO VIBES',
    headline: 'Two things you knew. One sentence you need.',
    body: 'Words from different vibes collide, and what comes out is not in either of them.',
    shows: { kind: 'collision', id: 'tb_bj_vinho' },
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
    image: 'intro_drops_card',
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
    image: 'intro_revision_card',
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
/**
 * THE DEMO IS NO LONGER WOVEN IN, because card one is the demo.
 *
 * `how_it_works` — the playable three-beat DemoCard — used to be spliced in after the
 * VIBES card, back when the sequence opened on "DUB — your travel companion" and nothing
 * demonstrated anything for six cards. It was the only thing showing Portuguese being
 * built, and it was seventh.
 *
 * The unpack is card one now and uses the same Goose line, so weaving the explainer in
 * replayed the same demonstration four cards later under the same SIXTY SECONDS eyebrow —
 * which firstrun-check caught as two cards sharing an eyebrow and one of them bare.
 *
 * DemoCard itself stays: it is the /vibes experience and its beat structure works there.
 * What stops is the splice into the showcase feed.
 */
export const INTRO_DEMO_AFTER: string | null = null
export const INTRO_SETUP_AFTER = 'intro_share'
