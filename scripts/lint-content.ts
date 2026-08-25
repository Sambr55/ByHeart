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

import { readFileSync } from 'node:fs'
import { MISSIONS, MISSION_ORDER } from '../content/missions'
import { DUB, DUB_CLUB, DUB_MARK } from '../content/marks'
import { LEGEND_FRAMES, REPAIR_KIT } from '../content/legend'
import {
  BLOCK_ORDER,
  EXAMPLES,
  NOT_REINFORCED_IN_BOND,
  REINFORCED_IN_BOND,
  TARGETS,
} from '../content/targets'
import { AUDIO_MANIFEST, normalisePhrase, slugFor } from '../content/audio-manifest'
import {
  COLLISIONS,
  CRATES,
  PIECES,
  ROOTS,
  ROOTS_BY_FAMILY,
  RUNGS,
  SETS,
  SHELVES,
  branchShows,
  fold,
  setPieces,
} from '../content/roots'
import { INSIGHTS } from '../content/osmosis'
import {
  AGE_QUESTION,
  GENDER_QUESTION,
  GOAL_NEEDS,
  GOAL_QUESTION,
  QUESTIONS_IN_ORDER,
} from '../content/profile'
import * as FRONT_DOOR_COPY from '../content/front-door'
import { LANDING } from '../content/front-door'
import * as PROFILE_COPY from '../content/profile'
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

/*
  The deck is gone, and so are the four routes that rendered it.

  /tg, /m2, /deck and /recall ran on the two-mission content model this product left
  behind. They had no way out — no menu, no back link — and /deck and /recall both still
  said "START MISSION 01" on a full-width button. Nineteen components and modules were
  reachable only from them.

  content/missions and content/targets stay, because the rules below still assert things
  worth asserting about the ten building blocks and the audio manifest is built from
  them. The UI that consumed them does not.
*/

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

    /*
      The first beat asks "do you recognise this?" and shows root_display and nothing
      else. That works for "Six Days, Seven Nights" and fails completely for "1, 2, 3, 4",
      which is four digits until somebody says Feist.

      source_label already knows the answer — it is two fields wearing one name, and the
      attribution half is written "Work — Artist". So when the work IS the thing on
      screen, the artist belongs in `credit` where it can actually be rendered. This
      keeps the two in step: add a song root and forget the credit, and the lint says so
      rather than the learner meeting a bare title.
    */
    const dash = root.source_label.split(' — ')
    if (dash.length === 2) {
      const [work, who] = dash
      const flat = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '')
      const worksOut = flat(work) === flat(root.root_display) || flat(root.root_display).includes(flat(work))
      if (worksOut && !root.credit) {
        warn(R + 'source_label credits "' + who + '" and nothing shows it — set credit')
      }
    }
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

  /*
    Drops, which had no rule at all.

    Adding one means editing a TypeScript union, the CRATES array, a new exported Root[],
    the family map and an SVG path table — and if any of the five is missed the tile
    renders nothing, silently, on the one kind of content that expires. This is the
    cheapest possible guard on the most fragile authoring path in the product.
  */
  for (const crate of CRATES.filter((c) => c.drop)) {
    const d = crate.drop!
    const D = 'drop ' + crate.id + ': '
    const iso = /^\d{4}-\d{2}-\d{2}$/
    if (!iso.test(d.on)) fail(D + '`on` is not an ISO date: ' + d.on)
    if (d.from && !iso.test(d.from)) fail(D + '`from` is not an ISO date: ' + d.from)
    if (d.from && d.from >= d.on) {
      fail(D + 'opens on or after the event it is about (' + d.from + ' → ' + d.on + ')')
    }
    if (!(ROOTS_BY_FAMILY[crate.id] ?? []).length) {
      fail(D + 'has no roots — the tile renders and the crate is empty')
    }
    // A drop expires. Gating it as well would mean it could be lost forever by somebody
    // being busy AND out of reach, which is the one combination this product refuses.
    if (crate.opens_at && crate.opens_at > 1) {
      fail(D + 'declares opens_at ' + crate.opens_at + ' — a drop is never stage-gated')
    }
    if (d.link && !/^https?:\/\//.test(d.link)) fail(D + 'link is not absolute: ' + d.link)
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

  /*
    Sets.

    A set is a promise that the group is closed and that you can see the whole of it —
    so the two ways it can lie are worth failing over: a set that is short without
    saying so, and a piece tagged into a set it does not appear in, which is a typo
    that renders as nothing at all and would never be noticed.
  */
  for (const set of SETS) {
    const S = 'set ' + set.id + ': '
    if (new Set(set.members.map(fold)).size !== set.members.length) {
      fail(S + 'lists the same member twice')
    }
    const covered = setPieces(set)
    if (covered.size < set.members.length && !set.partial) {
      fail(
        S + 'covers ' + covered.size + ' of ' + set.members.length +
          ' members. Either teach the rest or mark it partial — a set shown as closed ' +
          'when it is not is the thing this rule exists to stop.',
      )
    }
    if (covered.size === set.members.length && set.partial) {
      fail(S + 'is complete but still marked partial. Drop the flag.')
    }
    if (!SHELVES.some((sh) => sh.id === set.shelf)) fail(S + 'names no real shelf')
  }
  for (const [id, piece] of Object.entries(PIECES)) {
    if (!piece.set) continue
    const set = SETS.find((x) => x.id === piece.set)
    if (!set) {
      fail('piece ' + id + ' is tagged into the unknown set "' + piece.set + '"')
      continue
    }
    if (!set.members.some((m) => fold(m) === fold(piece.target))) {
      fail(
        'piece ' + id + ' ("' + piece.target + '") is tagged ' + set.id +
          ' but is not one of its members, so it would vanish from the group',
      )
    }
    if (piece.shelf !== set.shelf) {
      fail('piece ' + id + ' is tagged ' + set.id + ' but sits on the ' + piece.shelf + ' shelf')
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
// Shared copy may not name a medium
// ---------------------------------------------------------------------------
{
  /**
   * The product described itself as a film product because it WAS one, once — a single
   * Top Gun mission — and the copy never caught up. Exactly the same way the palette
   * did not. It will happen again unless something checks.
   *
   * The crates are films, titles, books, wisdom, swearing, flirting and a gig, and there
   * will be more. So: no copy outside a root's own fields may name a medium. Inside a
   * root it is legitimate and often the point — "o filme é uma merda" teaches the word
   * for film — which is why only the shared files are scanned.
   *
   * The replacement was never new copy. The proof card already said it well: "with
   * nothing on screen to copy from". Medium-agnostic, concrete, and already the
   * product's own voice.
   */
  const MEDIUM = /\b(films?|movies?|songs?|books?|quotes?|scenes?)\b/gi
  const SHARED: [string, Record<string, unknown>][] = [
    ['front-door', FRONT_DOOR_COPY as unknown as Record<string, unknown>],
    ['profile', PROFILE_COPY as unknown as Record<string, unknown>],
  ]

  /** Every string in a nested copy object, with a path to it. */
  function strings(value: unknown, path: string): [string, string][] {
    if (typeof value === 'string') return [[path, value]]
    if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, path + '[' + i + ']'))
    if (value && typeof value === 'object') {
      return Object.entries(value).flatMap(([k, v]) => strings(v, path ? path + '.' + k : k))
    }
    return []
  }

  // The landing list is a list of what a crate can be, not a narrowing to one of them.
  const ALLOWED = /films, music, books, TV, sport and culture/

  let named = 0
  for (const [file, obj] of SHARED) {
    for (const [path, text] of strings(obj, '')) {
      if (ALLOWED.test(text)) continue
      const hits = text.match(MEDIUM)
      if (!hits) continue
      named++
      fail(
        file + '.' + path + ' names a medium (' + [...new Set(hits)].join(', ') +
          '): "' + text.slice(0, 72) + '…" — say "with nothing on screen to copy from"',
      )
    }
  }
  console.log('shared copy names no medium (' + SHARED.length + ' files scanned)')
  if (named) console.log('  ' + named + ' line(s) to fix')
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

// --- the three profile questions -------------------------------------------
{
  /*
    These are the only screens in the product that ask the learner for something, so the
    bar on them is higher than anywhere else: an eyebrow that is a label, a headline that
    is unambiguous on its own, and no character attribution — a question asked by
    Maverick while somebody is inside Bridget Jones is incoherent whatever it says.
  */
  for (const q of [GENDER_QUESTION, AGE_QUESTION, GOAL_QUESTION]) {
    const Q = 'profile question ' + q.id + ': '
    if (q.eyebrow.length > 14) fail(Q + 'eyebrow is ' + q.eyebrow.length + ' chars (max 14)')
    if (q.eyebrow !== q.eyebrow.toUpperCase()) fail(Q + 'eyebrow is not a label')
    if (!q.headline.trim().endsWith('?')) fail(Q + 'headline is not a question')
    for (const o of q.options) {
      if (o.label !== o.label.toUpperCase()) fail(Q + 'option "' + o.label + '" is not a label')
    }
    if (!q.options.length) fail(Q + 'has nothing to answer with')
  }
  console.log('3 profile questions, asked by nobody in particular')
}

// --- the landing, which has a shape ----------------------------------------
{
  /*
    Four lines, and the Landing component gives each one a different size and weight.
    That is a design rather than a list, so the copy has to be written to it — and when
    the copy grew to six, indices 4 and 5 were written, reviewed and never rendered.

    Nothing about that was visible: no error, no warning, just two paragraphs that
    existed in the file and not on the screen.
  */
  if (LANDING.lines.length !== 4) {
    fail(
      'LANDING.lines has ' + LANDING.lines.length + ' entries and the front door renders ' +
        'exactly 4 — anything past the fourth is written and never shown',
    )
  }
  const beats = (LANDING.lines[2] ?? '').split('\n')
  if (beats.length !== 3) {
    fail('LANDING.lines[2] is the three-beat block and has ' + beats.length + ' beat(s)')
  }
  /*
    And no product words on the first screen a stranger sees. "You earn it a crate at a
    time" put jargon two beats before anything defines it, and it was read as "crate
    time". The deal introduces the word later, with an example attached.
  */
  for (const [i, line] of LANDING.lines.entries()) {
    const jargon = /\b(crates?|rungs?|drops?|pieces?)\b/i.exec(line)
    if (jargon) {
      fail(
        'LANDING.lines[' + i + '] says "' + jargon[0] + '" — the front door is the one ' +
          'screen where nothing has been defined yet',
      )
    }
  }
  console.log('the front door: 4 lines, 3 beats, no jargon')
}

// --- who the copy is talking to ---------------------------------------------
{
  /*
    A root speaks to the learner about Portuguese. Never about DUB.

    This shipped: "Sim and não were both missing from DUB entirely" — a note about the
    product's own content gaps, on a screen whose whole job is to explain a Portuguese
    sentence to somebody who has never heard of our content gaps. It is a note to the
    person building the product, left in the room with the person using it.

    It is an easy mistake to make while working from a review, which is exactly why it
    needs a grep. The learner does not know what a graph is, has not read the audit, and
    did not ask what used to be missing.
  */
  const INWARD = /\b(DUB|the product|the graph|this crate|the crate|the review|the audit|the app)\b/i
  let checked = 0
  for (const root of ROOTS) {
    const fields: [string, string][] = [
      ['semantic_bridge', root.semantic_bridge],
      ['subtext', root.subtext],
      ...root.extracts.map((e) => ['note on ' + e.id, e.note ?? ''] as [string, string]),
    ]
    for (const [field, text] of fields) {
      if (!text) continue
      checked++
      const hit = INWARD.exec(text)
      if (hit) {
        fail(
          'root ' + root.root_id + ' / ' + field + ' talks about "' + hit[0] +
            '" — this is read by a learner, and it should be about Portuguese: "' +
            text.slice(0, 60) + '…"',
        )
      }
    }
  }
  console.log(checked + ' root copy fields, all addressed to the learner')
}

// --- register ---------------------------------------------------------------
{
  /*
    Register is the one thing on the whole list that can make a courteous person sound
    rude, and it is the thing DUB asks about, justifies on screen, and used to ignore
    entirely. The graph is overwhelmingly tu — podes outnumbers pode heavily and o senhor
    does not occur once — so a learner told they would be taught the formal version was
    then taught the informal one for the rest of the product.

    AUTHORED, NEVER DERIVED. Two of the strings in the graph prove why: `desculpa` is a
    verb in "Desculpa o atraso" and a noun in "Peço desculpa", and only the second must
    be left alone; `és` is a verb on its own and three letters inside `Três`. A string
    transform gets both wrong, and getting this wrong is the exact failure the field
    exists to prevent.

    So the rule runs the other way round from most lints here. It does not try to decide
    which lines address somebody — it checks that where an author SAID a line does, the
    other register exists and is actually the other register.
  */

  /**
   * Verb forms and pronouns that are second-person-singular and nothing else.
   *
   * Deliberately excludes every ambiguous one: desculpa, olha, espera, vem, fica, diz,
   * repete and anda are all imperatives AND third-person indicatives, so requiring a
   * register on them would fail correct content. Unicode-aware boundaries rather than
   * \b, which is ASCII-only in JavaScript and finds "és" inside "Três".
   */
  const TU_ONLY = [
    'podes', 'tens', 'és', 'estás', 'queres', 'precisas', 'fazes', 'vais', 'sabes',
    'dizes', 'gostas', 'falas', 'chamas', 'percebes', 'dás', 'importas',
    'tu', 'teu', 'tua', 'teus', 'tuas', 'ti', 'contigo',
  ]
  const word = (w: string) => new RegExp('(?<![\\p{L}])' + w + '(?![\\p{L}])', 'iu')
  const hasTu = (line: string) => TU_ONLY.some((w) => word(w).test(line)) || /-te\b/.test(line)

  let registered = 0
  for (const root of ROOTS) {
    for (const b of root.branches) {
      const B = 'root ' + root.root_id + ' / "' + b.target + '": '

      if (b.address === 'tu') {
        registered++
        if (!b.formal) {
          fail(B + 'is addressed with tu and carries no formal version')
          continue
        }
        if (hasTu(b.formal)) {
          fail(B + 'formal version "' + b.formal + '" is still tu')
        }
        if (fold(b.formal) === fold(b.target)) {
          fail(B + 'formal version is identical to the informal one')
        }
      } else if (b.formal) {
        fail(B + 'carries a formal version but is not marked as addressed')
      } else if (hasTu(b.target)) {
        /*
          An unambiguous tu-form with no register declared. This is the half that catches
          new content: author a line with `podes` in it and the lint asks for the other
          version before it ships, which is the only way the promise on the age screen
          stays true.
        */
        fail(B + 'uses an unambiguous tu form and declares no register')
      }
    }
  }
  console.log(registered + ' branches carry both registers')
}

// --- the Legend ------------------------------------------------------------
{
  /*
    Frames are authored content and pass the same bar as everything else.

    Two rules matter. Every built_from must resolve to a real piece, because it is
    load-bearing three times over — the provenance line, the unlock thread, and the count
    on the Club — and a dangling id fails all three silently. And no frame may contain a
    Portuguese word the learner has not been taught and has not been glossed, because the
    whole promise of the Legend is that it is made of language they already own.
  */
  const seen = new Set<string>()
  const cards = new Set<number>()
  const taught = new Set(
    Object.values(PIECES).flatMap((p) => fold(p.target).split(/[^\p{L}]+/u)).filter(Boolean),
  )
  /*
    The closed-class words a sentence cannot be built without — articles, prepositions,
    the connective that. They are not vocabulary, they are grammar, and glossing "e" as
    "and" on every card would be noise. Everything else must be either taught or glossed
    on the card itself.
  */
  const GRAMMAR = new Set(
    ['e', 'o', 'a', 'os', 'as', 'na', 'no', 'em', 'com', 'que', 'me', 'se'].map(fold),
  )

  for (const f of LEGEND_FRAMES) {
    const F = 'legend frame ' + f.id + ': '
    if (seen.has(f.id)) fail(F + 'duplicate id')
    seen.add(f.id)
    if (cards.has(f.card)) fail(F + 'two frames claim card ' + f.card)
    cards.add(f.card)

    if (!f.built_from.length) fail(F + 'is built from nothing — it can never unlock')
    for (const id of f.built_from) {
      if (!PIECES[id]) fail(F + 'built_from names "' + id + '", which is not a piece')
    }
    // The rung a frame can first be reached at is the highest of its pieces. Declaring
    // it lower is a promise the graph cannot keep.
    const need = Math.max(...f.built_from.map((id) => PIECES[id]?.rung ?? 1))
    if (f.rung < need) {
      fail(F + 'declares rung ' + f.rung + ' but needs a rung ' + need + ' piece')
    }

    // Every slot the frame writes must exist, and every slot declared must be used.
    const used = [...f.frame.matchAll(/\{(\w+)\}/g)].map((m) => m[1])
    for (const key of used) {
      if (!f.slots.some((sl) => sl.key === key)) fail(F + 'writes {' + key + '} with no such slot')
    }
    for (const sl of f.slots) {
      if (!used.includes(sl.key)) fail(F + 'declares a slot "' + sl.key + '" it never writes')
      if (sl.kind === 'pick' && !sl.options?.length) fail(F + 'slot "' + sl.key + '" picks from nothing')
      if (sl.gendered && sl.options?.some((o) => !o.f)) {
        fail(F + 'slot "' + sl.key + '" is gendered but an option has no feminine form')
      }
    }

    // And the Portuguese itself.
    const glossed = new Set(
      Object.keys(f.helpers ?? {}).flatMap((k) => fold(k).split(/[^\p{L}]+/u)).filter(Boolean),
    )
    const words = fold(f.frame.replace(/\{\w+\}/g, ' ')).split(/[^\p{L}]+/u).filter(Boolean)
    for (const w of words) {
      if (taught.has(w) || GRAMMAR.has(w) || glossed.has(w)) continue
      fail(F + 'uses "' + w + '", which no piece teaches and the card does not gloss')
    }
    for (const k of Object.keys(f.helpers ?? {})) {
      if (!fold(f.frame).includes(fold(k))) fail(F + 'glosses "' + k + '", which is not in the frame')
    }
  }

  for (const r of REPAIR_KIT) {
    for (const id of r.built_from) {
      if (!PIECES[id]) fail('repair kit "' + r.pt + '" names piece "' + id + '", which does not exist')
    }
  }

  /*
    And the promise in §0.1: the landing page says you will build a Legend, so the first
    session has to be able to deliver one. A frame reachable at rung 1 is the proof.
  */
  const atOne = LEGEND_FRAMES.filter((f) => f.rung === 1)
  if (atOne.length < 2) {
    fail(
      'only ' + atOne.length + ' Legend frame(s) reachable at rung 1 — the landing promises ' +
        'a Legend in the first session and the content cannot deliver it',
    )
  }
  /*
    The compounding claim, on the learner's own material.

    A Legend that draws on one crate is a vocabulary list with a nice frame round it. The
    whole argument for building this INSIDE DUB rather than as some other app is that
    half of it is already taught across crates that have nothing to do with each other,
    so the provenance line writes itself. Four is the floor stated in the acceptance
    criteria; there is no reason it should ever be near it.
  */
  const families = new Set(
    LEGEND_FRAMES.flatMap((f) => f.built_from.map((p) => PIECES[p]?.family).filter(Boolean)),
  )
  if (families.size < 4) {
    fail(
      'a full Legend draws on only ' + families.size + ' crate(s) — the provenance line is ' +
        'the argument for this feature existing in DUB at all',
    )
  }

  /*
    And nothing in the feature is scored.

    A rehearsal count exists so the run-through can offer the least-practised card, and
    for nothing else. The moment a number is attached to being put on the spot, the
    feature becomes the anxiety it exists to remove — so no surface may render it.
  */
  for (const file of ['components/Legend.tsx', 'components/Club.tsx']) {
    const src = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/[^\n]*/g, ' ')
    if (/\{[^}]*said_cold[^}]*\}/.test(src)) {
      fail(file + ' renders said_cold — the rehearsal count is never shown to a learner')
    }
  }

  console.log(
    LEGEND_FRAMES.length + ' legend frames · ' + atOne.length + ' reachable at rung 1 · ' +
      families.size + ' crates feed one legend · ' + REPAIR_KIT.length + ' repair lines',
  )
}

// --- the marks -------------------------------------------------------------
{
  /*
    The wordmark exists twice, and it has to.

    public/brand/*.svg is what a designer edits and what next/og can fetch; content/marks.ts
    is what the app inlines so the mark can be white on a blue header, which an <img> can
    never be. Two copies of anything drift, so this is the rule that stops them becoming
    two marks: edit the SVG, run npm run brand, or this fails.
  */
  const pairs: [string, { viewBox: string; d: string }][] = [
    ['dub.svg', DUB],
    ['dub-club.svg', DUB_CLUB],
    ['dub-mark.svg', DUB_MARK],
  ]
  for (const [file, mark] of pairs) {
    let svg = ''
    try {
      svg = readFileSync('public/brand/' + file, 'utf8')
    } catch {
      fail('public/brand/' + file + ' is missing — the wordmark has no source of truth')
      continue
    }
    const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1]
    const d = /\bd="([^"]+)"/.exec(svg)?.[1]
    if (d !== mark.d || viewBox !== mark.viewBox) {
      fail(
        'public/brand/' + file + ' and content/marks.ts have drifted. Run npm run brand.',
      )
    }
    if (!/fill="currentColor"/.test(svg)) {
      fail(
        'public/brand/' + file + ' hard-codes a fill. The header is blue and needs a white ' +
          'mark, which only currentColor gives.',
      )
    }
  }
  console.log('3 marks, and the files and the code agree')
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
