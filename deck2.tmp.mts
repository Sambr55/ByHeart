import { LEGEND_FRAMES, frameForPurpose, frameApplies } from '@/content/legend'
import { CRATES, PIECES, ROOTS } from '@/content/roots'
function missingFrom(frame: any, owned: string[]): string {
  const have = new Set(owned)
  const short = frame.built_from.filter((p: string) => !have.has(p))
  const crates = [...new Set(short.map((p: string) => CRATES.find((c) => c.id === PIECES[p]?.family)?.title).filter(Boolean) as string[])]
  if (!crates.length) return 'a word you have not met yet'
  return crates.slice(0, 2).join(' and ')
}
// A learner who finished the 5 crates that unlock the Legend: which pieces do they own?
const basics = CRATES.find(c => c.title.includes('basics'))
console.log('basics crate id:', basics?.id)
for (const f of LEGEND_FRAMES) {
  const fams = f.built_from.map(p => `${p}:${PIECES[p]?.family ?? 'MISSING'}`)
  console.log(f.id, '|', f.purposes ? JSON.stringify(f.purposes) : 'all', '|', fams.join(' '))
}
