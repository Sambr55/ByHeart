'use client'

import type { BlockId } from '@/content/types'
import { TARGETS } from '@/content/targets'
import { useHighlight } from '@/engine/highlight'
import { useLearner } from '@/engine/useLearner'
import type { PropertyId } from '@/content/types'

const PROPERTY_LABEL: Record<PropertyId, string> = {
  top_gun: 'Top Gun',
  james_bond: 'Bond',
}

export function InventoryChip({
  block,
  size = 'sm',
}: {
  block: BlockId
  size?: 'sm' | 'lg'
}) {
  const { highlight } = useHighlight()
  const target = TARGETS[block]
  const lit = highlight === block
  return (
    <span
      className={
        'inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 transition ' +
        (size === 'lg' ? 'text-base' : 'text-xs') +
        (lit
          ? ' border-accent bg-accent text-accent-ink shadow-[0_0_0_4px_rgba(232,176,75,0.18)]'
          : ' border-line bg-chip text-fg')
      }
    >
      <span className="pt font-semibold tracking-tight">{target.label}</span>
      <span className={lit ? 'opacity-70' : 'text-muted'}>{target.gloss}</span>
    </span>
  )
}

/** The persistent rail. Empty until the first block is banked. */
export function InventoryRail({ blocks }: { blocks: BlockId[] }) {
  if (!blocks.length) return null
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-2">
        {blocks.map((b) => (
          <InventoryChip key={b} block={b} />
        ))}
      </div>
    </div>
  )
}

export function InventoryDrawer({ blocks }: { blocks: BlockId[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {blocks.map((b) => (
        <InventoryChip key={b} block={b} size="lg" />
      ))}
    </div>
  )
}

/**
 * The compound view. The source badge says where the memory started; the state says
 * what the learner can now do with it. Those are deliberately different lines —
 * culture must never read as owning the phrase (spec §8 design principle).
 */
export function SourceChip({ block }: { block: BlockId }) {
  const learner = useLearner()
  const target = TARGETS[block]
  const item = learner.inventory[block]
  const sources = item
    ? [item.acquired_source, ...item.reinforced_sources].filter(Boolean)
    : [target.source]
  const state = item?.latest_state ?? 'NEW'
  const strengthened = (item?.reinforced_sources.length ?? 0) > 0

  return (
    <div
      className={
        'rounded border px-3 py-2.5 ' +
        (strengthened ? 'border-accent/60 bg-accent/5' : 'border-line bg-chip')
      }
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="pt text-sm font-semibold">{target.label}</span>
        <span className="text-[0.6rem] uppercase tracking-wider text-muted">{state}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted">{target.gloss}</p>
      <p className="mt-1 text-[0.6rem] uppercase tracking-wider text-accent/80">
        {(sources as PropertyId[]).map((s) => PROPERTY_LABEL[s]).join(' → ')}
      </p>
    </div>
  )
}
