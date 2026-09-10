import { SITUATIONS, isCurrent } from '../content/situations'
import { roomsFor, feedFor } from '../content/feed'

const byRung: Record<number, number> = {}
for (const s of SITUATIONS) byRung[s.rung] = (byRung[s.rung] ?? 0) + 1
console.log('all situations by rung:', byRung, 'total', SITUATIONS.length)

for (const purpose of ['visiting', 'staying', 'moving', null] as const) {
  const rooms = roomsFor('lisbon', purpose)
  const rungs = rooms.map((c) => (c.kind === 'situation' ? c.situation.rung : 0))
  const dist: Record<number, number> = {}
  for (const r of rungs) dist[r] = (dist[r] ?? 0) + 1
  console.log(`\npurpose=${purpose}: ${rooms.length} rooms`)
  console.log('  order of rungs:', rungs.join(','))
  console.log('  distribution:', dist)
  console.log('  first 10 titles:', rooms.slice(0, 10).map((c) => c.kind === 'situation' ? `r${c.situation.rung} ${c.situation.title}` : '').join(' | '))
  const highest = Math.max(...(rungs as number[]))
  const firstHigh = (rungs as number[]).indexOf(highest)
  console.log(`  highest rung ${highest} first appears at position ${firstHigh} of ${rungs.length}`)
}
