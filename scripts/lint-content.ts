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
import {
  COLLISIONS,
  CRATES,
  PIECES,
  ROOTS,
  ROOTS_BY_FAMILY,
  RUNGS,
  SHELVES,
  branchShows,
} from '../content/roots'
import { INSIGHTS } from '../content/osmosis'
import { GOAL_NEEDS, QUESTIONS_IN_ORDER } from '../content/profile'
import { branchesFor, buildTargetFor } from '../engine/journey'
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
      if (s.source) {
        fail(M + s.id + ' carries a source moment on a measured screen')
      }
      if (CULTURE_WORDS.test(copy)) {
        fail(M + s.id + ' names a cultural property on a measured screen')
      }
    } else if (CULTURE_FREE_STAGES.has(s.stage) && s.source) {
      fail(M + s.id + ' carries a source moment inside a culture-free stage')
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
    // `source` is not listed here: useCopy strips it unconditionally in the control
    // arm, so unlike free copy it cannot leak by omission. What still needs an
    // explicit neutral is anything written into the screen's own words.
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



// ---------------------------------------------------------------------------
// v0.6 root graph — §05, §10, §B10
// ---------------------------------------------------------------------------
{

  for (const root of ROOTS) {
    const R = 'root ' + root.root_id + ': '
    // The bridge is what stops the product jumping from a famous name to merely
    // adjacent vocabulary. A root without one is not shippable (§10).
    if (!root.semantic_bridge.trim()) fail(R + 'has no semantic bridge')
    if (root.semantic_bridge.trim().length < 40) {
      warn(R + 'semantic bridge is very short — check it actually explains the crossing')
    }
    if (!root.subtext.trim()) fail(R + 'has no subtext (§07.2 requires how it feels in use)')
    if (!root.extracts.length || root.extracts.length > 3) {
      fail(R + 'has ' + root.extracts.length + ' extracts; the spec allows 1–3')
    }
    if (root.branches.length < 3) {
      fail(R + 'branches into ' + root.branches.length + '; §05 requires at least 3')
    }
    if (!root.transfer_prompt?.answer) fail(R + 'has no culture-free release')
    if (root.transfer_prompt?.answer === root.target) {
      fail(R + 'release repeats the root line, so it proves nothing')
    }
    // Nor may it repeat the build. Being asked to assemble the same sentence twice
    // running reads as a fault, and proves recall of the last screen rather than
    // transfer. buildTargetFor avoids it wherever a root has another usable branch;
    // this catches the roots where it cannot.
    const bt = buildTargetFor(root)
    if (!root.freebie_flag && bt && bt.target === root.transfer_prompt?.answer) {
      fail(R + 'build and release are both "' + bt.target + '"; give it another branch')
    }
    for (const p of root.reinforces) {
      if (!PIECES[p]) fail(R + 'claims to reinforce "' + p + '", which no root teaches')
    }
    // Every word the learner is asked to place must be one they were taught or one
    // they were shown. A build is a word-order task; making it a vocabulary ambush is
    // the fastest way to lose someone (§06).
    const target = buildTargetFor(root)
    if (target) {
      const taught = new Set(
        [...root.extracts.map((e) => e.target), ...Object.keys(PIECES).map((k) => PIECES[k].target)]
          .flatMap((s) => s.replace(/[…?.,!;:]/g, '').toLowerCase().split(' '))
          .filter(Boolean),
      )
      const glossed = new Set(
        Object.keys(root.helpers ?? {}).map((w) => w.replace(/[…?.,!;:]/g, '').toLowerCase()),
      )
      for (const word of target.target.replace(/[.?,!;:…]/g, '').split(' ')) {
        const w = word.toLowerCase()
        if (!w || taught.has(w) || glossed.has(w)) continue
        if (/^[A-Z]/.test(word)) continue // a name
        fail(R + 'build "' + target.target + '" uses untaught, unglossed word "' + word + '"')
      }
    }

    // Each extract has to actually demonstrate itself, or unpacking it teaches nothing.
    if (root.extracts.length > 1) {
      for (const e of root.extracts) {
        if (!branchesFor(root, e.id).length) {
          warn(R + 'extract "' + e.target + '" has no branch of its own to unpack')
        }
      }
    }

    // §14: extract from pieces genuinely contained in, or immediately implied by, the
    // natural Portuguese — not from anything that happens to be useful.
    const line = root.target.toLowerCase()
    for (const e of root.extracts) {
      const stem = e.target.replace(/[…?]/g, '').trim().toLowerCase().split(' ')[0]
      if (stem.length > 2 && !line.includes(stem)) {
        warn(R + 'extract "' + e.target + '" is not visible in "' + root.target + '"')
      }
    }
  }

  for (const family of CRATES) {
    const roots = ROOTS_BY_FAMILY[family.id] ?? []
    const freebies = roots.filter((r) => r.freebie_flag)
    // §B10 — maximum one freebie per cultural family per session.
    if (freebies.length > 1) {
      fail('crate ' + family.id + ' has ' + freebies.length + ' freebies; the cap is one')
    }
    const strong = roots.filter((r) => !r.freebie_flag)
    if (strong.length < 4) {
      fail(
        'crate ' + family.id + ' has ' + strong.length +
          ' strong roots; §17.4 requires at least 4',
      )
    }
  }

  // §11 — a collision must genuinely span two cultural worlds, or it is just revision.
  for (const c of COLLISIONS) {
    const families = new Set(c.requires.map((p) => PIECES[p]?.family).filter(Boolean))
    for (const p of c.requires) {
      if (!PIECES[p]) fail('collision ' + c.id + ' needs "' + p + '", which no root teaches')
    }
    if (families.size < 2) {
      fail('collision ' + c.id + ' draws on ' + families.size + ' family; §11 requires two')
    }
    if (!c.provenance.trim()) warn('collision ' + c.id + ' surfaces no provenance after success')
  }

  /**
   * A learner who takes two areas must find something that collides. Otherwise the
   * compounding claim — the reason the six families exist at all — is never once shown
   * to the person we are asking about it.
   */
  const inCollisions: Record<string, number> = {}
  for (const c of COLLISIONS) {
    for (const f of new Set(c.requires.map((p) => PIECES[p]?.family).filter(Boolean))) {
      inCollisions[f as string] = (inCollisions[f as string] ?? 0) + 1
    }
  }
  for (const f of CRATES) {
    const n = inCollisions[f.id] ?? 0
    if (n === 0) fail('crate ' + f.id + ' appears in no collision at all')
    else if (n < 2) warn('crate ' + f.id + ' appears in only one collision')
  }
  const pairs: string[] = []
  for (let i = 0; i < CRATES.length; i++) {
    for (let j = i + 1; j < CRATES.length; j++) {
      const a = CRATES[i].id
      const b = CRATES[j].id
      const covered = COLLISIONS.some((c) => {
        const fams = new Set(c.requires.map((p) => PIECES[p]?.family))
        return fams.has(a) && fams.has(b)
      })
      if (!covered) pairs.push(a + '+' + b)
    }
  }
  const totalPairs = (CRATES.length * (CRATES.length - 1)) / 2
  if (pairs.length) {
    warn(
      pairs.length + ' of ' + totalPairs + ' crate pairs have no collision: ' + pairs.slice(0, 6).join(', ') +
        (pairs.length > 6 ? '…' : ''),
    )
  }

  console.log(
    ROOTS.length + ' roots · ' + CRATES.length + ' crates · ' +
      Object.keys(PIECES).length + ' pieces · ' + COLLISIONS.length + ' collisions · ' +
      (totalPairs - pairs.length) + '/' + totalPairs + ' crate pairs collide',
  )
}



// ---------------------------------------------------------------------------
// The ladder — a rung is a promise that nothing above it is needed yet
// ---------------------------------------------------------------------------
{
  const byRung = new Map<number, typeof ROOTS>()
  for (const r of ROOTS) byRung.set(r.rung, [...(byRung.get(r.rung) ?? []), r])

  for (const root of ROOTS) {
    const R = 'root ' + root.root_id + ' (rung ' + root.rung + '): '
    // Reinforcement is opportunistic — it is filtered by what the learner actually
    // owns before it is ever shown, so reaching up costs nothing at runtime. It is
    // still worth reporting: a root that mostly nods at pieces above its own rung is
    // usually a root that has been tagged too low.
    const reaching = root.reinforces.filter((p) => (PIECES[p]?.rung ?? 0) > root.rung)
    if (reaching.length && reaching.length === root.reinforces.length && reaching.length > 1) {
      warn(R + 'every piece it reinforces sits above it (' + reaching.join(', ') + ') — check the rung')
    }
    // Same rule for the build: the words it asks the learner to place must be ones
    // this rung can honestly assume.
    const target = root.freebie_flag ? null : buildTargetFor(root)
    if (target) {
      const ownWords = new Set(
        root.extracts.flatMap((e) => e.target.replace(/[…?.,!;:]/g, '').toLowerCase().split(' ')),
      )
      const glossed = new Set(
        Object.keys(root.helpers ?? {}).map((w) => w.replace(/[…?.,!;:]/g, '').toLowerCase()),
      )
      const belowOrAt = new Set(
        Object.values(PIECES)
          .filter((pc) => pc.rung <= root.rung)
          .flatMap((pc) => pc.target.replace(/[…?.,!;:]/g, '').toLowerCase().split(' ')),
      )
      for (const word of target.target.replace(/[.?,!;:…]/g, '').split(' ')) {
        const w = word.toLowerCase()
        if (!w || ownWords.has(w) || glossed.has(w) || belowOrAt.has(w)) continue
        if (/^[A-Z]/.test(word)) continue
        warn(R + 'build "' + target.target + '" uses "' + word + '", which no rung ≤ ' + root.rung + ' teaches')
      }
    }
  }

  // A crate a beginner cannot enter will sit dimmed forever — unless it says so.
  for (const c of CRATES) {
    const rs = ROOTS_BY_FAMILY[c.id] ?? []
    const lowest = Math.min(...rs.map((r) => r.rung))
    if (!c.opens_at && lowest > 2) {
      warn(
        'crate ' + c.id + ' starts at rung ' + lowest +
          ' — nothing in it can open early, and it does not declare opens_at',
      )
    }
    // The other way round: a crate that promises to open late and then does not.
    if (c.opens_at && lowest > c.opens_at) {
      warn('crate ' + c.id + ' declares opens_at ' + c.opens_at + ' but its lowest root is rung ' + lowest)
    }
  }

  // Coverage, and this one is a gate rather than a note.
  //
  // A rung that lives in a single crate is not a rung, it is a quirk of that crate —
  // a learner who picked a different world would climb past it without ever meeting
  // it, and the rung above would then be standing on nothing. Three crates is the
  // minimum that makes a rung true regardless of which door somebody came in through.
  const thin: string[] = []
  for (const { rung, name } of RUNGS) {
    const rs = byRung.get(rung) ?? []
    const crates = new Set(rs.map((r) => r.culture_family))
    if (rs.length === 0) fail('rung ' + rung + ' (' + name + ') has no roots at all')
    else if (crates.size < 3) {
      thin.push(rung + '/' + name)
      fail(
        'rung ' + rung + ' (' + name + ') lives in ' + crates.size +
          ' crate' + (crates.size === 1 ? '' : 's') + '; three is the minimum for it to be reachable',
      )
    }
  }

  console.log(
    'ladder: ' +
      RUNGS.map(({ rung }) => rung + '×' + (byRung.get(rung) ?? []).length).join(' · ') +
      ' · ' + thin.length + ' of 6 rungs still thin',
  )
}

// ---------------------------------------------------------------------------
// The library — a shelf is a promise about where a word can be found
// ---------------------------------------------------------------------------
{
  // `shelf` is required by the type, so its absence cannot reach here. What the type
  // cannot say is whether the authored value is coherent, which is all of the below.
  const byShelf = new Map<string, string[]>()
  const byLemma = new Map<string, string[]>()
  const bySurface = new Map<string, string[]>()

  for (const [id, piece] of Object.entries(PIECES)) {
    const P = 'piece ' + id + ': '
    byShelf.set(piece.shelf, [...(byShelf.get(piece.shelf) ?? []), id])
    if (piece.lemma) byLemma.set(piece.lemma, [...(byLemma.get(piece.lemma) ?? []), id])

    // A noun without its gender is a word you can recognise, not one you can use. You
    // cannot order "um copo de vinho" from a card that says copo = glass.
    if (piece.shelf === 'things' && !piece.gender) {
      fail(P + 'is on the THINGS shelf with no gender, so it cannot be said')
    }
    if (piece.gender && piece.shelf !== 'things') {
      warn(P + 'carries a gender but is not on THINGS')
    }

    // The gloss says what it means and nothing else. Anything that would follow a dash
    // or a bracket is a usage note and belongs in `note`, which is most of why the
    // right-hand column used to read inconsistently.
    if (/[—–]|\(|\sand\s/.test(piece.gloss)) {
      fail(P + 'gloss "' + piece.gloss + '" is carrying a usage note; move it to note')
    }

    // A form with nothing to be a form OF is an orphan, and would render as a lemma
    // card of one.
    if (piece.form && !piece.lemma) {
      fail(P + 'declares the form "' + piece.form + '" but names no lemma')
    }

    const key = normalisePhrase(piece.target).toLowerCase()
    bySurface.set(key, [...(bySurface.get(key) ?? []), id])
  }

  // The same word filed twice as two unrelated entries — the visible duplicate.
  for (const [surface, ids] of bySurface) {
    if (ids.length < 2) continue
    const lemmas = new Set(ids.map((id) => PIECES[id].lemma ?? id))
    if (lemmas.size > 1) {
      fail('"' + surface + '" is filed as ' + ids.length + ' unrelated pieces (' + ids.join(', ') + ')')
    }
  }

  // Lemma names that differ only by accent or case are a typo, not two words.
  const folded = new Map<string, string[]>()
  for (const lemma of byLemma.keys()) {
    const k = lemma.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    folded.set(k, [...(folded.get(k) ?? []), lemma])
  }
  for (const [, names] of folded) {
    if (names.length > 1) fail('lemmas differ only by accent or case: ' + names.join(' / '))
  }

  // A branch that demonstrates nothing is a sentence with no job.
  for (const root of ROOTS) {
    const own = root.extracts.map((e) => e.id)
    for (const b of root.branches) {
      // The spec's wording is "at least one piece taught by its own root". Held to the
      // letter that rejects eight branches whose job is to reinforce a word from
      // another crate — which is the compounding thesis, not a sentence with no job.
      // So: nothing at all is a failure; only-other-crates is worth knowing about,
      // because it often means the root's own extracts were badly chosen.
      const showsOwn = own.some((id) => branchShows(b, id))
      const showsAny = showsOwn || (b.demonstrates ?? []).some((id) => PIECES[id])
      if (!showsAny) {
        fail(
          'root ' + root.root_id + ': branch "' + b.target +
            '" demonstrates nothing; declare demonstrates or rewrite it',
        )
      } else if (!showsOwn) {
        warn(
          'root ' + root.root_id + ': branch "' + b.target +
            '" only reinforces other crates — check its own extracts',
        )
      }
      for (const declared of b.demonstrates ?? []) {
        if (!PIECES[declared]) {
          fail('root ' + root.root_id + ': branch "' + b.target + '" declares "' + declared + '", which no root teaches')
        }
      }
    }
  }

  for (const shelf of SHELVES) {
    const n = (byShelf.get(shelf.id) ?? []).length
    if (n < 5) warn('shelf ' + shelf.label + ' holds only ' + n + ' — thin enough to look broken')
  }
  for (const [lemma, ids] of byLemma) {
    if (ids.length === 1) {
      warn('lemma ' + lemma + ' has one form (' + ids[0] + ') — usually a missing conjugation')
    }
  }

  console.log(
    'library: ' + SHELVES.map((sh) => sh.label.toLowerCase() + ' ' + (byShelf.get(sh.id) ?? []).length).join(' · ') +
      ' · ' + byLemma.size + ' lemmas',
  )
}

// ---------------------------------------------------------------------------
// Osmosis interstitials — the claims made about what a learner absorbed
// ---------------------------------------------------------------------------
{
  const all = ROOTS.flatMap((r) => [
    r.target,
    r.transfer_prompt.answer,
    ...r.branches.map((b) => b.target),
    ...r.extracts.map((e) => e.target),
    ...(r.voice_options ?? []).map((v) => v.target),
  ])
    .join(' | ')
    .toLowerCase()

  for (const i of INSIGHTS) {
    const I = 'insight ' + i.id + ': '
    for (const p of i.requires) {
      if (!PIECES[p]) fail(I + 'requires "' + p + '", which no root teaches')
    }
    if (!i.requires.length) fail(I + 'fires for everyone, so it is not about their session')
    // Evidence must be something they actually saw. Quoting an invented example turns
    // "look what you did" into a lie the attentive ones will catch.
    for (const e of i.evidence) {
      const needle = e.pt.replace(/[.?!]$/, '').toLowerCase()
      if (!all.includes(needle)) {
        fail(I + 'quotes "' + e.pt + '", which appears in no root the learner could have seen')
      }
    }
    if (/conjugat|reflexiv|preterite|imperative|periphrast|enclitic|demonstrativ/i.test(i.headline)) {
      fail(I + 'headline uses grammar jargon; it belongs in proper_name, not the headline')
    }
  }

  // A section that ends with nothing to say about itself is a wasted screen.
  for (const family of CRATES) {
    const owned = new Set(
      (ROOTS_BY_FAMILY[family.id] ?? []).flatMap((r) => r.extracts.map((e) => e.id)),
    )
    const fires = INSIGHTS.filter((i) => i.requires.every((p) => owned.has(p)))
    if (!fires.length) {
      fail('crate ' + family.id + ' can finish a section with no osmosis insight to show')
    }
  }
  console.log(INSIGHTS.length + ' osmosis insights, every crate covered')
}



// ---------------------------------------------------------------------------
// Profile payoffs — every promise must be one the graph can keep
// ---------------------------------------------------------------------------
{
  for (const [goal, needs] of Object.entries(GOAL_NEEDS)) {
    for (const n of needs) {
      for (const piece of n.pieces) {
        if (!PIECES[piece]) {
          fail(
            'goal "' + goal + '" promises "' + n.label + '" via "' + piece +
              '", which no root teaches',
          )
        }
      }
    }
    if (goal !== 'curious' && needs.length < 4) {
      warn('goal "' + goal + '" lists only ' + needs.length + ' things to work towards')
    }
  }
  // A question is only worth asking if its answer changes something on the spot.
  for (const q of QUESTIONS_IN_ORDER) {
    if (!q.why.trim()) fail('profile question ' + q.id + ' does not say why it is being asked')
    if (!q.skip.trim()) fail('profile question ' + q.id + ' cannot be skipped')
  }
  console.log(
    QUESTIONS_IN_ORDER.length + ' profile questions, all skippable, all payoffs deliverable',
  )
}


// ---------------------------------------------------------------------------
// Voice pairs — a choice screen that does not say WHEN is just a poll (§12)
// ---------------------------------------------------------------------------
{
  let pairs = 0
  for (const r of ROOTS) {
    if (!r.voice_options?.length) continue
    pairs++
    if (!r.voice_rule) fail(r.root_id + ' offers a voice choice but teaches no rule from it')
    if (r.voice_options.filter((o) => o.safest).length > 1) {
      fail(r.root_id + ' marks more than one option as the safe one')
    }
    for (const o of r.voice_options) {
      if (!o.register?.trim()) fail(r.root_id + ' / ' + o.target + ' has no register chip')
      if (!o.when?.trim()) fail(r.root_id + ' / ' + o.target + ' does not say when to use it')
      if (o.safest && o.register && o.register.length > 22) {
        warn(r.root_id + ' / ' + o.target + ' chip is too long to sit beside the IF IN DOUBT badge')
      }
      if (o.register && o.register.length > 34) {
        warn(r.root_id + ' / ' + o.target + ' chip is ' + o.register.length + ' chars, it will wrap')
      }
      if (o.when && o.when.split(' ').length < 6) {
        warn(r.root_id + ' / ' + o.target + ' when-line is too thin to be useful')
      }
    }
  }
  console.log(pairs + ' voice pairs, every option situated, every pair teaching a rule')
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
