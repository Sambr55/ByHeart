import { VenueClaim } from '@/components/venues/VenueClaim'

export const metadata = { title: 'Join DUB — for venues', robots: { index: false, follow: false } }

export default async function VenueClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <VenueClaim token={token} />
}
