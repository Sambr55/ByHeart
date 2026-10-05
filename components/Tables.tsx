'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { TABLE, band } from '@/content/table'
import { loadLearner } from '@/engine/learner'
import { useEntitlements } from '@/engine/useEntitlements'
import { track } from '@/engine/analytics'

interface Person {
  name: string
  said_cold: number
}

interface Seat {
  id: string
  place: string
  area: string | null
  sitsAt: string
  seats: number
  taken: number
  sitting: boolean
  people: Person[]
}

/**
 * A TABLE — six people who can already say the same things, and one evening.
 *
 * Sam: "match the people, not run the dinners." So this screen offers a seat and says
 * where and when. It does not book, take money, or pretend DUB will be there.
 *
 * THE RULE IS THE FIRST THING ON THE SCREEN, before any table, because somebody deciding
 * whether to come is deciding about one sentence: the first ten minutes are in Portuguese
 * and then they are not. Everything else here is logistics.
 *
 * NOBODY IS RANKED. The seat stores how much each person can say and this screen shows it
 * as a band — see `band` in content/table.ts. A figure beside a name would make a dinner
 * table a leaderboard, which is the sorting-into-grades the matching rule refuses.
 */
export function Tables() {
  const access = useEntitlements()
  const [tables, setTables] = useState<Seat[] | null>(null)
  const [said, setSaid] = useState(0)
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  /*
    After mount, like everything that reads the record: the server has no learner, and the
    count of what somebody can say lives on their device.
  */
  useEffect(() => {
    const me = loadLearner()
    setSaid((me.proof ?? []).filter((p) => p.clean).length)
  }, [])

  const load = () =>
    fetch('/api/tables')
      .then((r) => (r.ok ? r.json() : { tables: [] }))
      .then((d: { tables?: Seat[] }) => setTables(Array.isArray(d.tables) ? d.tables : []))
      .catch(() => setTables([]))

  useEffect(() => {
    load()
  }, [])

  /* The bar, from the learner's own record. See COLD_FLOOR. */
  const canSit = said >= 3

  async function sit(t: Seat, release = false) {
    setBusy(t.id)
    setNote(null)
    try {
      const r = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ table: t.id, said, release }),
      })
      const d = (await r.json()) as { state?: string }
      track('table_seat', { table: t.id, state: d.state ?? 'error' })
      if (d.state === 'taken') setNote('Your seat is booked. We will not remind you — it is in your calendar app if you want it there.')
      else if (d.state === 'full') setNote('That one filled while you were deciding. There will be another.')
      else if (d.state === 'gone') setNote('That table is no longer running.')
      else if (d.state === 'released') setNote('Seat given back.')
      await load()
    } catch {
      setNote('Could not reach the Club just now.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <PageShell eyebrow="A TABLE" stage="REAL WORLD">
      <div className="flex flex-col gap-6">
        {/*
          THE RULE, FIRST AND IN FULL. The whole decision somebody is making is about this
          sentence, so it is not a footnote under a list of dates.
        */}
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
          <h1 className="display text-balance text-2xl">{TABLE.what}</h1>
          <p className="text-base leading-relaxed text-accent">{TABLE.rule}</p>
          <p className="text-sm leading-relaxed text-muted">{TABLE.reassurance}</p>
          <ul className="mt-3 flex flex-col gap-1 border-t border-line pt-3">
            {TABLE.howItGoes.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-muted">
                {line}
              </li>
            ))}
          </ul>
          {/*
            WHAT DUB IS AND IS NOT DOING, said here rather than discovered on the night.
            Sam: "match the people, not run the dinners."
          */}
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {TABLE.weDo} {TABLE.weDont}
          </p>
        </div>

        {/*
          WHETHER THEY HAVE EARNED A SEAT, and the version that is not a rejection.

          "Not yet" names the one thing that fixes it and links at the screen that does —
          which is the same shape every gate in this product uses, because a door that says
          no without saying how is a wall.
        */}
        {!canSit ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-coach/60 bg-bg-elev px-5 py-6">
            <p className="eyebrow text-coach">NOT YET</p>
            <p className="text-base leading-relaxed text-fg">{TABLE.notYet}</p>
            <Link
              href="/legend?run=1"
              data-testid="table-earn"
              className="tap-target eyebrow mt-3 w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
            >
              RUN YOUR LEGEND
            </Link>
          </div>
        ) : null}

        {note ? (
          <p data-testid="table-note" className="rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed">
            {note}
          </p>
        ) : null}

        {tables === null ? null : tables.length === 0 ? (
          /*
            NO TABLE YET, SAID WITHOUT APOLOGY — and this is the state DUB is actually in
            today with two members. It names what makes one happen rather than promising
            one is coming, because a date invented to fill a screen is the one lie this
            feature cannot survive.
          */
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
            <p className="text-base leading-relaxed text-fg">
              No table yet. They happen when six people in {''}
              <span className="whitespace-nowrap">the same city</span> can all say their
              Legend — so the fastest way to get one is to bring somebody in.
            </p>
            <Link
              href="/profile"
              className="tap-target eyebrow mt-3 w-full rounded border border-accent px-5 py-3 text-center text-accent"
            >
              BRING SOMEBODY IN
            </Link>
          </div>
        ) : (
          <ul data-testid="table-list" className="flex flex-col gap-3">
            {tables.map((t) => {
              const left = Math.max(0, t.seats - t.taken)
              const when = new Date(t.sitsAt).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
              const at = new Date(t.sitsAt).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })
              return (
                <li
                  key={t.id}
                  data-testid={'table-' + t.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6"
                >
                  <p className="eyebrow text-telha">
                    {when} · {at}
                  </p>
                  <h2 className="display text-balance text-xl">{t.place}</h2>
                  {t.area ? <p className="text-sm text-muted">{t.area}</p> : null}

                  {/*
                    WHO ELSE IS COMING — first names and what they can say, which is the
                    whole of what one member learns about another. No photograph, no
                    surname, no age, no way to message them. See lib/tables.ts.
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

                  <p className="text-sm text-muted">
                    {left === 0 ? 'Full' : left === 1 ? 'One seat left' : left + ' seats left'}
                  </p>

                  {t.sitting ? (
                    <div className="flex flex-col gap-3">
                      <p className="eyebrow text-correct">YOU ARE GOING</p>
                      <button
                        type="button"
                        disabled={busy === t.id}
                        onClick={() => sit(t, true)}
                        className="tap-target eyebrow w-full rounded border border-line-strong px-5 py-3 text-center text-muted"
                      >
                        GIVE THE SEAT BACK
                      </button>
                    </div>
                  ) : !access.signedIn ? (
                    /*
                      A seat needs an account, because a table has to know who is coming —
                      and this is the one place in DUB where that is obviously true rather
                      than an imposition.
                    */
                    <Link
                      href="/signin?next=%2Ftable"
                      className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
                    >
                      SIGN IN TO TAKE A SEAT
                    </Link>
                  ) : (
                    <button
                      type="button"
                      data-testid={'take-' + t.id}
                      disabled={!canSit || left === 0 || busy === t.id}
                      onClick={() => sit(t)}
                      className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink disabled:bg-chip disabled:text-muted"
                    >
                      {left === 0 ? 'FULL' : 'TAKE A SEAT'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </PageShell>
  )
}
