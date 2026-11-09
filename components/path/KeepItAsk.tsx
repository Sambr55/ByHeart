'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { track } from '@/engine/analytics'
import { useEntitlements } from '@/engine/useEntitlements'
import { ASK_COPY, askNow, reached } from './signin-ask'

const KEY = 'dub.signin.ask'

function read(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/**
 * KEEP IT — the sign-in ask on the Path, after rooms 2 and 4 and at Level 2 (signin-ask.ts).
 *
 * Shown only when the server has answered that this person is not signed in and that
 * signing in works here, so it never flashes at somebody already in. One tap goes to
 * /signin and back to the Path; when sign-in by code lands (#44) that screen asks for the
 * six digits with no change here.
 */
export function KeepItAsk({ rooms, level }: { rooms: number; level: number }) {
  const access = useEntitlements()
  const [dismissed, setDismissed] = useState<string[] | null>(null)
  useEffect(() => setDismissed(read()), [])
  const moment = dismissed && access.known && access.signInReady && !access.signedIn ? askNow(rooms, level, dismissed) : null
  useEffect(() => {
    if (moment) track('signin_ask', { moment, action: 'shown' })
  }, [moment])
  if (!moment) return null

  const notNow = () => {
    const next = [...new Set([...(dismissed ?? []), ...reached(rooms, level)])]
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* then it asks again next time, which is the gentler failure */
    }
    track('signin_ask', { moment, action: 'not_now' })
    setDismissed(next)
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border-2 border-accent/40 bg-bg-elev px-5 py-5" data-testid="keep-it-ask" data-moment={moment}>
      <p className="eyebrow text-[0.65rem] text-accent">
        <span lang="pt-PT" className="pt normal-case tracking-normal">
          Guarda isto
        </span>{' '}
        · keep this
      </p>
      <p className="display text-xl leading-tight">{ASK_COPY[moment]}</p>
      <p className="text-sm leading-relaxed text-muted">
        Right now your rooms live on this phone only. Clear Safari or change phone and they’re gone. Sign in with
        your email — no password — and they follow you.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/signin?next=%2Fclub"
          onClick={() => track('signin_ask', { moment, action: 'sign_in' })}
          data-testid="keep-it-signin"
          className="tap-target eyebrow rounded-full bg-accent px-5 py-3 text-center text-accent-ink"
        >
          Keep them safe
        </Link>
        <button type="button" onClick={notNow} data-testid="keep-it-later" className="tap-target text-sm text-muted underline underline-offset-4">
          Not now
        </button>
      </div>
    </section>
  )
}
