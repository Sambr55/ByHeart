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
  saved_label: 'SAVED',
  saved_note: 'The ones you put by for the night before you need them.',
  saved_empty: 'Nothing saved. The bookmark on any card puts it here.',
  asked_label: 'KEPT',
  asked_note: 'Sentences you asked for, in the words you asked in.',
  asked_empty: 'Nothing kept yet. Ask for a sentence and press KEEP THIS.',
  words_label: 'WORTH HAVING',
  words_note: 'Small words that do a lot of work, each pinned to where you will want it.',
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
  /** Practice, which is the point. The verb is about them, not about the app. */
  legend_practise: 'Say it all, out loud',
  legend_practise_cold: 'Cold, with nothing on screen',
  /*
    Everything the burger was holding.

    Proof, the vocab library, drops, membership, the account — a flat list where Dub Club
    and the feedback form were peers. They are not peers. Most of them are answers to
    "what have I got", and that question has a screen now.
  */
  more_label: 'EVERYTHING ELSE',
} as const
