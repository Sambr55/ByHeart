'use client'

import type { BlockId } from '@/content/types'
import { TARGETS } from '@/content/targets'
import { useHighlight } from '@/engine/highlight'

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
