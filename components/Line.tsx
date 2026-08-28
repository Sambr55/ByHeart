'use client'

import Link from 'next/link'
import { Wordmark } from '@/components/Wordmark'
import { useEffect, useMemo, useState } from 'react'
import { dayKey, pickLine, rootFor, type DailyLine } from '@/content/daily-line'
import { CRATES } from '@/content/roots'
import { slugFor } from '@/content/audio-manifest'
import { play } from '@/engine/audio'
import { track } from '@/engine/analytics'
import { currentPair } from '@/engine/pair'
import { rememberLine } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { Dock } from '@/components/Journey'

/**
 * The Line — twenty seconds, once a day.
 *
 * Deliberately the smallest screen in the product. There is no lesson here, no build,
 * no score: one sentence, what it means, one thing worth knowing about it, and a way
 * out. Anything more turns a daily habit into a daily commitment, which is the thing
 * that makes people stop.
 *
 * It picks with the same function the cron uses, on the same day key, so the sentence
 * on the lock screen and the sentence on this page are always the same one.
 */
export function Line({ pushReady }: { pushReady: boolean }) {
  const learner = useLearner()
  const [said, setSaid] = useState(false)
  // The pick is salted with the learner's id and filtered by what they own, neither of
  // which the server has — so it chose a different line there and React tore the tree
  // down on hydration. Chosen after mount instead, which is also the only honest moment
  // to choose it: before then we do not know whose line it is.
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  const line = useMemo<DailyLine | null>(() => {
    if (!ready) return null
    const owned = Object.keys(learner.inventory)
    // Today where the language is spoken, which the pair decides.
    /*
      The same three inputs the cron uses, which is what makes the claim above true.

      It was three different ones. The page salted on learner_id and the cron on
      device_id-or-endpoint, so the two picked different sentences. The page passed no
      seen list, so it re-showed lines the notification had already delivered. And the
      day keys came from different zones. The docblock said "always the same one" and
      none of the three inputs matched.
    */
    return pickLine({
      owned,
      seen: learner.lines_seen ?? [],
      day: dayKey(new Date(), currentPair().day_zone),
      salt: learner.learner_id,
    })
  }, [ready, learner.inventory, learner.learner_id])

  useEffect(() => {
    if (!line) return
    track('line_view', { line: line.id, kind: line.kind })
    // Recorded wherever it was shown, so tomorrow's pick — here or on a lock screen —
    // knows this one has been used.
    rememberLine(line.id)
  }, [line])

  const root = line ? rootFor(line) : undefined
  const family = root ? CRATES.find((f) => f.id === root.culture_family) : undefined

  return (
    <main
      data-stage="REAL WORLD"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 py-6 text-fg"
    >
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="tap-target flex shrink-0 items-center gap-1 eyebrow text-muted">
          <span aria-hidden>←</span>
          <Wordmark className="h-3" title="DUB — back to your vibes" />
        </Link>
        <span className="eyebrow flex-1 text-muted">TODAY</span>
        
      </div>

      {!ready ? (
        // Deliberately blank rather than a spinner: it is on screen for one frame, and
        // a spinner on a twenty-second screen reads as something being wrong.
        <div className="flex-1" aria-hidden />
      ) : !line ? (
        <div className="flex flex-1 flex-col justify-center gap-3">
          <p className="display text-balance text-3xl">You have had all of them.</p>
          <p className="text-sm text-muted">
            Every sentence DUB knows has been through here. Open a new vibe and this
            starts again.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-6">
          {line.kind === 'reach' ? (
            <p className="eyebrow text-accent">ONE STEP PAST</p>
          ) : family ? (
            <p className="eyebrow text-accent">{family.title}</p>
          ) : null}

          <button
            type="button"
            onClick={() => play({ slug: slugFor(line.pt), text: line.pt })}
            className="tap-target text-left"
            aria-label={'Hear ' + line.pt}
          >
            <p className="pt display text-balance text-4xl leading-tight">{line.pt}</p>
          </button>

          <p className="text-lg text-muted">{line.en}</p>

          <div className="rounded border border-line bg-bg-elev p-4">
            <p className="text-sm leading-relaxed">{line.note}</p>
          </div>
        </div>
      )}

      <PushToggle ready={pushReady} />

      {/* The other twenty-second thing, for somebody who has a Legend. One question with
          no warning is a different exercise from a sentence to read, and this is where a
          person already is at the right moment of the morning. */}
      {(learner.legend ?? []).filter((a) => Object.keys(a.values).length).length >= 2 ? (
        <Link
          href="/legend?cold=1"
          className="tap-target block text-center text-xs text-muted underline underline-offset-4"
        >
          Or answer one about yourself, with no warning.
        </Link>
      ) : null}

      <Link
        href="/"
        className="tap-target block text-center text-xs text-muted underline underline-offset-4"
      >
        Got ten minutes? Open a vibe.
      </Link>

      {/*
        Last in the column, because a dock can only rest on the bottom if nothing is
        under it. The footnotes used to come after this and held it 188px up — the one
        screen in the product where the button was not where the button is. They are
        quiet links and read perfectly well above it.
      */}
      {line ? (
        <Dock>
          <button
            type="button"
            onClick={() => {
              track('line_said', { line: line.id })
              setSaid(true)
            }}
            className={
              'tap-target w-full rounded-full px-5 py-3 text-xs tracking-widest transition ' +
              (said ? 'border border-line text-muted' : 'bg-accent text-accent-ink')
            }
          >
            {said ? 'SEE YOU TOMORROW' : 'SAID IT OUT LOUD'}
          </button>
        </Dock>
      ) : (
        /*
          The nav's clearance, only when there is no dock.

          A dock IS the clearance — it is sticky 4.5rem off the bottom, so it holds itself
          above the bar. Leaving a 4.5rem spacer under it as well pushed its resting place
          up by exactly that spacer plus the column's gap, and this was the one screen in
          the product where the button was not where the button is.
        */
        <BottomNavSpace />
      )}
      <BottomNav />
    </main>
  )
}

/**
 * Switching The Line on.
 *
 * The permission prompt is asked for once, from a tap, and never on page load — a
 * browser that gets an unprompted permission request blocks the site from asking
 * again, which would cost the feature permanently.
 */
function PushToggle({ ready }: { ready: boolean }) {
  const [state, setState] = useState<'unknown' | 'off' | 'on' | 'denied' | 'busy' | 'install'>(
    'unknown',
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    /*
      iOS, in a browser tab.

      Safari exposes no Notification API at all unless the site has been added to the
      Home Screen — so `'Notification' in window` was false, the state went to 'denied',
      and the component returned null. An iPhone user got no toggle and no explanation:
      the morning line, which is the entire habit half of DUB, simply did not appear and
      there was nothing on screen to suggest it could.

      Checked before `ready`, because the instruction is worth showing even when the
      server has no VAPID keys configured — a person deciding whether to install should
      be told what installing gets them.
    */
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document)
    const installed =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true
    if (isIOS && !installed && !('Notification' in window)) {
      setState('install')
      return
    }
    if (!ready || !('Notification' in window)) {
      setState('denied')
      return
    }
    if (Notification.permission === 'denied') return setState('denied')
    navigator.serviceWorker?.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? 'on' : 'off'))
      .catch(() => setState('off'))
  }, [ready])

  const enable = async () => {
    setState('busy')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return setState('denied')

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!key) return setState('denied')

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      })
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...sub.toJSON(),
          time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      })
      setState(res.ok ? 'on' : 'off')
      if (res.ok) track('line_subscribed', {})
    } catch {
      setState('off')
    }
  }

  if (state === 'install') {
    return (
      <div
        data-testid="line-install"
        className="rounded border border-line bg-bg-elev px-4 py-3 text-center"
      >
        <p className="text-sm font-semibold">One line every morning, on your lock screen.</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          On an iPhone this only works once DUB is on your Home Screen — Apple does not
          let a browser tab send anything. Tap Share, then <em>Add to Home Screen</em>, and
          open DUB from there.
        </p>
      </div>
    )
  }

  if (!ready || state === 'denied' || state === 'unknown') return null

  if (state === 'on') {
    return (
      <p className="text-center text-xs text-muted">
        One line every morning. Nothing else, ever.
      </p>
    )
  }

  return (
    <button
      type="button"
      onClick={enable}
      disabled={state === 'busy'}
      className="tap-target w-full rounded-full border border-line px-5 py-3 text-xs tracking-widest text-muted"
    >
      {state === 'busy' ? 'ONE MOMENT…' : 'SEND ME ONE EVERY MORNING'}
    </button>
  )
}

/** VAPID keys travel as base64url; PushManager wants raw bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const raw = atob(padded)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}
