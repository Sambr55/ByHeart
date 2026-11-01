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
 * EVERY SCREEN CARRIES A PHOTOGRAPH NOW, and that is a reversal of what this file used to
 * argue. The sand ground was chosen so the sequence could ship before the pictures existed
 * — eleven cards, and the bank had six. The sequence is eight screens and the bank has
 * grown, so every one of them has a ground of its own and the alternation it used to rely
 * on for rhythm is gone. What replaces it is order: two gestures, then four things the
 * product does, then one decision.
 *
 * WHY THE GESTURE CARDS ARE IN IT, AND WHY THERE ARE TWO. They open the sequence — left
 * sends a card back, tap or right opens one — and they are the only cards in the product
 * that describe an interaction rather than the language. They earn their place because the
 * grammar changed: left used to open a card and now it sends it away, so even somebody who
 * has used DUB before is holding a different product. And they teach by being: the card you
 * are told to swipe is the card that responds, and the swipe left on the first is what
 * lands you on the second.
 *
 * NO CARD HERE SELLS THE LEGEND. It used to be the price of the Club and three cards said
 * so. It is an optional "introduce yourself" card inside the Club now, and the sequence
 * says nothing about it rather than promising a door that is not there.
 */

/*
  THE FIVE PICTURES, named once.

  Sam, on the Club card: "each roundel needs an icon". They are drawn in the renderer as
  inline SVG inside the 36px ring the words already stood in — no icon font and no new
  dependency for five shapes, and inline means they inherit `currentColor` and are right
  in both themes without a second definition.
*/
export type StepIcon = 'learn' | 'listen' | 'say' | 'share' | 'enjoy'

/*
  AND ONE FOR EACH RUNG OF THE LADDER.

  Sam: "Add an icon to each one and drop in one by one". Named here beside the step icons
  and keyed to the STAGE IDS, so the picture a rung gets is decided by which rung it is
  rather than by where it happens to sit in the list — a stage inserted or reordered keeps
  its own icon, and a stage added without one is a type error rather than a blank ring.

  `legend` is not a stage. It is the ten minutes before the ladder starts, so it carries an
  id of its own here and is prepended by the renderer.
*/
export type StageIcon =
  | 'legend'
  | 'basics'
  | 'around'
  | 'understood'
  | 'conversing'
  | 'leading'

export interface IntroCard {
  id: string
  /** Max 14 characters, like every eyebrow in the product. */
  eyebrow: string
  /*
    THE THREE THAT ARE A SEQUENCE, numbered.

    Sam's deck puts a circled 1, 2 and 3 against VIBES, YOUR LEGEND and THE CLUB, and the
    numbers are the argument: those three cards are one sentence said over three screens —
    build your legend from vibes, your legend earns you the Club, drop into the Club
    whenever you like. ASK, DROPS and the ladder are what the Club HOLDS, so they carry the
    destination as an eyebrow rather than a position in a count.

    Optional, because most cards are not a step. A card without one draws its eyebrow the
    way it always did.

    NO CARD CARRIES ONE SINCE THE LISBON PASS: the three-step Legend sentence went with the
    cards that said it. The field stays because the renderer still draws it, and the next
    counted run of screens should not have to rebuild it.
  */
  step?: 1 | 2 | 3
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
    /*
      THE LADDER, DERIVED FROM STAGES rather than typed.

      Five names written out here drift the moment a stage is renamed or a threshold moves,
      and this is the card that tells somebody what the whole thing adds up to — a wrong
      rung is a promise about a product that does not exist. Same argument as `legend`.
    */
    /*
      THE LADDER, AS FIVE NAMES AND A WAY IN.

      Sam, on this card: "Remove the sub text on each of these sections", "Add an icon to
      each one", "Add Your Legend as the first, above Basics", and move the headline down
      into "a round CTA at the end of the screen".

      So what was a definition list — a rung and a sentence explaining it — becomes a list
      of places, each with a picture, ending in the control that takes you to the first of
      them. The explanations were good and they were also five paragraphs on the card whose
      argument is that this is not homework; what somebody needs here is how far it goes
      and a way to start, which is six words and a button.

      The rungs still come from STAGES, derived rather than retyped, for the reason they
      always did: this is the card that says what the product adds up to, and a rung renamed
      in one place and not the other is a promise about a product that does not exist. YOUR
      LEGEND is prepended here rather than added to STAGES because it is not a rung — it is
      the ten minutes before the ladder starts, and putting it in STAGES would move every
      threshold in the product.
    */
    | { kind: 'stages'; cta: { over: string; label: string } }
    | { kind: 'lines'; lines: { pt: string; en: string }[] }
    /*
      FIVE ACTS, NAMED AND NOT TRANSLATED — the only specimen on the rail with no
      Portuguese in it at all.

      `lines` is the obvious thing to reach for and it is wrong here twice over. Every row
      it draws hangs a play button and a copy button off the left of it and sets the first
      column in the Portuguese face, because every line it has ever carried was a sentence
      somebody would say. Learn, Listen, Say, Share and Enjoy are none of those: they are
      English names for the five things a member does, there is nothing to play and nothing
      worth copying, and dressing them as the language being taught would be the clearest
      possible lie on the card that explains what membership IS.

      `stages` has the same shape and is already spoken for — it is the ladder, derived
      from STAGES, and it carries a second column saying what each rung lets you do. These
      have no second column on purpose. The claim is that there are five and they are
      plain.
    */
    /*
      The five are drawn with an icon each, and the icon is named here rather than
      derived from the word in the renderer. A lookup keyed off a display string is a
      silent break the day somebody rewords a step — this way each step carries its own
      picture and the compiler says so.

      `say` is the one that moves: it borrows `.listening`, the ring the microphone wears
      while it is actually hearing you, so the card shows the mechanic rather than
      describing it.
    */
    | {
        kind: 'steps'
        steps: { word: string; icon: StepIcon }[]
        /*
          SIX FACES, because the five verbs are what a member does and these are who they
          do it with. They arrive one at a time — six landing together is a stock photo,
          six landing in turn is a room filling up.
        */
        members?: { src: string; alt: string }[]
        /*
          The meet-up types itself out. It is the one piece of this card that is a real
          thing on a real date, and a line that appears a character at a time reads as
          news coming in rather than as a caption that was always there.
        */
        meet?: { line: string; where: string; when: string }
      }
    | { kind: 'exchange'; exchange: { asked: string; pt: string; en: string }[] }
    /*
      THE TWO WAYS INTO ASK, shown as the act rather than listed as features.

      `exchange` renders a stack of question-and-answer pairs, which reads as a FAQ: the
      more examples it carries the more it looks like documentation. What ASK actually is
      is two inputs — a phrase you type, and a camera pointed at words you cannot read —
      and the second one is the half nothing in the sequence has ever shown.

      So this carries one of each, and the answer sits under them rather than beside them.
      `shot` keeps its own English because a photographed sign is the one case where the
      translation IS the whole point: somebody looking at "Encerrado para férias" on a
      locked door needs to know the shop is shut, not how to say it.
    */
    | {
        kind: 'asking'
        typed: { asked: string; pt: string }
        shot: { caption: string; pt: string; en: string }
      }
}

/*
  THE SEQUENCE LEADS WITH LISBON NOW, and that reverses a rule this file used to state.

  It said no card may name a language or a city, because every card was met before set-up
  asked for either. That rule belonged to a product whose pitch was "learn through the films
  and songs you already know", where the city was a detail to be settled later. The pitch
  is the city now: somebody visiting Lisbon gets the European Portuguese they need to get
  about. Lisbon is the only open chapter, set-up opens on "Visiting Lisbon?", and a front
  door that will not say where it is, is hiding the one thing a visitor came in for.

  What still holds is the narrower half: no card names a city that is not open. See
  scripts/intro-check.mts, which reads the open chapters rather than a list.

  THE SPECIMENS ARE REAL LINES, every one with its English underneath. The Lisbon card's
  three are taken verbatim from the rooms they come from (content/situations.ts and the
  visitor blocks), so the intro cannot teach a sentence the product does not.
*/
export const INTRO_CARDS: IntroCard[] = [
  {
    /*
      THE GESTURE TUTORIAL IS TWO SLIDES, AND THIS IS THE FIRST OF THEM.

      It opens the sequence: COME IN, and the very next thing is how a card is opened.

      OPENING BEFORE REJECTING, which is the order Sam asked for and is the better lesson
      anyway. Tapping a card is what somebody does with the thing in front of them — it is
      the verb the whole product is made of. Swiping one away is what you do with a card you
      have decided about, and deciding requires having looked.
    */
    id: 'intro_in',
    image: 'intro_in_card',
    exit: 'in',
    eyebrow: "HERE'S HOW IT WORKS",
    headline: 'Tap a card to open it. Or swipe right.',
    body: 'Inside is the language: what to say, when to say it, and somebody saying it.',
  },
  {
    /*
      AND THE SECOND SLIDE, the other half of the same lesson.

      Reached BY the tap or the right swipe, so the instruction on the card before has to be
      performed to get here. A promise about loss only means something to somebody who now
      knows what a card contains; having just opened one, they do.

      THE REWIND RIDES HERE. See the `rewind` prop in components/Feed.tsx, which keys on
      this card's id.
    */
    id: 'intro_away',
    image: 'intro_away_card',
    exit: 'away',
    eyebrow: 'NOT THIS ONE',
    headline: 'Swipe left and it goes to the back of the pile.',
    body: 'Not gone — behind the rest, for later. Change your mind and the rewind arrow brings it straight back.',
  },
  {
    /*
      LISBON, FIRST — the card the whole sequence now exists to make.

      It used to be VIBES here: Top Gun, Bridget Jones and Bond as the pitch, and the city
      somewhere behind them. The owner's call is the reverse. Somebody visiting Lisbon needs
      to get about — arrive, order, find the metro, see the place, cope when it goes wrong —
      and those five are the rooms of the visitor path in the Club, named here in the order
      the path walks them.

      THE PLACES, NOT A FEATURE LIST. "The rooms you will actually stand in" is the claim,
      and it is concrete enough to check: every one is a room a new member lands in straight
      after set-up.

      THREE REAL LINES, verbatim from the rooms that teach them, each with its English: the
      café counter (content/situations.ts lisbon_cafe), asking the way and the bill (the
      visitor blocks). Um café is the first thing most visitors say, so it goes first.
    */
    id: 'intro_lisbon',
    image: 'cafe_counter',
    eyebrow: 'IN LISBON',
    headline: 'The rooms you’ll actually stand in.',
    body: 'Arriving, coffee and food, getting about, seeing the city, and when it goes wrong. Each one gives you the few lines it needs, said the way Lisbon says them.',
    shows: {
      kind: 'lines',
      lines: [
        { pt: 'Um café, por favor.', en: 'An espresso, please.' },
        { pt: 'Desculpe, onde fica o Chiado?', en: 'Excuse me, where is the Chiado?' },
        { pt: 'A conta, por favor.', en: 'The bill, please.' },
      ],
    },
  },
  {
    id: 'intro_drops',
    image: 'intro_drops_card',
    /*
      WHAT IS ON, straight after where you will be — because a visitor's week is both.

      Sam's wording is kept where it still holds: LEARN opens the headline, the calendar and
      the tickets stay. What changed is that the city is named. It came out once because the
      card ran before a city had been chosen; the sequence is about Lisbon now, so "the city"
      stops being coy about which one.
    */
    eyebrow: 'WHAT’S ON',
    headline:
      'LEARN from what’s actually on in Lisbon — a gig, a match, a holiday that shuts the city.',
    body: 'Dropped into your calendar, with the words for when you get there. You can even buy the tickets!',
    /*
      Whatever is genuinely on, with its real date and its English under the Portuguese.
      Empty when nothing is live, which is the honest outcome.
    */
    shows: { kind: 'drop' },
  },
  {
    id: 'intro_ask',
    image: 'pharmacy',
    /*
      THE PERSON'S PROBLEM, not the product's gap.

      Sam: "If you don't know the words you need, just ask!" The moment somebody uses ASK is
      the moment they are standing in front of a thing they cannot say — which, for a
      visitor, is a pharmacy counter or a sign on a locked door.

      The eyebrow said THE CLUB, grouping ASK with DROPS and the ladder as what the Club
      holds once you are through the door. There is no door to be through now — a new
      member lands in the Club — so the eyebrow says when rather than where.
    */
    eyebrow: 'ANY TIME',
    headline: "If you don't know the words you need, JUST ASK.",
    body: 'Anywhere, anytime, it gets straight back to you and saves the words in your library.',
    /*
      THE ACT, NOT A LIST OF QUESTIONS: a phrase being typed, and a sign being photographed.
      Same specimen as the ask_anything explainer, so the two cannot drift.
    */
    shows: {
      kind: 'asking',
      typed: { asked: 'How do I ask them to split the bill?', pt: 'Pode partir a conta em dois?' },
      shot: { caption: 'Or photograph what you cannot read.', pt: 'Encerrado para férias', en: 'Closed for holidays' },
    },
  },
  {
    id: 'intro_vibes',
    image: 'intro_vibes_card',
    /*
      THE SIDE DOOR, and it is last of the four on purpose.

      This was the pitch — step one of three, "Build your legend from VIBES you have seen a
      hundred times" — and the Legend it promised was the price of the Club. Neither is true
      now: the Club is where a new member lands, and the Legend is an optional card inside
      it. So VIBES stops arguing for the product and becomes the fun way in: the lines you
      already carry around, and the word or two in each that works at a café counter too.

      THE SONGS YOU KNOW IS STILL NOT BOLD: the three before it are titles, and it is not.
      The list keeps the shape scripts/vocabulary-check.mts exempts — a list of what a vibe
      can BE, not DUB calling itself a product about songs.

      GOOSE STAYS, because it is the strongest single specimen: "Talk to me, Goose" is the
      line everybody can hear in their head, and comigo comes out of it into three
      sentences somebody would actually use.
    */
    eyebrow: 'FOR FUN',
    headline: 'And a side door: lines you’ve heard a hundred times.',
    body: '**Top Gun**, **Bridget Jones**, **Bond**, the songs you know. You recognise the line, and keep a word or two that works at the café counter too.',
    shows: { kind: 'unpack', root_id: 'tg_goose' },
  },
]
/*
  GONE IN THE LISBON PASS: YOUR LEGEND, THE CLUB, AND THE LADDER.

  The three said one sentence across three screens — build your Legend from vibes, your
  Legend earns you the Club, drop into the Club whenever you like — and the ladder card
  after them put YOUR LEGEND on its first rung. That sentence is no longer true. A new
  member lands in the Club after set-up, on the visitor path, and the Legend is an optional
  "introduce yourself" card inside it. Keeping the cards and softening a word would have
  left the sequence promising a toll the product does not charge.

  What they said that still holds moved: "no streaks" and "drop in whenever" are what the
  Club itself says once you are in it; the meet-up and the faces are Club content.

  REMINDERS, CHEATS and SIXTY SECONDS went in earlier passes; their notes are in history.
*/

/**
 * The last screen, woven into the sequence rather than declared in it.
 *
 * ONE DECISION is the set-up card — a form that answers back rather than an argument. It
 * opens on "Visiting Lisbon?" with yes as the one-tap answer, and staying or moving one
 * row underneath. Then a name, and the learner is in the Club.
 */
/**
 * THE DEMO IS NOT WOVEN IN.
 *
 * VIBES carries the Goose unpack itself, so splicing the three-beat DemoCard in after it
 * would replay the same demonstration on the very next card. DemoCard stays: it is the
 * /vibes experience.
 */
export const INTRO_DEMO_AFTER: string | null = null
/*
  AFTER THE LAST PITCH CARD, which is the side door now.

  Named rather than computed from the array's end on purpose: which card closes the pitch
  is an editorial decision, and a constant that quietly follows the last element would
  change meaning every time somebody appended one.
*/
export const INTRO_SETUP_AFTER = 'intro_vibes'
