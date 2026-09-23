'use client'

/**
 * The learner, not the lesson.
 *
 * Missions come and go; this is what accumulates. Spec §8: cultural worlds are
 * sources, the inventory is the learner's capability. It therefore has to survive
 * Mission 01 → Mission 02 → the 24–72h recall, which for this prototype means the
 * tester's own phone plus a resume link that carries the whole state in the URL.
 */

import { drainEvents, returnEvents } from './analytics'
import type { MissionId, PropertyId } from '@/content/types'
import { BLOCK_ORDER, TARGETS } from '@/content/targets'

/**
 * A piece id. The two original missions used a closed PieceId union; the v0.6 root
 * graph mints pieces from content, so this is deliberately open.
 */
import { DEFAULT_PAIR, pairId, type Pair } from '@/content/pairs'
import { mergeLearner, mergeOwner } from '@/lib/merge'
import { LEGEND_FRAMES, fillEnglish, fillFrame } from '@/content/legend'
import { currentPair } from './pair'

export type PieceId = string

/**
 * One record per pair, namespaced: byheart.learner.v1:en-GB:pt-PT.
 *
 * This single change buys the multiple-identities model — EN→PT, EN→FR, PT→ES, each
 * with its own inventory, proof, stage and played history — without restructuring
 * LearnerState at all. Nesting progress under a pairs map inside one record would cost
 * far more and buy nothing extra.
 */
const LEGACY_KEY = 'byheart.learner.v1'

function keyFor(pair: Pair): string {
  return LEGACY_KEY + ':' + pairId(pair)
}

function currentKey(): string {
  return keyFor(currentPair())
}

/** The key this pair's record actually lives under. Exported for tooling and tests. */
export function learnerStorageKey(pair: Pair = currentPair()): string {
  return keyFor(pair)
}
const VERSION = 1

// ---------------------------------------------------------------------------
// §13 entities
// ---------------------------------------------------------------------------

export type InventoryState =
  | 'NEW'
  | 'YOURS'
  | 'STRONGER'
  | 'SOLID'
  | 'NEEDS ANOTHER LOOK'

export type EvidenceType =
  | 'encounter'
  | 'acquire'
  | 'transfer'
  | 'reinforce'
  | 'combine'
  | 'cold_recall'
  | 'checkpoint_recall'
  | 'crossover'
  | 'delayed_recall'

export interface LearningEvidence {
  target_id: PieceId
  event_type: EvidenceType
  correct_first_try: boolean
  hint_count: number
  /** True when the learner never produced it and the answer was shown. */
  revealed: boolean
  latency_ms: number
  /** The world the learner was inside when this happened; null once culture is gone. */
  culture_context: PropertyId | null
  mission_id: MissionId | null
  timestamp: string
}

/**
 * A sentence the learner produced with nothing on screen to copy from.
 *
 * This is the honest count, and it is deliberately narrow. Tapping through a lesson
 * does not qualify; recognising a line does not qualify. Only the beats where the
 * cultural source has been taken away — release, no-cue and collisions — put anything
 * in here, which is what makes the number worth showing to another person.
 */
export interface ProofLine {
  pt: string
  en: string
  /**
   * Where it was said with nothing on screen.
   *
   * release = the cultural cue removed. nocue = never had one. collision = two crates at
   * once. legend = a question about yourself, answered cold — which counts on exactly
   * the same terms as the rest, because it is exactly the same thing.
   */
  /**
   * Where it was said with nothing on screen.
   *
   * `room` is the Club's own: an errand performed in a Situation. It is distinct from
   * `release` because a room is not a root — it carries its own rung rather than borrowing
   * one from the graph, and rungReached had no way to score it while the two shared a name.
   */
  source: 'release' | 'nocue' | 'collision' | 'legend' | 'room'
  /**
   * The rung this line is worth, for a source that is not in the root graph.
   *
   * Absent on every other source, where the rung comes from the root the sentence belongs
   * to — and absent on every record written before rooms could count, which is why
   * rungReached treats a missing value as "not on the ladder" rather than as zero.
   */
  rung?: number
  /** Whether it came out right first time, with no hint taken. */
  clean: boolean
  at: string
}

/**
 * One card of somebody's Legend, filled in.
 *
 * Kept as a list rather than a map so the order a learner built them in survives.
 *
 * CLEARING A CARD LEAVES AN EMPTY ROW, and that is deliberate. Deleting it looked
 * cleaner and was wrong: the merge cannot tell "I never answered this" from "I cleared
 * it", and it must never let an empty side erase a full one — so a deleted card would
 * quietly resurrect from any device that still had it. An empty row is a tombstone with
 * a timestamp, so a clear made later beats an answer made earlier, and it carries no
 * personal data of its own.
 *
 * `isAnswered` is what everything else asks, so an empty row is invisible: not in the
 * run-through, not in the count, never rendered as a gap to be filled.
 */
export interface LegendAnswer {
  frame_id: string
  values: Record<string, string>
  /** When this answer was last written. The merge reads it to decide between two edits. */
  at: string
}

export interface InventoryItem {
  target_id: PieceId
  acquired_source: PropertyId | null
  reinforced_sources: PropertyId[]
  latest_state: InventoryState
  latest_recall_at: string | null
}

export interface CultureAffinity {
  categories_ranked: string[]
  free_text_favourite: string
  next_world_pre: string | null
  next_world_post: string | null
  source_familiarities: Partial<Record<PropertyId, number>>
}

export interface Experiment {
  test_variant: 'culture_full' | 'culture_neutral'
  same_or_delayed: 'same_session' | 'delayed_24_72h' | 'unknown'
  cohort_tag: string
}

export interface VoiceSignal {
  signal: string
  pt: string
  at: string
}

export interface LearnerState {
  version: number
  learner_id: string
  /**
   * Whose copy this is.
   *
   * The account is the record and this is a cache of it. `null` means anonymous — nobody
   * has claimed this work yet, which is the normal state for most of DUB's traffic and has
   * to stay first-class: the product is usable, and worth using, before anybody gives an
   * email.
   *
   * A value means this cache belongs to that account, and it is the one field in the record
   * that can make a merge REFUSE. Every other rule here is chosen so a merge can only gain;
   * gaining is exactly the wrong behaviour when the two copies are two people, which is one
   * shared laptop away. See lib/merge.ts and docs/spec-identity.md.
   */
  user_id: string | null
  /**
   * Who this is, for multi-user testing. Set from ?tester= on the link the facilitator
   * sends, or typed on the way in. Never used for anything but joining a session to a
   * feedback form.
   */
  tester_label: string
  /** §12 — collected invisibly through meaningful choices, never a personality quiz. */
  voice_signals: VoiceSignal[]
  /** Grammar points already surfaced, so no section repeats another section's. */
  osmosis_seen: string[]
  /**
   * What they told us about themselves, and what it is for. `gender` is grammatical —
   * which endings they use — not an identity claim. Every field is optional because
   * every question is skippable, and a skip is recorded as a skip rather than a blank.
   */
  profile: {
    gender: 'm' | 'f' | null
    age_band: string | null
    goal: string | null
    /**
     * WHERE THEY ARE FROM, which the product has been teaching and never knowing.
     *
     * Sam: "The third thing we should ask is where they are from. So the I am Sam, I am
     * from London is real. But 'And from the United States' doesn't get the same."
     *
     * He is right about the difference and it is the whole reason this is two fields. The
     * Legend's `origin` card already asks for both — Sou {nationality}. Sou de {place}. —
     * with gendered options, and it is one of the best cards in the product BECAUSE the
     * place is a town rather than a country: London, Glasgow, Cork. A nationality alone is
     * a form field; a nationality and a town is a person.
     *
     * Stored rather than left as a card answer, which is what it was. The answer lived in
     * `legend` as a slot value and nothing else read it, so a learner who had told DUB they
     * were from Glasgow could be handed "Sou inglês" as a specimen on the next screen.
     *
     * `nationality` is the Portuguese masculine form — inglês, escocês — because that is
     * what the graph stores and what gendering rules operate on; the feminine is derived
     * where it is shown. Null is honest for both: not everybody has answered, and a person
     * may give one and not the other.
     */
    nationality: string | null
    from_place: string | null
    /**
     * HOW OLD THEY ACTUALLY ARE, as a number, because the number is the lesson.
     *
     * Sam: "We need to ask specific age — not bands because that is part of learning
     * numbers." The root that asks it teaches tenho, anos and trinta, so an answer of 34
     * hands back "Tenho trinta e quatro anos" — two numbers and a construction learned by
     * answering.
     *
     * `age_band` above is kept and still derived from this, because registerFor reads it
     * and a band is the right shape for that question: what changes at 60 is how Portugal
     * speaks to you, not the specific year. Two fields for two jobs rather than one field
     * doing neither well.
     *
     * It is also what decides whether an account is permitted at all — see
     * content/consent.ts and `consent_age` on Chapter. That makes it the one profile field
     * with a legal consequence, which is the argument for asking it honestly rather than
     * in a range that could hide a twelve-year-old.
     */
    age: number | null
    /**
     * WHICH KINDS OF NIGHT OUT THEY CARE ABOUT, which the calendar asked and threw away.
     *
     * Sam: "I also want to look at how the information we are gathering INCLUDING the
     * calendar genre preferences (which we need to look at again)... drive the content
     * that the user sees in the club."
     *
     * It was useState in components/Subscribe.tsx, posted to a calendar_feeds row and
     * never written here — so choosing "football and the big matches" shaped an .ics feed
     * and nothing else, and reopening the page lost it. The Club went on serving every
     * drop in the fortnight.
     *
     * EMPTY MEANS EVERYTHING, never nothing. Most learners will never open the calendar,
     * and a Club that empties itself until somebody fills in a form is the exact failure
     * roomsFor warns about. See dropsFor, which holds the same rule.
     */
    genres: string[]
    /**
     * WHAT THEY ARE INTO, which is not the same question as which events they want.
     *
     * Sam: "could everyone's legend be different? So someone who loves festivals needs to
     * be able to say I love going to festivals."
     *
     * Genre above is a request about a feed — what is on in the city. This is a fact about
     * a person, and it is what a Legend frame can be built from. A learner can love fado
     * and still want to know when Benfica play; measured, no crate in the product teaches
     * a single word about music, football or festivals, so one answer was never going to
     * serve both.
     *
     * Every id here is also a banked piece — see content/interests.ts. Tapping `música`
     * puts the word in the inventory, so the question pays whether or not anything
     * downstream ever reads this field.
     */
    into: string[]
    /**
     * Their email, once they have given it, and only ever because they chose to.
     *
     * The set-up copy promises "nothing here will take your email and promise to let you
     * know" — and that promise is kept: this is not a newsletter signup and nothing is
     * sold. It is how a learner gets their Portuguese back on a new phone, which is the
     * only thing it is used for and the only thing the screen asking for it claims.
     *
     * Stored on the profile as well as on the users row because the two are different
     * facts: the row is an account, this is something they told DUB while learning the
     * word for it. Signing in later reconciles them.
     */
    email: string | null
    skipped: string[]
  }
  created_at: string
  missions_completed: MissionId[]
  /** ISO timestamp each mission finished, for previous_session_age_hours. */
  mission_completed_at: Partial<Record<MissionId, string>>
  inventory: Record<string, InventoryItem>
  /** Everything they have said cold. The number on the proof card. */
  proof: ProofLine[]
  /**
   * Which roots and collisions have been through a session.
   *
   * Kept with the learner rather than in the journey's own state, which lives only as
   * long as the tab: a crate that reported itself finished and then forgot the moment
   * somebody refreshed made the picker lie about where they had been.
   *
   * It is a record of what has been SEEN, not a lock. Re-entering a crate is allowed —
   * nothing downstream double-counts, because recordProof dedupes by sentence and the
   * osmosis screen has a state for having nothing new to say.
   */
  roots_played: string[]
  collisions_played: string[]
  /**
   * Cold prompts already answered. Without this, indexing the filtered list by step
   * number meant every section ended with the same three sentences — which makes the
   * proof card look like it is measuring the same thing over and over.
   */
  nocue_done: string[]
  /**
   * Daily lines already shown, so the same sentence never arrives twice.
   *
   * On the LEARNER rather than on the push subscription, because both halves of the
   * feature have to read it: the cron picks from a `sent` column and the /line page
   * passed no seen list at all, so the page happily re-showed a sentence the
   * notification had already delivered — and the docblock claimed the two were always
   * the same line.
   */
  lines_seen: string[]
  /**
   * The Legend — the most personal data in the product.
   *
   * Names of children, ages, marital status, why somebody left a country. Three
   * obligations follow from that and all three are honoured: it is in the export, it is
   * destroyed by account deletion, and it never reaches a share image unless the learner
   * puts it there deliberately.
   *
   * THERE IS NO REHEARSAL COUNT HERE ANY MORE. `said_cold` incremented on every I SAID IT
   * and was never rendered — it was self-certified, which is the whole problem with it:
   * the learner taps the button and the product records the claim as fact, checking
   * nothing. Sam: "we have to take their word for it." Its one stated purpose, offering
   * the cards somebody had practised least, was never built, and the run is shuffled.
   *
   * What survives is `proof`, which records a sentence actually produced and is the same
   * claim from a better source. The retrieval itself — say it before you see it — stays
   * exactly as it was; only the tally is gone.
   */
  legend: LegendAnswer[]
  /**
   * Whether the Legend has been offered, taken up, or turned down.
   *
   * The honesty rule the whole thread depends on: never say "this goes in your Legend"
   * to somebody who has never seen one. The first mention OFFERS it; after that the line
   * is quiet reinforcement. And if a learner declines, it stops entirely — a goal you did
   * not choose is a nag.
   */
  legend_prompt: 'unseen' | 'accepted' | 'declined'
  /**
   * Whether the offer to keep this work off the device has been made, and answered.
   *
   * Everything DUB knows lives in localStorage: a cleared browser or a new phone loses
   * all of it. That is worth saying once, at the moment it would hurt most to discover —
   * one vibe short of the Legend, with real work behind them. Saying it twice is nagging,
   * so the answer is recorded and the offer never returns.
   *
   * 'declined' is not a refusal of accounts, only of being asked again here. Sign-in
   * stays reachable from the front door and from Yours.
   */
  save_prompt: 'unseen' | 'declined'
  /**
   * Cheat-sheet members the learner said they had, in the sheet's own test.
   *
   * THE INVENTORY CANNOT HOLD THESE. A tick on a sheet resolves through `setPieces`, which
   * maps a member to a piece — and four of the nine sheets list members the product has no
   * piece for (`eu`, `tu`, `você`, the ten verbs, the rooms of a house, the directions).
   * That is deliberate: a set names the whole group so the shape of it is legible, and the
   * gaps are the content brief. But it meant somebody could sit those tests, get every
   * answer, and watch nothing tick, because there was no key to write.
   *
   * Sam: "If they do the Your Turn questionairre they should get ticks against all they
   * have done and they should be banked."
   *
   * So the member string itself is the key. It is NOT an inventory entry and must never be
   * counted as one — a word nobody has been taught is not a word somebody owns, and every
   * count in the product would become a lie the moment it was. It is exactly what it says:
   * the answers they got right on a reference sheet. A member that later gains a piece
   * goes on being ticked by the inventory, which is the stronger claim of the two.
   */
  sheet_got: string[]
  /**
   * When set-up was finished — the THAT IS ME tap, and nothing else.
   *
   * WRITTEN IN ONE PLACE ON PURPOSE. The showcase ends when this question has been
   * answered, and the first attempt at saying so inferred it from `chapter`: "written in
   * finish() and nowhere else", which was simply wrong. setChapter has four callers —
   * both city pickers write it, and so does anything that routes through Destination — so
   * a learner who had ever chosen a city was marked as having finished a form they had
   * never seen, and the whole intro sequence vanished out from under them. Sam: "THE FIRST
   * screen I see now after Open is Count to Ten?! What happened to the log in and vibe
   * selector??"
   *
   * A fact this specific needs its own field. Inferring it from a shared one is how that
   * happened, and no amount of care about WHICH shared field would have prevented it.
   */
  set_up_at: string | null
  /**
   * Whether the learner has been told what actually happens when they get it wrong.
   *
   * Once per learner, ever. It is a truth about Portugal rather than a feature, and a
   * truth told twice is a lesson being repeated at somebody.
   */
  switch_seen_at: string | null
  /**
   * Crates whose section has been carried all the way to the end.
   *
   * roots_played says what was opened; this says what was FINISHED, and only the second
   * one can answer "has this person been through DUB once". It is what unlocks the Club
   * and what the welcome ceremony fires on, so it has to survive a refresh, a new phone
   * and a sign-in — hence a learner field rather than journey state.
   *
   * A set, not a count. Finishing Bond twice is one section finished, and a number that
   * can be inflated by repetition is the beginning of a streak.
   */
  sections_completed: string[]
  /**
   * How many sittings this learner has done, in total, across every vibe.
   *
   * A sitting is one pass through a vibe — capped by screen count rather than by roots,
   * so it is about ten minutes rather than a fixed amount of content. It is what the
   * SESSION DONE badge marks, and now what the Legend counts.
   */
  sittings: number
  /** When the Club welcomed them. Fires once, ever. Earliest wins on a merge. */
  club_welcomed_at: string | null
  /**
   * Cards kept, and cards liked.
   *
   * Two different gestures and they are not the same thing. A save is FOR the learner —
   * the pharmacy card the night before an appointment — and has to survive everything,
   * so it merges as a union like every other set here. A like is a signal to us about
   * what is worth writing more of, and it costs nothing to give.
   *
   * Neither is a score, and neither is ever shown as a total. The moment a number is
   * attached to how much somebody has liked, the feed starts asking to be fed.
   */
  saved: string[]
  liked: string[]
  /**
   * Cards and vibes you have been all the way through.
   *
   * Kept apart from `saved` on purpose: a save is a decision and this is a record. They
   * end up in the same place — the profile — and they answer different questions there.
   * "What did I keep for later" is not "what have I done".
   */
  finished_cards: string[]
  /**
   * Idioms met, split by whether the punchline landed.
   *
   * WHY A TALLY IS ALLOWED HERE AND REFUSED ON A LEGEND CARD, which is the question
   * scripts/lint-content.ts exists to force somebody to answer before adding one.
   *
   * The rule it guards is this: "the moment a number is attached to being put on the spot,
   * the feature becomes the anxiety it exists to remove." That is exactly right about the
   * Legend. The Legend is a PERFORMANCE — seven things about yourself, said cold, with
   * nothing on screen — and counting the attempts turns a rehearsal into an exam.
   *
   * An idiom card is not a performance. Nobody is asked to produce anything: the card shows
   * "Bob's your uncle", you guess what Portugal says instead, and you turn it over. GOT IT
   * and MISSED record whether a joke landed, which is nearer to turning a page than to
   * being tested. There is no spot to be put on, so there is nothing for a number to make
   * anxious. Sam, proposing it: "Simple Did you get it mechanic (tick, cross) adds a tiny
   * point to their score. It's an honesty call obviously."
   *
   * IT IS SELF-CERTIFIED AND THAT IS FINE HERE, which is the other half of the argument,
   * because `said_cold` was deleted partly for being self-reported. The difference is what
   * the claim is worth: said_cold asserted "I can produce this sentence cold", which is the
   * central capability the whole product measures, and taking somebody's word for that
   * corrupts the thing Proof exists to be honest about. A tick on an idiom asserts "I knew
   * that one", which nothing else depends on and which nobody has any reason to lie to
   * themselves about. Cheating it inflates a number by one and teaches you nothing, which
   * is its own punishment.
   *
   * Two lists rather than a count, for the reason every other record here is a list: a
   * number cannot merge across devices without double-counting, and a set can. `missed`
   * also tells the feed which idioms are worth bringing round again, which a total never
   * could — and an idiom moves from missed to got the day it lands, so the pair is not
   * a permanent record of having been wrong.
   */
  idioms_got: string[]
  idioms_missed: string[]
  /**
   * Sentences the learner asked the translator for, and chose to keep.
   *
   * Not a translation history — the ones they pressed KEEP on. That gesture is the whole
   * value of the list: everything typed into a translator is a moment of wanting to say
   * something, but the kept ones are the sentences somebody decided they will need again,
   * which is a better description of what a person is actually learning than anything DUB
   * can infer from what it chose to teach them.
   *
   * Held on the learner rather than only in the database, because it has to work on a
   * device with no account and survive being offline. The server row is the backlog; this
   * is the learner's own.
   */
  asked: { pt: string; en: string; note: string; at: string }[]
  /**
   * Why they are in the city, or null if they have not been asked yet.
   *
   * Not a level and not a preference — it decides WHICH of Lisbon the Club offers, while
   * the rung goes on deciding when. Null is a real state and is treated as "everything",
   * because a Club that shows nothing until a question is answered is a Club with a form
   * in front of it.
   */
  purpose: 'visiting' | 'staying' | 'moving' | null
  /**
   * Which city, asked with the why and for the same reason.
   *
   * Chapter was a parameter everywhere and a question nowhere: feedFor, roomsFor, dropsFor
   * and rowsFor all took a ChapterId and every caller passed the default, so the product
   * had two cities in CHAPTERS and no way for anybody to say which one they were in.
   *
   * Null means Lisbon, not "unknown" — there is exactly one open chapter, and a learner
   * who has not answered should get the club that exists rather than an empty screen.
   */
  chapter: 'lisbon' | 'porto' | 'algarve' | null
  /**
   * Cards pushed to the back, oldest first.
   *
   * Reject is "not this one now", not "never" — the feed is finite and a bored thumb on a
   * bus should not be able to permanently shrink somebody's Club. So a rejected card sinks
   * behind everything else rather than leaving, and the order here is the order they sink
   * in, which is also what makes rewind possible: the last one is on the end.
   *
   * The mirror of `saved`. Save pulls a card to the front, reject pushes it to the back,
   * and nothing is ever lost in either direction.
   */
  rejected: string[]
  /**
   * The one Club room handed over before anything was earned, or null.
   *
   * A showcase that only describes itself is a brochure. So the first room somebody opens
   * is given to them outright — the whole thing, the Portuguese, the audio — and after that
   * the rest are teased until the Legend is written.
   *
   * One, ever, and the id is stored rather than a counter so it cannot be re-spent by
   * clearing something else, and so the room they were given stays open to them.
   */
  tasted: string | null
  /**
   * When the deal was accepted, or null. Kept per pair rather than globally, because
   * the deal screen speaks about the language being learned — "your Portuguese" — and
   * somebody arriving at a second pair has not been told that deal.
   */
  deal_accepted_at: string | null
  evidence: LearningEvidence[]
  affinity: CultureAffinity
  experiment: Experiment
  /** The learner's own name, if they gave one — used in the introduction screens. */
  display_name: string
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'l_' + Math.abs(Math.floor(performance.now() * 1000)).toString(36)
}

export function emptyLearner(): LearnerState {
  return {
    version: VERSION,
    learner_id: uid(),
    tester_label: '',
    voice_signals: [],
    osmosis_seen: [],
    user_id: null,
    profile: {
      gender: null,
      age_band: null,
      goal: null,
      nationality: null,
      from_place: null,
      age: null,
      email: null,
      genres: [],
      into: [],
      skipped: [],
    },
    created_at: new Date().toISOString(),
    missions_completed: [],
    mission_completed_at: {},
    inventory: {},
    proof: [],
    roots_played: [],
    collisions_played: [],
    nocue_done: [],
    lines_seen: [],
    legend: [],
    idioms_got: [],
    idioms_missed: [],
    legend_prompt: 'unseen',
    save_prompt: 'unseen',
    sheet_got: [],
    set_up_at: null,
    switch_seen_at: null,
    sections_completed: [],
    sittings: 0,
    club_welcomed_at: null,
    saved: [],
    liked: [],
    finished_cards: [],
    asked: [],
    purpose: null,
    chapter: null,
    rejected: [],
    tasted: null,
    deal_accepted_at: null,
    evidence: [],
    affinity: {
      categories_ranked: [],
      free_text_favourite: '',
      next_world_pre: null,
      next_world_post: null,
      source_familiarities: {},
    },
    experiment: {
      test_variant: 'culture_full',
      same_or_delayed: 'unknown',
      cohort_tag: '',
    },
    display_name: '',
  }
}

let state: LearnerState | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function save() {
  if (typeof window === 'undefined' || !state) return
  try {
    window.localStorage.setItem(currentKey(), JSON.stringify(state))
  } catch {
    // Private mode or a full quota. The in-memory copy still drives the session.
  }
}

/**
 * The one-off repair for Legend proof banked with its template English.
 *
 * WHAT WENT WRONG. `recordProof` was passed `frame.en` — the raw pattern — where the
 * filled value was computed three lines above and handed to the screen. So a learner's
 * proof card stored "Chamo-me Sam." against "My name is {name}.", and, because frameFor
 * swaps the whole frame for the children variant, somebody with two daughters banked a
 * sentence about them against "I do not have children."
 *
 * WHY IT NEEDS A MIGRATION AT ALL. `recordProof` dedupes on `pt` and only ever upgrades
 * `clean` — it never rewrites `en` — so saying the sentence again does not heal the row.
 * The bad English is on the proof card and in the share image until something replaces it.
 *
 * HOW IT IS SAFE. The learner's own answers are still in `legend`, so the correct English
 * is not guessed: it is recomputed from what they actually said, and only accepted when
 * the Portuguese it produces matches the Portuguese already stored. A row that does not
 * match is left exactly as it is. Nothing is deleted, no row is added, and `clean` and
 * `at` are carried through untouched — this rewrites one field on rows that are provably
 * the same sentence.
 *
 * It runs on load rather than as a script because the record lives on the phone. Records
 * that never had the problem are returned by identity, so the common case allocates
 * nothing and the pass is invisible.
 *
 * Exported so `npm run proof:repair` can exercise it directly. loadLearner is client code
 * — it reads localStorage — and mocking a browser to reach a pure function is a way of
 * testing the mock. This is the function that does the work.
 */
export function repairLegendEnglish(proof: ProofLine[], legend: LegendAnswer[]): ProofLine[] {
  /*
    A template is the tell. Every damaged row has a brace in it — either an unfilled slot,
    or, for children, the base sentence which is a different string from the one the
    learner built. Rows without one are already right and are not touched.
  */
  const suspect = proof.some((line) => line.source === 'legend' && /[{}]/.test(line.en))
  if (!suspect) return proof
  if (!legend.length) return proof

  return proof.map((line) => {
    if (line.source !== 'legend' || !/[{}]/.test(line.en)) return line
    for (const answer of legend) {
      const frame = LEGEND_FRAMES.find((f) => f.id === answer.frame_id)
      if (!frame) continue
      /*
        Matched on the Portuguese, and on nothing else. Gender is unknown at this point in
        the load — profile is parsed further down — so both endings are tried and the one
        that reproduces the stored sentence is the one that was said.
      */
      const said =
        fillFrame(frame, answer.values, 'm') === line.pt
          ? 'm'
          : fillFrame(frame, answer.values, 'f') === line.pt
            ? 'f'
            : null
      if (!said) continue
      const better = fillEnglish(frame, answer.values)
      /* Never trade one template for another. */
      if (/[{}]/.test(better)) return line
      return { ...line, en: better }
    }
    return line
  })
}

export function loadLearner(): LearnerState {
  if (state) return state
  if (typeof window === 'undefined') return emptyLearner()
  try {
    // A record written before pairs existed belongs to the default pair. Read it
    // across rather than abandoning it — and leave the original in place, because a
    // migration that deletes its own source has no way back if it turns out to be wrong.
    const key = currentKey()
    let raw = window.localStorage.getItem(key)
    if (!raw && pairId(currentPair()) === pairId(DEFAULT_PAIR)) {
      const legacy = window.localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        raw = legacy
        try {
          window.localStorage.setItem(key, legacy)
        } catch {
          // Out of room. The record still loads for this session.
        }
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LearnerState>
      if (parsed.version === VERSION) {
        // Fields added after a tester started are backfilled rather than version-bumped:
        // a bump throws away a session that is still running, which is a worse bug than
        // a missing array.
        //
        // Backfilling one field at a time was the bug — every field added since a
        // record was written came back undefined, and the first component to reach
        // for .length or spread it died. So a saved record is merged onto a complete
        // one, and anything that must be an array or an object is checked rather than
        // trusted: this data has been through a schema change, a JSON round trip and
        // sometimes a hand edit in devtools.
        const base = emptyLearner()
        const arr = <T>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback)
        const obj = <T extends object>(v: unknown, fallback: T): T =>
          v && typeof v === 'object' && !Array.isArray(v) ? { ...fallback, ...(v as T) } : fallback
        state = {
          ...base,
          ...parsed,
          learner_id: parsed.learner_id || base.learner_id,
          created_at: parsed.created_at || base.created_at,
          tester_label: parsed.tester_label ?? base.tester_label,
          display_name: parsed.display_name ?? base.display_name,
          voice_signals: arr(parsed.voice_signals, []),
          osmosis_seen: arr(parsed.osmosis_seen, []),
          missions_completed: arr(parsed.missions_completed, []),
          proof: repairLegendEnglish(
            arr(parsed.proof, []) as ProofLine[],
            arr(parsed.legend, []) as LegendAnswer[],
          ),
          roots_played: arr(parsed.roots_played, []),
          nocue_done: arr(parsed.nocue_done, []),
          lines_seen: arr(parsed.lines_seen, []),
          legend: arr(parsed.legend, []),
          /* Absent on every record written before idioms existed, which is all of them. */
          idioms_got: arr(parsed.idioms_got, []),
          idioms_missed: arr(parsed.idioms_missed, []),
          save_prompt: parsed.save_prompt === 'declined' ? 'declined' : 'unseen',
          legend_prompt:
            parsed.legend_prompt === 'accepted' || parsed.legend_prompt === 'declined'
              ? parsed.legend_prompt
              : 'unseen',
          /*
            Absent means anonymous, not broken.

            Every record already on a phone predates this field. Treating a missing owner as
            anything but anonymous would orphan the entire existing cohort on the day this
            ships, and the merge would then refuse to claim any of them.
          */
          user_id: typeof parsed.user_id === 'string' && parsed.user_id ? parsed.user_id : null,
          switch_seen_at: parsed.switch_seen_at ?? null,
          sections_completed: arr(parsed.sections_completed, []),
          /*
            Back-filled from sections_completed for anybody who has one and no count.

            Their real total is higher — a vibe they sat twice counts once here — and
            guessing upward would open the door on work nobody did. The floor is the
            honest reading of a record written before this field existed.
          */
          sittings:
            typeof parsed.sittings === 'number'
              ? parsed.sittings
              : arr(parsed.sections_completed, []).length,
          club_welcomed_at: parsed.club_welcomed_at ?? null,
          saved: arr(parsed.saved, []),
          liked: arr(parsed.liked, []),
          finished_cards: arr(parsed.finished_cards, []),
          sheet_got: arr(parsed.sheet_got, []),
          set_up_at: parsed.set_up_at ?? null,
          asked: arr(parsed.asked, []),
          purpose: parsed.purpose ?? null,
          chapter: parsed.chapter ?? null,
          rejected: arr(parsed.rejected, []),
          tasted: parsed.tasted ?? null,
          deal_accepted_at: parsed.deal_accepted_at ?? null,
          collisions_played: arr(parsed.collisions_played, []),
          evidence: arr(parsed.evidence, []),
          inventory: obj(parsed.inventory, {}),
          mission_completed_at: obj(parsed.mission_completed_at, {}),
          profile: {
            ...obj(parsed.profile, base.profile),
            skipped: arr(parsed.profile?.skipped, []),
            /* Absent on every record written before the calendar stored anything. */
            genres: arr(parsed.profile?.genres, []),
            into: arr(parsed.profile?.into, []),
          },
          affinity: {
            ...obj(parsed.affinity, base.affinity),
            categories_ranked: arr(parsed.affinity?.categories_ranked, []),
            source_familiarities: obj(parsed.affinity?.source_familiarities, {}),
          },
          experiment: obj(parsed.experiment, base.experiment),
        }
        return state
      }
    }
  } catch {
    // Corrupt record — start clean rather than trap the tester on a broken session.
  }
  state = emptyLearner()
  save()
  return state
}

export function subscribeLearner(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getLearner(): LearnerState {
  return state ?? loadLearner()
}

function update(fn: (s: LearnerState) => void) {
  const s = getLearner()
  fn(s)
  state = { ...s }
  save()
  emit()
}

export function setExperiment(patch: Partial<Experiment>) {
  update((s) => {
    s.experiment = { ...s.experiment, ...patch }
  })
}

export function setAffinity(patch: Partial<CultureAffinity>) {
  update((s) => {
    s.affinity = { ...s.affinity, ...patch }
  })
}

export function setFamiliarity(property: PropertyId, value: number) {
  update((s) => {
    s.affinity.source_familiarities = {
      ...s.affinity.source_familiarities,
      [property]: value,
    }
  })
}

export function setTester(label: string) {
  update((s) => {
    s.tester_label = label.trim().slice(0, 60)
  })
}

/** §12 — after three to five signals the product may reflect something back. */
/**
 * Record a sentence produced cold.
 *
 * Deduplicated on the Portuguese, because saying the same line twice is revision
 * rather than a second capability, and a count that inflates on repetition is exactly
 * the kind of number this product exists to avoid.
 */
/**
 * A sentence produced with nothing on screen to copy from.
 *
 * Two things this gets right that the first version did not.
 *
 * A fumble is not permanent. It used to return early on any sentence already in the
 * log, so a release got wrong once was stored clean:false FOREVER — replaying the root
 * could not fix it, and the rung it would have earned was gone. Worst case was live: a
 * learner who picked Bridget Jones got a section containing exactly one release, the
 * longest rung-1 build in the graph, and one slip left them still on rung 1 having spent
 * one of three free crates. The dedupe stays for the COUNT — a sentence said twice is
 * one sentence — and drops for the flag.
 *
 * And it goes through update(). It was the only mutator in this file that mutated the
 * state object in place, so useSyncExternalStore compared the same reference with
 * Object.is, decided nothing had changed, and never re-rendered a subscriber. The proof
 * card and the ladder could both sit a whole session behind.
 *
 * `at` is deliberately not restamped on an upgrade: the merge dedupes proof on pt|at,
 * so moving it would turn one sentence into two the next time a device synced.
 */
export function recordProof(line: Omit<ProofLine, 'at'>) {
  update((s) => {
    const found = s.proof.findIndex((p) => p.pt === line.pt)
    if (found < 0) {
      s.proof = [...s.proof, { ...line, at: new Date().toISOString() }]
      return
    }
    if (line.clean && !s.proof[found].clean) {
      s.proof = s.proof.map((p, i) => (i === found ? { ...p, clean: true } : p))
    }
  })
}

export function recordVoiceSignal(signal: string, pt: string) {
  update((s) => {
    s.voice_signals = [...s.voice_signals, { signal, pt, at: new Date().toISOString() }]
  })
}

export function markOsmosisSeen(ids: string[]) {
  update((s) => {
    s.osmosis_seen = [...new Set([...(s.osmosis_seen ?? []), ...ids])]
  })
}

export function setProfile(
  field: 'gender' | 'age_band' | 'goal' | 'nationality' | 'from_place' | 'age' | 'email',
  value: string | number | null,
) {
  update((s) => {
    s.profile = {
      ...(s.profile ?? {
        gender: null,
        age_band: null,
        goal: null,
        nationality: null,
        from_place: null,
        age: null,
        email: null,
        genres: [],
        into: [],
        skipped: [],
      }),
    }
    if (value === null) {
      s.profile.skipped = [...new Set([...s.profile.skipped, field])]
    } else {
      ;(s.profile as Record<string, unknown>)[field] = value
    }
  })
}

/**
 * Which kinds of night out this learner wants to hear about.
 *
 * Replaces rather than unions, because this is a preference and not a record: unticking
 * "classical and fado" has to mean it goes away, which a union could never express. That
 * is the opposite of every list above it, so it is worth saying out loud.
 */
export function setGenres(genres: string[]) {
  update((s) => {
    s.profile = { ...s.profile, genres: [...new Set(genres)] }
  })
}

/**
 * What this learner is into, replacing rather than unioning for the same reason.
 *
 * Unticking `futebol` has to mean it goes away, which a union could never express — the
 * opposite of every other list on this record, and worth saying out loud.
 */
export function setInto(into: string[]) {
  update((s) => {
    s.profile = { ...s.profile, into: [...new Set(into)] }
  })
}

export function voiceLean(): { lean: string; count: number } | null {
  const signals = getLearner().voice_signals
  if (signals.length < 3) return null
  const tally: Record<string, number> = {}
  for (const s of signals) tally[s.signal] = (tally[s.signal] ?? 0) + 1
  const [lean] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]
  return { lean, count: signals.length }
}

/**
 * Push the whole session somewhere a facilitator can read it. Multi-user testing on
 * twelve phones is unreadable if each phone keeps its own record — but a failed POST
 * must never cost the tester anything, so this is fire-and-forget and the local copy
 * stays authoritative.
 */
export async function syncSession(reason: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const s = getLearner()
  const pending = drainEvents()
  try {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        session_id: s.learner_id,
        tester_label: s.tester_label,
        recorded_at: new Date().toISOString(),
        reason,
        experiment: s.experiment,
        affinity: s.affinity,
        profile: s.profile,
        inventory: s.inventory,
        voice_signals: s.voice_signals,
        evidence: s.evidence.slice(-400),
        missions_completed: s.missions_completed,
        /**
         * proof was missing, and it is the only number the product counts — the
         * sentences said cold, the thing on the share card, and what rungReached is
         * derived from. Without it the server could not say how many learners had said
         * anything or what stage anyone had reached, which makes every question you
         * would ask before pricing unanswerable.
         */
        proof: s.proof,
        /*
          Whose copy this is, sent up so the server's merge can refuse for the same reason
          the device's does. Both sides of the round trip run mergeLearner and both have to
          be able to say no — a rule enforced on one side only is a rule the other side
          quietly breaks.
        */
        user_id: s.user_id,
        display_name: s.display_name,
        osmosis_seen: s.osmosis_seen,
        roots_played: s.roots_played,
        sections_completed: s.sections_completed,
        sittings: s.sittings,
        club_welcomed_at: s.club_welcomed_at,
        collisions_played: s.collisions_played,
        nocue_done: s.nocue_done,
        lines_seen: s.lines_seen,
        legend: s.legend,
        legend_prompt: s.legend_prompt,
        save_prompt: s.save_prompt,
        sheet_got: s.sheet_got,
        set_up_at: s.set_up_at,
        switch_seen_at: s.switch_seen_at,
        deal_accepted_at: s.deal_accepted_at,
        created_at: s.created_at,
        user_agent: navigator.userAgent,
        /*
          The events, at last.

          /api/session has accepted an `events` array and written it to the events table
          since it was built, and nothing had ever sent one — so DUB had no analytics
          egress whatsoever. Every event a tester generated lived in sessionStorage until
          they closed the tab, which means every question you would ask before pricing
          was unanswerable from data that was being collected the whole time.

          Piggy-backed on the sync rather than given its own beacon: the sync already
          runs at every meaningful moment, already carries the device identity, and a
          second endpoint is a second thing to fail.
        */
        events: pending.map((e) => ({ name: e.name, payload: e.props, at: new Date(Date.now() - 0).toISOString() })),
      }),
    })
    const body = await res.json()
    if (!body?.stored) returnEvents(pending.length)
    return Boolean(body?.stored)
  } catch {
    // Handed back rather than dropped. Losing telemetry is cheap; double-counting is not.
    returnEvents(pending.length)
    return false
  }
}

export function setDisplayName(name: string) {
  update((s) => {
    s.display_name = name.trim()
  })
}

/**
 * Whether the punchline landed, recorded once per idiom.
 *
 * MOVES BETWEEN THE TWO LISTS rather than appending to both. An idiom you missed in
 * September and got in October is one you know — a permanent record of having been wrong
 * about a joke would be a grudge, and the feed reads `missed` to decide what to bring back
 * round, so leaving a stale id there would keep serving a card that has already landed.
 *
 * Idempotent, because the card can be turned over more than once and a tally that grows on
 * re-reading is a tally that rewards scrolling.
 */
export function markIdiom(id: string, got: boolean) {
  update((s) => {
    s.idioms_got = s.idioms_got.filter((x) => x !== id)
    s.idioms_missed = s.idioms_missed.filter((x) => x !== id)
    if (got) s.idioms_got.push(id)
    else s.idioms_missed.push(id)
  })
}

export function completeMission(id: MissionId) {
  update((s) => {
    if (!s.missions_completed.includes(id)) s.missions_completed.push(id)
    s.mission_completed_at[id] = new Date().toISOString()
  })
}

/** Hours since the most recent completed mission, for previous_session_age_hours. */
export function hoursSinceLastMission(): number | null {
  const s = getLearner()
  const stamps = Object.values(s.mission_completed_at).filter(Boolean) as string[]
  if (!stamps.length) return null
  const latest = stamps.map((t) => Date.parse(t)).sort((a, b) => b - a)[0]
  return Math.round(((Date.now() - latest) / 36e5) * 10) / 10
}

// ---------------------------------------------------------------------------
// Inventory state machine — spec §8
// ---------------------------------------------------------------------------

/**
 * Evidence scoring, kept deliberately dumb: +1 acquired outside its source culture,
 * +1 recalled later, +1 reinforced in another world, +1 transferred with no hint,
 * −1 when the answer had to be revealed. The events are stored, not just the total,
 * so a better model can be fitted later without re-running any tester.
 */
export function scoreFor(target: PieceId): number {
  const evidence = getLearner().evidence.filter((e) => e.target_id === target)
  let score = 0
  for (const e of evidence) {
    if (e.event_type === 'acquire' || e.event_type === 'transfer') score += 1
    if (e.event_type === 'cold_recall' || e.event_type === 'delayed_recall') score += 1
    if (e.event_type === 'reinforce') score += 1
    if (
      (e.event_type === 'transfer' || e.event_type === 'crossover') &&
      e.correct_first_try &&
      e.hint_count === 0
    ) {
      score += 1
    }
    if (e.revealed) score -= 1
  }
  return score
}

function deriveState(target: PieceId): InventoryState {
  const evidence = getLearner().evidence.filter((e) => e.target_id === target)
  if (!evidence.length) return 'NEW'

  const latest = evidence[evidence.length - 1]
  // The label describes the most recent retrieval, so a fresh failure outranks history.
  if (latest.revealed || (!latest.correct_first_try && latest.hint_count >= 2)) {
    return 'NEEDS ANOTHER LOOK'
  }

  const cleanLate = evidence.some(
    (e) =>
      (e.event_type === 'crossover' || e.event_type === 'delayed_recall') &&
      e.correct_first_try &&
      e.hint_count === 0,
  )
  if (cleanLate) return 'SOLID'

  if (evidence.some((e) => e.event_type === 'reinforce')) return 'STRONGER'
  if (evidence.some((e) => e.event_type === 'transfer' && !e.revealed)) return 'YOURS'
  return 'NEW'
}

export function recordEvidence(
  ev: Omit<LearningEvidence, 'timestamp'> & { timestamp?: string },
) {
  update((s) => {
    const entry: LearningEvidence = {
      ...ev,
      timestamp: ev.timestamp ?? new Date().toISOString(),
    }
    s.evidence = [...s.evidence, entry]

    const existing: InventoryItem = s.inventory[ev.target_id]
      ? {
          ...s.inventory[ev.target_id],
          /*
            Tolerant of a row that is not the shape we expect.

            Spreading a missing list throws, and this runs inside the tap that banks a
            piece — so one malformed row does not degrade the journey, it ENDS it: the
            exception kills the handler before next(), the button stays live, and pressing
            it again does the same nothing. A record written by an older build, or
            half-merged from another device, should cost its own history and not the
            learner's ability to move.
          */
          reinforced_sources: [...(s.inventory[ev.target_id].reinforced_sources ?? [])],
        }
      : {
          target_id: ev.target_id,
          acquired_source: null,
          reinforced_sources: [],
          latest_state: 'NEW',
          latest_recall_at: null,
        }

    if (ev.event_type === 'acquire' && !existing.acquired_source) {
      existing.acquired_source =
        ev.culture_context ?? TARGETS[ev.target_id as keyof typeof TARGETS]?.source ?? null
    }
    if (
      ev.event_type === 'reinforce' &&
      ev.culture_context &&
      ev.culture_context !== existing.acquired_source &&
      !existing.reinforced_sources.includes(ev.culture_context)
    ) {
      existing.reinforced_sources.push(ev.culture_context)
    }
    if (
      ev.event_type === 'cold_recall' ||
      ev.event_type === 'delayed_recall' ||
      ev.event_type === 'checkpoint_recall'
    ) {
      existing.latest_recall_at = entry.timestamp
    }

    s.inventory = { ...s.inventory, [ev.target_id]: { ...existing } }
  })

  // deriveState reads the freshly-written evidence, so it runs after the update.
  update((s) => {
    const item = s.inventory[ev.target_id]
    if (!item) return
    s.inventory = {
      ...s.inventory,
      [ev.target_id]: { ...item, latest_state: deriveState(ev.target_id) },
    }
  })
}

/** Blocks the learner has met at all, in curriculum order then arrival order. */
export function ownedBlocks(): PieceId[] {
  const s = getLearner()
  const known = BLOCK_ORDER.filter((b) => s.inventory[b])
  const rest = Object.keys(s.inventory).filter((b) => !known.includes(b as never))
  return [...known, ...rest]
}

/** Bank a piece from the root graph. */
export function acquirePiece(id: PieceId, family: string) {
  recordEvidence({
    target_id: id,
    event_type: 'acquire',
    correct_first_try: true,
    hint_count: 0,
    revealed: false,
    latency_ms: 0,
    culture_context: family as PropertyId,
    mission_id: null,
  })
}

/**
 * A word used away from where it was learned, which is what makes it yours.
 *
 * THE LIBRARY WAS A LIST OF WORDS PERMANENTLY MARKED NEW. `acquirePiece` hardcodes a
 * perfect first try, so one acquire gives NEW and so do five; SOLID, STRONGER, YOURS and
 * NEEDS ANOTHER LOOK all require a reinforce, transfer, crossover or delayed_recall event,
 * and nothing in the app ever wrote one. That silently deleted six features on the vocab
 * screen — the amber ordering, the shaky count, the set flag, the underline, the row badge
 * and the coach panel — and with them the one designed reason to reopen the library.
 *
 * A room performed cold is a TRANSFER by the plainest reading of the word: the learner
 * produced a sentence, with nothing on screen, in a place that did not teach them any of
 * it. deriveState turns that into YOURS, which is the honest label.
 *
 * ONLY WORDS THEY ALREADY HAVE. The room does not declare what it teaches, and inferring
 * it from the sentence would bank `bom`, `um` and `com` off any errand that happens to
 * contain them — inventing an acquisition out of a word-match, which is the class of bug
 * that put the Club off the ladder in the first place. So this reinforces what is already
 * owned and claims nothing new. Rooms will hand over new vocabulary when they say which
 * words they teach, and not before.
 */
export function transferPieces(ids: PieceId[]) {
  const owned = getLearner().inventory
  for (const id of ids) {
    if (!owned[id]) continue
    recordEvidence({
      target_id: id,
      event_type: 'transfer',
      correct_first_try: true,
      hint_count: 0,
      revealed: false,
      latency_ms: 0,
      culture_context: null,
      mission_id: null,
    })
  }
}

/**
 * The other half of `transferPieces`: a word the learner had to be shown.
 *
 * NEEDS ANOTHER LOOK WAS A STATE NOTHING COULD REACH. Every recordEvidence call in the
 * product hardcodes `revealed: false, hint_count: 0`, so deriveState's first branch — the
 * one that catches a fresh failure — was dead, and with it the amber ordering, the shaky
 * count, the set flag and the coach panel on the vocab screen. The same shape as the bug
 * the comment above describes, caught one direction later: transfer was wired, reveal
 * was not, so the ladder could only ever go up.
 *
 * A room whose sentence had to be revealed is the honest signal. It says nothing about
 * what the learner knows in general — only that this time, here, they needed it on the
 * screen. deriveState reads the LATEST event, so one clean cold delivery clears it.
 *
 * Same restraint as transfer: only words already owned. A reveal does not teach.
 */
export function revealPieces(ids: PieceId[]) {
  const owned = getLearner().inventory
  for (const id of ids) {
    if (!owned[id]) continue
    recordEvidence({
      target_id: id,
      event_type: 'transfer',
      correct_first_try: false,
      hint_count: 0,
      revealed: true,
      latency_ms: 0,
      culture_context: null,
      mission_id: null,
    })
  }
}

export function itemFor(target: PieceId): InventoryItem | undefined {
  return getLearner().inventory[target]
}

/** Weakest first: reveals, then hints, then slow. Drives deck selection (§9). */
export function weakestBlocks(limit: number, pool?: PieceId[]): PieceId[] {
  const s = getLearner()
  const candidates = pool ?? ownedBlocks()
  return [...candidates]
    .map((b) => {
      const ev = s.evidence.filter((e) => e.target_id === b)
      const reveals = ev.filter((e) => e.revealed).length
      const hints = ev.reduce((n, e) => n + e.hint_count, 0)
      const latency = ev.length
        ? ev.reduce((n, e) => n + e.latency_ms, 0) / ev.length
        : 0
      return { b, weakness: reveals * 100 + hints * 10 + latency / 1000 }
    })
    .sort((a, b) => b.weakness - a.weakness)
    .filter((x) => x.weakness > 0)
    .slice(0, limit)
    .map((x) => x.b)
}

// ---------------------------------------------------------------------------
// Resume link — the whole learner in a URL, so a cleared browser or a second
// device is not a lost tester. No backend, no account, nothing sent anywhere.
// ---------------------------------------------------------------------------

export function encodeLearner(s: LearnerState = getLearner()): string {
  const json = JSON.stringify(s)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeLearner(token: string): LearnerState | null {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(b64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as LearnerState
    return parsed.version === VERSION ? parsed : null
  } catch {
    return null
  }
}

export function adoptLearner(next: LearnerState) {
  state = next
  save()
  emit()
}

/** Read ?t= on load so a resume link restores the learner before anything renders. */
export function hydrateFromUrl(): boolean {
  if (typeof window === 'undefined') return false
  const token = new URLSearchParams(window.location.search).get('t')
  if (!token) return false
  const next = decodeLearner(token)
  if (!next) return false
  adoptLearner(next)
  return true
}

/**
 * STAND A LEARNER UP AT THE CLUB DOOR, for testing, without playing the whole game.
 *
 * Sam: "I need a way of testing club without having to reset and redo the legend."
 *
 * The Club opens on `club_welcomed_at` alone — see clubOpen, where it is the first line
 * and returns true unconditionally. Everything else this writes is there so the Club is
 * worth LOOKING at once it opens: a feed with no inventory, no proof and no answered
 * Legend renders every card in its empty state, which tests almost nothing and reads as
 * broken rather than as new.
 *
 * WHAT IT FAKES AND WHAT IT DOES NOT. It writes the shape of somebody who has been
 * through the doorway: the pair, the deal, a purpose, a chapter, the basics played and
 * completed, the seven Legend answers, and one proof line. It does NOT invent an
 * inventory — `words` on the profile counts banked pieces, and a fabricated one would put
 * a number on the stages screen that no lesson produced, which is the one number in this
 * product that is supposed to be real. So a skipped learner shows a Club full of content
 * and a stage of BASICS, which is honest: they have not learned anything, they have just
 * been let in.
 *
 * `answers` are the literal slot values rather than anything clever, because cardDone only
 * asks whether a frame has any values at all.
 *
 * NOT REACHABLE FROM THE PRODUCT. Same rule as /reset: a URL you have to know. This one
 * writes rather than destroys, so the danger is different and smaller — the worst case is
 * a tester's own device claiming a Legend they did not build, which /reset undoes.
 */
export function fastForward(opts: { name?: string; purpose?: PropertyId | string } = {}) {
  const name = (opts.name ?? 'Sam').trim() || 'Sam'
  const now = new Date().toISOString()
  update((s) => {
    s.deal_accepted_at = s.deal_accepted_at ?? now
    s.display_name = s.display_name ?? name
    s.chapter = s.chapter ?? 'lisbon'
    s.purpose = (s.purpose ?? opts.purpose ?? 'moving') as LearnerState['purpose']
    s.profile = { ...s.profile, goal: s.profile?.goal ?? 'moving' }
    /*
      The doorway, marked as played AND completed. Both, because they answer different
      questions — roots_played is what the shelf dims, sections_completed is what the
      basics gate reads — and a learner with one and not the other is a state no real
      session produces.
    */
    const doorway = (ROOTS_BY_FAMILY_FOR_SEED?.() ?? []).map((r) => r.root_id)
    if (doorway.length) s.roots_played = [...new Set([...s.roots_played, ...doorway])]
    s.sections_completed = [...new Set([...s.sections_completed, 'the_basics'])]
    /*
      The seven, answered. Only the frames this learner's purpose actually asks for —
      cardDone measures against their card, not the universal one, so filling the wrong
      seven would leave the door shut and look like the tool had failed.
    */
    const already = new Set(s.legend.map((a) => a.frame_id))
    for (const f of SEED_CARD_FOR?.(s.purpose ?? null) ?? []) {
      if (already.has(f.id)) continue
      const values: Record<string, string> = {}
      for (const slot of f.slots) values[slot.key] = slot.kind === 'name' ? name : 'x'
      s.legend.push({ frame_id: f.id, values, at: now })
    }
    /* One line of proof, so the proof card and SAID COLD are not empty. */
    if (!s.proof.length) {
      s.proof.push({ pt: 'Chamo-me ' + name + '.', en: 'My name is ' + name + '.', source: 'release', clean: true, at: now })
    }
    s.legend_prompt = s.legend_prompt === 'unseen' ? 'accepted' : s.legend_prompt
    /* The line that actually opens the door. Everything above is so it is worth opening. */
    s.club_welcomed_at = s.club_welcomed_at ?? now
  })
}

/*
  Late-bound so this module does not import the content graph.

  engine/learner.ts is imported by content/roots.ts (for PieceId) and importing it back
  would be a cycle. The two setters are called once from the page that uses fastForward,
  which is the only caller and knows both modules already.
*/
let ROOTS_BY_FAMILY_FOR_SEED: (() => { root_id: string }[]) | null = null
let SEED_CARD_FOR:
  | ((p: string | null) => { id: string; slots: { key: string; kind: string }[] }[])
  | null = null

export function provideSeedContent(
  roots: () => { root_id: string }[],
  card: (p: string | null) => { id: string; slots: { key: string; kind: string }[] }[],
) {
  ROOTS_BY_FAMILY_FOR_SEED = roots
  SEED_CARD_FOR = card
}

export function resetLearner() {
  state = emptyLearner()
  save()
  emit()
}

/**
 * Remember a section that has been played. Unions rather than replaces, so it cannot
 * be wiped by a caller that happens to hold a stale list.
 */
export function rememberPlayed(rootIds: string[], collisionId?: string | null) {
  update((s) => {
    if (rootIds.length) s.roots_played = [...new Set([...s.roots_played, ...rootIds])]
    if (collisionId) s.collisions_played = [...new Set([...s.collisions_played, collisionId])]
  })
}

/**
 * Drop the in-memory record so the next read loads the pair that is now current.
 *
 * Called when somebody switches pair. Kept here rather than inside setPair so that
 * engine/pair.ts stays pure storage and the two modules do not import each other.
 */
/**
 * Everything this device holds about a learner, gone.
 *
 * Only for account deletion, and it is what the deletion flow was missing entirely: the
 * server wiped the account and the client kept every byte, so somebody who closed their
 * account landed on their own Club page with their whole history intact and the redirect
 * to it working perfectly. It looked exactly like the deletion had failed, on the one
 * flow where trust IS the product.
 *
 * Every namespaced key, not just the current pair's — a learner may have started more
 * than one — plus the legacy unnamespaced record, the analytics buffer, the chosen pair
 * and the remembered library scope. Deliberately enumerated by prefix rather than by
 * calling localStorage.clear(), so a future key that belongs to something else on the
 * same origin is not swept up by accident.
 */
export function wipeLearner() {
  if (typeof window === 'undefined') return
  try {
    const doomed: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith('byheart.')) doomed.push(key)
    }
    doomed.forEach((k) => window.localStorage.removeItem(k))
    window.sessionStorage.removeItem('byheart.events.v1')
    window.sessionStorage.removeItem('byheart.session.v1')
  } catch {
    /* private mode, or storage blocked. Nothing to clear. */
  }
  resetLearnerCache()
}

export function resetLearnerCache() {
  state = null
  emit()
}

/** Recorded once. Re-accepting does not move the date. */
export function acceptDeal() {
  update((s) => {
    if (!s.deal_accepted_at) s.deal_accepted_at = new Date().toISOString()
  })
}

/** Set-up finished. Called once, from SetUp's own finish(). */
export function rememberSetUp() {
  update((s) => {
    if (!s.set_up_at) s.set_up_at = new Date().toISOString()
  })
}

export function hasAcceptedDeal(): boolean {
  return Boolean(getLearner().deal_accepted_at)
}

/**
 * Pull the server's copy down and merge it into this device's.
 *
 * The half of sync that did not exist. Progress uploaded and never came back, so
 * signing in on a new phone started you at zero and clearing the browser lost work the
 * server was already holding.
 *
 * Merge, never replace — in either direction. Taking the server copy would destroy an
 * offline session; taking the local one would destroy whatever the other device did.
 * mergeLearner asserts that neither can happen before this writes anything.
 *
 * Silent by design: an unprovisioned deployment, an offline phone and a 401 all mean
 * the same thing here, which is that the local copy stays authoritative and the learner
 * notices nothing.
 */
export async function restoreLearner(): Promise<'merged' | 'nothing' | 'failed' | 'refused'> {
  if (typeof window === 'undefined') return 'nothing'
  try {
    const res = await fetch('/api/session?mine=1', { headers: { accept: 'application/json' } })
    if (!res.ok) return 'failed'
    const body = (await res.json()) as {
      found?: boolean
      state?: Partial<LearnerState>
      user_id?: string | null
    }
    const local = getLearner()

    /*
      Stamp first, from the session rather than from the state.

      The server's copy may predate the owner field entirely, so the state cannot be trusted
      to know whose it is — the session can. Stamping before the merge is also what makes
      the refusal fire: an unstamped local copy would be claimed silently by whoever signed
      in next, which is the whole failure this exists to stop.
    */
    if (body?.user_id) {
      try {
        mergeOwner(local.user_id ?? null, body.user_id)
      } catch (e) {
        // Somebody else's cache on this device. Nothing is written — a refusal loses
        // nothing — and the screen that says so is the caller's job.
        return 'refused'
      }
      if (!local.user_id) {
        state = { ...local, user_id: body.user_id }
        save()
        emit()
      }
    }

    if (!body?.found || !body.state) return 'nothing'
    const merged = mergeLearner(getLearner(), { ...body.state, user_id: body.user_id ?? null })
    // Nothing changed is worth knowing about: it means the round trip is working and
    // the two copies already agreed, which is the steady state.
    const gained =
      merged.proof.length !== local.proof.length ||
      Object.keys(merged.inventory).length !== Object.keys(local.inventory).length
    state = merged
    save()
    emit()
    if (gained) void syncSession('restore')
    return 'merged'
  } catch (e) {
    /*
      A refusal is not a failure, and telling them apart matters: one means the network is
      down and the local copy is fine, the other means this device belongs to somebody else
      and there is a decision to make.
    */
    if (e instanceof Error && /two people/.test(e.message)) return 'refused'
    // Offline, or no store configured. The local copy is untouched.
    return 'failed'
  }
}

/** One more cold prompt answered. Union, like everything else that only ever grows. */
export function rememberNoCue(id: string) {
  update((s) => {
    if (!s.nocue_done.includes(id)) s.nocue_done = [...s.nocue_done, id]
  })
}

/**
 * A Legend card, answered — or emptied.
 *
 * Emptying is a real action, not an oversight: some people have no children and some will
 * not say why they left. Clearing every slot removes the card from the record entirely,
 * so it drops out of the run-through without ever appearing as a gap to be filled.
 */
export function answerLegend(frameId: string, values: Record<string, string>) {
  update((s) => {
    const before = s.legend.find((a) => a.frame_id === frameId)
    const filled = Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim()))
    s.legend = [
      ...s.legend.filter((a) => a.frame_id !== frameId),
      {
        frame_id: frameId,
        values: filled,
        // Every write restamps, because the merge decides between two edits by which is
        // later. This is the field that makes clearing a card stick.
        at: new Date().toISOString(),
      },
    ]
  })
}

/** Shown once, ever. The earliest time is the true one, exactly like the Club welcome. */
export function markSwitchSeen() {
  update((s) => {
    s.switch_seen_at ??= new Date().toISOString()
  })
}

/** Taken up, or turned down. Turned down is a decision and it is respected forever. */
/**
 * The save offer has been answered. It never comes back.
 *
 * Only 'declined' is recordable: taking the offer means a sign-in, and a signed-in
 * learner's work is already off the device, so the condition that raises this stops being
 * true on its own. One state, one direction, nothing to get out of sync.
 */
export function setSaveDeclined() {
  update((s) => {
    s.save_prompt = 'declined'
  })
}

export function setLegendPrompt(value: 'accepted' | 'declined') {
  update((s) => {
    // Accepting is not reversible by a later decline elsewhere: somebody who has built a
    // card has answered the question, and re-offering would be the product forgetting.
    if (s.legend_prompt === 'accepted') return
    s.legend_prompt = value
  })
}


/** A daily line shown. Recorded wherever it was shown — the page or a notification. */
export function rememberLine(id: string) {
  update((s) => {
    if (!s.lines_seen.includes(id)) s.lines_seen = [...s.lines_seen, id]
  })
}

/** A section carried to the end. The thing that unlocks the Club. */
/** Toggle a save or a like. Returns the new state so the caller need not re-read. */
/** Been all the way through it. Idempotent, and it never comes back off. */
export function rememberFinishedCard(id: string) {
  update((s) => {
    if (!s.finished_cards.includes(id)) s.finished_cards = [...s.finished_cards, id]
  })
}

/**
 * A cheat-sheet member the learner got in the sheet's own test.
 *
 * For the members no root teaches, which the inventory has no key for — see `sheet_got`.
 * Append-only and de-duplicated, like every other record of something somebody did.
 */
export function rememberSheetGot(member: string) {
  update((s) => {
    if (!s.sheet_got.includes(member)) s.sheet_got = [...s.sheet_got, member]
  })
}

/**
 * Keep a sentence the translator gave back.
 *
 * De-duplicated on the Portuguese, because asking the same thing twice is the most likely
 * way this list gets used — you look something up on Tuesday, forget, and look it up again
 * on Friday. Keeping it once and leaving the first timestamp in place means the list stays
 * a record of what somebody needed rather than of how forgetful they are.
 */
/**
 * Why they are here, set once at the Club threshold and changeable from YOURS.
 *
 * Nothing is taken away when it changes. Somebody who arrives for a holiday and decides to
 * move has not un-learned the bus; they have gained the Junta. So this only ever changes
 * what is OFFERED — no card is retracted, no progress is reset, and the merge keeps the
 * most recent answer rather than the first, because this is the one field where the later
 * answer is the true one.
 */
export function setPurpose(purpose: 'visiting' | 'staying' | 'moving') {
  update((s) => {
    s.purpose = purpose
  })
}

export function setChapter(chapter: 'lisbon' | 'porto' | 'algarve') {
  update((s) => {
    s.chapter = chapter
  })
}

/**
 * Push a card to the back. Rejecting the same card twice moves it, it does not double it.
 *
 * Saved and rejected are opposites and a card cannot be both: rejecting something you
 * saved is you changing your mind, and the newer decision is the one that counts.
 */
export function rejectCard(id: string) {
  update((s) => {
    s.rejected = [...(s.rejected ?? []).filter((x) => x !== id), id]
    s.saved = (s.saved ?? []).filter((x) => x !== id)
  })
}

/**
 * Undo the last reject, and only the last.
 *
 * One step, deliberately. "Tap rewind if you want it back" is about the card that just
 * left the screen — a full history would be a second navigation model for a gesture whose
 * whole point is that it is cheap.
 */
export function rewindReject(): string | null {
  let back: string | null = null
  update((s) => {
    const list = [...(s.rejected ?? [])]
    back = list.pop() ?? null
    s.rejected = list
  })
  return back
}

/**
 * Hand over the one free room, if it has not been handed over already.
 *
 * Deliberately first-wins: whichever room somebody opened first is the one they keep. A
 * later call cannot move it, so browsing on cannot quietly take back the thing they were
 * given.
 */
export function tasteRoom(id: string) {
  update((s) => {
    if (!s.tasted) s.tasted = id
  })
}

export function keepAsk(ask: { pt: string; en: string; note: string }) {
  update((s) => {
    const already = (s.asked ?? []).some((a) => a.pt === ask.pt)
    if (already) return
    s.asked = [...(s.asked ?? []), { ...ask, at: new Date().toISOString() }]
  })
}

export function toggleCard(list: 'saved' | 'liked', id: string): boolean {
  let on = false
  update((s) => {
    const set = new Set(s[list])
    if (set.has(id)) set.delete(id)
    else set.add(id)
    on = set.has(id)
    s[list] = [...set]
  })
  return on
}

export function rememberSection(family: string) {
  update((s) => {
    if (!s.sections_completed.includes(family)) {
      s.sections_completed = [...s.sections_completed, family]
    }
    /*
      AND THE SITTING ITSELF, counted separately, because the two are not the same fact.

      `sections_completed` dedupes by vibe: four sittings of the basics leave one entry.
      That is the right shape for "which vibes has this person been inside", and it is the
      wrong shape for "how much work have they done" — and the Legend was asking it the
      second question.

      The gap is not small. The basics hold 16 roots and a sitting serves about four, so
      "basics + 3 vibes finished" costs roughly ELEVEN sittings. Sam did five, saw five
      SESSION DONE badges, and had finished nothing by that definition: "I've now done
      basics and 5 vibes ... why are we so disconnected here."

      So sittings are counted here, one per pass, and the door counts these. It is the
      same number the SESSION DONE badge is already claiming, which is the whole point —
      a learner should be able to add up what the product tells them and get the answer
      the product is using.
    */
    s.sittings = (s.sittings ?? 0) + 1
  })
}

/** The welcome fires once, ever, and the first time is the true time. */
export function welcomeToClub() {
  update((s) => {
    s.club_welcomed_at ??= new Date().toISOString()
  })
}
