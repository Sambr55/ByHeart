'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { CHECKIN_ERRORS, checkIn, useVenues } from '@/components/city/useVenues'

/**
 * THE DUB CARD, SCANNED (2026-11-05). The learner asked for it at the counter — "Tem o
 * cartão DUB?" — which is the whole point: the proof they were there is a sentence said to a
 * person. Signed in, it checks in on arrival; signed out, it asks them to sign in and comes
 * straight back here.
 */
export function CardCheckIn({ code }: { code: string }) {
  const v = useVenues()
  const [state, setState] = useState<'wait' | 'ok' | 'error'>('wait')
  const [msg, setMsg] = useState('')
  const [count, setCount] = useState(0)
  const [ran, setRan] = useState(false)

  useEffect(() => {
    if (ran || !v.signedIn) return
    setRan(true)
    void checkIn(null, code).then((r) => {
      if (r.ok) {
        setCount(r.count)
        setState('ok')
      } else {
        setMsg(CHECKIN_ERRORS[r.error])
        setState('error')
      }
    })
  }, [v.signedIn, ran, code])

  return (
    <PageShell eyebrow="DUB CARD" back="/club" backLabel="PATH">
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-bg-elev px-5 py-8 text-center" data-testid="card-checkin">
        {!v.signedIn ? (
          <>
            <p className="display text-3xl" lang="pt-PT">
              Obrigado!
            </p>
            <p className="text-base leading-relaxed">You asked for the card. Sign in and this visit counts towards the venue’s rewards.</p>
            <Link href={'/signin?next=' + encodeURIComponent('/v/' + code)} className="tap-target eyebrow rounded-full bg-accent px-6 py-3 text-accent-ink">
              Sign in and check in
            </Link>
          </>
        ) : state === 'ok' ? (
          <>
            <p className="display text-4xl text-correct" lang="pt-PT">
              Boa!
            </p>
            <p className="text-base leading-relaxed">You’re checked in. {count === 1 ? 'You’re the first DUB learner here.' : count + ' DUB learners have said it here now.'}</p>
            <Link href="/rewards" className="tap-target eyebrow rounded-full bg-accent px-6 py-3 text-accent-ink">
              Your rewards
            </Link>
          </>
        ) : state === 'error' ? (
          <p className="text-base">{msg}</p>
        ) : (
          <p className="text-base text-muted">Checking you in…</p>
        )}
      </div>
    </PageShell>
  )
}
