import { WalkScreen } from '@/components/city/WalkScreen'
import { WALKS, walkById } from '@/content/walks'

export function generateStaticParams() {
  return WALKS.map((w) => ({ id: w.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: (walkById(id)?.title ?? 'A language walk') + ' — DUB' }
}

export default async function WalkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <WalkScreen id={id} />
}
