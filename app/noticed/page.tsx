import { Noticed } from '@/components/Noticed'

export const metadata = { title: 'What I have noticed — DUB' }

/**
 * /noticed — the teacher's own page.
 *
 * Everything on it is derived from the learner record at render, so there is nothing to
 * cache and nothing that can go stale. Dynamic for the same reason /vibes is: every pixel
 * is drawn from storage after hydration, and a cached shell is all of the staleness and
 * none of the speed.
 */
export const dynamic = 'force-dynamic'

export default function NoticedPage() {
  return <Noticed />
}
