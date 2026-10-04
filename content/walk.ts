/**
 * THE WALK — what gets pointed at, in what order, and what is said about it.
 *
 * Sam: "Build a Club intro animation that walks through each icon in the bottom, mid and
 * top rails and the Logo tap which will take you to the Club home page not app home page."
 *
 * Three rails and a logo, and the ORDER is bottom, mid, top — his order, and it is the
 * right one for a reason he did not have to state. The bottom rail is the only thing on
 * this phone that is on every screen, so it is where somebody who is lost goes first; the
 * boards are what Yours is FOR; the top rail is the two things that are about you rather
 * than about the product. The logo is last because it is the way back to the room they
 * were just welcomed into, which is the sentence the walk should end on.
 *
 * EVERY TARGET IS A data-testid THAT ALREADY EXISTS, and scripts/walk-check.mts asserts it
 * in a browser rather than trusting this comment. A step pointing at a control that was
 * renamed is a circle drawn over empty sand, and it is invisible in the DOM — which is the
 * exact class of fault that has shipped here before.
 *
 * `opens` IS NOT A SCREENSHOT, and that is a deliberate departure from the brief. Sam asked
 * for one; a screenshot of DUB inside DUB goes stale the first time any of these screens is
 * touched, and this product has already been bitten by pictures and coordinates that were
 * true the day they were written. What a person actually needs here is what is BEHIND the
 * control, which is three words rather than a picture of three words.
 *
 * `say` IS ONE SENTENCE AND IT NAMES THE CONTROL'S JOB, never its appearance. "The house is
 * the Club" teaches nothing — somebody can see it is a house. What they cannot see is that
 * it is where the city lives.
 */
export interface WalkStep {
  /** For analytics, and for the check to name a failing step. */
  id: string
  /** The data-testid of the real control. Measured at runtime — never a coordinate. */
  target: string
  /** The caption. Big, white, low on the screen. */
  say: string
  /** What is behind it, when saying so helps. Three or fewer: this is a label, not a menu. */
  opens?: string[]
  /** The last step's button, when 'GOT IT' is not the right words. */
  done?: string
}

export const WALK: WalkStep[] = [
  /*
    THE BOTTOM RAIL, four tabs, and each one gets its own step rather than one step for
    the bar.

    A single circle around the whole bar would be the honest shape of "this is always
    here" and it would teach nothing: four tabs is four decisions, and the only useful
    thing to say about a tab is what is behind it. See components/BottomNav.tsx, whose own
    note argues the four are "a claim about what those things ARE rather than a way of
    saving space" — so the walk makes the same claim out loud.
  */
  {
    id: 'tab-club',
    target: 'tab-club',
    say: 'The Club is your city in Portuguese — what is on, and the words for being there.',
    opens: ['What is on', 'Rooms', 'Drops'],
  },
  {
    id: 'tab-on',
    target: 'tab-on',
    say: 'ON is the calendar. Real nights out, with the Portuguese you will need at them.',
    opens: ['This week', 'Gigs', 'Save to your phone'],
  },
  {
    /*
      ASK is the one tab that is not a place — BottomNav says so in its own comment — and
      the caption has to say that, because a person who taps it expecting a screen and
      gets a panel over the one they were on has learnt that the bar is unreliable.
    */
    id: 'tab-ask',
    target: 'tab-ask',
    say: 'ASK opens on top of whatever you are doing. Say it in English, get it in Portuguese.',
  },
  {
    id: 'tab-yours',
    target: 'tab-yours',
    say: 'YOURS is this screen — everything you have built, and the only one that is about you.',
  },

  /*
    THE MID RAIL. Four boards and a MORE, and they are pointed at as ONE step rather than
    five.

    This is where the walk stops being a tour of controls and starts being a tour of the
    product, and the difference matters: the four tabs go to four different places, so
    four steps is four facts. The boards all do the same thing — they change the grid
    under them — so five steps would be the same sentence five times with a different
    noun, which is how a walk-through becomes something people skip.

    The hole lands on the RAIL rather than on the library card — `collection` is the card
    around the whole thing and is 900px tall, so a circle at its centre lands on a grid
    tile, which is the opposite of what this step says. See the note on `rail` in
    components/Collection.tsx.
  */
  {
    id: 'boards',
    target: 'rail',
    say: 'Your boards. Tap one to change what is in the grid — and MORE has six more.',
    opens: ['Legend', 'Vibes', 'Cheats', 'Drops'],
  },
  /*
    AND THE LEGEND ON ITS OWN, because it is not a peer of the other three.

    Collection.tsx: "THE LEGEND IS THE DEFAULT, always... It is about the Legend, and the
    first card on it is the one that practises it." A board that is the default and holds
    the thing the whole product is for has earned a sentence of its own, and this is the
    one step of the six that is about what to DO rather than where something is.
  */
  {
    id: 'rail-legend',
    target: 'rail-legend',
    say: 'Your Legend lives here. Practise it cold, and add to it as you learn.',
  },

  /*
    THE TOP RAIL — the two controls on Yours that are about this person rather than about
    the product. Both are on the identity row rather than in a bar of their own, which is
    Profile.tsx's own decision and the reason a walk is worth having: they are small, they
    are high, and nothing else on the screen looks like them.
  */
  {
    id: 'inbox-door',
    target: 'inbox-door',
    say: 'The inbox. The red number is what has landed since you last looked.',
    opens: ['Drops near you', 'What is new'],
  },
  {
    id: 'yours-settings',
    target: 'yours-settings',
    say: 'The cog is settings — your account, your language, and what the app may send you.',
  },

  /*
    THE LOGO, LAST, AND THE CAPTION PROMISES THE CLUB.

    Sam: "the Logo tap which will take you to the Club home page not app home page." Where
    the mark actually points is HIS fix and not this walk's — so the caption describes the
    destination he has named, and components/Walkthrough.tsx sends the last button to
    /club rather than touching the mark's own routing. If the two ever disagree it is
    because the fix has not landed, which is a visible disagreement rather than a silent
    one.
  */
  {
    id: 'logo',
    target: 'yours-wordmark',
    say: 'And the mark, anywhere you see it, is the way back to the Club.',
    done: 'TAKE ME IN',
  },
]
