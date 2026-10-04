import type { ProofLine, RoughLine } from '@/engine/learner'
import { mentorFor, type MentorId } from '@/content/mentors'

/**
 * What a teacher would have noticed, said in plain English.
 *
 * Sam: "let's act as the User's teacher — the more they do, and the more they speak and get
 * right, clearly the better they will get. But as we say it's not about streaks or numbers
 * it's about a gentle and genuine levelling up… It's like you could do five years at school
 * learning Portuguese, or you could push yourself (and be pushed) to learn more and improve."
 *
 * THE MEASUREMENT ALREADY EXISTED AND SAID NOTHING. The record holds every sentence produced
 * cold with `clean` marking first-attempt-no-help, every sentence that would not land after
 * five goes, per-word reinforcement, and `progressFor` weighting seven kinds of work into
 * one number. All of it drove counters and a stage label. Nothing in DUB has ever told a
 * learner what it had seen them do.
 *
 * THE RULE THAT MAKES THIS NOT A STREAK, and it is the whole design: every observation must
 * name a SENTENCE, a WORD or a VIBE. Never a count, never a comparison, never a day. "Three
 * days in a row" is a streak with a nicer voice; "Sou de Edinburgh has landed every time you
 * have tried it" is a teacher. The moment one of these can be satisfied by turning up rather
 * than by doing something, it has become the thing this product exists not to be.
 *
 * READ-ONLY AND PURE. It takes a record and returns observations. It writes nothing, decides
 * nothing, and sends nothing — see the note on `tone` for why a thing that might one day
 * become a notification is built as a function that cannot notify.
 *
 * THE VOICE, WHICH IS THE HARDEST PART AND THE MOST IMPORTANT.
 *
 * Sam: "we are the coolest and best teacher you ever had. Like being taught by your elder
 * brother's best mate who is really cool."
 *
 * That is a precise brief and it rules out two things this copy reached for first. It is not
 * a tutor — no "worth hearing it again rather than pushing at it", which is kind and is the
 * voice of somebody being paid by the hour. And it is not a coach — nothing is "crushing it"
 * and nobody is on a journey.
 *
 * Your brother's mate is impressed when you have actually done something, flat about the
 * stuff that is just hard, and completely uninterested in making you feel managed. He says
 * the true thing in the fewest words and then gets on with it. Short sentences. No
 * exclamation marks. Never explains why he is telling you.
 *
 * The test for every line here: would somebody cool say this to you in a kitchen at a party,
 * or does it sound like a progress report? If the second, it is wrong however true it is.
 */

/** The record this reads. A subset of LearnerState, so a caller can pass the whole thing. */
export interface NoticedInput {
  proof?: ProofLine[]
  rough?: RoughLine[]
  sections_completed?: string[]
  roots_played?: string[]
  legend?: { frame_id: string; values: Record<string, string> }[]
  idioms_got?: string[]
  drops_done?: string[]
  inventory?: Record<string, unknown>
  /**
   * WHO IS SAYING IT, which changes the words and nothing else.
   *
   * Sam: "Give /Noticed a configurable Mentor type… changing tone of voice." The
   * observations below are unchanged by it — what is noticed is a fact about the record,
   * and a product where the drill sergeant notices DIFFERENT things from the gentle dad
   * would be four products. Only the sentence changes. See content/mentors.ts.
   */
  mentor?: string | null
}

/**
 * How an observation is meant to land, which decides where it can ever be shown.
 *
 * `won` is something that went right and the learner may not have noticed. `stuck` is
 * something going wrong, and the rule for those is the rule the microphone already follows:
 * it names the instrument, never the person. `nudge` is the only kind that asks for
 * anything, and there is deliberately at most one of them — see `cap` below.
 */
export type NoticedTone = 'won' | 'stuck' | 'nudge'

export interface Notice {
  /** Stable, so a surface can remember which have been seen without storing the text. */
  id: string
  tone: NoticedTone
  /** The whole observation, as a teacher would say it. One sentence, sometimes two. */
  say: string
  /**
   * The thing it is about — a sentence, a word, a vibe — shown in Portuguese where there is
   * one. This is what stops an observation being a statistic: it has a subject.
   */
  about?: string
}

/*
  HOW MANY TIMES A SENTENCE HAS BEEN PRODUCED COLD.

  `proof` dedupes by sentence and only ever upgrades `clean`, so a line appearing in it says
  "this was said with nothing on screen" and not "this was said once". Counting rows is
  therefore counting SENTENCES, which is the honest unit and the one a learner recognises.
*/
function byClean(proof: ProofLine[]) {
  return {
    clean: proof.filter((p) => p.clean),
    helped: proof.filter((p) => !p.clean),
  }
}

/** A week in milliseconds, for the one observation that is allowed to be about time. */
const WEEK = 7 * 24 * 60 * 60 * 1000

export function noticed(me: NoticedInput, now: Date = new Date()): Notice[] {
  const proof = me.proof ?? []
  const rough = me.rough ?? []
  const out: Notice[] = []
  /*
    THE VOICE, WHICH IS THE ONLY THING THE MENTOR CHANGES.

    Every rule below is untouched by it: what counts as a win, what counts as stuck, the
    one-nudge cap, the order. A learner who switches from the gentle dad to the drill
    sergeant sees the same four observations in different words, which is the point — the
    alternative is four products that disagree about what the learner has done.
  */
  const v = mentorFor(me.mentor as MentorId | null | undefined).voice

  /*
    WHAT THEY CAN SAY WITHOUT HELP, which is the thing nobody tells them.

    A learner who has produced eleven sentences cold has no idea they have done that —
    each one happened in its own sitting and then the screen moved on. This is the
    observation the whole feature exists for: not "you are doing well" but "here is the
    specific thing you did and did not notice doing".

    Named with the most recent, because that is the one they can still hear themselves
    saying. The count is in the sentence rather than being the sentence — "eleven" on its
    own is a score; "eleven sentences, the last of them this one" is a fact about work.
  */
  const { clean } = byClean(proof)
  if (clean.length >= 3) {
    const last = [...clean].sort((a, b) => (a.at < b.at ? 1 : -1))[0]
    out.push({
      id: 'cold-count',
      tone: 'won',
      say: v.cold(clean.length),
      about: last?.pt,
    })
  }

  /*
    A SENTENCE THAT KEEPS SLIPPING, and the rule for saying so.

    `rough` is written when a line has beaten somebody five times, and `goes` accumulates
    across sittings — so this is not "you got it wrong", it is "this one has been hard more
    than once", which is a different and kinder claim.

    IT NAMES THE INSTRUMENT, NOT THE PERSON. The microphone in SayItCard already works this
    way and the reason holds here: browser speech recognition is approximate, and a learner
    who has said something correctly five times and been refused is not the one who needs
    correcting. So the sentence offers to play it rather than suggesting they try harder.

    The worst one only. A list of everything that has gone wrong is a report card.
  */
  const worst = [...rough].sort((a, b) => b.goes - a.goes)[0]
  if (worst) {
    out.push({
      id: 'rough-worst',
      tone: 'stuck',
      say: v.rough,
      about: worst.pt,
    })
  }

  /*
    SAID WITH HELP AND NEVER SINCE WITHOUT, which is the most teacherly thing here.

    A line in `proof` with clean: false was produced, but with the words on screen or after
    a hint. That is real and it is not the same as owning it — and the learner cannot see
    the difference, because both look identical on the proof card.

    This is the observation that creates the "push yourself" Sam described: it points at a
    specific sentence that is nearly theirs and says so. Not a failure, not a gap in a
    dashboard — one sentence, named, with the suggestion that it is closer than they think.
  */
  const cleanSet = new Set(clean.map((p) => p.pt))
  const nearly = proof.filter((p) => !p.clean && !cleanSet.has(p.pt))
  if (nearly.length) {
    const one = [...nearly].sort((a, b) => (a.at < b.at ? 1 : -1))[0]
    out.push({
      id: 'nearly-yours',
      tone: 'nudge',
      say: v.nearly,
      about: one.pt,
    })
  }

  /*
    NOTHING SPOKEN IN A WEEK, which is the one observation allowed to be about time.

    It is about a GAP rather than a streak, and the difference is which direction it points.
    A streak rewards turning up and punishes a fortnight in hospital; this notices that the
    speaking has stopped and says one thing about it, once. It cannot accumulate, there is
    nothing to break, and coming back does not reset anything.

    Only for somebody who HAS spoken — "you have not spoken in a week" to a learner who has
    never spoken at all is not an observation, it is a complaint about a stranger.
  */
  const lastSpoken = [...proof].sort((a, b) => (a.at < b.at ? 1 : -1))[0]
  if (lastSpoken && now.getTime() - new Date(lastSpoken.at).getTime() > WEEK) {
    out.push({
      id: 'quiet-week',
      tone: 'nudge',
      say: v.quiet,
      about: lastSpoken.pt,
    })
  }

  /*
    AT MOST ONE THING ASKED FOR, EVER.

    Sam's whole framing is "gentle and genuine", and the fastest way to lose that is three
    nudges at once — which reads as nagging however kindly each is worded. Wins and stuck
    notices can stack because they are reports; a nudge is a request, and a teacher makes
    one of those at a time.

    The first survives rather than the strongest, because the order above is the order of
    usefulness: a sentence that is nearly theirs is a better thing to be told than that they
    have been quiet.
  */
  const firstNudge = out.findIndex((n) => n.tone === 'nudge')
  return out.filter((n, i) => n.tone !== 'nudge' || i === firstNudge)
}
