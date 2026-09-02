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
  retires: 'played-a-vibe' | 'legend-written' | 'is-member' | 'used-translator'
}

/** Every explainer's call to action, and there is deliberately only one of them. */
export const EXPLAINER_CTA = 'TRY YOUR FIRST THREE VIBES'

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
}): Explainer[] {
  /*
    A member sees none of them, whatever the individual conditions say.

    Each card retires on its own trigger, and those triggers are about USE — has a vibe been
    played, has the translator been asked. A member has by definition answered all four
    questions, so any that survive their own condition are surviving on a technicality: the
    seeded case is a member with no roots_played, but the real one is a member who has never
    happened to use the translator being sold it forever.

    An explainer a member is still being shown is an advert.
  */
  if (state.isMember) return []
  return EXPLAINERS.filter((e) => {
    if (e.retires === 'played-a-vibe') return !state.playedAVibe
    if (e.retires === 'legend-written') return !state.legendWritten
    if (e.retires === 'is-member') return !state.isMember
    return !state.usedTranslator
  })
}

/** Nothing here belongs to a vibe; the type wants one and this says so out loud. */
export const EXPLAINER_FAMILY: CultureFamily | null = null
