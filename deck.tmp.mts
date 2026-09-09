import { LEGEND_FRAMES, frameForPurpose, frameApplies } from '@/content/legend'
import { CRATES, PIECES } from '@/content/roots'

function missingFrom(frame: any, owned: string[]): string {
  const have = new Set(owned)
  const short = frame.built_from.filter((p: string) => !have.has(p))
  const crates = [...new Set(short.map((p: string) => CRATES.find((c) => c.id === PIECES[p]?.family)?.title).filter(Boolean) as string[])]
  if (!crates.length) return 'a word you have not met yet'
  return crates.slice(0, 2).join(' and ')
}

const allOwned = Object.keys(PIECES)
for (const purpose of ['visiting','staying','moving', null] as any[]) {
  for (const [label, owned] of [['OWNS NOTHING', [] as string[]], ['OWNS ALL 177', allOwned]] as const) {
    const reachable = LEGEND_FRAMES.filter((f) => frameForPurpose(f, purpose))
    const closed = LEGEND_FRAMES.filter((f) => frameApplies(f, [])).filter((f) => !reachable.some((r) => r.id === f.id))
    console.log(`\npurpose=${purpose} ${label}`)
    for (const f of closed) console.log(`  ${f.id} -> Needs ${missingFrom(f, owned as string[])}`)
    if (!closed.length) console.log('  (nothing closed)')
  }
}
