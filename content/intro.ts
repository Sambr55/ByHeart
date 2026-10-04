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
  NO CARD HERE NAMES A LANGUAGE, and that is a rule rather than a style choice.

  Every screen in this list is met BEFORE the language is chosen — the selector is on the
  set-up card, which is the last of them. So "Inside is the Portuguese", "said in
  Portuguese" and "the Portuguese they actually speak here" were all asserting an answer
  to a question nobody had been asked. Reported directly: "you are assuming Portuguese
  ... before the language has been selected."

  The specimens are a different matter and stay as they are. A card SHOWING "Fala comigo,
  Goose" is showing what the product does with a real line, and the demonstration has to
  be in some language to be a demonstration at all. What changes is the copy that
  describes the product, which should read as true whichever language gets picked.
*/
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
    body: 'Inside is the language: what to say, when to say it, and somebody saying it.',
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
    /*
      SAM'S OWN LINE, from the intro flow deck: "Build your LEGEND from what you have
      seen a hundred times."

      The headline it replaces — "Learn from what you have already seen a hundred times"
      — said what the card SHOWS and stopped there. This one says what the showing is
      FOR, and it names the Legend on the first pillar rather than waiting for the card
      that introduces it, so the sequence has one destination stated four cards early
      instead of a feature list that arrives at one.

      The second half of the sentence is unchanged, because it is the claim: the hundred
      times are already behind you.
    */
    headline: 'Build your legend from what you have seen a hundred times.',
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
  /*
    CHEATS, HACKS & BLUFFS IS GONE, and it went the same way REMINDERS did.

    Sam: "Remove Cheats,Hacks and Bluffs from teh intro sequence."

    The argument it made is still true — the plainest words in the language are behind
    twelve units of fruit vocabulary everywhere else, and here they are a card you open and
    keep. What was wrong is where it made it. It sat second, between VIBES and the Legend,
    which put a FEATURE in the middle of the one run of screens that has to be about the
    person: you already know more than you think, here is what ten minutes buys you, here
    is the Club. A cheat sheet is a thing DUB has; it is not a reason to start.

    The sheets themselves are untouched. They are in the product, they are on YOURS, and
    they are what a learner finds the first time they need the days of the week — which is
    the moment the card was describing and a better place to meet it than screen two.
  */
  {
    id: 'intro_legend',
    image: 'intro_arrival',
    eyebrow: 'YOUR LEGEND',
    /*
      WHAT IT BUYS YOU, rather than what it is made of.

      Sam's line: "Your LEGEND gets you a seat at any table." The headline it replaces —
      "Build your legend out of what you have learned" — described the ASSEMBLY, which is
      the one thing the body underneath already spells out at length. Worse, VIBES four
      cards earlier now opens with "Build your legend from what you have seen a hundred
      times", so the two pillars led with the same verb and the same object and read as
      one claim made twice.

      This one is the consequence: a seat at any table is what seven sentences said cold
      actually gets somebody, and it is the only thing on this card that is not a
      mechanic.
    */
    headline: 'Your legend gets you a seat at any table.',
    /*
      WHAT THE LEGEND IS FOR, said on the card that introduces it.

      The card explained the mechanic — seven things, said cold — and stopped there, so
      the Legend read as an exercise rather than as the threshold it is. Every other card
      in the intro sells the Club; this one built the thing that gets you in and never
      mentioned it. Sam: add "Once you have your Legend, you're in The DUB Club."

      Kept as the last sentence rather than folded into the first: it is a consequence,
      and a consequence reads as one when it follows the thing it is a consequence of.
    */
    body: "Seven things about yourself, said out loud with nothing on screen. It is what a stranger asks you, in the order they ask it. Once you have your Legend, you're in **DUB Club**.",
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
    /*
      WHAT THE LEGEND IS A DOOR TO, on a card of its own.

      New in the intro flow deck as screen 6, immediately behind the Legend: "Once your
      LEGEND is complete*, you are in THE CLUB. *takes approx 10 minutes", and then five
      words — Learn, Listen, Say, Share, Enjoy.

      THE LEGEND CARD SAID THIS IN A SUBORDINATE CLAUSE and that is why this exists. Its
      body ends "Once you have your Legend, you're in **DUB Club**" — the single most
      important sentence in the sequence, arriving fourth in a paragraph about how many
      questions there are. A consequence that big is not a clause.

      TEN MINUTES IS THE WHOLE OF THE ASK, and nothing in the product had ever said how
      long anything takes. Every other app in the category is vague about this on purpose,
      because the honest answer is months. DUB's answer is ten minutes to the thing that
      gets you in, and a number that specific is only worth printing if it is true: seven
      Legend questions, answered out loud, is about that.

      The asterisk is Sam's and it is kept as an asterisk rather than folded into the
      sentence. A qualification inside the promise weakens it; a qualification under it
      reads as the product showing its working.

      NO PILLAR HERE, deliberately, though it is the biggest claim in the file. The five
      pillars are the things DUB IS — VIBES, CHEATS, ASK, DROPS and the reward card — and
      this is a threshold between two of them. Setting it at pillar size would make six
      enormous eyebrows in a row and flatten the rhythm that makes any of them land.
    */
    id: 'intro_club',
    image: 'intro_arrival',
    eyebrow: 'THE CLUB',
    headline: 'Once your legend is complete, you are in THE CLUB.',
    /*
      THE FIVE VERBS, said once in the body and drawn underneath.

      They are not features and they are not a syllabus — they are what a member spends
      an evening doing, in the order it happens: you learn a line, you hear it said, you
      say it back, you send it to somebody, and then the night is better for it.
    */
    body: 'It takes about ten minutes. Seven sentences about yourself, said out loud, and the door is open.',
    shows: {
      kind: 'steps',
      steps: [
        { word: 'Learn', icon: 'learn' },
        { word: 'Listen', icon: 'listen' },
        { word: 'Say', icon: 'say' },
        { word: 'Share', icon: 'share' },
        { word: 'Enjoy', icon: 'enjoy' },
      ],
      /*
        WHO IS ALREADY IN, shown rather than counted.

        Sam, on the member count: honest, and two is honest. A number is honest and cold;
        six faces is what the room looks like when you walk in, and nothing here claims
        how many there are. They are the example members shipped in /vibes/members.
      */
      members: [
        { src: '/vibes/members/liv.png', alt: 'Liv, smiling, outdoors.' },
        { src: '/vibes/members/rob.png', alt: 'Rob, outdoors.' },
        { src: '/vibes/members/vinnie.png', alt: 'Vinnie.' },
        { src: '/vibes/members/coffee-lover.png', alt: 'A member with a coffee.' },
        { src: '/vibes/members/com-gelo.png', alt: 'A member with an iced drink.' },
        { src: '/vibes/members/mountain-guy.png', alt: 'A member out on a hillside.' },
      ],
      /*
        ONE REAL NIGHT, with an address and a time on it.

        The rest of this card is what membership is in the abstract. This is the thing
        that makes it a club rather than a course: somewhere to be, on a date, with the
        people whose faces are directly above it.
      */
      meet: {
        line: 'Lisbon Digital Nomads Xmas Meet-up!',
        where: 'Honest Greens. R. Ivens 44, 1200-445 Lisboa',
        when: '19 Dec. 1900hrs',
      },
    },
  },
  {
    id: 'intro_ask',
    image: 'pharmacy',
    pillar: true,
    eyebrow: 'ASK',
    /*
      THE PERSON'S PROBLEM, not the product's gap.

      Sam: "If you don't know the words you need, just ask!" The headline it replaces —
      "The sentence we have not taught you yet" — was written from inside the syllabus:
      it described ASK as the hole in the teaching, which is true and is nobody's reason
      to tap it. The moment somebody actually uses ASK is the moment they are standing in
      front of a thing they cannot say, and this is that moment in their words.
    */
    headline: "If you don't know the words you need, just ask.",
    body: 'Ask for it, anywhere, any time, and get it back in the words they actually speak here. It goes into your own library.',
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
    /*
      NO CITY HERE, because none has been chosen yet.

      Sam: "We need to remove 'in Lisbon' as we haven't selected it yet." This card is
      screen six of the intro and the selector is on screen seven, so a stranger was being
      told what is on in a city they had not picked — the same fault as "Inside is the
      Portuguese", caught and fixed across the other cards in this file and missed here.

      "Your city" rather than a blank: the card still has to say what a drop is ABOUT, and
      the possessive is true before the choice and after it. Every other screen reads the
      chapter and names the place; this one runs before there is a chapter to read.
    */
    /*
      AND WHAT YOU DO ABOUT IT, which the old line stopped short of.

      Sam: "LEARN from what is actually on in your city, what to say when you get there,
      invite someone and buy tickets!" The headline said what a drop KNOWS — what is on,
      what to say — and left out the two things that make it a night rather than a
      lesson: somebody comes with you, and you have tickets. Both are real: the invite is
      the share sheet and the tickets are the drop's own link.
    */
    headline:
      'Learn from what is actually on in your city, what to say when you get there, invite someone and buy tickets.',
    /*
      Sam's wording. The old line described the drop's LIFECYCLE — when it arrives and
      when it goes — which is a fact about the feed rather than a reason to want one.
      This says what it is for: the thing is on, you learn from it, and the night is
      better for it.
    */
    body: "A gig, a match, a holiday that shuts down the city. We drop what's on in your calendar, you learn from it and enjoy it even more.",
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
      WHERE ALL OF IT GOES, which nothing said anywhere.

      The stages — Basics, Getting around, Being understood, Conversing, Leading — existed
      in exactly one place: the function that computes them. They were never named to a
      learner, never explained, and the bar on Yours sat under one of them with no
      indication it was a rung on anything. Sam, looking straight at it: "I had no idea the
      being understood was a progress bar to another level."

      So this card is the ladder, before anybody starts climbing it. It goes last in the
      sequence, after the cards that show what there IS to do, because it is the answer to
      the question those raise: what does any of this add up to?

      THE POINT IS THAT THE FUN IS THE MECHANISM, not a sweetener on top of one. A film
      quote, a night out, a cheat sheet you keep — every one of them moves the same number,
      and the number is what you can do rather than how often you turned up. That is the
      claim this product makes and it has never been made out loud.
    */
    id: 'intro_stages',
    image: 'intro_arrival',
    pillar: true,
    /*
      Sam's own words, on all three lines.

      "WHERE IT GOES" and "everything you do here moves one number" described the
      MECHANISM — the stage count — and led with the thing the screen is least interested
      in. What somebody wants at this point is what they get and how they learn, so that
      is what the eyebrow and the headline now say, and the number is left to the list
      underneath, which shows it rather than announcing it.
    */
    /*
      THE CLAIM, SAID AS A CLAIM.

      Sam's three lines, and they invert what was here. WHAT YOU GET / "And how you learn"
      was a label over a label: the eyebrow announced a list and the headline announced
      the list's second half, so the loudest type on the card said nothing at all while
      the actual argument — no streaks, no emojis — sat four lines down in the body where
      nobody reads it.

      "THE REWARD IS GETTING THERE, NOT EMOJIS" is the argument, so it goes in the pillar.
      It is the one sentence in the sequence that says what DUB refuses to do, and every
      other product in the category does the opposite loudly.

      "KEEP BUSY LEARNIN'" rides as the headline under it, which is where the list that
      follows gets its instruction — the stages underneath are the busy, and the apostrophe
      is Sam's.
    */
    eyebrow: 'THE REWARD IS GETTING THERE, NOT EMOJIS.',
    /*
      THE HEADLINE IS NOW THE DESTINATION, because the instruction became the button.

      "Keep busy learnin'" sat here as a second, quieter claim, and Sam moved it: "Move
      this to a round CTA at the end of the screen and change to Get Busy Learnin'." It
      reads better as something you can act on than as a line you pass on the way down, and
      the card now ends on a way in rather than on the last rung of a ladder.

      What takes its place says where the ladder goes, which is the one thing the list
      underneath cannot say about itself now the explanations are off it. The apostrophe in
      the button is Sam's.
    */
    headline: 'As far as you want to take it.',
    /*
      DROP IN WHENEVER — the permission, which the old body buried under its own refusals.

      Sam: "Drop into your CLUB whenever you like - no streaks required. Learn as you
      live, relate to Vibes, locals knowledge, tailored events and people like you."
      The line it replaces opened on three things DUB does not do before it got to one it
      does. The pillar now carries the refusal, so the body is free to be the offer.
    */
    body: 'Drop into **DUB Club** whenever you like — no streaks required. You learn as you live: vibes, local knowledge, events picked for you, and people like you.',
    shows: { kind: 'stages', cta: { over: 'GET', label: 'Busy Learnin’' } },
  },
]
/*
  REMINDERS IS GONE, and it was the last card in the sequence.

  Sam struck it through in the intro flow deck with one word beside it: Remove. The card
  was good and the argument for it is still in the history — "the thing that arrives on a
  Tuesday because you live here now", three small concrete lines rather than a description
  of them — and it is the wrong thing for a stranger to be reading in the last minute
  before the one decision.

  Everything else in the sequence is something a person gets by joining. REMINDERS was
  about what keeps arriving AFTER they have joined, which is a reason to stay rather than a
  reason to start, and it sat between WHAT YOU GET — the summary of the offer — and the
  card that asks for the answer. So the pitch landed, and then one more card happened.

  The reminders themselves are not lost. They are what the Club's rooms are made of, and
  the three specimen lines that stood here are the same kind of line every drop and
  situation already carries.
*/

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
  ONE DECISION follows DROPS, and it now carries the language question itself.

  The selector was a card of its own here for one release — `intro_choose`, ninth, right
  after OPEN. That put it in the right place in the sequence and the wrong place in the
  logic: the set-up card's own form asks why and who, and BOTH name the answer the
  selector had not yet been given. "What brings you to Lisbon?" interpolates the city;
  "the first thing you will say in Portuguese is your own name" names the language.

  So it moved INSIDE the card as its first step — choose, then why, then who — and the
  separate card went. Sam: "move language selector to its logical slot so its dependants
  follow."
*/
/*
  AFTER THE LAST PITCH CARD, whichever that now is.

  This named intro_drops, then intro_reminders. REMINDERS has been removed from the deck,
  so the card that closes the pitch is WHAT YOU GET — the one that says the reward is
  getting there rather than emojis, and summarises how the learning works. That is the
  right note to ask the question on: the offer has just been stated in full.

  Named rather than computed from the array's end on purpose: which card closes the pitch
  is an editorial decision, and a constant that quietly follows the last element would
  change meaning every time somebody appended one.
*/
export const INTRO_SETUP_AFTER = 'intro_stages'
