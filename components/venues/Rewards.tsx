'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { track } from '@/engine/analytics'
import { useVenues } from '@/components/city/useVenues'

/**
 * YOUR REWARDS (Sam, 2026-11-05: "actual reward on the ground"). Every voucher a venue's
 * count has unlocked for this learner, and the screen they show at the counter: a live
 * clock and a moving band so a screenshot does not pass, and a PIN pad for the staff.
 */
interface Voucher {
  id: string
  gem: string
  venue: string
  tier: 1 | 2 | 3
  what: string
  usedAt: string | null
  locked: boolean
}

const RESULT: Record<string, string> = {
  wrong: 'That PIN isn’t right. Try again.',
  locked: 'Too many wrong PINs: this reward is locked. Ask DUB to help.',
  spent: 'This reward has already been used.',
  cap: 'This week’s ones are all gone here. Come back next week.',
  gone: 'This reward isn’t yours, or has gone.',
  unavailable: 'Rewards aren’t available right now.',
}

export function Rewards() {
  const v = useVenues()
  const [list, setList] = useState<Voucher[] | null>(null)
  const [open, setOpen] = useState<Voucher | null>(null)
  const load = useCallback(() => {
    void fetch('/api/venues/vouchers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setList(j.vouchers ?? []))
      .catch(() => setList([]))
  }, [])
  useEffect(load, [load])

  return (
    <PageShell eyebrow="YOUR REWARDS">
      <div className="flex flex-col gap-4" data-testid="rewards">
        {!v.signedIn ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
            <p className="text-base leading-relaxed">Sign in to see your rewards: check-ins at DUB venues count once you have an account.</p>
            <Link href="/signin?next=%2Frewards" className="tap-target eyebrow rounded-full bg-accent px-6 py-3 text-center text-accent-ink">
              Sign in
            </Link>
          </div>
        ) : list === null ? (
          <p className="text-muted">Loading…</p>
        ) : list.length === 0 ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-line bg-bg-elev px-5 py-6" data-testid="rewards-empty">
            <p className="display text-2xl">Nothing to spend yet.</p>
            <p className="text-sm leading-relaxed text-muted">
              Check in at the places on your board. When enough DUB learners have said it at a DUB venue, everyone who has gets a reward there — you included.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  disabled={Boolean(w.usedAt) || w.locked}
                  onClick={() => setOpen(w)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-4 text-left disabled:opacity-50"
                  data-testid="voucher"
                >
                  <span className="min-w-0">
                    <span className="eyebrow block text-[#c9973b]">{w.venue}</span>
                    <span className="display block text-xl leading-tight">{w.what}</span>
                  </span>
                  <span className="eyebrow shrink-0 text-muted">{w.usedAt ? 'Used' : w.locked ? 'Locked' : 'Show →'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {open ? (
        <Spend
          w={open}
          onClose={() => {
            setOpen(null)
            load()
          }}
        />
      ) : null}
    </PageShell>
  )
}

/** The counter screen: show it, the staff type their PIN, it's spent. */
function Spend({ w, onClose }: { w: Voucher; onClose: () => void }) {
  const [now, setNow] = useState(() => new Date())
  const [pin, setPin] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [used, setUsed] = useState(false)
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])
  async function spend() {
    const r = await fetch('/api/venues/redeem', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: w.id, pin }) }).catch(() => null)
    const j = r ? await r.json().catch(() => ({})) : {}
    if (j.result === 'used') {
      setUsed(true)
      track('voucher_used', { gem: w.gem, tier: w.tier })
    } else {
      setMsg(RESULT[j.result] ?? RESULT.unavailable)
      setPin('')
    }
  }
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#14243a] px-5 pb-8 pt-20 text-white" data-testid="voucher-spend">
      <button type="button" onClick={onClose} className="tap-target eyebrow absolute right-5 top-5 rounded-full border border-white/40 px-3 py-1">
        Close
      </button>
      <div className="voucher-live relative flex flex-col items-center gap-2 overflow-hidden rounded-3xl bg-[#e5b04a] px-6 py-8 text-center text-[#14243a]">
        <p className="eyebrow">{w.venue}</p>
        <p className="display text-4xl leading-tight">{w.what}</p>
        <p className="text-sm">For a DUB learner who said it here.</p>
        <p className="mt-2 font-mono text-2xl tabular-nums" aria-label="The time now">
          {now.toLocaleTimeString('en-GB')}
        </p>
      </div>
      {used ? (
        <p className="display mt-8 text-center text-4xl text-[#e5b04a]" lang="pt-PT" data-testid="voucher-used">
          Bom proveito!
        </p>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="eyebrow text-white/70">For staff: type your PIN to use it</p>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            type="password"
            aria-label="Staff PIN"
            className="w-40 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white"
            data-testid="voucher-pin"
          />
          <button type="button" disabled={pin.length !== 4} onClick={spend} className="tap-target eyebrow rounded-full bg-[#e5b04a] px-8 py-3 text-[#14243a] disabled:opacity-40" data-testid="voucher-use">
            Use it
          </button>
          {msg ? <p className="text-sm text-white/80">{msg}</p> : null}
        </div>
      )}
    </div>
  )
}
