/**
 * Content invariants. The lesson is data, so the data has to be checked like code —
 * a mistyped tile id or an unreachable diagnostic rule is a broken screen in front of
 * a tester, and there is no compiler error for it.
 *
 *   npm run lint:content
 */

import { SCREENS, FINAL_TEST_ITEMS } from '../content/topgun-pt'
import { BLOCK_ORDER, EXAMPLES, TARGETS } from '../content/targets'
import { AUDIO_MANIFEST, normalisePhrase, slugFor } from '../content/audio-manifest'
import { isExercise, type BlockId } from '../content/types'

const errors: string[] = []
const warnings: string[] = []

const fail = (m: string) => errors.push(m)
const warn = (m: string) => warnings.push(m)

// --- ids ------------------------------------------------------------------
const ids = SCREENS.map((s) => s.id)
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
if (dupes.length) fail('Duplicate screen ids: ' + dupes.join(', '))

// --- every block is introduced, acquired, and acquired only once ----------
const introduced = new Set<BlockId>()
const acquired = new Set<BlockId>()
for (const s of SCREENS) {
  for (const b of ([] as BlockId[]).concat(s.introduces ?? [])) introduced.add(b)
  for (const b of ([] as BlockId[]).concat(s.acquires ?? [])) {
    if (acquired.has(b)) fail(s.id + ' acquires ' + b + ', already banked earlier')
    acquired.add(b)
  }
}
for (const b of BLOCK_ORDER) {
  if (!acquired.has(b)) fail('Block never acquired: ' + b)
}

// --- a block may not be used before it is banked --------------------------
const bankedBy = new Map<BlockId, number>()
SCREENS.forEach((s, i) => {
  for (const b of ([] as BlockId[]).concat(s.acquires ?? [])) bankedBy.set(b, i)
})
SCREENS.forEach((s, i) => {
  if (s.chipHint && (bankedBy.get(s.chipHint) ?? Infinity) > i) {
    fail(s.id + ' highlights the ' + s.chipHint + ' chip before it is banked')
  }
  if (s.type === 'recall-burst') {
    for (const c of s.cards) {
      for (const o of c.options) {
        if ((bankedBy.get(o) ?? Infinity) > i) {
          fail(s.id + ' offers ' + o + ' as an option before it is banked')
        }
      }
      if (!c.options.includes(c.answer)) {
        fail(s.id + ' card "' + c.cue + '" does not offer its own answer')
      }
      if (new Set(c.options).size !== c.options.length) {
        fail(s.id + ' card "' + c.cue + '" repeats an option')
      }
    }
  }
})

// --- exercises are answerable --------------------------------------------
for (const s of SCREENS) {
  if (s.type === 'choice') {
    const right = s.options.filter((o) => o.correct)
    if (right.length !== 1) fail(s.id + ' has ' + right.length + ' correct options')
    for (const o of s.options) {
      if (!o.correct && !o.feedback) {
        warn(s.id + ' distractor "' + o.pt + '" has no diagnostic feedback')
      }
    }
  }
  if (s.type === 'tiles') {
    const tileIds = new Set(s.tiles.map((t) => t.id))
    for (const a of s.answer) {
      if (!tileIds.has(a)) fail(s.id + ' answer references missing tile "' + a + '"')
    }
    for (const t of s.tiles) {
      if (!s.answer.includes(t.id) && !t.distractor) {
        fail(s.id + ' tile "' + t.id + '" is unused but not marked as a distractor')
      }
    }
    for (const r of s.rules ?? []) {
      if (r.when === 'uses' && !tileIds.has(r.tile)) {
        fail(s.id + ' rule targets missing tile "' + r.tile + '"')
      }
      if (r.when === 'omits' && !s.answer.includes(r.tile)) {
        fail(s.id + ' "omits" rule targets "' + r.tile + '", which is not in the answer')
      }
      if (r.when === 'not-first' && s.answer[0] !== r.tile) {
        fail(s.id + ' "not-first" rule names "' + r.tile + '", not the opening tile')
      }
    }
    if (!s.rules?.length && !s.hint1) {
      warn(s.id + ' has no diagnostic rule and no hint1 — level-1 feedback will be generic')
    }
  }
  if (isExercise(s) && s.type !== 'recall-burst' && !s.reveal) {
    warn(s.id + ' resolves with no reveal copy')
  }
}

// --- the Lisbon test ------------------------------------------------------
for (const id of FINAL_TEST_ITEMS) {
  const s = SCREENS.find((x) => x.id === id)
  if (!s) {
    fail('Final test item ' + id + ' is not a screen')
    continue
  }
  if (s.stage !== 'LISBON') fail(id + ' is a final test item but not in the LISBON stage')
}
const lisbon = SCREENS.filter((s) => s.stage === 'LISBON')
for (const s of lisbon) {
  if (s.hook) fail(s.id + ' shows a film hook inside the Lisbon test (spec §9)')
  const copy = [s.headline, s.sub, s.context, s.eyebrow, s.note].join(' ')
  if (/top gun|maverick|goose|wingman/i.test(copy) && s.id < 'L09') {
    fail(s.id + ' mentions the film during the transfer test')
  }
}

// --- coverage: every acquired block must escape the film at least once ----
const transferred = new Set<string>()
for (const s of SCREENS) {
  for (const c of s.capture ?? []) {
    if (c.startsWith('transfer=')) transferred.add(c.slice('transfer='.length))
  }
}
for (const b of BLOCK_ORDER) {
  if (!transferred.has(b) && !['claro', 'porque_nao'].includes(b)) {
    warn('Block ' + b + ' has no non-film transfer screen tagged')
  }
}
const testedInLisbon = new Set(
  lisbon.filter((s) => FINAL_TEST_ITEMS.includes(s.id)).map((s) => s.chipHint),
)
for (const b of BLOCK_ORDER) {
  if (!testedInLisbon.has(b)) {
    warn('Block ' + b + ' is taught but never tested in the Lisbon transfer test')
  }
}

// --- audio ----------------------------------------------------------------
const slugs = AUDIO_MANIFEST.map((a) => a.slug)
const byText = new Map<string, string>()
for (const a of AUDIO_MANIFEST) {
  const key = normalisePhrase(a.text)
  const seen = byText.get(key)
  if (seen && seen !== a.slug) {
    fail('Phrase "' + a.text + '" resolves to two slugs: ' + seen + ' and ' + a.slug)
  }
  byText.set(key, a.slug)
}
// Every phrase the UI will actually speak must have an asset queued for it.
const spoken = new Set<string>()
for (const s of SCREENS) {
  if (s.type === 'choice') {
    const right = s.options.find((o) => o.correct)
    if (right) spoken.add(right.pt)
  }
  if (s.type === 'tiles') {
    spoken.add(
      s.answer
        .map((id) => s.tiles.find((t) => t.id === id)!.text)
        .join(' ')
        .replace(/ \?$/, '?'),
    )
  }
  if (s.type === 'match') for (const p of s.pairs) spoken.add(p.pt)
  if (s.type === 'generativity') for (const l of s.lines) spoken.add(l.pt)
  if (s.type === 'block-intro' && s.phrase) spoken.add(s.phrase.pt)
}
for (const phrase of spoken) {
  if (!slugs.includes(slugFor(phrase))) {
    fail('No audio asset queued for spoken phrase "' + phrase + '"')
  }
}
for (const e of EXAMPLES) {
  if (!TARGETS[e.target_id]) fail('Example ' + e.example_id + ' has an unknown target')
}

// --- report ---------------------------------------------------------------
console.log(
  SCREENS.length +
    ' screens · ' +
    BLOCK_ORDER.length +
    ' blocks · ' +
    EXAMPLES.length +
    ' examples · ' +
    new Set(slugs).size +
    ' audio assets',
)
warnings.forEach((w) => console.log('  warn  ' + w))
errors.forEach((e) => console.log('  FAIL  ' + e))
console.log(errors.length ? '\n' + errors.length + ' error(s)' : '\nno errors')
process.exit(errors.length ? 1 : 0)
