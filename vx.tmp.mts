import { PIECES, ROOTS, RUNGS } from '@/content/roots'
const all = Object.entries(PIECES)
console.log('TOTAL PIECES:', all.length)
const byRung: Record<number,string[]> = {}
for (const [id,p] of all) (byRung[p.rung] ??= []).push(`${p.pt}  (${p.gloss})`)
for (const r of [1,2,3,4,5,6]) {
  console.log(`\n===== STAGE ${r} — ${RUNGS[r-1].name} — ${(byRung[r]??[]).length} pieces =====`)
  for (const x of (byRung[r]??[])) console.log('   ' + x)
}
