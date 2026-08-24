/**
 * Fixtures for the merge. Proven, not asserted by hand.
 *
 * The rule this file exists to defend: a merge can only ever gain. Every case below is
 * a way somebody could lose work — two devices, an offline session, a stale server copy,
 * a record from before a field existed — and the expected result is always "nothing that
 * was there has gone".
 *
 *   npm run merge:test
 *
 * TYPED AGAINST THE REAL SHAPES, and that is the whole lesson of this file's second
 * draft. The first one cast every fixture through `as never`, which let it assert
 * "strength only goes up — in the real InventoryItem shape" while testing
 * `{ state, acquired_at }` — a shape that exists nowhere in DUB. Nineteen fixtures
 * passed while the merge silently destroyed evidence and demoted inventory on every
 * sync. The compiler would have caught all three defects before a human did.
 *
 * So: no `as never`. If a fixture will not typecheck, the fixture is wrong about the
 * product, and that is exactly the thing worth being told.
 */
import { mergeLearner } from '../lib/merge'
import type { InventoryItem, LearnerState, LearningEvidence, ProofLine } from '../engine/learner'

let failures = 0
function check(label: string, ok: boolean, detail = '') {
  if (!ok) { failures++; console.log('  FAIL  ' + label + (detail ? ' — ' + detail : '')) }
  else console.log('  ok    ' + label)
}

type Partial_ = Partial<LearnerState>

function line(pt: string, at: string): ProofLine {
  return { pt, en: '', source: 'release', clean: true, at }
}

function item(
  id: string,
  state: InventoryItem['latest_state'],
  sources: string[] = [],
): InventoryItem {
  return {
    target_id: id,
    acquired_source: null,
    reinforced_sources: sources as InventoryItem['reinforced_sources'],
    latest_state: state,
    latest_recall_at: null,
  }
}

function ev(
  id: string,
  kind: LearningEvidence['event_type'],
  timestamp: string,
): LearningEvidence {
  return {
    target_id: id,
    event_type: kind,
    correct_first_try: true,
    hint_count: 0,
    revealed: false,
    latency_ms: 1000,
    culture_context: null,
    mission_id: null,
    timestamp,
  }
}

// 1. two devices, different sentences
{
  const a: Partial_ = { proof: [line('Tenho fome.', '1'), line('Onde está?', '2')], inventory: { fome: item('fome', 'SOLID') } }
  const b: Partial_ = { proof: [line('Sete euros.', '3')], inventory: { sete: item('sete', 'YOURS') } }
  const m = mergeLearner(a, b)
  check('two devices union their proof', m.proof.length === 3)
  check('two devices union their inventory', Object.keys(m.inventory).length === 2)
}

// 2. the same session seen twice — no duplicates
{
  const shared = [line('Tenho fome.', '1')]
  const m = mergeLearner({ proof: shared }, { proof: [...shared] })
  check('identical proof does not duplicate', m.proof.length === 1)
}

// 3. an empty server copy must never wipe a full local one
{
  const a: Partial_ = { proof: [line('a', '1'), line('b', '2')], inventory: { x: item('x', 'SOLID') } }
  const m = mergeLearner(a, {})
  check('empty remote cannot erase local', m.proof.length === 2 && 'x' in m.inventory)
  const m2 = mergeLearner({}, a)
  check('empty local cannot erase remote', m2.proof.length === 2 && 'x' in m2.inventory)
}

/*
  4. A piece can never be demoted, and its history can never be thinned.

  This is the fixture the first draft claimed to be. A learner opens DUB on a phone that
  has been in a drawer since July; that phone's copy of `água` says NEW and knows about
  one crate. The phone in their hand says SOLID and knows about three. The stale copy
  must lose, on every field.
*/
{
  const fresh: Partial_ = { inventory: { agua: item('agua', 'SOLID', ['top_gun', 'james_bond', 'pulp_fiction']) } }
  const stale: Partial_ = { inventory: { agua: item('agua', 'NEW', ['top_gun']) } }
  for (const [label, m] of [
    ['stale remote', mergeLearner(fresh, stale)],
    ['stale local', mergeLearner(stale, fresh)],
  ] as const) {
    const p = m.inventory.agua
    check(label + ' cannot demote a piece', p.latest_state === 'SOLID', String(p.latest_state))
    check(
      label + ' cannot erase cross-world reinforcement',
      p.reinforced_sources.length === 3,
      p.reinforced_sources.join(','),
    )
    check(
      label + ' does not inject a field the product has never had',
      !('state' in p) && !('acquired_at' in p),
      Object.keys(p).join(','),
    )
  }
}

/*
  5. The evidence log.

  Every evidence row is a separate event and the log is append-only — scoreFor,
  deriveState and weakestBlocks all COUNT rows, so losing one silently demotes a piece
  and corrupts deck selection. Three reinforcements on one piece are three rows, not one.

  The bug this catches keyed the dedupe on `e.at`, a field LearningEvidence does not
  have. Undefined on every row, so the key degraded to target_id|""|event_type and every
  row sharing a target and a type collapsed into one survivor.
*/
{
  const local: Partial_ = {
    evidence: [ev('agua', 'reinforce', '1'), ev('agua', 'reinforce', '2'), ev('agua', 'reinforce', '3')],
  }
  const remote: Partial_ = {
    evidence: [ev('agua', 'reinforce', '4'), ev('agua', 'reinforce', '5')],
  }
  const m = mergeLearner(local, remote)
  check('three reinforcements plus two are five, not one', m.evidence.length === 5, String(m.evidence.length))

  const same = ev('agua', 'reinforce', '1')
  check(
    'but the identical row still dedupes',
    mergeLearner({ evidence: [same] }, { evidence: [{ ...same }] }).evidence.length === 1,
  )
}

/*
  5b. A fumbled release, upgraded.

  recordProof lets a learner fix a release they got wrong once. `clean` is what
  rungReached counts, so a stale copy carrying the old false back through a merge is a
  lost rung, not a cosmetic flag.
*/
{
  const fumbled: ProofLine = { ...line('Um copo de água, por favor.', '1'), clean: false }
  const fixed: ProofLine = { ...fumbled, clean: true }
  check(
    'a clean upgrade survives a stale remote',
    mergeLearner({ proof: [fixed] }, { proof: [fumbled] }).proof[0].clean,
  )
  check(
    'and survives being the stale side itself',
    mergeLearner({ proof: [fumbled] }, { proof: [fixed] }).proof[0].clean,
  )
  check(
    'and it is still one sentence, not two',
    mergeLearner({ proof: [fumbled] }, { proof: [fixed] }).proof.length === 1,
  )
}

/*
  5c. The Legend.

  Unlike proof, a Legend card is EDITABLE — it is somebody's own words about themselves —
  so the later edit has to win rather than the first one. But rehearsal is append-only in
  spirit: two devices each counted real cold deliveries, so the counts add.

  And the case that matters most: a card cleared on one device must not resurrect from
  the other's stale copy. Clearing is how somebody says "I am not answering that", and a
  sync that undoes it is the product overruling them about their own family.
*/
{
  const card = (frame_id: string, values: Record<string, string>, said_cold: number, at: string) => ({
    frame_id,
    values,
    said_cold,
    at,
  })
  const older = card('children', { n: '2', names: 'Ana e Rui' }, 3, '2026-08-01T09:00:00.000Z')
  const newer = card('children', { n: '3', names: 'Oscar, Tilly e Ted' }, 2, '2026-08-20T09:00:00.000Z')

  for (const [label, m] of [
    ['newer as remote', mergeLearner({ legend: [older] }, { legend: [newer] })],
    ['newer as local', mergeLearner({ legend: [newer] }, { legend: [older] })],
  ] as const) {
    const got = m.legend.find((a) => a.frame_id === 'children')
    check(label + ': the later edit wins', got?.values.names === 'Oscar, Tilly e Ted', String(got?.values.names))
    check(label + ': rehearsals add rather than replace', got?.said_cold === 5, String(got?.said_cold))
  }

  check(
    'two different cards both survive',
    mergeLearner(
      { legend: [card('name', { name: 'Sam' }, 1, '1')] },
      { legend: [card('age', { n: '56' }, 1, '1')] },
    ).legend.length === 2,
  )
  /*
    Clearing is a tombstone, not a delete, and this is why.

    A merge may never let an empty side erase a full one — that invariant is the whole of
    lib/merge.ts — so a DELETED card resurrects from any device that still has it. The
    merge cannot tell "I never answered this" from "I cleared it". An empty row with a
    later timestamp can.
  */
  const cleared = card('children', {}, 3, '2026-08-25T09:00:00.000Z')
  const stillThere = mergeLearner({ legend: [cleared] }, { legend: [newer] }).legend.find(
    (a) => a.frame_id === 'children',
  )
  check(
    'a card cleared later stays cleared',
    Object.keys(stillThere?.values ?? {}).length === 0,
    JSON.stringify(stillThere?.values),
  )
  check(
    'and an absent card is not mistaken for a cleared one',
    mergeLearner({ legend: [] }, { legend: [older] }).legend.length === 1,
  )
}

// 6. missing arrays and objects on an older record
{
  const m = mergeLearner({ proof: [line('a', '1')] }, { proof: [line('b', '2')], inventory: undefined })
  check('an absent inventory is an empty one, not a crash', typeof m.inventory === 'object')
  check('and the proof still merged', m.proof.length === 2)
}

// 7. identity and the dates that must not move
{
  const m = mergeLearner(
    { learner_id: 'L1', created_at: '2026-07-01T00:00:00.000Z', deal_accepted_at: '2026-07-02T00:00:00.000Z' },
    { learner_id: 'L1', created_at: '2026-08-01T00:00:00.000Z', deal_accepted_at: '2026-08-05T00:00:00.000Z' },
  )
  check('the earliest created_at wins', m.created_at === '2026-07-01T00:00:00.000Z', m.created_at)
  check('the earliest deal acceptance wins', m.deal_accepted_at === '2026-07-02T00:00:00.000Z', String(m.deal_accepted_at))
}

// 8. sets are unions
{
  const m = mergeLearner(
    { roots_played: ['a', 'b'], collisions_played: ['c1'], nocue_done: ['n1'] },
    { roots_played: ['b', 'c'], collisions_played: ['c2'], nocue_done: ['n1', 'n2'] },
  )
  check('roots played union', m.roots_played.length === 3)
  check('collisions played union', m.collisions_played.length === 2)
  check('cold prompts done union', m.nocue_done.length === 2)
}

/*
  9. The Club.

  A learner who has finished a section on one phone and signs in on another is not new —
  so sections union, and the welcome keeps the FIRST time it fired. Getting this
  backwards shows somebody the welcome ceremony a second time, which is a small thing
  that makes a product feel like it has forgotten you.
*/
{
  const club = mergeLearner(
    { sections_completed: ['james_bond'], club_welcomed_at: '2026-08-02T09:00:00.000Z' },
    { sections_completed: ['top_gun'], club_welcomed_at: '2026-08-20T09:00:00.000Z' },
  )
  check('sections union rather than replace', club.sections_completed.length === 2)
  check('the welcome keeps the first time it fired', club.club_welcomed_at === '2026-08-02T09:00:00.000Z')
  check(
    'a never-welcomed copy does not erase a welcome',
    mergeLearner({ club_welcomed_at: null }, { club_welcomed_at: '2026-08-02T09:00:00.000Z' })
      .club_welcomed_at === '2026-08-02T09:00:00.000Z',
  )
}

/*
  10. The invariant itself, which is the last line of defence.

  It has to throw rather than write: the learner's record of what they can say IS the
  product, and there is nowhere to restore it from. It previously checked two things —
  proof length and inventory key presence — and both of the defects above sailed past it.
*/
{
  const { assertCanOnlyGain } = await import('../lib/merge')
  const throws = (label: string, a: Partial_, b: Partial_, merged: Partial_) => {
    let threw = false
    try {
      assertCanOnlyGain(a, b, merged as LearnerState)
    } catch {
      threw = true
    }
    check(label, threw)
  }

  throws(
    'the invariant throws when proof would shrink',
    { proof: [line('a', '1'), line('b', '2')] },
    {},
    { proof: [line('a', '1')], inventory: {}, evidence: [] },
  )
  throws(
    'the invariant throws when an inventory key would vanish',
    { inventory: { keep: item('keep', 'SOLID') } },
    {},
    { proof: [], inventory: {}, evidence: [] },
  )
  throws(
    'the invariant throws when evidence would be thinned',
    { evidence: [ev('a', 'reinforce', '1'), ev('a', 'reinforce', '2')] },
    {},
    { proof: [], inventory: {}, evidence: [ev('a', 'reinforce', '1')] },
  )
  throws(
    'the invariant throws when a piece would be demoted',
    { inventory: { a: item('a', 'SOLID') } },
    {},
    { proof: [], evidence: [], inventory: { a: item('a', 'NEW') } },
  )
  throws(
    'the invariant throws when reinforcement history would be thinned',
    { inventory: { a: item('a', 'SOLID', ['x', 'y']) } },
    {},
    { proof: [], evidence: [], inventory: { a: item('a', 'SOLID', ['x']) } },
  )
}

console.log('')
if (failures) { console.log(failures + ' merge fixture(s) failed'); process.exit(1) }
console.log('merge fixtures pass: a merge can only ever gain')
