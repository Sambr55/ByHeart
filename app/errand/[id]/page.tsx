import { notFound } from 'next/navigation'
import { Errand } from '@/components/Errand'
import { roomById } from '@/content/feed'
import { DROP_SITUATIONS } from '@/content/drops'
import { SITUATIONS, isCurrent } from '@/content/situations'

/*
  Every room the Club can link to, not only the standing ones.

  This listed SITUATIONS alone, and a room's SAY IT COLD goes to /errand/<id> — so every
  room that lives inside a drop was unprerendered AND unresolvable, and the first three
  cards of the default feed were all dead. Drop rooms are included now; rooms from
  `generatedDrops` are built per-request and cannot be listed here, which is why the page
  resolves through roomById rather than trusting this list.
*/
export function generateStaticParams() {
  return [...SITUATIONS, ...DROP_SITUATIONS].map((s) => ({ id: s.id }))
}

export default async function ErrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const situation = roomById(id)
  // Past its review date it is hidden rather than wrong: a Club full of things that are
  // no longer true is worse than a Club with less in it.
  if (!situation || !isCurrent(situation)) notFound()
  return <Errand situation={situation} />
}
