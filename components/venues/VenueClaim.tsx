'use client'

import { useEffect, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { FIRST_REWARD, PAIR_REWARD, PAIR_WINDOW_H, REWARD_TIERS, SECOND_OFFERS, type SecondOffer } from '@/content/board'

/**
 * A VENUE SIGNS UP, ON ITS OWN PHONE, IN FIVE MINUTES (Sam, 2026-11-05: "a very simple
 * mechanic"; "5 will be a local partner"). The partner walks in with this link — made on
 * /admin/venues — and hands over the phone. The venue says who to call, picks what it
 * gives at 150 (Sam: "let venues choose"), and sets a 4-digit PIN its staff type to spend
 * a voucher. No app, no till, no account. The same link edits it later.
 *
 * DRAFT COPY: the agreement line below is a placeholder until Sam approves the venue terms.
 */
export function VenueClaim({ token }: { token: string }) {
  const [v, setV] = useState<{ name: string; address: string; claimed: boolean; card: string; draw: boolean } | null | 'gone'>(null)
  const [contactName, setContactName] = useState('')
  const [contact, setContact] = useState('')
  const [pin, setPin] = useState('')
  const [first, setFirst] = useState(true)
  const [second, setSecond] = useState<SecondOffer>('small_item')
  const [item, setItem] = useState('')
  const [cap, setCap] = useState('')
  const [pairOn, setPairOn] = useState(false)
  const [pairItem, setPairItem] = useState('')
  const [agree, setAgree] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    void fetch('/api/venues/claim/' + encodeURIComponent(token))
      .then((r) => (r.ok ? r.json() : 'gone'))
      .then(setV)
      .catch(() => setV('gone'))
  }, [token])

  const field = 'w-full rounded border border-line bg-surface px-3 py-3 text-base text-fg focus:border-accent focus:outline-none'
  if (v === null) return <PageShell eyebrow="DUB FOR VENUES" back="/" backLabel="DUB"><p className="text-muted">Loading…</p></PageShell>
  if (v === 'gone')
    return (
      <PageShell eyebrow="DUB FOR VENUES" back="/" backLabel="DUB">
        <p className="text-base">This link has expired. Ask your DUB contact for a new one.</p>
      </PageShell>
    )

  const offers = (Object.keys(SECOND_OFFERS) as SecondOffer[]).filter((k) => k !== 'meal_draw' || v.draw)
  const ok = contactName.trim() && contact.trim() && /^\d{4}$/.test(pin) && agree

  async function save() {
    setNote(null)
    const r = await fetch('/api/venues/claim/' + encodeURIComponent(token), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contactName, contact, pin, offerFirst: first, offerSecond: second, item, cap: cap ? Number(cap) : null, offerPair: pairOn, pairItem }),
    }).catch(() => null)
    const j = r ? await r.json().catch(() => ({})) : {}
    if (j.result === 'ok') setDone(true)
    else setNote(j.result === 'pin' ? 'The PIN must be 4 numbers.' : 'That didn’t save. Try again.')
  }

  if (done)
    return (
      <PageShell eyebrow="DUB FOR VENUES" back="/" backLabel="DUB">
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6" data-testid="claim-done">
          <p className="display text-3xl" lang="pt-PT">Bem-vindos!</p>
          <p className="text-base leading-relaxed">
            {v.name} is a DUB venue. Your DUB card and window sticker are on their way. Keep the card behind the counter: learners ask for it in
            Portuguese, scan it, and their visit counts.
          </p>
          <p className="text-sm text-muted">To spend a reward, the learner shows it on their phone and one of your team types the PIN.</p>
        </div>
      </PageShell>
    )

  return (
    <PageShell eyebrow="DUB FOR VENUES" back="/" backLabel="DUB">
      <div className="flex flex-col gap-5 rounded-2xl border border-line bg-bg-elev px-5 py-6" data-testid="venue-claim">
        <div className="flex flex-col gap-1">
          <h1 className="display text-balance text-2xl">{v.name}</h1>
          <p className="text-sm text-muted">{v.address}</p>
        </div>
        <p className="text-base leading-relaxed">
          People learning Portuguese with DUB come here to say their first sentences to a real person. When enough of them have, you reward them.
          You choose what, and you can pause at any time.
        </p>

        <label className="flex items-start gap-3">
          <input type="checkbox" checked={first} onChange={(e) => setFirst(e.target.checked)} className="mt-1 h-5 w-5 accent-[#1f5d8c]" />
          <span>
            <span className="block font-semibold">At {REWARD_TIERS.first} learners: {FIRST_REWARD}</span>
            <span className="block text-sm text-muted">For every DUB learner who has checked in here, once each.</span>
          </span>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-semibold">At {REWARD_TIERS.second} learners, you choose:</legend>
          {offers.map((k) => (
            <label key={k} className="flex items-start gap-3">
              <input type="radio" name="second" checked={second === k} onChange={() => setSecond(k)} className="mt-1 h-5 w-5 accent-[#1f5d8c]" />
              <span className="text-sm">{SECOND_OFFERS[k].venue}</span>
            </label>
          ))}
          {second === 'small_item' || second === 'meal_all' ? (
            <input value={item} onChange={(e) => setItem(e.target.value)} placeholder={second === 'small_item' ? 'What? e.g. a coffee and a pastel de nata' : 'Which meal? e.g. the dish of the day'} className={field} />
          ) : null}
          {second === 'meal_all' ? (
            <input value={cap} onChange={(e) => setCap(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Most per week (e.g. 10)" className={field} />
          ) : null}
        </fieldset>

        {/* Bica a dois (2026-11-05): from the first visit, not at a count — two friends who came in together. */}
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={pairOn} onChange={(e) => setPairOn(e.target.checked)} className="mt-1 h-5 w-5 accent-[#1f5d8c]" data-testid="claim-pair" />
            <span>
              <span className="block font-semibold" lang="pt-PT">
                {PAIR_REWARD.name}
              </span>
              <span className="block text-sm text-muted">
                {PAIR_REWARD.venue}. Both check in within {PAIR_WINDOW_H} hours; once each, ever. Optional — it brings people in from the first day.
              </span>
            </span>
          </label>
          {pairOn ? (
            <input value={pairItem} onChange={(e) => setPairItem(e.target.value)} placeholder="What? e.g. a bica each" className={field} data-testid="claim-pair-item" />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Your name" className={field} />
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone or email" className={field} />
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" type="password" placeholder="Staff PIN (4 numbers)" className={field} data-testid="claim-pin" />
          <p className="text-xs text-muted">Your team types this on a learner’s phone to use a reward. Keep it behind the counter.</p>
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#1f5d8c]" />
          <span>I can agree this for {v.name}, and I’ve read the DUB venue terms.</span>
        </label>

        <button type="button" disabled={!ok} onClick={save} className="tap-target eyebrow rounded-full bg-accent px-6 py-3 text-accent-ink disabled:opacity-40" data-testid="claim-save">
          {v.claimed ? 'Save changes' : 'Join DUB'}
        </button>
        {note ? <p className="text-sm text-muted">{note}</p> : null}
      </div>
    </PageShell>
  )
}
