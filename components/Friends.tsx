'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { track } from '@/engine/analytics'
import { mintShowing } from '@/engine/showing'
import { useLearner } from '@/engine/useLearner'

/**
 * The people you have shown something to, in Yours.
 *
 * WHY IT MOVED HERE. Showing was fully built — mint a card of what you can say, hand it
 * to one person, they show one back and you are a pair — and lived on /proof, a screen
 * almost nobody finds. So the mechanic existed and the relationship it creates was
 * invisible from anywhere a person actually goes. Yours is where somebody looks for their
 * own things, and a friend they have shown something to is one of them.
 *
 * A LIST AND NEVER A NUMBER, which the API already insists on: showingsFor returns rows
 * and refuses to count them. A tally of who has shown you something is a score with extra
 * steps, and DUB exists because scores are the wrong fuel. So this shows who is waiting on
 * you and who you are waiting on, and nothing that could be compared.
 *
 * SYMMETRIC, NOT RANKED, for the same reason. Nobody is ahead of anybody here. The only
 * two states are "they have shown you back" and "not yet", and neither is a position.
 */
interface Mine {
  id: string
  sent: boolean
  returned: boolean
}

export function Friends() {
  const learner = useLearner()
  const [mine, setMine] = useState<Mine[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    fetch('/api/showing')
      .then((r) => r.json())
      .then((b: { ok: boolean; showings?: Mine[] }) => {
        if (live) setMine(b.ok ? (b.showings ?? []) : [])
      })
      .catch(() => {
        if (live) setMine([])
      })
    return () => {
      live = false
    }
  }, [busy])

  async function invite() {
    setBusy(true)
    setNote(null)
    const { path, reason } = await mintShowing(learner)
    if (!path) {
      setNote(reason ?? 'Could not make a link.')
      setBusy(false)
      return
    }
    const url = window.location.origin + path
    track('showing_sent', {})
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: 'DUB', url }).catch(() => {})
    } else {
      await navigator.clipboard?.writeText(url).catch(() => {})
      setNote('Link copied.')
    }
    setBusy(false)
  }

  // Before the fetch answers. An empty list flashed at somebody with three friends reads
  // as having lost them.
  if (mine === null) return null

  const paired = mine.filter((m) => m.returned)
  const waiting = mine.filter((m) => !m.returned)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="eyebrow text-muted">SHOWN</p>
        <p className="text-sm leading-relaxed text-muted">
          {mine.length
            ? 'Sentences you handed to somebody, and what came back.'
            : 'Show somebody three things you can say. They can show you theirs.'}
        </p>
      </div>

      {mine.length ? (
        <ul className="flex flex-col gap-1">
          {[...paired, ...waiting].map((m) => (
            <li key={m.id}>
              <Link
                href={'/s/' + m.id}
                className="tap-target flex items-center justify-between gap-3 rounded border border-line bg-bg-elev px-4 py-3"
              >
                <span className="text-sm">
                  {m.returned ? 'They showed you back' : m.sent ? 'Waiting on them' : 'Waiting on you'}
                </span>
                <span className="eyebrow shrink-0 text-muted">{m.returned ? 'BOTH' : 'ONE'}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        data-testid="friends-invite"
        onClick={invite}
        disabled={busy}
        className="tap-target eyebrow rounded border border-line-strong px-5 py-3 text-center disabled:opacity-60"
      >
        {busy ? 'MAKING A LINK' : 'SHOW SOMEBODY'}
      </button>

      {/*
        The reason, when there is one, in the words the engine gave — which for a new
        learner is "say something cold first", and is a instruction rather than an error.
      */}
      {note ? <p className="text-xs leading-relaxed text-muted">{note}</p> : null}
    </section>
  )
}
