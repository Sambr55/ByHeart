import { Inbox } from '@/components/Inbox'

export const metadata = { title: 'Inbox — DUB' }
/*
  force-dynamic for the same reason /line has it: the page offers a push opt-in, and
  whether that opt-in can work at all is read from the environment at request time. A
  statically rendered copy would bake in whichever answer was true at build.
*/
export const dynamic = 'force-dynamic'

export default function InboxPage() {
  /* Push needs both halves of the pair; the public key alone means the cron cannot send. */
  const pushReady = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  )
  return <Inbox pushReady={pushReady} />
}
