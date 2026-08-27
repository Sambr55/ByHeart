'use client'

import { useState } from 'react'
import { welcomeToClub } from '@/engine/learner'

/**
 * Redeeming a code.
 *
 * Quiet and last on the page: almost nobody has one, and a prominent box asking for a
 * code you do not have reads as a discount hunt. The people who do have one were handed
 * it personally and know to look.
 *
 * Lives in its own file because /account redirects a signed-out visitor to /signin, so
 * the one control a tester needs sat behind the exact wall it exists to get them past.
 * It is now rendered on both sides of that redirect.
 */
export function RedeemCode() {
  const [code, setCode] = useState('')
  const [state, setState] = useState<{ ok?: boolean; message?: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function redeem() {
    setBusy(true)
    setState(null)
    try {
      const res = await fetch('/api/comp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const body = (await res.json()) as {
        ok: boolean
        reason?: string
        until?: string | null
        bound?: 'account' | 'device'
        club?: boolean
      }
      setState({
        ok: body.ok,
        message: body.ok
          ? body.until
            ? 'Done — every vibe is open until ' +
              new Date(body.until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) +
              '.'
            : 'Done — every vibe is open.'
          : body.reason ?? 'That did not work.',
      })
      // The picker asks for entitlements once, on mount, so a redeemed code changes
      // nothing on screen until something reloads. Telling somebody to reload is a
      // worse product than reloading.
      if (body.ok) setTimeout(() => window.location.assign('/vibes'), 1400)
    } catch {
      setState({ ok: false, message: 'That did not work.' })
    }
    setBusy(false)
  }

  return (
    <section>
      <p className="eyebrow text-muted">GOT A CODE?</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABCD-1234"
          aria-label="Comp code"
          data-testid="comp-code"
          className="tap-target min-w-0 flex-1 rounded border border-line bg-surface px-3 py-3 text-sm uppercase tracking-widest text-fg placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          data-testid="comp-redeem"
          onClick={redeem}
          disabled={busy || !code.trim()}
          className="tap-target rounded-full border border-line px-5 py-3 text-xs tracking-widest disabled:opacity-40"
        >
          REDEEM
        </button>
      </div>
      {state ? (
        <p className={'mt-3 text-xs ' + (state.ok ? 'text-correct' : 'text-accent')}>{state.message}</p>
      ) : null}
    </section>
  )
}
