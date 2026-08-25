import { notFound } from 'next/navigation'
import { Errand } from '@/components/Errand'
import { SITUATIONS, isCurrent, situationById } from '@/content/situations'

export function generateStaticParams() {
  return SITUATIONS.map((s) => ({ id: s.id }))
}

export default async function ErrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const situation = situationById(id)
  // Past its review date it is hidden rather than wrong: a Club full of things that are
  // no longer true is worse than a Club with less in it.
  if (!situation || !isCurrent(situation)) notFound()
  return <Errand situation={situation} />
}
