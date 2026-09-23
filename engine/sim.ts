/**
 * A learner, simulated — the one place that can answer "what actually happens".
 *
 * WHY THIS EXISTS. Sam, after playing all ten vibes and being told nothing:
 *
 *   "This is getting frustrating… No indication was given that my legend was open. This
 *    is why I keep asking to step back. We are in architectural spaghetti. Suggest a way
 *    we can definitively map, audit and edit this architecture."
 *
 * He was right, and the shape of the problem is this: FIFTEEN files decide what a learner
 * sees next — sectionRoots, legendUnlocked, doorwayRoots, framesJustOpened, rungReached,
 * cardFor, NO_CUE_PROMPTS, explainersFor, feedFor and the components around them — and
 * there was no way to ask any question that spanned more than one of them. So every bug
 * was found by a person on a phone, one at a time, and each fix was made blind to the next.
 *
 * The good news, and the reason this is assembly rather than a rewrite: every one of those
 * decision functions is ALREADY PURE. They take plain data and return plain data; nothing
 * is trapped inside React. This file only puts them in one room.
 *
 * WHAT IT IS NOT. Not a second implementation — that would be two products disagreeing,
 * which is the exact failure mode this codebase has hit repeatedly (two ladders, two
 * notions of "unlocked", two screens counting vibes differently). Every decision below is
 * DELEGATED to the function the app itself calls. If the app changes, this changes with
 * it; if this is right and the app is wrong, the difference is a bug in the app.
 *
 * WHAT IT IS FOR. Three things, in rising order of value:
 *
 *   1. MAP — print what a learner sees, sitting by sitting, in under a second.
 *   2. AUDIT — sweep every plausible path and find the dead ends before a tester does.
 *   3. EDIT — change content or a rule, re-run, and see what moved. The feedback loop
 *      that has been missing all along.
 */
import { sectionRoots } from './journey'
import {
  cardFor,
  doorwayToGo,
  frameReady,
  framesJustOpened,
  legendUnlocked,
  LEGEND_FRAMES,
} from '../content/legend'
import { NO_CUE_PROMPTS } from '../content/front-door'
import { ROOTS, ROOTS_BY_FAMILY, rungReached, type CultureFamily, type Rung } from '../content/roots'

/**
 * Everything about a learner that any decision in the product reads.
 *
 * Deliberately the same fields the stored record uses (engine/learner.ts), so a real
 * learner's localStorage blob can be dropped straight in when somebody reports something.
 */
export interface SimLearner {
  roots_played: string[]
  sections_completed: string[]
  /** Piece ids owned. The record stores an object; a set is the same fact. */
  pieces: Set<string>
  proof: { pt: string; source: string; clean: boolean; rung?: number }[]
  nocue_done: string[]
  legend: { frame_id: string; values: Record<string, string> }[]
  purpose: 'visiting' | 'staying' | 'moving' | null
}

export const newLearner = (): SimLearner => ({
  roots_played: [],
  sections_completed: [],
  pieces: new Set(),
  proof: [],
  nocue_done: [],
  legend: [],
  purpose: null,
})

/** What one sitting of one vibe did to a learner. The unit everything else is built from. */
export interface Sitting {
  vibe: CultureFamily
  /** Which roots were served — empty means the vibe had nothing left to give. */
  roots: { id: string; display: string; rung: Rung; type: string }[]
  /** Pieces this sitting handed over that the learner did not already have. */
  gained: string[]
  /** The three cold prompts at the end, in the order they are offered. */
  cold: string[]
  /** Legend questions this sitting made answerable, as the unlock screen computes them. */
  opened: string[]
  /** Where the learner stands afterwards. */
  after: { rung: Rung; pieces: number; card: number; legendOpen: boolean; doorwayToGo: number }
}

/**
 * Play one sitting, exactly as the app would.
 *
 * Every line here delegates. `rungReached` decides the ladder, `sectionRoots` decides what
 * is served, `framesJustOpened` decides what the unlock screen announces — the same calls
 * the components make, in the same order.
 */
export function playSitting(l: SimLearner, vibe: CultureFamily, quit: number | null = null): Sitting {
  const rung = rungReached(l.proof)
  const before = new Set(l.pieces)

  /*
    THE LEARNER'S OWN PURPOSE, because the component passes it.

    sectionRoots front-loads the doorway, and the doorway is now the card this learner is
    actually building rather than the union of all three — so a simulator that omitted it
    would measure a learner the product no longer produces, which is the one thing this
    file exists not to do.
  */
  const served = sectionRoots(vibe, rung, l.roots_played, l.purpose).filter(
    (r) => !l.roots_played.includes(r.root_id),
  )

  /*
    A ROOT COUNTS AS PLAYED AT ITS RELEASE, not when the session serves it.

    Journey.tsx records it inside the release beat, deliberately — recording at queue time
    meant entering a vibe consumed it, so tapping in and leaving marked everything done.
    Found by driving the app against this simulator's first version, which assumed served
    meant played and disagreed with the browser.

    `quit` models the learner who walks away mid-sitting: the roots before the stopping
    point count and the rest do not, which is the difference between the shelf's
    `sessionDone` and its `finished`.
  */
  const reached = quit === null ? served : served.slice(0, Math.max(0, quit))
  for (const r of reached) {
    l.roots_played.push(r.root_id)
    for (const e of r.extracts) l.pieces.add(e.id)
    /*
      The release banks a proof line, which is what moves the ladder. Modelled as clean
      because rungReached does not read `clean` — see content/roots.ts, where that was
      deliberately separated from the proof card's own count.
    */
    l.proof.push({ pt: r.transfer_prompt.answer, source: 'release', clean: true })
  }
  /* The section is recorded when the end-of-session screen renders, so only a completed
     sitting records it — a learner who quits halfway has played roots and finished nothing. */
  if (quit === null && served.length && !l.sections_completed.includes(vibe)) {
    l.sections_completed.push(vibe)
  }

  /*
    THE COLD PROMPTS, modelled the way NoCueView picks them: unseen first, this vibe's own
    before anybody else's, three per sitting. Worth simulating rather than assuming — it is
    how the "random coffee question" was found.
  */
  const mine = new Set(
    (ROOTS_BY_FAMILY[vibe] ?? []).flatMap((r) => r.extracts.map((e) => e.id)),
  )
  const able = NO_CUE_PROMPTS.filter((p) => l.pieces.has(p.requires))
  const seen = new Set(l.nocue_done)
  const unseen = able.filter((p) => !seen.has(p.answer))
  const pool = unseen.length ? unseen : able
  const cold = [
    ...pool.filter((p) => mine.has(p.requires)),
    ...pool.filter((p) => !mine.has(p.requires)),
  ].slice(0, 3)
  for (const p of cold) l.nocue_done.push(p.answer)

  const answered = l.legend
    .filter((a) => Object.keys(a.values).length > 0)
    .map((a) => a.frame_id)
  /*
    The unlock screen only speaks once the door is open — see SectionComplete. Modelling
    that here rather than reporting every frame that crossed the line is the difference
    between "what could be announced" and "what a learner is actually told".
  */
  const open = legendUnlocked(l.roots_played, l.sections_completed ?? [])
  const opened = open
    ? framesJustOpened({
        before,
        after: l.pieces,
        answered,
        purpose: l.purpose,
        answers: l.legend,
      }).map((f) => f.id)
    : []

  return {
    vibe,
    roots: reached.map((r) => ({
      id: r.root_id,
      display: r.root_display,
      rung: r.rung,
      type: r.root_type,
    })),
    gained: [...l.pieces].filter((p) => !before.has(p)),
    cold: cold.map((p) => p.answer),
    opened,
    after: {
      rung: rungReached(l.proof),
      pieces: l.pieces.size,
      card: cardFor(l.purpose).filter((f) => frameReady(f, l.pieces)).length,
      legendOpen: open,
      doorwayToGo: doorwayToGo(l.roots_played, l.purpose),
    },
  }
}

/** Play a vibe until it has nothing left to serve. Bounded — sectionRoots replays for ever. */
export function playVibe(l: SimLearner, vibe: CultureFamily, max = 20): Sitting[] {
  const out: Sitting[] = []
  for (let i = 0; i < max; i++) {
    const s = playSitting(l, vibe)
    if (!s.roots.length) break
    out.push(s)
  }
  return out
}

/** How many card questions this learner can answer, and which are still shut. */
export function cardState(l: SimLearner): { ready: string[]; shut: string[] } {
  const card = cardFor(l.purpose)
  return {
    ready: card.filter((f) => frameReady(f, l.pieces)).map((f) => f.id),
    shut: card.filter((f) => !frameReady(f, l.pieces)).map((f) => f.id),
  }
}

/** Every Legend question, including the deeper ones, with what each still needs. */
export function legendState(l: SimLearner): { id: string; ready: boolean; needs: string[] }[] {
  return LEGEND_FRAMES.map((f) => ({
    id: f.id,
    ready: frameReady(f, l.pieces),
    needs: f.built_from.filter((p) => !l.pieces.has(p)),
  }))
}

/** Which vibe teaches a piece — the reverse index nothing else has. */
export function taughtBy(piece: string): CultureFamily[] {
  return [
    ...new Set(
      ROOTS.filter((r) => r.extracts.some((e) => e.id === piece)).map((r) => r.culture_family),
    ),
  ]
}
