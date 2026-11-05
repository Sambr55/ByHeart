'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

/** On Yours, above Your Lisbon: rewards waiting to be spent — and nothing at all when there are none. */
export function RewardsLink() {
  const [n, setN] = useState(0)
  useEffect(() => {
    void fetch('/api/venues/vouchers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j: { vouchers?: { usedAt: string | null; locked: boolean }[] }) => setN((j.vouchers ?? []).filter((v) => !v.usedAt && !v.locked).length))
      .catch(() => setN(0))
  }, [])
  if (!n) return null
  return (
    <Link href="/rewards" data-testid="yours-rewards" className="flex items-center justify-between gap-3 rounded-2xl bg-[#e5b04a] px-5 py-4 text-[#14243a]">
      <span>
        <span className="eyebrow block">Your rewards</span>
        <span className="display block text-xl">{n === 1 ? '1 to spend' : n + ' to spend'} in Lisbon</span>
      </span>
      <span aria-hidden className="text-2xl">→</span>
    </Link>
  )
}
