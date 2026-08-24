/**
 * Fixtures for the merge. Proven, not asserted by hand.
 *
 * The rule this file exists to defend: a merge can only ever gain. Every case below is
 * a way somebody could lose work — two devices, an offline session, a stale server copy,
 * a record from before a field existed — and the expected result is always "nothing that
 * was there has gone".
 *
 *   npm run merge:test
 */
import { mergeLearner } from '../lib/merge'

let failures = 0
function check(label: string, ok: boolean, detail = '') {
  if (!ok) { failures++; console.log('  FAIL  ' + label + (detail ? ' — ' + detail : '')) }
  else console.log('  ok    ' + label)
}

function line(pt: string, at: string) {
  return { pt, en: '', source: 'release', clean: true, at }
}

// 1. two devices, different sentences
{
  const a = { proof: [line('Tenho fome.', '1'), line('Onde está?', '2')], inventory: { fome: 'strong' } }
  const b = { proof: [line('Sete euros.', '3')], inventory: { sete: 'known' } }
  const m = mergeLearner(a as never, b as never)
  check('two devices union their proof', m.proof.length === 3)
  check('two devices union their inventory', Object.keys(m.inventory).length === 2)
}

// 2. the same session seen twice — no duplicates
{
  const shared = [line('Tenho fome.', '1')]
  const m = mergeLearner({ proof: shared } as never, { proof: [...shared] } as never)
  check('identical proof does not duplicate', m.proof.length === 1)
}

// 3. an empty server copy must never wipe a full local one
{
  const a = { proof: [line('a', '1'), line('b', '2')], inventory: { x: 'strong' } }
  const m = mergeLearner(a as never, {} as never)
  check('empty remote cannot erase local', m.proof.length === 2 && 'x' in m.inventory)
  const m2 = mergeLearner({} as never, a as never)
  check('empty local cannot erase remote', m2.proof.length === 2 && 'x' in m2.inventory)
}

// 4. strength only goes up — in the real InventoryItem shape, and in the bare string
//    shape a record written by an older build might still be carrying
{
  const m = mergeLearner(
    { inventory: { p: { state: 'strong', acquired_at: '2026-08-02' } } } as never,
    { inventory: { p: { state: 'shaky', acquired_at: '2026-07-01' } } } as never,
  )
  const p = m.inventory.p as unknown as { state: string; acquired_at: string }
  check('a weaker copy cannot demote a piece', p.state === 'strong', p.state)
  check('the earlier acquisition survives', p.acquired_at === '2026-07-01', p.acquired_at)

  const m2 = mergeLearner({ inventory: { q: 'strong' } } as never, { inventory: { q: 'seen' } } as never)
  check('and the same holds for a bare string record', (m2.inventory.q as unknown) === 'strong')
}

// 5. sets union rather than replace
{
  const m = mergeLearner(
    { roots_played: ['jb_007'], osmosis_seen: ['a'] } as never,
    { roots_played: ['tg_goose'], osmosis_seen: ['b'] } as never,
  )
  check('roots_played unions', m.roots_played.length === 2)
  check('osmosis_seen unions', m.osmosis_seen.length === 2)
}

// 6. the earliest date is the true one
{
  const m = mergeLearner(
    { created_at: '2026-08-01', deal_accepted_at: '2026-08-05' } as never,
    { created_at: '2026-07-01', deal_accepted_at: '2026-07-09' } as never,
  )
  check('created_at takes the earliest', m.created_at === '2026-07-01', m.created_at)
  check('deal acceptance takes the earliest', m.deal_accepted_at === '2026-07-09')
}

// 7. a record written before a field existed
{
  const m = mergeLearner({ proof: [line('a', '1')] } as never, { learner_id: 'l_old' } as never)
  check('a legacy record merges without throwing', m.proof.length === 1)
  check('missing arrays become arrays', Array.isArray(m.roots_played) && Array.isArray(m.evidence))
}

// 8. the invariant itself fires
{
  let threw = false
  try {
    // A deliberately broken merge: pretend the result lost a line.
    const { assertCanOnlyGain } = await import('../lib/merge')
    assertCanOnlyGain(
      { proof: [line('a', '1'), line('b', '2')] } as never,
      {} as never,
      { proof: [line('a', '1')], inventory: {} } as never,
    )
  } catch { threw = true }
  check('the invariant throws when proof would shrink', threw)

  let threw2 = false
  try {
    const { assertCanOnlyGain } = await import('../lib/merge')
    assertCanOnlyGain(
      { inventory: { keep: 'strong' } } as never,
      {} as never,
      { proof: [], inventory: {} } as never,
    )
  } catch { threw2 = true }
  check('the invariant throws when an inventory key would vanish', threw2)

  /*
    The Club.

    A learner who has finished a section on one phone and signs in on another is not
    new — so sections union, and the welcome keeps the FIRST time it fired. Getting
    this backwards would show somebody the welcome ceremony a second time, which is a
    small thing that makes a product feel like it has forgotten you.
  */
  const club = mergeLearner(
    { sections_completed: ['james_bond'], club_welcomed_at: '2026-08-02T09:00:00.000Z' } as never,
    { sections_completed: ['top_gun'], club_welcomed_at: '2026-08-20T09:00:00.000Z' } as never,
  )
  check(
    'sections union rather than replace',
    club.sections_completed.length === 2 &&
      club.sections_completed.includes('james_bond') &&
      club.sections_completed.includes('top_gun'),
  )
  check('the welcome keeps the first time it fired', club.club_welcomed_at === '2026-08-02T09:00:00.000Z')
  check(
    'a never-welcomed copy does not erase a welcome',
    mergeLearner({ club_welcomed_at: null } as never, { club_welcomed_at: '2026-08-02T09:00:00.000Z' } as never)
      .club_welcomed_at === '2026-08-02T09:00:00.000Z',
  )
}

console.log('')
if (failures) { console.log(failures + ' merge fixture(s) failed'); process.exit(1) }
console.log('merge fixtures pass: a merge can only ever gain')
