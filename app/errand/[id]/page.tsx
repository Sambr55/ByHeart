import { notFound, redirect } from 'next/navigation'
import { Errand } from '@/components/Errand'
import { RoomGate } from '@/components/path/RoomGate'
import { dropForRoom, roomById } from '@/content/feed'
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
  /*
    WHO YOU ARE IS THE LEGEND (Sam, 2026-11-03: "It defaults to my name is Ana from London
    without pulling through my actual name or asking me where I am from"). As a fixed room it
    could only teach somebody else's name; the Legend asks yours and where you are from, so
    the tile opens it at the next unanswered question. The tile is laid there (Legend.tsx).
  */
  if (id === 'lisbon_legend') redirect('/legend?next=1')
  const situation = roomById(id)
  // Past its review date it is hidden rather than wrong: a Club full of things that are
  // no longer true is worse than a Club with less in it.
  if (!situation || !isCurrent(situation)) notFound()
  /*
    The night this room belongs to, where it belongs to one.

    Undefined for the forty-five standing rooms, which is correct — they are about Lisbon
    rather than about an evening, and only a room pegged to a date has an invitation worth
    sending.
  */
  return (
    <RoomGate id={situation.id} title={situation.title}>
      <Errand situation={situation} drop={dropForRoom(id)} />
    </RoomGate>
  )
}
