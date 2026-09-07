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
    The Legend, rolled up.

    It is the biggest thing somebody makes in DUB and it had its own tab in a menu of
    eleven, which put it level with the feedback form. Here it is a row with a state on
    it — how much of the card is written, and whether it is open yet — and the card
    itself is one tap away.
  */
  legend_label: 'YOUR LEGEND',
  legend_locked: 'Opens {n} vibes from here.',
  legend_building: '{done} of {all} questions answered.',
  legend_done: 'All ten answered.',
  /*
    Everything the burger was holding.

    Proof, the vocab library, drops, membership, the account — a flat list where Dub Club
    and the feedback form were peers. They are not peers. Most of them are answers to
    "what have I got", and that question has a screen now.
  */
  more_label: 'EVERYTHING ELSE',
} as const
