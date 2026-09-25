/**
 * The four cards that explain DUB, sitting in the feed among the real ones.
 *
 * These replace a corridor. WELCOME, HOW_IN, the demo, the pair screen and THE_WAY were
 * five screens in a fixed order, each one a wall between somebody and the thing they came
 * to look at, with no way to skip ahead. The same claims are made here as cards you can
 * swipe past — a corridor tests patience, a feed tests interest, and interest is the only
 * thing worth measuring before anybody has committed anything.
 *
 * THE RULE THEY ALL OBEY: one question each, and the same call to action on every one. A
 * learner sold by the Drop and a learner sold by the demo end up in the same place, which
 * is what makes this a funnel rather than a menu.
 *
 * AND THEY RETIRE. Each one goes for good once its thing has been used, and never returns.
 * An explainer a member is still being shown is an advert.
 */
import type { CultureFamily } from '@/content/roots'

export interface Explainer {
  id: string
  /** Max 14 characters, like every other eyebrow. */
  eyebrow: string
  title: string
  /** The front of the card. One claim, said the way a person would say it. */
  blurb: string
  /** The far side of the swipe: the proof, not more of the pitch. */
  detail: { heading: string; body: string }
  /**
   * A line to hear, where there is one.
   *
   * Only the demo has this and it is the reason the demo is first: sixty seconds, no
   * account, and the strongest argument this product has — you already understand more
   * than you can say.
   */
  say?: { pt: string; en: string; note: string }
  image: { src: string; alt: string }
  /**
   * When this card has done its job and should never be seen again.
   *
   * Written as a question about the learner rather than a flag we set, so it cannot drift
   * out of step with what has actually happened.
   */
  retires:
    | 'played-a-vibe'
    | 'legend-written'
    | 'is-member'
    | 'used-translator'
    /** Subscribed to the calendar, or picked what they are into on it. */
    | 'used-the-calendar'
    /*
      Retired by DOING the thing it describes, which is the only honest trigger for a card
      that explains a gesture. Saving or rejecting anything means the grammar has landed.
    */
    | 'acted-on-a-card'
}

/**
 * Every explainer's call to action, and there is deliberately only one of them.
 *
 * It said TRY YOUR FIRST THREE VIBES, which names the mechanism rather than the point.
 * Sam: "the cta is wrong — should be 'It's all about building your Legend'". Three vibes
 * is what you do next; the Legend is what it is FOR, and the Legend is the spine — so the
 * one button every explainer shares should say the thing the whole product is about
 * rather than the first chore on the way to it.
 *
 * The apostrophe is the typographic one (U+2019), like every other apostrophe in the copy;
 * scripts/copy-check.mts holds that line.
 */
export const EXPLAINER_CTA = 'IT’S ALL ABOUT BUILDING YOUR LEGEND'

/*
  The last button of the intro, which is an instruction rather than a label.

  It said OPEN. One word, and the wrong one: it names the door instead of what is through
  it, at the exact moment the card before has promised that a Legend is what gets you into
  the Club. This says the next thing you will actually do.

  A constant rather than a literal in the JSX because it wears `eyebrow` for its type, and
  the vocabulary check holds literal eyebrows to fourteen characters — correctly, since an
  eyebrow is a label. This is a call to action that happens to share the type scale, which
  is precisely the distinction EXPLAINER_CTA above already relies on.
*/
export const DOOR_CTA = 'BUILD YOUR LEGEND'

export const EXPLAINERS: Explainer[] = [
  {
    id: 'how_it_works',
    eyebrow: 'SIXTY SECONDS',
    /*
      The canonical wording, not a paraphrase of it.

      DEMO_BEATS has said "You already understand more than you can say" since the product
      began, and it is the best sentence in it — understand and say are the two halves of
      the actual problem, where "know more than you think" is a compliment. Rewriting it
      here would also have quietly split one claim into two versions.
    */
    title: 'You already understand more than you can say.',
    blurb:
      'Not a claim — a thing you can test right now, with a line you have known for forty years.',
    detail: {
      heading: 'Talk to me, Goose.',
      body: 'Fala comigo, Goose. You did not learn that, you recognised it. And comigo is now yours: with me. It works in a bar, in a taxi, and in every sentence you will ever build with it.',
    },
    say: {
      pt: 'Fala comigo, Goose.',
      en: 'Talk to me, Goose.',
      note: 'comigo — with me. One familiar line, one word you keep.',
    },
    image: {
      src: '/lisbon/cafe-counter.jpg',
      alt: 'A Lisbon café counter in the morning, cups stacked, nobody at it yet.',
    },
    retires: 'played-a-vibe',
  },
  {
    id: 'the_legend',
    eyebrow: 'THE WAY IN',
    title: 'Seven questions a stranger will ask you.',
    blurb:
      'Your name, where you live, what you do, why you are here. Answered in Portuguese, out of language you own, with nothing on screen.',
    detail: {
      heading: 'Why it is the test',
      body: 'Anybody can read a phrasebook out loud. The Legend is the minute about yourself you can say without assembling it first — which is the difference between having Portuguese and having a phone with Portuguese on it. It is also the only thing DUB has ever counted.',
    },
    image: {
      src: '/lisbon/azulejo.jpg',
      alt: 'A weathered blue and white azulejo panel, separate tiles making one picture.',
    },
    retires: 'legend-written',
  },
  {
    id: 'live_events',
    eyebrow: 'THIS MONTH',
    title: 'Lisbon, as it is actually happening.',
    blurb:
      'A gig, a match, a strike, a deadline. What is on, and what you will need to say when you get there.',
    detail: {
      heading: 'Why it expires',
      body: 'A pharmacy will be there next month; the concert will not. So some of what is here counts down and then goes, which is the opposite of a course and the whole reason this is a club rather than a syllabus.',
    },
    image: {
      src: '/lisbon/tram-distant.jpg',
      alt: 'A Lisbon tram at the far end of a steep street at dusk, its light on.',
    },
    retires: 'is-member',
  },
  {
    id: 'ask_anything',
    eyebrow: 'ANY MOMENT',
    title: 'The sentence we have not taught you yet.',
    blurb:
      'Ask for it, anywhere in the app, and get it back in the Portuguese they actually speak here.',
    detail: {
      heading: 'Why not just use Google',
      body: 'Because the internet’s Portuguese is Brazilian. Ask Google for a bus and you will be handed ônibus, say it in Lisbon, and watch the conversation switch to English. Everything here is European Portuguese, in the register you are being taught.',
    },
    image: {
      src: '/lisbon/wall.jpg',
      alt: 'A Lisbon façade in faded ochre, the paint peeling back in layers to pink underneath.',
    },
    retires: 'used-translator',
  },
  {
    /*
      WHAT THIS PLACE IS, said inside it.

      Every other explainer sells something — the demo, the Legend, the translator, the
      drops. Not one of them says how the Club itself works, so the room a person spends
      most of their time in was the only room with no sign on the door: cards arrive, some
      of them are events and some are not, and the three gestures were taught once in an
      intro that a returning learner never sees again.

      One card, three facts: where the cards come from, why these ones, and what the swipes
      do. It sits among the rooms it describes rather than in front of them, so it can be
      thrown away like anything else — and throwing it away is itself the lesson, which is
      why that is also what retires it.
    */
    id: 'how_the_club_works',
    eyebrow: 'THIS PLACE',
    title: 'Everything here is a moment you will actually be in.',
    /*
      Sam's wording, and the change is not only length.

      "Your answers" was true and vague — it named the set-up form. "Your interests and
      your learning so far" names the two things that actually shape the feed, and the
      second is the one nothing anywhere had said: the rooms move as the learner does.

      The gestures are spelled out the same way for the same reason. "Send it back" is
      what happens; "send it to the back" is where it goes, which is the promise the away
      lane actually makes.
    */
    blurb:
      'The rooms you will enter come from your city, your interests and your learning so far. Swipe right to open one, left to send it to the back, up for the next.',
    detail: {
      heading: 'Why this card and not another',
      /*
        Widened to match the face, which now promises three things rather than one.

        "What you said at set-up" was the whole story when the feed keyed on purpose
        alone. The face now says city, interests and learning so far, and a detail pane
        narrower than the claim above it is the product explaining a different product.
      */
      body: 'Three things decide which rooms you get. Why you are here — a few days in Lisbon and a life in it need different Portuguese. What you have said you are into, which is what turns a feed into yours. And what you have learned so far, because a room you could not have used last week is worth offering this one. Anything pegged to a date comes first, since it expires and the rest does not. Nothing you send away is lost: it goes to the back and comes round again, so you can swipe freely.',
    },
    image: {
      src: '/lisbon/calcada.jpg',
      alt: 'A Lisbon side street in the late afternoon, calçada underfoot and washing strung between the balconies.',
    },
    retires: 'acted-on-a-card',
  },
  /*
    THE CALENDAR, WHICH NOTHING EXPLAINED.

    Sam: "build a new card that explains how the calendar works... explain that we will
    tailor their content to the dates of their trip and also the preferences they select
    for events."

    The ON tab shows what is happening in Lisbon and offers to put it in the calendar
    somebody already looks at — which is the most concrete thing DUB does and the least
    obvious from the outside. A learner who never opens that tab never finds out, and one
    who does meets a list of genre chips with no statement of what ticking them buys.

    It says the two things that are true and neither of them was said anywhere: the dates
    decide what is worth showing, and the genres decide which of it arrives.

    Retires on the calendar being used, which is the same shape as every other explainer
    here: the card goes when the thing it describes has been done.
  */
  {
    id: 'how_the_calendar_works',
    eyebrow: 'WHAT IS ON',
    /*
      THE FACE ASKS; THE DETAIL EXPLAINS. Sam: "tell us when you'll be here and then
      explain why."

      It led with what the calendar IS and kept the question behind a swipe, which is the
      wrong way round for the one intro card that wants an answer rather than a read.
    */
    title: 'When will you be here?',
    blurb:
      'It decides which of Lisbon is worth showing you — concerts, matches, the holidays that shut the city.',
    detail: {
      heading: 'Why these and not everything',
      body: 'Two things decide what you get. Your dates, so a week in October is not filled with things happening in March — and if you live here, nothing is out of range. And what you say you are into: tick football and the big matches arrive, leave it blank and you get all of it. Both are yours to change whenever, and the whole thing subscribes to the calendar on your phone rather than living in another app.',
    },
    image: {
      src: '/lisbon/intro-drops.jpg',
      alt: 'A Lisbon street at night, a crowd spilling out of a doorway under strung lights.',
    },
    retires: 'used-the-calendar',
  },
  /*
    WHERE THEY ARE NOW, AND WHAT THE REST OF IT LOOKS LIKE.

    Sam: "in the main intro we explain about learning the basics, getting around etc.
    Explain where they are now by getting to their legend and what happens next in terms
    of the content we will serve them and how they will grow their knowledge and
    confidence."

    The five stages are on the WHAT YOU GET intro card, which is the product's argument to
    somebody who has not started. A new member has just finished the first of them and has
    been told nothing about the other four — so the ladder is named here, with their own
    position on it stated rather than implied, and the next rung described in the only
    terms that matter: what they will be able to say.

    It says what grows the number too, because every other product answers that with days
    in a row. This one answers it with words owned, rooms been through, nights taken it
    to — which is the claim the whole product is built on and the one place it is worth
    repeating.
  */
  {
    id: 'where_you_are_now',
    eyebrow: 'FROM HERE',
    title: 'You have the first of five. Here is what the other four are.',
    blurb:
      'The basics are the rung you just finished. Getting around, being understood, conversing, and leading it.',
    detail: {
      heading: 'What happens from here',
      body: 'Your Legend was the basics: your name, where you are from, what you do — enough to be somebody rather than a tourist. Getting around is next, and then being understood in a room, holding your end of a conversation, and starting one. Every rung is a thing you can DO, not a score: the number moves when you own a word, go through a room, take a sheet out with you. Nothing counts days, and nothing goes down.',
    },
    image: {
      src: '/lisbon/intro-arrival.jpg',
      alt: 'A Lisbon street climbing away from the river in the early evening.',
    },
    retires: 'acted-on-a-card',
  },
  /*
    AND THE ONE THING IN HERE THAT NEEDS SOMEBODY ELSE.

    Sam: "recommend a friend mechanic and how they can share content, drop events and
    progress between them."

    The mechanic exists and nothing points at it: Yours can mint a SHOWING — a card of the
    sentences you have said cold, with nothing on screen — and send it. It is reciprocal
    by design: they show you theirs back, and the row says BOTH rather than ONE when they
    have.

    Written to what it DOES rather than to what a referral card usually promises. There is
    no reward, no code and no discount, and claiming any of those here would be the one
    card in the Club that lies. What it offers is the thing that actually happens: the
    person you send it to can see what you can say, and you can see what they can.
  */
  {
    id: 'bring_somebody',
    eyebrow: 'WITH SOMEBODY',
    title: 'Send somebody what you can say. They send theirs back.',
    blurb:
      'A card of the sentences you have said cold, with nothing on screen. Not a score — the actual sentences.',
    detail: {
      heading: 'Showing somebody',
      body: 'In Yours you can make a showing: the lines you have produced from memory, as a card you can send to anybody. They see what you can say. If they are in here too, they show you theirs back and you both end up with the other. It is the one part of DUB that needs another person, and it is the part that makes a night out worth planning — you already know what they can order.',
    },
    image: {
      src: '/lisbon/cafe-counter.jpg',
      alt: 'Two people at a café counter in Lisbon, mid-conversation.',
    },
    retires: 'acted-on-a-card',
  },
]

/**
 * Which explainers this learner still has a reason to see.
 *
 * Asked of the learner rather than tracked with a flag, so a card cannot linger because
 * somebody forgot to set something.
 */
export function explainersFor(state: {
  playedAVibe: boolean
  legendWritten: boolean
  isMember: boolean
  usedTranslator: boolean
  /** Saved or rejected anything. The Club explainer retires on the gesture it teaches. */
  actedOnACard: boolean
  /** Subscribed to the calendar, or said which kinds of night out they want. */
  usedTheCalendar: boolean
}): Explainer[] {
  /*
    A MEMBER IS DONE BEING SOLD TO. THEY ARE NOT DONE BEING SHOWN HOW THINGS WORK.

    This returned nothing at all for a member, on the argument that an explainer a member
    still sees is an advert. That is right about three of these and wrong about the other
    two — and the consequence was total, because DUB hands out membership to everybody the
    moment billing is not configured. So on the live build nobody saw a single explainer in
    the Club, including the card that explains what the Club IS, which was written for
    exactly the people this line was hiding it from. Reported as the translator explainer
    being left out; it was, along with all the others.

    The split is between selling and telling. The demo, the Legend and the drops argue for
    the product to somebody deciding whether to have it — a member has decided, so they go.
    The translator and the Club's own grammar are instructions for a tool that is already
    theirs, and somebody who has never used the translator does not know it exists however
    long they have been a member.
  */
  const SELLS: Explainer['retires'][] = ['played-a-vibe', 'legend-written', 'is-member']
  return EXPLAINERS.filter((e) => {
    if (state.isMember && SELLS.includes(e.retires)) return false
    if (e.retires === 'played-a-vibe') return !state.playedAVibe
    if (e.retires === 'legend-written') return !state.legendWritten
    if (e.retires === 'is-member') return !state.isMember
    if (e.retires === 'acted-on-a-card') return !state.actedOnACard
    /*
      The calendar card goes once the calendar has been used — subscribed, or told what
      they are into. Named rather than falling through to the translator's clause, which
      is what the `return` below is: a default that was fine while there was one card left
      and silently wrong the moment a second arrived.
    */
    if (e.retires === 'used-the-calendar') return !state.usedTheCalendar
    return !state.usedTranslator
  })
}

/** Nothing here belongs to a vibe; the type wants one and this says so out loud. */
export const EXPLAINER_FAMILY: CultureFamily | null = null
