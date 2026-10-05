'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { band, SEATS } from '@/content/table'

interface Person {
  name: string
  said_cold: number
}

interface Row {
  id: string
  place: string
  area: string | null
  sitsAt: string
  seats: number
  taken: number
  state: string
  people: Person[]
}

/**
 * PUTTING A TABLE ON THE BOARD.
 *
 * Sam: "build the table builder."
 *
 * A place, an area, a date and a time. That is the whole form, because that is the whole
 * of what DUB decides about an evening — see lib/tables.ts for why there is no venue
 * record, no booking reference and no capacity beyond six seats.
 *
 * THE KEY IS NOT STORED, which is the one piece of security hygiene this screen owes.
 * It is held in component state for the length of the visit and sent as a header on each
 * call; putting it in localStorage would leave the admin key on whatever device last
 * opened this page, and in a query string would write it into logs and browser history —
 * the exact mistake app/api/comp/issue/route.ts already records having made once.
 */
export function TableBuilder() {
  const [key, setKey] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [place, setPlace] = useState('')
  const [area, setArea] = useState('')
  const [when, setWhen] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    async (k: string) => {
      if (!k) return
      try {
        const r = await fetch('/api/tables/make', { headers: { 'x-admin-key': k } })
        if (!r.ok) {
          setRows(null)
          setNote(r.status === 404 ? 'That key is not right.' : 'Could not load.')
          return
        }
        const d = (await r.json()) as { tables?: Row[] }
        setRows(Array.isArray(d.tables) ? d.tables : [])
        setNote(null)
      } catch {
        setNote('Could not reach the server.')
      }
    },
    [],
  )

  useEffect(() => {
    if (key) load(key)
  }, [key, load])

  async function create() {
    setBusy(true)
    setNote(null)
    try {
      const r = await fetch('/api/tables/make', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ place, area, sitsAt: new Date(when).toISOString() }),
      })
      const d = (await r.json()) as { id?: string; error?: string }
      if (d.id) {
        setNote('Table is up. Members can take a seat now.')
        setPlace('')
        setArea('')
        setWhen('')
        await load(key)
      } else {
        setNote(d.error ?? 'Could not create it.')
      }
    } catch {
      setNote('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  async function callOff(id: string) {
    setBusy(true)
    try {
      await fetch('/api/tables/make', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ callOff: id }),
      })
      await load(key)
      setNote('Called off. Anybody who had a seat still has the row.')
    } finally {
      setBusy(false)
    }
  }

  const field =
    'w-full rounded border border-line bg-surface px-3 py-3 text-base text-fg placeholder:text-muted focus:border-accent focus:outline-none'

  return (
    <PageShell eyebrow="TABLES" stage="REAL WORLD" back="/admin" backLabel="ADMIN">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
          <h1 className="display text-balance text-2xl">Put a table up.</h1>
          <p className="text-sm leading-relaxed text-muted">
            A place somebody else already chose, and a time. {SEATS} seats. DUB does not
            book it or pay for it.
          </p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin key"
            aria-label="Admin key"
            data-testid="tb-key"
            className={field + ' mt-3'}
          />
        </div>

        {key ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
            <p className="eyebrow text-accent">NEW TABLE</p>
            <input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Where — e.g. Cervejaria Ramiro"
              aria-label="Place"
              data-testid="tb-place"
              className={field}
            />
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Area — e.g. Intendente"
              aria-label="Area"
              data-testid="tb-area"
              className={field}
            />
            {/*
              datetime-local, so the person typing it is working in the time the evening
              actually happens rather than converting one in their head. It is sent as an
              ISO string, which is the only form that survives a timezone.
            */}
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              aria-label="When"
              data-testid="tb-when"
              className={field}
            />
            <button
              type="button"
              data-testid="tb-create"
              disabled={busy || !place.trim() || !when}
              onClick={create}
              className="tap-target eyebrow mt-3 w-full rounded bg-accent px-5 py-3 text-center text-accent-ink disabled:bg-chip disabled:text-muted"
            >
              PUT IT UP
            </button>
          </div>
        ) : null}

        {note ? (
          <p data-testid="tb-note" className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
            {note}
          </p>
        ) : null}

        {rows?.length ? (
          <ul data-testid="tb-list" className="flex flex-col gap-3">
            {rows.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6"
              >
                <p className="eyebrow text-telha">
                  {new Date(t.sitsAt).toLocaleString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <h2 className="display text-xl">{t.place}</h2>
                {t.area ? <p className="text-sm text-muted">{t.area}</p> : null}
                <p className="text-sm text-muted">
                  {t.taken} of {t.seats} taken · {t.state}
                </p>
                {/*
                  WHO IS COMING, which is the one thing this screen exists to show that
                  the member's own cannot: the whole table rather than everybody else.
                  Still only a first name and a band — see whoElse.
                */}
                {t.people.length ? (
                  <ul className="flex flex-col gap-1 border-t border-line pt-3">
                    {t.people.map((p) => (
                      <li key={p.name + p.said_cold} className="flex items-baseline gap-3 text-sm">
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-muted">{band(p.said_cold)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {t.state === 'open' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => callOff(t.id)}
                    className="tap-target eyebrow w-full rounded border border-line-strong px-5 py-3 text-center text-muted"
                  >
                    CALL IT OFF
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </PageShell>
  )
}
