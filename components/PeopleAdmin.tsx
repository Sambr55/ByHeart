'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageShell } from '@/components/PageShell'

/**
 * REGISTRATIONS, SIGN-UPS AND CANCELS (Sam, 2026-11-05). The numbers first, then a month day
 * by day, then the latest accounts and billing moments. The admin key is the same as every
 * other admin page and stays in this tab. lib/people.ts says what each number counts.
 */
type Report = {
  totals: Record<string, number>
  days: { day: string; learners: number; accounts: number; trials: number; converted: number; subscribed: number; cancels: number; ended: number }[]
  accounts: { email: string; at: string; plan: string; status: string; source: string | null; cancelling: boolean }[]
  events: { email: string | null; kind: string; detail: string | null; at: string }[]
  billingReady: boolean
  trialDays: number
}

const KIND: Record<string, string> = {
  trial_started: 'Started free week',
  converted: 'Trial → paying',
  subscribed: 'Subscribed',
  cancel_requested: 'Cancelled (access to period end)',
  cancel_undone: 'Took cancel back',
  ended: 'Subscription ended',
  payment_failed: 'Payment failed',
  comped: 'Free access',
}

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function PeopleAdmin() {
  const [key, setKey] = useState('')
  const [r, setR] = useState<Report | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [confirm, setConfirm] = useState('')
  useEffect(() => setKey(sessionStorage.getItem('dub.admin.key') ?? ''), [])
  const load = useCallback(async (k: string) => {
    if (!k) return
    sessionStorage.setItem('dub.admin.key', k)
    const res = await fetch('/api/admin/people', { headers: { 'x-admin-key': k } }).catch(() => null)
    if (!res?.ok) return setNote(res?.status === 403 ? 'That key is not right.' : 'Could not load.')
    setNote(null)
    setR(await res.json())
  }, [])
  useEffect(() => void load(key), [key, load])

  const t = r?.totals ?? {}
  const tile = (label: string, value: number | undefined, sub?: string) => (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-line bg-bg-elev px-4 py-3">
      <span className="eyebrow text-[0.6rem] text-muted">{label}</span>
      <span className="display text-3xl tabular-nums">{value ?? '—'}</span>
      {sub ? <span className="text-xs text-muted">{sub}</span> : null}
    </div>
  )

  return (
    <PageShell eyebrow="PEOPLE" stage="REAL WORLD" back="/admin" backLabel="ADMIN">
      <div className="flex flex-col gap-6" data-testid="people-admin">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          aria-label="Admin key"
          className="w-full rounded border border-line bg-surface px-3 py-3 text-base"
        />
        {note ? <p className="text-sm text-muted">{note}</p> : null}
        {r ? (
          <>
            {!r.billingReady ? <p className="text-sm text-muted">Stripe is not switched on yet: trials and payments will appear here once it is.</p> : null}
            <section className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="people-totals">
              {tile('Learners', t.learners, '+' + t.learners7 + ' this week · everyone, account or not')}
              {tile('Accounts', t.accounts, '+' + t.accounts7 + ' this week · signed up')}
              {tile('On the free week', t.trialing, r.trialDays + '-day trial')}
              {tile('Paying', t.paying)}
              {tile('Cancelling', t.cancelling, 'still have access to period end')}
              {tile('Ended', t.ended)}
              {tile('Payment failed', t.pastDue)}
              {tile('Free access', (t.compedAccounts ?? 0) + (t.compedDevices ?? 0), t.compedAccounts + ' accounts · ' + t.compedDevices + ' devices')}
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="eyebrow text-muted">Last 30 days</h2>
              <div className="overflow-x-auto rounded-2xl border border-line bg-bg-elev">
                <table className="w-full text-sm tabular-nums" data-testid="people-days">
                  <thead>
                    <tr className="text-left text-xs text-muted">
                      {['Day', 'Learners', 'Accounts', 'Trials', 'Trial→paid', 'Subscribed', 'Cancels', 'Ended'].map((h) => (
                        <th key={h} className="px-3 py-2 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.days.map((d) => (
                      <tr key={d.day} className="border-t border-line">
                        <td className="px-3 py-1.5 text-muted">{d.day.slice(5)}</td>
                        {[d.learners, d.accounts, d.trials, d.converted, d.subscribed, d.cancels, d.ended].map((v, i) => (
                          <td key={i} className={'px-3 py-1.5 ' + (v ? 'font-semibold' : 'text-muted/50')}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="eyebrow text-muted">Latest billing moments</h2>
              <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-bg-elev text-sm" data-testid="people-events">
                {r.events.length ? (
                  r.events.map((e, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 px-4 py-2">
                      <span className="min-w-0 truncate">
                        <span className="font-semibold">{KIND[e.kind] ?? e.kind}</span>
                        {e.detail ? <span className="text-muted"> · {e.detail}</span> : null} <span className="text-muted">{e.email ?? ''}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">{when(e.at)}</span>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-muted">Nothing yet.</li>
                )}
              </ul>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="eyebrow text-muted">Latest accounts</h2>
              <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-bg-elev text-sm" data-testid="people-accounts">
                {r.accounts.map((a) => (
                  <li key={a.email} className="flex items-baseline justify-between gap-3 px-4 py-2">
                    <span className="min-w-0 truncate">{a.email}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {a.source === 'comp' ? 'free access' : a.status === 'none' ? 'free' : a.status}
                      {a.cancelling ? ' · cancelling' : ''} · {when(a.at)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-2 rounded-2xl border border-[#c9973b] px-4 py-4">
              <h2 className="eyebrow text-[#c9973b]">Free access for existing users</h2>
              <p className="text-sm leading-relaxed">
                Gives everybody who is here right now — every account and every device — full access for good. Press it once, when Stripe goes live.
                Pressing it again only adds people who arrived since; it never touches anyone who pays.
              </p>
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type FREE FOR EXISTING" className="rounded border border-line bg-surface px-3 py-2 text-sm" />
              <button
                type="button"
                disabled={confirm !== 'FREE FOR EXISTING'}
                className="eyebrow self-start rounded-full bg-accent px-4 py-2 text-accent-ink disabled:opacity-40"
                onClick={async () => {
                  const res = await fetch('/api/admin/people', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', 'x-admin-key': key },
                    body: JSON.stringify({ action: 'comp-existing', confirm }),
                  })
                  const j = await res.json()
                  setNote(j.ok ? `Done: ${j.accounts} accounts and ${j.devices} devices now have free access.` : 'That did not work.')
                  setConfirm('')
                  void load(key)
                }}
                data-testid="comp-existing"
              >
                Give them free access
              </button>
            </section>
          </>
        ) : null}
      </div>
    </PageShell>
  )
}
