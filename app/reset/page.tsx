import { Reset } from '@/components/Reset'

export const metadata = {
  title: 'Start again — DUB',
  // Not a page for search engines. It is a testing tool with a destructive button on it.
  robots: { index: false, follow: false },
}

export default function ResetPage() {
  return <Reset />
}
