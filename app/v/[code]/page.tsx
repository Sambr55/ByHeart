import { CardCheckIn } from '@/components/venues/CardCheckIn'

export const metadata = { title: 'Checked in — DUB', robots: { index: false, follow: false } }

/** Where a venue's DUB card QR goes. The camera opens it; the check-in happens on arrival. */
export default async function CardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return <CardCheckIn code={code} />
}
