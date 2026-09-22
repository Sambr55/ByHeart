/**
 * The profile, in words.
 *
 * Not "your progress" and not a dashboard. The question this screen answers is "what is
 * mine" — the rooms you have been through, the ones you kept for later, and the words
 * worth having. Nothing here is a total and nothing here is a streak.
 */
export const PROFILE_COPY = {
  eyebrow: 'YOURS',
  headline: 'Your Lisbon.',
  name_hint: 'Your name',
  add_photo: 'ADD A PHOTO',
  done_label: 'BEEN THROUGH',
  done_note: 'Vibes you have been into, and rooms you have been through. They stay here.',
  done_empty: 'Nothing yet. Anything you finish turns up here on its own.',
  /*
    SAVED, not KEPT — because the translator's button says KEEP and meant something else.

    Two different acts wore one word: bookmarking a card, and keeping a sentence you asked
    for. Somebody who pressed KEEP THIS in the translator came here, found a section called
    KEPT with none of their sentences in it, and reasonably concluded the button was broken.
    One word per thing, which is a rule this product already has.
  */
  /*
    SAVED AND KEPT WERE ONE PILE ALL ALONG.

    Two sections sat next to each other on Yours — "the ones you put by for the night
    before you need them" and "sentences you asked for" — and both answer "I wanted this
    later". The difference was which button had been pressed, which is a fact about the
    product rather than about the learner: somebody hunting for a thing they set aside had
    to remember whether they had bookmarked it or asked for it.
  */
  aside_label: 'PUT ASIDE',
  aside_note: 'Cards you bookmarked and sentences you asked for, kept for when you need them.',
  aside_empty: 'Nothing here yet. The bookmark on any card, or KEEP THIS on a sentence you asked for.',
  /*
    THE PROOF, AS A SECTION RATHER THAN A LINK IN A DRAWER.

    It is the one number DUB says is real — what somebody produced with nothing on screen
    — and it was a row at the foot of the page next to the feedback form. The section
    shows the last six and the button goes to the card.
  */
  cold_label: 'SAID COLD',
  cold_note: 'Portuguese you produced with nothing on the screen to copy from.',
  cold_empty: 'Nothing yet. This fills the first time you say something with no cue.',
  /*
    AND WHAT REPLACES WORTH HAVING.

    That section rendered four cards from a hardcoded editorial list — identical for every
    learner, on the screen that is supposed to be theirs — while the real inventory was a
    link called "Vocab library". One is a shop window and the other is the cupboard, and
    the shop window had the better position.
  */
  words_label: 'YOUR WORDS',
  words_note: 'Every piece you have banked, the ones you have used most recently first.',
  words_empty: 'Nothing banked yet. Words arrive as you go through a vibe.',
  /*
    DROPS, which is what the product calls them everywhere else.

    Two renames in a row, and the second undoes half of the first. WHAT IS ON was wrong
    because it listed the whole calendar rather than the learner's own — that part stands,
    and the filter stayed. NIGHTS OUT was wrong for a different reason: it named the
    content rather than the format, and the format is about to hold more than nights. Sam:
    "Rename them as DROPS and I am going to ask you to mint Daytime content as well as
    Annual Content - e.g. halloween, Christmas."

    A Christmas drop is not a night out and a Sunday market is not either. `drop` is the
    word the code, the Club and the calendar already use for the thing, and it is the one
    that survives new kinds without lying about any of them.
  */
  /*
    CHEAT SHEETS, kept rather than done.

    Every other row on Yours is a record — where you have been, what you set aside, what
    you produced, what you own. This one is a reference: counting to ten is not something
    you finish, it is something you check, and it is the only pile here somebody opens
    again on purpose.
  */
  sheets_label: 'CHEAT SHEETS',
  sheets_note: 'Groups you kept — the ten of a thing, in one place.',
  sheets_empty: 'None kept yet. The bookmark on a cheat sheet in the Club puts it here.',
  /*
    The one line on Yours that says where somebody is going rather than where they have been.

    Says what the number COVERS rather than what it finishes. "800 words and you speak
    Portuguese" is a claim no count can make and would be false the moment somebody met a
    doctor; "most of a day" is what the corpus figure actually supports.
  */
  /*
    THE NUMBER FROM THE CONSTANT, never typed again.

    This said "the 800" in one branch and read `need` in the other, so the two could
    disagree the moment WORDS_FOR_MOST_OF_A_DAY moved — the same shape as the free tier
    saying "three vibes" while FREE_CRATES was five, which is the fault that produced
    scripts/allowance-check.mts.
  */
  /*
    WHAT THIS MANY WORDS LETS YOU DO, rather than how far off a fixed number they are.

    The old line measured against 800 — a real figure for everyday coverage, and the wrong
    denominator for a library that grows every month. See STAGES in content/legend.ts.
  */
  /*
    The stage copy that was here is gone with the bar it served. The stage is on the Legend
    slab now and reads every section — see progressFor — so a second set of words for it,
    one screen down and measuring only the vocabulary, would be two answers to one
    question. PROFILE_COPY.stage_next carries it.
  */
  drops_label: 'DROPS',
  drops_note: 'Pegged to something really happening, with the language you took to it.',
  drops_empty: 'None yet. Open a drop from the Club and finish a room, and it lands here.',
  /*
    The Legend, as the hero of this screen rather than a row on it.

    It is the biggest thing somebody makes in DUB and it sat fifth down the page, in a
    bordered row, at the same type size as a saved card — measured at y=1990 on a 390x844
    phone, which is two full screens of scrolling past saved cards to reach the point of
    the product. Sam: "building your legend is the main purpose of all this… if a person
    practised their Legend once a day they will be flying with Portuguese."

    THE NUMBERS ONLY EVER GROW, and that is the whole design of this copy. The old line
    was "{done} of {all} questions answered", which is a completion bar: it caps at the
    twelve frames that exist, and it tells somebody with all twelve that they are finished.
    Sam: "the first 7 are only the start, we want a user to want to have 30 in there — then
    they know they have really built their legend." So what is counted is what somebody
    HAS — things they can say about themselves — and there is no denominator anywhere,
    which also keeps the product's own rule: no count that can go down, no percentage, no
    score. scripts/hero-check.mts asserts that in a browser.
  */
  legend_label: 'YOUR LEGEND',
  /*
    IN SESSIONS, like every other screen that states this door.

    It said "Opens {n} vibes from here" and was filled with status.toGo — the count of
    doorway ROOTS. So somebody one session into the basics was told their Legend opened 5
    VIBES away, when the answer was two more sessions of the vibe they had just finished.
    The same fault the shelf, the tile and the Legend page all had; see PICKER.legend_basics.
  */
  legend_locked: 'Opens {n} basics sessions from here.',
  legend_locked_one: 'Opens one basics session from here.',
  legend_locked_vibes: 'Opens {n} vibes from here.',
  legend_locked_vibes_one: 'Opens one vibe from here.',
  /** The only headline number on the screen, and it is a possession, not a fraction. */
  /*
    The next stage, named rather than counted. A number of points to go would be a score,
    and a score is the thing this screen refuses to become — what changes as somebody
    learns is what they can DO, so the line says the next thing they will be able to do.
  */
  stage_next: 'Everything here moves you towards {name}.',
  legend_have_one: 'One thing you can say about yourself.',
  legend_have: '{done} things you can say about yourself.',
  /** Before the first answer there is nothing to count, so it says what this is FOR. */
  legend_have_none: 'Seven things about you, in Portuguese, with nothing on the screen.',
  /*
    What is waiting, phrased as more to say rather than work outstanding. Never "left" or
    "remaining" — the card is a start, not a quota.
  */
  legend_ready_one: 'One more is ready to answer.',
  legend_ready: '{n} more are ready to answer.',
  /*
    AND WHEN NOTHING IS READY BUT THE CARD IS NOT DONE, which said nothing at all.

    Three things can be true on this screen — the door is shut, a question is waiting, or
    the card is unfinished and every remaining question is held by a word the learner does
    not have yet — and only the first two had a line. So somebody who answered everything
    available arrived at a screen that showed a number and then went quiet, with no way to
    know that more existed or what opened it. Sam: "We are not doing a good enough job at
    sign-posting the completion of legend questions and how."

    It names the WORDS as the thing in the way, because they are: every remaining frame is
    blocked on vocabulary, the Legend page says which word and which vibe hands it over,
    and this is the sentence that sends somebody there.
  */
  legend_held_one: 'One question left on your card, waiting on a word.',
  legend_held: '{n} questions left on your card, each waiting on a word.',
  legend_held_cta: 'SEE WHAT OPENS THEM',
  /** Practice, which is the point. The verb is about them, not about the app. */
  /*
    ONE LABEL. This was two — "Say it all, out loud" over "Cold, with nothing on screen" —
    and they described the same act in different words, which is why they read as
    duplicates. The run is one run now, and this says what it is: everything on your card,
    asked in the order a stranger would ask it, with nothing in front of you.
  */
  legend_practise: 'Say it all, cold',
  /*
    Everything the burger was holding.

    Proof, the vocab library, drops, membership, the account — a flat list where Dub Club
    and the feedback form were peers. They are not peers. Most of them are answers to
    "what have I got", and that question has a screen now.
  */
  more_label: 'EVERYTHING ELSE',
} as const
