import { VenuesAdmin } from '@/components/venues/VenuesAdmin'

export const metadata = { title: 'Venues — DUB', robots: { index: false, follow: false } }

export default function AdminVenuesPage() {
  return <VenuesAdmin />
}
