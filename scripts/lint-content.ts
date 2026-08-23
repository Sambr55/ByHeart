/**
 * Content invariants across both missions.
 *
 * The lesson is data, so the data has to be checked like code. Several of these
 * checks exist specifically to keep the v0.2 falsification criteria measurable: a
 * crossover item that repeats a taught line, a reinforced block with no cold-recall
 * baseline, or a Bond reference surviving into culture_neutral would each quietly
 * turn a decision rule into decoration.
 *
 *   npm run lint:content
 */

import { MISSIONS, MISSION_ORDER } from '../content/missions'
import {
  BLOCK_ORDER,
  EXAMPLES,
  NOT_REINFORCED_IN_BOND,
  REINFORCED_IN_BOND,
  TARGETS,
} from '../content/targets'
import { AUDIO_MANIFEST, normalisePhrase, slugFor } from '../content/audio-manifest'
import { ANCHOR_CARDS, BLOCK_CARDS, COMBINATION_CARDS } from '../content/deck'
import { CULTURE_FREE_STAGES, isExercise, type BlockId, type Mission, type Screen } from '../content/types'

const errors: string[] = []
const warnings: string[] = []
const fail = (m: string) => errors.push(m)
const warn = (m: string) => warnings.push(m)

const asArray = <T>(v: T | T[] | undefined): T[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v]

/** Every Portuguese sentence a screen's correct answer produces. */
function sentencesOf(s: Screen): string[] {
  const fromTiles = (
    tiles: { id: string; text: string }[],
    answer: string[],
  ): string =>
    answer
      .map((id) => tiles.find((t) => t.id === id)!.text)
      .join(' ')
      .replace(/ \?$/, '?')
  switch (s.type) {
    case 'choice':
      return [s.options.find((o) => o.correct)!.pt]
    case 'tiles':
      return [fromTiles(s.tiles, s.answer)]
    case 'match':
      return s.pairs.map((p) => p.pt)
    case 'block-intro':
      return s.phrase ? [s.phrase.pt] : []
    case 'generativity':
      return s.lines.map((l) => l.pt)
    case 'composite':
      return s.parts
        .filter((p) => p.kind === 'tiles' || !p.english)
        .map((p) =>
          p.kind === 'tiles'
            ? fromTiles(p.tiles, p.answer)
            : p.options.find((o) => o.correct)!.pt,
        )
    default:
      return []
  }
}

const CULTURE_WORDS =
  /\b(top gun|maverick|goose|wingman|bond|007|james bond|spy|licence to kill)\b/i

// ---------------------------------------------------------------------------
for (const missionId of MISSION_ORDER) {
  const mission: Mission = MISSIONS[missionId]
  const M = mission.mission_id + ': '
  const ids = mission.screens.map((s) => s.id)
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupes.length) fail(M + 'duplicate screen ids: ' + dupes.join(', '))

  // --- blocks -------------------------------------------------------------
  const acquired = new Set<BlockId>()
  const bankedAt = new Map<BlockId, number>()
  mission.screens.forEach((s, i) => {
    for (const b of asArray(s.acquires)) {
      if (acquired.has(b)) fail(M + s.id + ' acquires ' + b + ', already banked')
      acquired.add(b)
      bankedAt.set(b, i)
    }
  })
  for (const b of mission.targets_new) {
    if (!acquired.has(b)) fail(M + 'declared new block never acquired: ' + b)
  }
  for (const b of acquired) {
    if (!mission.targets_new.includes(b)) {
      fail(M + b + ' is acquired but not declared in targets_new')
    }
  }

  // A reinforced block has to have been taught in an earlier mission, or the
  // "already yours" framing is a lie the learner will catch.
  const earlier = MISSION_ORDER.slice(0, MISSION_ORDER.indexOf(missionId))
  const priorBlocks = new Set(earlier.flatMap((m) => MISSIONS[m].targets_new))
  for (const b of mission.targets_reinforced) {
    if (!priorBlocks.has(b)) {
      fail(M + 'reinforces ' + b + ', which no earlier mission teaches')
    }
  }
  const reinforcedOnScreens = new Set(
    mission.screens.flatMap((s) => asArray(s.reinforces)),
  )
  for (const b of mission.targets_reinforced) {
    if (!reinforcedOnScreens.has(b)) {
      fail(M + b + ' is declared reinforced but no screen reinforces it')
    }
  }

  // --- exercises are answerable -------------------------------------------
  for (const s of mission.screens) {
    if (s.type === 'choice' || s.type === 'meaning-check') {
      const right = s.options.filter((o) => o.correct)
      if (right.length !== 1) fail(M + s.id + ' has ' + right.length + ' correct options')
    }
    if (s.type === 'tiles') {
      const tileIds = new Set(s.tiles.map((t) => t.id))
      for (const a of s.answer) {
        if (!tileIds.has(a)) fail(M + s.id + ' answer references missing tile "' + a + '"')
      }
      for (const t of s.tiles) {
        if (!s.answer.includes(t.id) && !t.distractor) {
          fail(M + s.id + ' tile "' + t.id + '" is unused but not a distractor')
        }
      }
      for (const r of s.rules ?? []) {
        if (r.when === 'uses' && !tileIds.has(r.tile)) {
          fail(M + s.id + ' rule targets missing tile "' + r.tile + '"')
        }
        if (r.when === 'omits' && !s.answer.includes(r.tile)) {
          fail(M + s.id + ' "omits" rule names "' + r.tile + '", not in the answer')
        }
        if (r.when === 'not-first' && s.answer[0] !== r.tile) {
          fail(M + s.id + ' "not-first" rule names "' + r.tile + '", not the opening tile')
        }
      }
      if (!s.rules?.length && !s.hint1) {
        warn(M + s.id + ' has no diagnostic rule and no hint1')
      }
    }
    if (s.type === 'composite') {
      if (s.parts.length < 2) fail(M + s.id + ' is a composite with fewer than two parts')
      const partIds = s.parts.map((p) => p.id)
      if (new Set(partIds).size !== partIds.length) {
        fail(M + s.id + ' has duplicate part ids')
      }
      for (const p of s.parts) {
        if (p.kind === 'tiles') {
          const tileIds = new Set(p.tiles.map((t) => t.id))
          for (const a of p.answer) {
            if (!tileIds.has(a)) {
              fail(M + s.id + '/' + p.id + ' answer references missing tile "' + a + '"')
            }
          }
          for (const t of p.tiles) {
            if (!p.answer.includes(t.id) && !t.distractor) {
              fail(M + s.id + '/' + p.id + ' tile "' + t.id + '" unused, not a distractor')
            }
          }
        } else if (p.options.filter((o) => o.correct).length !== 1) {
          fail(M + s.id + '/' + p.id + ' does not have exactly one correct option')
        }
      }
    }
    if (s.type === 'recall-burst') {
      for (const c of s.cards) {
        if (!c.options.includes(c.answer)) {
          fail(M + s.id + ' card "' + c.cue + '" does not offer its own answer')
        }
        if (new Set(c.options).size !== c.options.length) {
          fail(M + s.id + ' card "' + c.cue + '" repeats an option')
        }
      }
    }
    if (isExercise(s) && s.type !== 'recall-burst' && !s.reveal) {
      warn(M + s.id + ' resolves with no reveal copy')
    }
  }

  // --- no cultural cue on a screen whose result is counted -----------------
  // This is the invariant that protects H1 and H5: a measured retrieval must not be
  // primed, and "no Maverick" primes just as effectively as "Maverick".
  const measured = new Set([
    ...mission.transfer_items,
    ...(mission.crossover_items ?? []),
    ...(mission.cold_recall_items ?? []),
  ])
  for (const s of mission.screens) {
    const copy = [s.eyebrow, s.headline, s.sub, s.context, s.note].join(' ')
    if (measured.has(s.id)) {
      if (s.hook) fail(M + s.id + ' shows a cultural hook on a measured screen')
      if (CULTURE_WORDS.test(copy)) {
        fail(M + s.id + ' names a cultural property on a measured screen')
      }
    } else if (CULTURE_FREE_STAGES.has(s.stage) && s.hook) {
      fail(M + s.id + ' shows a cultural hook inside a culture-free stage')
    }
  }

  // --- control variant -----------------------------------------------------
  // culture_neutral must reach the same Portuguese by a different door. Any screen
  // carrying a cultural cue therefore needs a neutral replacement, or the control
  // arm silently leaks the very thing it is controlling for.
  for (const s of mission.screens) {
    if (CULTURE_FREE_STAGES.has(s.stage)) continue
    const cue = [s.hook, s.eyebrow, s.headline, s.sub, s.context].join(' ')
    const carriesCulture = Boolean(s.hook) || CULTURE_WORDS.test(cue)
    if (
      carriesCulture &&
      !s.neutral &&
      !s.skipInNeutral &&
      mission.mission_id === 'mission_02'
    ) {
      fail(
        M + s.id + ' carries a cultural cue with no culture_neutral replacement or skip',
      )
    }
    if (s.neutral) {
      const neutralCopy = Object.values(s.neutral).filter(Boolean).join(' ')
      if (CULTURE_WORDS.test(neutralCopy)) {
        fail(M + s.id + ' culture_neutral copy still names a cultural property')
      }
    }
  }

  // --- transfer / crossover ------------------------------------------------
  for (const id of [
    ...mission.transfer_items,
    ...(mission.crossover_items ?? []),
    ...(mission.cold_recall_items ?? []),
  ]) {
    if (!mission.screens.some((s) => s.id === id)) {
      fail(M + 'metric references ' + id + ', which is not a screen')
    }
  }

  /**
   * The crossover is the headline proof point: build language neither world taught
   * as a line. A crossover answer that repeats an earlier sentence lets short-term
   * recall satisfy a metric that is supposed to measure construction.
   */
  if (mission.crossover_items?.length) {
    const crossoverStart = mission.screens.findIndex(
      (s) => s.id === mission.crossover_items![0],
    )
    const taught = new Set(
      mission.screens
        .slice(0, crossoverStart)
        .flatMap(sentencesOf)
        .map(normalisePhrase),
    )
    const singleBlock = new Set(
      BLOCK_ORDER.flatMap((b) => [
        normalisePhrase(TARGETS[b].block),
        ...TARGETS[b].generativity
          .filter((g) => g.split(' ').length === 1)
          .map(normalisePhrase),
      ]),
    )
    for (const id of mission.crossover_items) {
      const screen = mission.screens.find((s) => s.id === id)!
      for (const sentence of sentencesOf(screen)) {
        const key = normalisePhrase(sentence)
        if (singleBlock.has(key)) continue
        if (taught.has(key)) {
          fail(
            M + id + ' repeats "' + sentence + '", already taught as a line in this mission',
          )
        }
      }
    }
  }

  /**
   * Reinforcement gain is defined as the change against a cold-recall baseline, and
   * it is only interpretable next to blocks that were deliberately left alone.
   */
  if (mission.cold_recall_items?.length) {
    const coldTargets = new Map(
      mission.cold_recall_items.map((id) => {
        const s = mission.screens.find((x) => x.id === id)!
        return [s.type === 'meaning-check' ? s.target : ('' as BlockId), s]
      }),
    )
    for (const b of mission.targets_reinforced) {
      if (!coldTargets.has(b)) {
        fail(M + b + ' is reinforced but has no cold-recall baseline (H3 unmeasurable)')
      }
    }
    const controls = mission.cold_recall_items
      .map((id) => mission.screens.find((s) => s.id === id)!)
      .filter((s) => s.type === 'meaning-check' && s.role === 'control')
    if (!controls.length) {
      fail(M + 'cold recall has no control block, so reinforcement has nothing to beat')
    }
    for (const s of mission.screens) {
      if (s.type !== 'meaning-check' || s.role !== 'control') continue
      if (!NOT_REINFORCED_IN_BOND.includes(s.target)) {
        fail(M + s.id + ' is tagged control but ' + s.target + ' is reinforced later')
      }
    }
  }
}

// --- cross-mission ---------------------------------------------------------
const allBlocks = new Set(MISSION_ORDER.flatMap((m) => MISSIONS[m].targets_new))
for (const b of BLOCK_ORDER) {
  if (!allBlocks.has(b)) fail('Block ' + b + ' is in BLOCK_ORDER but no mission teaches it')
}
for (const b of REINFORCED_IN_BOND) {
  if (!MISSIONS.mission_02.targets_reinforced.includes(b)) {
    fail('REINFORCED_IN_BOND lists ' + b + ' but Mission 02 does not reinforce it')
  }
}
for (const b of NOT_REINFORCED_IN_BOND) {
  if (MISSIONS.mission_02.targets_reinforced.includes(b)) {
    fail('NOT_REINFORCED_IN_BOND lists ' + b + ' but Mission 02 reinforces it')
  }
}

// --- deck ------------------------------------------------------------------
for (const b of BLOCK_ORDER) {
  if (!BLOCK_CARDS[b]) fail('No deck card for block ' + b)
}
for (const card of [...ANCHOR_CARDS, ...COMBINATION_CARDS, ...Object.values(BLOCK_CARDS)]) {
  if (!card.block_ids.length) fail('Deck card ' + card.card_id + ' references no block')
  for (const b of card.block_ids) {
    if (!TARGETS[b]) fail('Deck card ' + card.card_id + ' references unknown block ' + b)
  }
  // The front is the cue, so it must not leak any word from its own answer.
  const answerWords = new Set(
    card.reveal.flatMap((r) => normalisePhrase(r.pt).split(/[^\p{L}]+/u)).filter(Boolean),
  )
  const frontWords = normalisePhrase(card.front).split(/[^\p{L}]+/u).filter(Boolean)
  const leaked = frontWords.filter((w) => answerWords.has(w) && w.length > 2)
  if (leaked.length) {
    fail('Deck card ' + card.card_id + ' front leaks its answer: ' + leaked.join(', '))
  }
}

// --- audio -----------------------------------------------------------------
const slugs = new Set(AUDIO_MANIFEST.map((a) => a.slug))
const byText = new Map<string, string>()
for (const a of AUDIO_MANIFEST) {
  const key = normalisePhrase(a.text)
  const seen = byText.get(key)
  if (seen && seen !== a.slug) {
    fail('Phrase "' + a.text + '" resolves to two slugs: ' + seen + ' and ' + a.slug)
  }
  byText.set(key, a.slug)
}
const spoken = new Set<string>()
for (const m of MISSION_ORDER) {
  for (const s of MISSIONS[m].screens) sentencesOf(s).forEach((x) => spoken.add(x))
}
for (const card of [...ANCHOR_CARDS, ...COMBINATION_CARDS, ...Object.values(BLOCK_CARDS)]) {
  card.reveal.forEach((r) => spoken.add(r.pt))
}
for (const phrase of spoken) {
  if (!slugs.has(slugFor(phrase))) {
    fail('No audio asset queued for spoken phrase "' + phrase + '"')
  }
}
for (const e of EXAMPLES) {
  if (!TARGETS[e.target_id]) fail('Example ' + e.example_id + ' has an unknown target')
}

// --- report ----------------------------------------------------------------
const screenCount = MISSION_ORDER.reduce((n, m) => n + MISSIONS[m].screens.length, 0)
console.log(
  MISSION_ORDER.length +
    ' missions · ' +
    screenCount +
    ' screens · ' +
    BLOCK_ORDER.length +
    ' blocks · ' +
    slugs.size +
    ' audio assets',
)
warnings.forEach((w) => console.log('  warn  ' + w))
errors.forEach((e) => console.log('  FAIL  ' + e))
console.log(errors.length ? '\n' + errors.length + ' error(s)' : '\nno errors')
process.exit(errors.length ? 1 : 0)
