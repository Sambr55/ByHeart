'use client'

import { useEffect, useState } from 'react'
import { track } from '@/engine/analytics'

/**
 * Switching notifications on. One flow, two places that offer it.
 *
 * The permission prompt is asked for once, from a tap, and never on page load — a
 * browser that gets an unprompted permission request blocks the site from asking
 * again, which would cost the feature permanently.
 *
 * ---------------------------------------------------------------------------
 * LIFTED OUT OF Line.tsx RATHER THAN COPIED, and the reason is the thing it registers.
 *
 * The inbox needed an opt-in and the obvious move was to write one: a button, a
 * requestPermission, a subscribe, a POST. That would have been a SECOND subscription flow
 * against the same endpoint, and the ways two of them go wrong are not cosmetic — one
 * sends `time_zone` and the other does not, so whichever ran last decides when the cron
 * thinks your morning is; one knows about the iOS Home Screen rule and the other shows an
 * iPhone a button that cannot work; one registers /sw.js and the other assumes it is
 * already there. /api/push/subscribe is idempotent on the endpoint, which means the two
 * would overwrite each other silently and the bug would be a notification arriving at the
 * wrong hour for one learner.
 *
 * So there is one component, it is the one that was already working, and the only thing
 * either caller gets to change is what the button says. The permission handling, the iOS
 * branch, the VAPID decode and the POST body are not configurable, because none of them
 * are a matter of opinion.
 * ---------------------------------------------------------------------------
 *
 * WHAT THE SUBSCRIPTION IS FOR IS NOT DECIDED HERE. A browser gets one push subscription
 * per origin — there is no such thing as subscribing to the inbox but not the morning line
 * — so both callers are turning on the same switch, and the copy has to be honest about
 * that rather than implying two separate taps. See the inbox's own wording.
 */
export function PushToggle({
  ready,
  /*
    What the button says, and what it says once it is on.

    Defaulted to The Line's own words so that moving this file changed nothing about the
    screen it came from. A caller that wants different copy passes it; a caller that
    forgets gets the morning line's promise, which is the one the product has made longest.
  */
  cta = 'SEND ME ONE EVERY MORNING',
  on = 'One line every morning. Nothing else, ever.',
  /*
    The iOS Home Screen explanation, which is about the PLATFORM rather than about the
    feature — so it has a default that is true wherever it is shown, and the headline is
    the only part a caller needs to replace.
  */
  install = 'One line every morning, on your lock screen.',
  /** For the analytics event, so the two opt-ins can be told apart. */
  from = 'line',
}: {
  ready: boolean
  cta?: string
  on?: string
  install?: string
  from?: string
}) {
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
      /* Same event name as before, with where it was tapped — so the existing series is
         unbroken and the inbox's share of it is still answerable. */
      if (res.ok) track('line_subscribed', { from })
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
        <p className="text-sm font-semibold">{install}</p>
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
    return <p className="text-center text-xs text-muted">{on}</p>
  }

  return (
    <button
      type="button"
      data-testid="push-toggle"
      onClick={enable}
      disabled={state === 'busy'}
      className="tap-target w-full rounded-full border border-line px-5 py-3 text-xs tracking-widest text-muted"
    >
      {state === 'busy' ? 'ONE MOMENT…' : cta}
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
