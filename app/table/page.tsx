import { Tables } from '@/components/Tables'

export const metadata = {
  title: 'A table — DUB',
  /* Reachable from inside the Club, not from a search engine. */
  robots: { index: false, follow: false },
}

export default function TablePage() {
  return <Tables />
}
