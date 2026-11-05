'use client'

import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { KIND_LABEL, bairroById, gemsIn } from '@/content/gems'
import { HOUSE_RULES, TABLE_KINDS, inviteText, type HouseRule } from '@/content/table-night'
import { setDisplayName } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'
import { track } from '@/engine/analytics'
import { SayLine, whenText } from './bits'

/** Next Friday (or this one, if it is still early in the week), 20:00, as input values. */
function defaultWhen(now = new Date()): { date: string; time: string } {
  const d = new Date(now)
  const add = (5 - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + add)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: '20:00' }
}

/**
 * /table/new — PUT A TABLE TOGETHER (2026-11-03).
 *
 * Four things, on one screen, in the order a host thinks them: where, when, how much
 * Portuguese, and who is asking. The places are the City's gems where people sit and eat or
 * drink — real places, each with its line — or anywhere the host types. Done: the invite,
 * through the phone's own share sheet.
 */
export function HostTable() {
  const learner = useLearner()
  /* Your own city's places to sit first (2026-11-05: Cascais and Sintra have their own). */
  const chapter = learner.chapter ?? 'lisbon'
  const places = useMemo(() => gemsIn(chapter).filter((g) => (TABLE_KINDS as readonly string[]).includes(g.kind)), [chapter])
  const [gemId, setGemId] = useState<string | null>(null)
  /* Arriving from a venue card's "host a table here" (2026-11-04): that place, chosen. */
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get('gem')
    if (want && places.some((g) => g.id === want)) setGemId(want)
  }, [places])
  const [other, setOther] = useState('')
  const [elsewhere, setElsewhere] = useState(false)
  const start = useMemo(() => defaultWhen(), [])
  const [date, setDate] = useState(start.date)
  const [time, setTime] = useState(start.time)
  const [rule, setRule] = useState<HouseRule>('ten')
  const [name, setName] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [made, setMade] = useState<{ code: string; place: string; when: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const host = name ?? learner.display_name ?? ''
  const gem = places.find((g) => g.id === gemId)
  const place = elsewhere ? other.trim() : gem?.name ?? ''
  const ready = Boolean(place && date && time && host.trim())

  async function make() {
    if (!ready) return
    setBusy(true)
    setNote(null)
    try {
      const sitsAt = new Date(date + 'T' + time).toISOString()
      const r = await fetch('/api/hosted', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ host: host.trim(), gem: elsewhere ? null : gemId, place, sitsAt, rule }),
      })
      const d = (await r.json().catch(() => ({}))) as { code?: string; error?: string }
      if (!r.ok || !d.code) {
        setNote(d.error === 'unavailable' ? 'Tables are not open on this build yet.' : d.error ? 'Check the ' + d.error + '.' : 'Something went wrong — try again.')
        return
      }
      if (!learner.display_name && host.trim()) setDisplayName(host.trim())
      track('table_hosted', { rule, gem: elsewhere ? 'own' : gemId })
      setMade({ code: d.code, place, when: sitsAt })
    } catch {
      setNote('No connection — try again.')
    } finally {
      setBusy(false)
    }
  }

  if (made) {
    const url = (typeof window === 'undefined' ? '' : window.location.origin) + '/t/' + made.code
    const text = inviteText({ host: host.trim(), place: made.place, when: whenText(made.when), rule, url })
    return (
      <>
      <div data-stage="TABLE" className="booker min-h-svh px-5 py-8 text-[#f4ead6]">
        <main className="mx-auto flex max-w-md flex-col gap-5" data-testid="table-made">
          <p className="eyebrow text-[#e5b04a]">Table laid</p>
          <h1 className="display text-4xl leading-tight">Now invite your people.</h1>
          <article className="rounded-3xl bg-[#f4ead6] p-5 text-[#1a2430]">
            <p className="eyebrow text-[0.6rem] text-telha">{host.trim()} is putting a table together</p>
            <p className="display mt-1 text-2xl leading-tight">{made.place}</p>
            <p className="text-sm">{whenText(made.when)}</p>
            <p className="mt-3 border-t border-dashed border-[#1a2430]/30 pt-3 text-sm">
              <span className="font-semibold">House rule · </span>
              {HOUSE_RULES.find((r) => r.id === rule)?.rule}
            </p>
          </article>
          <button
            type="button"
            data-testid="table-share"
            onClick={async () => {
              track('table_invite_shared', {})
              if (navigator.share) {
                try {
                  await navigator.share({ text })
                  return
                } catch {
                  /* cancelled — fall through to copy */
                }
              }
              await navigator.clipboard?.writeText(text)
              setCopied(true)
            }}
            className="tap-target eyebrow rounded-2xl bg-[#e5b04a] px-5 py-4 text-[#0f1f33]"
          >
            {copied ? 'Copied — paste it to your friends' : 'Send the invite'}
          </button>
          <p className="break-all text-center font-mono text-xs text-white/60">{url}</p>
          <Link href={'/t/' + made.code} className="tap-target eyebrow rounded-2xl border border-white/30 px-5 py-3 text-center">
            Open your table
          </Link>
          <p className="text-sm text-white/70">
            Only people with this link can join. Each of them gets the lines for the night on their own phone, with a voice, before they arrive.
          </p>
        </main>
        <BottomNavSpace />
      </div>
      <BottomNav />
      </>
    )
  }

  return (
    <>
    <div data-stage="TABLE" className="min-h-svh bg-bg text-fg">
      <header className="booker safe-top px-5 pb-6 pt-6 text-[#f4ead6]">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <Link href="/table" className="eyebrow w-fit text-white/70">
            ← Your table
          </Link>
          <h1 className="display text-3xl leading-tight">Host a table</h1>
          <p className="text-sm text-white/75">A real place, your own friends, and Portuguese for the first part of the night.</p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-7 px-5 py-6 pb-16">
        <section className="flex flex-col gap-3">
          <h2 className="eyebrow text-telha">1 · Where</h2>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Where">
            {places.map((g) => {
              const on = !elsewhere && gemId === g.id
              return (
                <button
                  key={g.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  data-testid="table-place"
                  onClick={() => {
                    setElsewhere(false)
                    setGemId(g.id)
                  }}
                  className={'tap-target rounded-2xl border px-4 py-3 text-left ' + (on ? 'border-accent bg-accent/10' : 'border-line bg-bg-elev')}
                >
                  <span className="eyebrow block text-[0.6rem] text-muted">
                    {KIND_LABEL[g.kind]} · {bairroById(g.bairro).name}
                  </span>
                  <span className="block font-semibold">{g.name}</span>
                  {on ? <span className="mt-1 block text-sm text-muted">{g.why}</span> : null}
                </button>
              )
            })}
            <button
              type="button"
              role="radio"
              aria-checked={elsewhere}
              onClick={() => setElsewhere(true)}
              className={'tap-target rounded-2xl border px-4 py-3 text-left ' + (elsewhere ? 'border-accent bg-accent/10' : 'border-dashed border-line')}
            >
              <span className="block font-semibold">Somewhere else</span>
              <span className="block text-sm text-muted">Your local, a friend’s flat, a picnic on the miradouro.</span>
            </button>
            {elsewhere ? (
              <input
                autoFocus
                value={other}
                onChange={(e) => setOther(e.target.value)}
                maxLength={80}
                placeholder="Where — name and street"
                data-testid="table-other"
                className="rounded-2xl border border-line bg-bg-elev px-4 py-3 outline-none focus:border-accent"
              />
            ) : null}
          </div>
          {gem && !elsewhere ? (
            <ul className="flex flex-col gap-2">
              <p className="eyebrow text-[0.6rem] text-muted">Everyone gets this line for walking in</p>
              <SayLine line={gem.line} />
            </ul>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="eyebrow text-telha">2 · When</h2>
          <div className="grid grid-cols-[1.4fr_1fr] gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
              className="rounded-2xl border border-line bg-bg-elev px-4 py-3"
              aria-label="Date"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
              className="rounded-2xl border border-line bg-bg-elev px-4 py-3"
              aria-label="Time"
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="eyebrow text-telha">3 · How much Portuguese</h2>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="House rule">
            {HOUSE_RULES.map((r) => (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={rule === r.id}
                data-testid={'table-rule-' + r.id}
                onClick={() => setRule(r.id)}
                className={'tap-target rounded-2xl border px-4 py-3 text-left ' + (rule === r.id ? 'border-accent bg-accent/10' : 'border-line bg-bg-elev')}
              >
                <span className="block font-semibold">{r.name}</span>
                <span className="block text-sm">{r.rule}</span>
                <span className="block text-xs text-muted">{r.for}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="eyebrow text-telha">4 · Who’s hosting</h2>
          <input
            value={host}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Your first name"
            data-testid="table-name"
            className="rounded-2xl border border-line bg-bg-elev px-4 py-3 outline-none focus:border-accent"
          />
        </section>

        {note ? <p className="text-sm text-telha">{note}</p> : null}
        <button
          type="button"
          disabled={!ready || busy}
          onClick={make}
          data-testid="table-make"
          className="tap-target eyebrow rounded-2xl bg-accent px-5 py-4 text-accent-ink disabled:opacity-40"
        >
          {busy ? 'Laying the table…' : ready ? 'Lay the table' : 'Pick a place, a time and your name'}
        </button>
      </main>
      <BottomNavSpace />
    </div>
    <BottomNav />
    </>
  )
}
