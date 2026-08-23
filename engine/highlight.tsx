'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { BlockId } from '@/content/types'

/** Level-2 of the hint ladder highlights an inventory chip, which lives in the shell. */
const Ctx = createContext<{
  highlight: BlockId | null
  setHighlight: (b: BlockId | null) => void
}>({ highlight: null, setHighlight: () => {} })

export function HighlightProvider({ children }: { children: React.ReactNode }) {
  const [highlight, setHighlight] = useState<BlockId | null>(null)
  const value = useMemo(() => ({ highlight, setHighlight }), [highlight])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useHighlight = () => useContext(Ctx)
