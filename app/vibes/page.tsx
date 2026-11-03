import { redirect } from 'next/navigation'
import { VibesView } from './view'

export const dynamic = 'force-dynamic'

/**
 * VIBES: ONE SITTING, NOT A SECOND LOOP (Sam, 2026-11-03).
 *
 * The shelf as a place of its own is retired — two loops was half of "I get lost in my own
 * app in seconds". But the vibes themselves came back, as the Just for fun row on the Path
 * (components/path/FunShelf.tsx), and each of those opens here with ?open=<vibe>. Without
 * one, /vibes still lands home, so old links and shortcuts go somewhere sensible.
 */
export default async function VibesPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const { open } = await searchParams
  if (!open) redirect('/club#fun')
  return <VibesView />
}
