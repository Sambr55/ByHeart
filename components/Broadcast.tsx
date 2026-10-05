'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageShell } from '@/components/PageShell'

/**
 * TELLING EVERYBODY SOMETHING.
 *
 * Sam: "We also need a method of pushing these updates to people who have already
 * downloaded the app."
 *
 * THE DRY RUN IS THE POINT OF THIS SCREEN. A broadcast is the one action in DUB that
 * cannot be taken back — it is on a stranger's lock screen a second after the tap, and
 * there is no edit and no delete. So the only button that is easy to press sends it to ONE
 * phone, and the real one has to be deliberately chosen afterwards.
 *
 * THE TAG IS WHAT MAKES A RETRY SAFE. Every subscription records which announcements it
 * has had, so pressing send twice — which is exactly what somebody does when the first
 * attempt appears to fail — reaches nobody a second time.
 *
 * The admin key is held in state for the visit and never stored, same as the table
 * builder: localStorage would leave it on whatever device last opened this page.
 */
export function Broadcast() {
  const [key, setKey] = useState('')
  const [reach, setReach] = useState<{ reachable: number; configured: boolean } | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/table')
  const [tag, setTag] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async (k: string) => {
    if (!k) return
    try {
      const r = await fetch('/api/push/broadcast', { headers: { 'x-admin-key': k } })
      if (!r.ok) {
        setReach(null)
        setNote(r.status === 404 ? 'That key is not right.' : 'Could not load.')
        return
      }
      setReach(await r.json())
      setNote(null)
    } catch {
      setNote('Could not reach the server.')
    }
  }, [])

  useEffect(() => {
    if (key) load(key)
  }, [key, load])

  async function send(dryRun: boolean) {
    setBusy(true)
    setNote(null)
    try {
      const r = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ title, body, url, tag, dryRun }),
      })
      const d = (await r.json()) as {
        sent?: number
        expired?: number
        failed?: number
        skipped?: number
        error?: string
      }
      if (d.error) setNote(d.error)
      else
        setNote(
          (dryRun ? 'Test: ' : 'Sent: ') +
            d.sent +
            ' delivered' +
            (d.skipped ? ', ' + d.skipped + ' already had it' : '') +
            (d.expired ? ', ' + d.expired + ' gone' : '') +
            (d.failed ? ', ' + d.failed + ' failed' : '') +
            '.',
        )
      await load(key)
    } catch {
      setNote('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  const field =
    'w-full rounded border border-line bg-surface px-3 py-3 text-base text-fg placeholder:text-muted focus:border-accent focus:outline-none'
  const ready = Boolean(title.trim() && body.trim() && tag.trim())

  return (
    <PageShell eyebrow="BROADCAST" stage="REAL WORLD" back="/admin" backLabel="ADMIN">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
          <h1 className="display text-balance text-2xl">Tell everybody something.</h1>
          <p className="text-sm leading-relaxed text-muted">
            One notification to every phone that said yes. There is no edit and no delete —
            it is on a lock screen a second after you tap.
          </p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin key"
            aria-label="Admin key"
            data-testid="bc-key"
            className={field + ' mt-3'}
          />
          {reach ? (
            <p className="text-sm text-muted">
              {reach.reachable === 0
                ? 'Nobody has turned notifications on yet.'
                : reach.reachable === 1
                  ? 'One phone can be reached.'
                  : reach.reachable + ' phones can be reached.'}
              {reach.configured ? '' : ' Push is not configured on this deployment.'}
            </p>
          ) : null}
        </div>

        {key && reach ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
            <p className="eyebrow text-accent">THE MESSAGE</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title — e.g. A table at Ramiro"
              aria-label="Title"
              data-testid="bc-title"
              maxLength={48}
              className={field}
            />
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Body — e.g. Thursday the 14th, six seats, first ten minutes in Portuguese."
              aria-label="Body"
              data-testid="bc-body"
              maxLength={140}
              className={field}
            />
            {/*
              THE COUNTS ARE SHOWN WHILE TYPING rather than enforced on send. A lock screen
              truncates around 65 characters on Android and fewer on iOS, so the limits are
              about being read rather than about being valid — and somebody who can see
              they are near the end writes shorter.
            */}
            <p className="text-sm text-muted">
              {title.length}/48 · {body.length}/140 — a lock screen shows less than this.
            </p>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Where it opens — /table"
              aria-label="Where it opens"
              data-testid="bc-url"
              className={field}
            />
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Tag — e.g. ramiro-14-nov. Nobody gets the same tag twice."
              aria-label="Tag"
              data-testid="bc-tag"
              className={field}
            />

            {/*
              THE TEST IS THE EASY BUTTON AND THE REAL ONE IS NOT. A broadcast cannot be
              taken back, so the shape of this pair is the safety: accent for the harmless
              one, and the irreversible one is an outline that has to be chosen.
            */}
            <button
              type="button"
              data-testid="bc-test"
              disabled={busy || !ready}
              onClick={() => send(true)}
              className="tap-target eyebrow mt-3 w-full rounded bg-accent px-5 py-3 text-center text-accent-ink disabled:bg-chip disabled:text-muted"
            >
              SEND IT TO ONE PHONE FIRST
            </button>
            <button
              type="button"
              data-testid="bc-send"
              disabled={busy || !ready}
              onClick={() => send(false)}
              className="tap-target eyebrow w-full rounded border border-telha px-5 py-3 text-center text-telha disabled:border-line disabled:text-muted"
            >
              SEND TO ALL {reach.reachable}
            </button>
          </div>
        ) : null}

        {note ? (
          <p data-testid="bc-note" className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
            {note}
          </p>
        ) : null}
      </div>
    </PageShell>
  )
}
