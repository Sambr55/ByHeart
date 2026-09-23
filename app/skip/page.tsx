import { Skip } from '@/components/Skip'

export const metadata = {
  title: 'Skip to the Club — DUB',
  // Not a page for search engines. It is a testing tool that writes to the learner record.
  robots: { index: false, follow: false },
}

export default function SkipPage() {
  return <Skip />
}
