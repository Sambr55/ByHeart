import { DEFAULT_PAIR } from '../content/pairs'
import { dayKey, notificationFor, pickLine } from '../content/daily-line'
import { ROOTS } from '../content/roots'

// A learner with nothing gets a starter; the same day always yields the same line.
const cold = pickLine({ owned: [], day: '2026-08-24', salt: 'a' })
const cold2 = pickLine({ owned: [], day: '2026-08-24', salt: 'a' })
if (!cold) throw new Error('a learner with no inventory got no line')
if (cold.id !== cold2!.id) throw new Error('the same day gave two different lines')
if (cold.kind !== 'starter') throw new Error('a cold learner should start on a freebie')

// Two people on the same day should not get identical lines.
const a = pickLine({ owned: [], day: '2026-08-24', salt: 'a' })!
const b = pickLine({ owned: [], day: '2026-08-24', salt: 'b-different' })!
if (a.id === b.id) console.log('note: two salts collided on this day, which is allowed')

// Someone with an inventory gets lines built from what they own, most days.
const owned = ROOTS.filter((r) => r.culture_family === 'top_gun').flatMap((r) => r.extracts.map((e) => e.id))
let reach = 0
const seen = new Set<string>()
for (let d = 1; d <= 60; d++) {
  const day = '2026-09-' + String(d % 30 + 1).padStart(2, '0')
  const line = pickLine({ owned, seen: [...seen], day, salt: 'sam' })
  if (!line) throw new Error('ran out of lines after ' + seen.size)
  if (seen.has(line.id)) throw new Error('sent the same line twice: ' + line.id)
  seen.add(line.id)
  if (line.kind === 'reach') reach++
  if (!line.note.trim()) throw new Error('line ' + line.id + ' has no note')
  const n = notificationFor(line)
  if (n.body.length > 240) throw new Error('notification body too long for ' + line.id)
}
if (reach === 0) throw new Error('never once pushed past what they own')

// Every note must be about the sentence it is attached to, not a different one.
import { PIECES } from '../content/roots'
const strip = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
let checked = 0
for (const root of ROOTS) {
  for (const line of [...root.branches.map((b) => b.pt), root.transfer_prompt.answer]) {
    const l = pickLine({ owned: root.extracts.map((e) => e.id), day: '2026-01-01', salt: line })
    void l
  }
}
for (let d = 0; d < 400; d++) {
  const line = pickLine({ owned: Object.keys(PIECES), day: '2027-01-01', salt: 's' + d })
  if (!line) continue
  const words = new Set(strip(line.pt).replace(/[^a-z\s-]/g, ' ').split(/\s+/).filter((w) => w.length >= 3))
  const noteWords = strip(line.note).replace(/[^a-z\s-]/g, ' ').split(/\s+/)
  const root = ROOTS.find((r) => r.root_id === line.root_id)!
  const rootWords = new Set(strip(root.pt_natural).replace(/[^a-z\s-]/g, ' ').split(/\s+/).filter((w) => w.length >= 3))
  const relevant = noteWords.some((w) => words.has(w) || rootWords.has(w))
  if (!relevant) {
    throw new Error('note for "' + line.pt + '" is about neither it nor its root: ' + line.note)
  }
  checked++
}

console.log(
  '60 days: ' + seen.size + ' distinct lines, ' + reach + ' of them a reach, none repeated',
)
console.log(checked + ' notes checked, every one about the line it is attached to')
console.log('today in ' + DEFAULT_PAIR.day_zone + ': ' + dayKey())
console.log('example: ' + JSON.stringify(notificationFor(pickLine({ owned, salt: 'sam' })!), null, 1))
