'use client'

import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { PageShell } from '@/components/PageShell'
import { gemById } from '@/content/gems'

/**
 * THE LOCAL PARTNER'S SHEET (Sam, 2026-11-05: "5 will be a local partner").
 *
 * Every venue, busiest first, with its count — the pitch: "48 of our learners have said it
 * here already." One tap makes a claim link to hand over on the venue's own phone, and the
 * venue's DUB card: a QR to print and keep behind the counter. The admin key is the same
 * as the other admin pages, kept in this tab only.
 */
interface Row {
  gem: string
  count: number
  status: 'none' | 'invited' | 'partner' | 'paused'
  card: string | null
  cardUrl: string | null
  contact: string | null
  used: number
}

export function VenuesAdmin() {
  const [key, setKey] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [made, setMade] = useState<Record<string, { claimUrl: string; cardUrl: string; qr: string }>>({})

  useEffect(() => setKey(sessionStorage.getItem('dub.admin.key') ?? ''), [])
  const load = useCallback(async (k: string) => {
    if (!k) return
    sessionStorage.setItem('dub.admin.key', k)
    const r = await fetch('/api/admin/venues', { headers: { 'x-admin-key': k } }).catch(() => null)
    if (!r?.ok) return setNote(r?.status === 403 ? 'That key is not right.' : 'Could not load.')
    setNote(null)
    setRows((await r.json()).venues)
  }, [])
  useEffect(() => void load(key), [key, load])

  async function post(body: object) {
    const r = await fetch('/api/admin/venues', { method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': key }, body: JSON.stringify(body) })
    return r.json()
  }
  async function showCard(gem: string, cardUrl: string) {
    const qr = await QRCode.toString(cardUrl, { type: 'svg', margin: 1, color: { dark: '#14243a', light: '#ffffff' } })
    setMade((m) => ({ ...m, [gem]: { claimUrl: '', cardUrl, qr } }))
  }
  async function invite(gem: string) {
    const j = await post({ gem })
    if (!j.claimUrl) return setNote('Could not make a link: ' + (j.error ?? 'error'))
    const qr = await QRCode.toString(j.cardUrl, { type: 'svg', margin: 1, color: { dark: '#14243a', light: '#ffffff' } })
    setMade((m) => ({ ...m, [gem]: { claimUrl: j.claimUrl, cardUrl: j.cardUrl, qr } }))
    void load(key)
  }

  return (
    <PageShell eyebrow="VENUES" stage="REAL WORLD" back="/admin" backLabel="ADMIN">
      <div className="flex flex-col gap-4">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          aria-label="Admin key"
          className="w-full rounded border border-line bg-surface px-3 py-3 text-base"
        />
        {note ? <p className="text-sm text-muted">{note}</p> : null}
        {rows ? (
          <ul className="flex flex-col gap-3" data-testid="venues-admin">
            {rows.map((r) => (
              <li key={r.gem} className="flex flex-col gap-2 rounded-2xl border border-line bg-bg-elev px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{gemById(r.gem)?.name ?? r.gem}</span>
                  <span className="display text-xl tabular-nums">{r.count}</span>
                </div>
                <p className="text-xs text-muted">
                  {r.status === 'none' ? 'Not signed up' : r.status === 'invited' ? 'Link sent, not signed up yet' : r.status === 'paused' ? 'Paused' : 'DUB venue'}
                  {r.contact ? ' · ' + r.contact : ''}
                  {r.used ? ' · ' + r.used + ' rewards used' : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => invite(r.gem)} className="eyebrow rounded-full border border-accent px-3 py-1 text-accent">
                    {r.status === 'none' ? 'Make sign-up link' : 'New sign-up link'}
                  </button>
                  {r.cardUrl ? (
                    <button type="button" onClick={() => showCard(r.gem, r.cardUrl!)} className="eyebrow rounded-full border border-line px-3 py-1 text-muted">
                      Card QR
                    </button>
                  ) : null}
                  {r.status === 'partner' || r.status === 'paused' ? (
                    <button type="button" onClick={async () => (await post({ gem: r.gem, paused: r.status === 'partner' }), load(key))} className="eyebrow rounded-full border border-line px-3 py-1 text-muted">
                      {r.status === 'partner' ? 'Pause' : 'Resume'}
                    </button>
                  ) : null}
                </div>
                {made[r.gem] ? (
                  <div className="flex flex-col gap-2 text-sm">
                    {made[r.gem].claimUrl ? <p>
                      Sign-up link (open it on the venue’s phone): <a className="break-all text-accent underline" href={made[r.gem].claimUrl}>{made[r.gem].claimUrl}</a>
                    </p> : null}
                    <p>The DUB card to print and keep behind the counter:</p>
                    <div className="w-40 rounded bg-white p-2" dangerouslySetInnerHTML={{ __html: made[r.gem].qr }} />
                    <p className="break-all text-xs text-muted">{made[r.gem].cardUrl}</p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </PageShell>
  )
}
