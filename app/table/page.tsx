import { Tables } from '@/components/Tables'

export const metadata = {
  title: 'A table — DUB',
  /* Reachable from inside the Club, not from a search engine. */
  robots: { index: false, follow: false },
}

/*
  force-dynamic for the reason /inbox and /line have it: this page offers a push opt-in,
  and whether that opt-in can work at all is read from the environment at request time. A
  statically rendered copy would bake in whichever answer was true at build.
*/
export const dynamic = 'force-dynamic'

export default function TablePage() {
  /* Push needs both halves of the pair; the public key alone means nothing can be sent. */
  const pushReady = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  )
  return <Tables pushReady={pushReady} />
}
