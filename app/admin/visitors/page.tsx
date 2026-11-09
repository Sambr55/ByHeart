'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageShell } from '@/components/PageShell'

interface Data {
  now: { devices: number; signed_in: number }
  totals: { devices: number; consented: number; accounts: number; push_live: number; visitors_week: number }
  days: { day: string; visitors: number; new_devices: number; sign_ins: number; new_accounts: number }[]
  people: {
    email: string
    display_name: string | null
    created_at: string
    last_seen: string | null
    here_now: boolean
    devices: number
    push: boolean
    level: number
    rooms: number
    purpose: string | null
    chapter: string | null
  }[]
  devices: {
    device: string
    name: string | null
    created_at: string
    last_seen: string
    push: boolean
    level: number
    rooms: number
    purpose: string | null
    chapter: string | null
  }[]
}

/**
 * WHO HAS BEEN HERE (Sam, 2026-11-09). Visitors, sign-ins, and every account with where they
 * have got to. Read by /api/admin/visitors, behind the same admin key as the other pages.
 */
export default function PeoplePage() {
  const [key, setKey] = useState('')
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'people' | 'devices'>('people')

  const load = useCallback(async (k: string) => {
    setError('')
    try {
      const res = await fetch('/api/admin/visitors', { headers: { 'x-admin-key': k } })
      const body = (await res.json()) as Data & { error?: string }
      if (!res.ok || body.error) {
        setError(body.error ?? 'could not load')
        return
      }
      sessionStorage.setItem('dub.admin.key', k)
      setData(body)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'network error')
    }
  }, [])

  useEffect(() => {
    const k = sessionStorage.getItem('dub.admin.key') ?? ''
    setKey(k)
    if (k) void load(k)
  }, [load])

  const max = Math.max(1, ...(data?.days ?? []).map((d) => d.visitors))
  const week = (data?.days ?? []).slice(0, 7)
  const sum = (k: 'visitors' | 'sign_ins' | 'new_devices' | 'new_accounts') => week.reduce((n, d) => n + d[k], 0)

  return (
    <PageShell eyebrow="DUB · VISITORS" stage="CHOICE" back="/admin" backLabel="ADMIN">
      <h1 className="display text-3xl">Who has been here</h1>
      {/* Its pair: sign-ups, trials, paying and cancels (#44). */}
      <a href="/admin/people" className="mt-2 inline-block text-sm text-accent underline underline-offset-4">
        Sign-ups &amp; billing →
      </a>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Visitors are devices that opened the app after agreeing to the terms. Visits are only
        counted from 9 Nov 2026, when the app started telling the server — earlier days undercount.
      </p>

      <div className="mt-6 flex gap-3">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          type="password"
          className="flex-1 rounded border border-line bg-surface px-3 py-3 font-mono text-xs text-fg outline-none focus:border-accent"
        />
        <button type="button" onClick={() => load(key)} className="tap-target eyebrow rounded bg-accent px-4 text-accent-ink">
          LOAD
        </button>
      </div>
      {error ? <p className="mt-3 text-xs text-coach">{error}</p> : null}

      {data ? (
        <div className="mt-6 flex flex-col gap-6" data-testid="admin-people">
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat n={data.now.devices} label="Here now" note={data.now.signed_in + ' signed in'} live />
            <Stat n={data.totals.visitors_week} label="Visitors, 7 days" note={sum('new_devices') + ' new devices'} />
            <Stat n={data.totals.accounts} label="Accounts" note={sum('sign_ins') + ' sign-ins this week'} />
            <Stat n={data.totals.push_live} label="Notifications on" note={data.totals.consented + ' of ' + data.totals.devices + ' devices agreed'} />
          </section>

          <section className="rounded-2xl border border-line bg-bg-elev p-4">
            <p className="eyebrow text-accent">Visitors a day · last 30</p>
            <div className="mt-3 flex h-28 items-end gap-[2px]" aria-label="Visitors per day for the last 30 days">
              {[...data.days].reverse().map((d) => (
                <span
                  key={d.day}
                  title={`${d.day}: ${d.visitors} visitors, ${d.new_devices} new, ${d.sign_ins} sign-ins`}
                  className="flex-1 rounded-t bg-accent/80"
                  style={{ height: Math.max(2, (d.visitors / max) * 100) + '%' }}
                />
              ))}
            </div>
            <table className="mt-4 w-full text-left text-sm tabular-nums">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-1 font-normal">Day</th>
                  <th className="py-1 text-right font-normal">Visitors</th>
                  <th className="py-1 text-right font-normal">New</th>
                  <th className="py-1 text-right font-normal">Sign-ins</th>
                  <th className="py-1 text-right font-normal">Accounts</th>
                </tr>
              </thead>
              <tbody>
                {week.map((d) => (
                  <tr key={d.day} className="border-t border-line">
                    <td className="py-1">{d.day.slice(5)}</td>
                    <td className="py-1 text-right">{d.visitors}</td>
                    <td className="py-1 text-right">{d.new_devices}</td>
                    <td className="py-1 text-right">{d.sign_ins}</td>
                    <td className="py-1 text-right">{d.new_accounts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-1 rounded-full border border-line bg-bg-elev p-1">
              {(['people', 'devices'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={'tap-target eyebrow rounded-full px-3 py-2 text-[0.65rem] ' + (tab === t ? 'bg-accent text-accent-ink' : 'text-muted')}
                >
                  {t === 'people' ? 'Signed in · ' + data.people.length : 'Not signed in · ' + data.devices.length}
                </button>
              ))}
            </div>

            <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-bg-elev">
              {tab === 'people'
                ? data.people.map((p) => (
                    <li key={p.email} className="flex items-start justify-between gap-3 px-4 py-3">
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          {p.here_now ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#4cc38a]" title="Here now" /> : null}
                          <span className="truncate font-semibold">{p.display_name || '—'}</span>
                        </span>
                        <span className="block truncate text-xs text-muted">{p.email}</span>
                        <span className="block text-xs text-muted">
                          Joined {short(p.created_at)} · {p.devices} {p.devices === 1 ? 'device' : 'devices'}
                          {p.push ? ' · notifications on' : ''}
                        </span>
                      </span>
                      <Where level={p.level} rooms={p.rooms} purpose={p.purpose} seen={p.last_seen} />
                    </li>
                  ))
                : data.devices.map((d) => (
                    <li key={d.device} className="flex items-start justify-between gap-3 px-4 py-3">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{d.name || 'Anonymous'}</span>
                        <span className="block font-mono text-xs text-muted">{d.device}</span>
                        <span className="block text-xs text-muted">
                          First seen {short(d.created_at)}
                          {d.push ? ' · notifications on' : ''}
                        </span>
                      </span>
                      <Where level={d.level} rooms={d.rooms} purpose={d.purpose} seen={d.last_seen} />
                    </li>
                  ))}
            </ul>
          </section>
        </div>
      ) : null}
    </PageShell>
  )
}

function Stat({ n, label, note, live = false }: { n: number; label: string; note: string; live?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-bg-elev px-4 py-3">
      <p className="flex items-center gap-2">
        {live ? <span className="h-2 w-2 rounded-full bg-[#4cc38a]" /> : null}
        <span className="display text-3xl leading-none tabular-nums">{n}</span>
      </p>
      <p className="eyebrow mt-1 text-[0.6rem] text-accent">{label}</p>
      <p className="text-xs text-muted">{note}</p>
    </div>
  )
}

function Where({ level, rooms, purpose, seen }: { level: number; rooms: number; purpose: string | null; seen: string | null }) {
  return (
    <span className="shrink-0 text-right text-xs">
      <span className="block font-semibold">{rooms ? 'Level ' + level : 'Not started'}</span>
      <span className="block text-muted">
        {rooms} {rooms === 1 ? 'room' : 'rooms'}
        {purpose ? ' · ' + purpose : ''}
      </span>
      <span className="block text-muted">{seen ? ago(seen) : 'never'}</span>
    </span>
  )
}

function short(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function ago(iso: string): string {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (m < 2) return 'just now'
  if (m < 60) return m + ' min ago'
  const h = Math.round(m / 60)
  if (h < 24) return h + ' h ago'
  const d = Math.round(h / 24)
  return d === 1 ? 'yesterday' : d + ' days ago'
}
