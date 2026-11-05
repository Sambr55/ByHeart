import { LevelRecap } from '@/components/LevelRecap'

export const metadata = { title: 'Level recap — DUB' }

/** A level's recap — opened by Errand when its last room is laid, and from Yours after. */
export default async function LevelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LevelRecap id={decodeURIComponent(id)} />
}
