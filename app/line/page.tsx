import { Line } from '@/components/Line'

export const metadata = { title: 'Today — DUB' }
export const dynamic = 'force-dynamic'

export default function LinePage() {
  // Push needs both halves of the pair; the public key alone means the cron cannot send.
  const pushReady = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  )
  return <Line pushReady={pushReady} />
}
