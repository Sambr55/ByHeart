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
  asks?: 'where' | 'choose'
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

export const INTRO_CARDS: IntroCard[] = [
  {
    /*
      THE GESTURE TUTORIAL IS TWO SLIDES, AND THIS IS THE FIRST OF THEM.

      It opens the sequence: COME IN, and the very next thing is how a card is opened.

      OPENING BEFORE REJECTING, which is the order Sam asked for and is the better lesson
      anyway. The two gestures are not equals. Tapping a card is what somebody does with
      the thing in front of them — it is the verb the whole product is made of, and it is
      the one a stranger will try first whether or not they were told to. Swiping a card
      away is what you do with a card you have decided about, and deciding requires having
      looked. Teaching reject first asked people to dismiss something before they had any
      idea what opening one would have given them.

      What used to be here was SIXTY SECONDS: the Goose unpack, arguing that you already
      understand more than you can say. That argument has not been lost, it moved to slide
      4, VIBES, which carries the Goose line itself. Two cards making the same
      demonstration under two eyebrows was the actual fault.
    */
    id: 'intro_in',
    image: 'intro_in_card',
    exit: 'in',
    eyebrow: "HERE'S HOW IT WORKS",
    headline: 'Tap a card to open it. Or swipe right.',
    body: 'Inside is the Portuguese: what to say, when to say it, and somebody saying it.',
  },
  {
    /*
      AND THE SECOND SLIDE, which is the other half of the same lesson.

      Reached BY the tap or the right swipe, which is what makes the pair work: the
      instruction on the card before it has to be performed to get here, so the tutorial is
      never read without being done. Then this one asks for the opposite movement.

      It follows opening for a reason beyond order. "Swipe left and it goes to the back of
      the pile" is a promise about loss, and a promise about loss only means something to
      somebody who now knows what a card contains. Having just opened one, they do.

      THE REWIND RIDES HERE NOW. It answers the gesture that has just been asked for rather
      than one made two cards ago — the person has been told a card can be sent away, and
      the looping arrow beside the instruction says it comes back. See the `rewind` prop in
      components/Feed.tsx, which keys on this card's id.
    */
    id: 'intro_away',
    image: 'intro_away_card',
    exit: 'away',
    eyebrow: 'NOT THIS ONE',
    headline: 'Swipe left and it goes to the back of the pile.',
    body: 'Not gone — behind the rest, for later. Change your mind and the rewind arrow brings it straight back.',
  },
  {
    id: 'intro_vibes',
    image: 'intro_vibes_card',
    pillar: true,
    eyebrow: 'VIBES',
    headline: 'Learn from what you have already seen a hundred times.',
    /*
      THE SONGS YOU KNOW IS NOT BOLD, and that is a deliberate piece of typography rather
      than an oversight.

      The three before it are titles — Top Gun, Bridget Jones, Bond — and they are set in
      the emphasis this card uses for a named thing. "the songs you know" is not a title.
      Bolding it would make the list read as four franchises, one of which nobody can
      place; leaving it plain is what makes the sentence land as "and everything else you
      already carry around".
    */
    body: '**Top Gun**, **Bridget Jones**, **Bond**, the songs you know. You don’t learn the line — you recognise it, and keep a word or two that works everywhere.',
    /*
      GOOSE, NOT ROYALE, and the reason is that there is only one unpack in the sequence
      now.

      This card showed pf_royale on the reasoning that card one was already the Goose
      unpack, so a second line from a second film proved the trick was a system rather
      than a one-off. Card one is gone — the SIXTY SECONDS screen went with it — and with
      it the thing royale was contrasting against. What is left is a single specimen, and
      the single specimen should be the strongest one: "Talk to me, Goose" is the line
      Sam names first, it is the one everybody can hear in their head, and `comigo` comes
      out of it into three sentences somebody would actually use.

      The Royale com queijo card went entirely in the same pass — see the removals.
    */
    shows: { kind: 'unpack', root_id: 'tg_goose' },
  },
  {
    id: 'intro_legend',
    image: 'intro_arrival',
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
    id: 'intro_ask',
    image: 'pharmacy',
    pillar: true,
    eyebrow: 'ASK',
    headline: 'The sentence we have not taught you yet.',
    body: 'Ask for it, anywhere, any time, and get it back in the Portuguese they actually speak here. It goes into your own library.',
    /*
      THE ACT, NOT A LIST OF QUESTIONS.

      This showed an exchange: two questions somebody typed and the European Portuguese
      that came back. As copy it was true and as a card it was a FAQ — a stack of
      sentences, read left to right, describing a feature.

      What the card has to show is the two ways in, because they are the whole of what
      ASK is: type a phrase, or point the camera at something written in a language you
      cannot read. A person looking at a menu they cannot order from is the entire use
      case, and no list of example questions puts them in that moment.

      So the specimen is the input rather than the output — a phrase being typed, and a
      sign being photographed — and the answer comes underneath one of them.
    */
    shows: {
      kind: 'asking',
      typed: { asked: 'How do I ask them to split the bill?', pt: 'Pode partir a conta em dois?' },
      shot: { caption: 'Or photograph what you cannot read.', pt: 'Encerrado para férias', en: 'Closed for holidays' },
    },
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
      WHAT ARE WE LEARNING, AND WHERE — asked at last, and asked before it is needed.

      Sam: "we haven't asked them what language we are learning yet, so how do we know to
      return the answers in Portuguese. The same goes for the tagline — European
      Portuguese."

      The question used to be here as WHERE TO and was removed when the sequence went to
      eight screens; the city became a silent write inside set-up and the language was
      never asked at all. So every screen before this one shows Portuguese, and the header
      calls itself "European Portuguese, and the places you will use it", on an assumption
      the learner was never given a chance to make.

      IT COMES AFTER THE ARGUMENT AND NOT BEFORE IT. The old card sat third, on the
      reasoning that asking early makes every card after it true of somewhere specific.
      That reasoning was sound and it cost the thing that matters more: a stranger who has
      seen nothing yet is being asked to commit to a language. Now they have watched the
      unpack, read what a Legend is, seen what ASK does and what is on in Lisbon — and
      then they are asked. The screens before it are a demonstration, which is true of
      Portuguese whether or not Portuguese is what they pick.

      `asks` rather than `shows`, because the card is answered rather than read.
      components/Choose.tsx renders it; the copy here keeps the sequence readable as one
      list and gives the check something to find.
    */
    id: 'intro_choose',
    /*
      LOCKED TO ITS OWN QUESTION, which lint-content enforces and is right to.

      A card that asks something must be the only way off itself — otherwise the question
      can be swiped past while everything downstream waits on the answer, which is the
      exact failure this card exists to fix. `exit: 'choose'` means choosing IS the
      gesture: Choose calls onDone from the city row and the rail advances on it.
    */
    exit: 'choose',
    /*
      A café counter, not the calçada — chosen by looking at it rather than by theme.

      Calçada is the most Portuguese surface there is and it is pale limestone in daylight,
      which is the worst ground in the bank for a card carrying eight rows of white type.
      Destination's own note already warned about it: greyed has to mean "not available",
      never "hard to read". On the calçada the COMING rows read as a rendering fault.

      The zinc counter is an interior, it is dark, and it is the one picture in the bank
      that is about arriving somewhere and ordering — which is what the card is asking.
    */
    image: 'cafe_counter',
    asks: 'choose',
    eyebrow: 'YOUR LANGUAGE',
    headline: 'What are we learning, and where?',
    body: 'Pick the language first — the cities that speak it come with it. One of each is built; the rest are on the way and say so.',
  },
]

/**
 * Screen eight, woven into the sequence rather than declared in it.
 *
 * ONE DECISION is the set-up card — a form that answers back rather than an argument —
 * which is why it is spliced in here instead of sitting in the list above with the six
 * that are copy. It is last because last is what it means: by the time somebody reaches
 * it they have made both gestures, seen what a vibe is, what a Legend is, what ASK does
 * and what is on in Lisbon. Then one decision, and tapping OPEN ends the intro.
 *
 * It follows DROPS because DROPS is the final card now. It used to follow `intro_share`,
 * the WITH MATES card, which no longer exists — that card, THE FOUR RS and the collision
 * went in the same pass that took the sequence to eight screens.
 */
/**
 * THE DEMO IS NOT WOVEN IN.
 *
 * `how_it_works` — the playable three-beat DemoCard — used to be spliced in after the
 * VIBES card, back when the sequence opened on "DUB — your travel companion" and nothing
 * demonstrated anything for six cards. It was the only thing showing Portuguese being
 * built, and it was seventh.
 *
 * VIBES carries the Goose unpack itself now, so weaving the explainer in would replay the
 * same demonstration on the very next card — which is the duplication this rework exists
 * to remove.
 *
 * DemoCard itself stays: it is the /vibes experience and its beat structure works there.
 * What stops is the splice into the showcase feed.
 */
export const INTRO_DEMO_AFTER: string | null = null
/*
  ONE DECISION follows DROPS, and the language/city selector follows IT.

  The splice in Feed.tsx inserts the set-up card immediately after the card named here, so
  anchoring it to DROPS puts it between DROPS and the selector — which is the order Sam
  asked for: "add the Language/City selector as the first screen after Then you
  start/Open."

  Read as a sequence: DROPS closes the argument, ONE DECISION is the commitment, and the
  selector is the first thing on the other side of it. What follows the selector is the
  account screen and the why-are-you-here question, in that order.
*/
export const INTRO_SETUP_AFTER = 'intro_drops'
