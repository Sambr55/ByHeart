'use client'

import { useCallback, useEffect, useState } from 'react'
import { track } from '@/engine/analytics'

/**
 * YOUR OWN CALENDAR, BESIDE DUB'S (Sam, 2026-11-05: "Can't I see what's on MY calendar in
 * the DUB calendar (if I allow it?)" — and he chose Google sign-in).
 *
 * HOW, AND WHY THIS WAY.
 *
 *   - Google's own permission window, asking for one thing: to READ calendar events
 *     (calendar.events.readonly — the narrowest scope that can see them).
 *   - The events are fetched by this browser straight from Google and drawn on the
 *     fortnight. They are never sent to DUB's servers and never stored: there is nothing
 *     of somebody's diary in any database of ours to lose.
 *   - It is NOT a way to sign in. DUB stays email-only (lib/auth.ts explains why: a Google
 *     login would bring Sign in with Apple with it). This is a permission, like a photo.
 *
 * The price of keeping nothing: Google's token lasts an hour. It is kept for this tab only
 * (sessionStorage), and after it runs out "Show my calendar" is one tap with no consent
 * screen, because Google remembers the yes. `dub.gcal.on` (this phone) only remembers that
 * the answer was yes, so the screen offers the one tap rather than the whole explanation.
 *
 * Needs NEXT_PUBLIC_GOOGLE_CLIENT_ID — a Google Cloud OAuth client (Web), with this
 * site's origins authorised and the Calendar API enabled. Without it the option is not
 * shown at all.
 */
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''
const SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly'
const ON_KEY = 'dub.gcal.on'
const TOKEN_KEY = 'dub.gcal.token'

export interface MyEvent {
  id: string
  title: string
  /** Local ISO days this event covers (a run of days covers each). */
  days: string[]
  /** "14:00", or null for all-day. */
  time: string | null
}

export type MyCalendarStatus = 'unavailable' | 'off' | 'tap' | 'loading' | 'on' | 'error'

type TokenResponse = { access_token?: string; expires_in?: number; error?: string }
type TokenClient = { requestAccessToken: (o?: { prompt?: string }) => void }
type GoogleOAuth = {
  accounts: {
    oauth2: {
      initTokenClient: (o: { client_id: string; scope: string; callback: (r: TokenResponse) => void; error_callback?: (e: unknown) => void }) => TokenClient
      revoke: (token: string, done?: () => void) => void
    }
  }
}
declare global {
  interface Window {
    google?: GoogleOAuth
  }
}

let gis: Promise<GoogleOAuth> | null = null
function loadGis(): Promise<GoogleOAuth> {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google)
  gis ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => (window.google ? resolve(window.google) : reject(new Error('no google')))
    s.onerror = () => {
      gis = null
      reject(new Error('blocked'))
    }
    document.head.appendChild(s)
  })
  return gis
}

function readToken(): string | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const t = JSON.parse(raw) as { token: string; until: number }
    return t.until > Date.now() + 30_000 ? t.token : null
  } catch {
    return null
  }
}

const isoLocal = (d: Date) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

/** Google's start/end into the local days it covers. End is exclusive for all-day events. */
export function daysOf(start: { date?: string; dateTime?: string }, end: { date?: string; dateTime?: string }): string[] {
  const s = start.date ? new Date(start.date + 'T00:00:00') : new Date(start.dateTime ?? '')
  let e = end.date ? new Date(end.date + 'T00:00:00') : new Date(end.dateTime ?? start.dateTime ?? '')
  if (Number.isNaN(s.getTime())) return []
  if (Number.isNaN(e.getTime()) || e <= s) e = new Date(s.getTime() + 1)
  /* A timed event ending at midnight belongs to the day it started, not the next. */
  if (!end.date) e = new Date(e.getTime() - 1)
  else e = new Date(e.getTime() - 86_400_000)
  const out: string[] = []
  const d = new Date(s.getFullYear(), s.getMonth(), s.getDate())
  for (let i = 0; i < 62 && d <= e; i++) {
    out.push(isoLocal(d))
    d.setDate(d.getDate() + 1)
  }
  return out.length ? out : [isoLocal(s)]
}

/**
 * The learner's own events between two days (ISO, inclusive start, exclusive end), and the
 * controls to show or hide them.
 */
export function useMyCalendar(fromIso: string | null, toIso: string | null) {
  const [status, setStatus] = useState<MyCalendarStatus>('unavailable')
  const [events, setEvents] = useState<MyEvent[]>([])
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (!CLIENT_ID) return
    const t = readToken()
    let on = false
    try {
      on = localStorage.getItem(ON_KEY) === '1'
    } catch {
      /* nothing remembered */
    }
    setToken(t)
    setStatus(t ? 'loading' : on ? 'tap' : 'off')
  }, [])

  useEffect(() => {
    if (!token || !fromIso || !toIso) return
    let alive = true
    setStatus('loading')
    const q = new URLSearchParams({
      timeMin: new Date(fromIso + 'T00:00:00').toISOString(),
      timeMax: new Date(toIso + 'T00:00:00').toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
      fields: 'items(id,summary,start,end,status)',
    })
    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?' + q, { headers: { Authorization: 'Bearer ' + token } })
      .then(async (r) => {
        if (r.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY)
          if (alive) {
            setToken(null)
            setStatus('tap')
          }
          return
        }
        if (!r.ok) throw new Error(String(r.status))
        const body = (await r.json()) as {
          items?: { id: string; summary?: string; status?: string; start: { date?: string; dateTime?: string }; end: { date?: string; dateTime?: string } }[]
        }
        if (!alive) return
        setEvents(
          (body.items ?? [])
            .filter((x) => x.status !== 'cancelled')
            .map((x) => ({
              id: x.id,
              title: x.summary || 'Busy',
              days: daysOf(x.start, x.end),
              time: x.start.dateTime ? new Date(x.start.dateTime).toTimeString().slice(0, 5) : null,
            })),
        )
        setStatus('on')
      })
      .catch(() => alive && setStatus('error'))
    return () => {
      alive = false
    }
  }, [token, fromIso, toIso])

  /** Must be called from a tap: Google's window is a popup. */
  const connect = useCallback(async () => {
    if (!CLIENT_ID) return
    let asked = false
    try {
      asked = localStorage.getItem(ON_KEY) === '1'
    } catch {
      /* first time, then */
    }
    try {
      const g = await loadGis()
      const client = g.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (r) => {
          if (!r.access_token) {
            setStatus(asked ? 'tap' : 'off')
            return
          }
          try {
            sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token: r.access_token, until: Date.now() + (r.expires_in ?? 3600) * 1000 }))
            localStorage.setItem(ON_KEY, '1')
          } catch {
            /* it works for this screen */
          }
          track('gcal_connect', { again: asked })
          setToken(r.access_token)
        },
        error_callback: () => setStatus(asked ? 'tap' : 'off'),
      })
      client.requestAccessToken({ prompt: asked ? '' : 'consent' })
    } catch {
      setStatus('error')
    }
  }, [])

  /** Hides it, and tells Google to forget the yes. */
  const disconnect = useCallback(() => {
    const t = readToken()
    try {
      sessionStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(ON_KEY)
    } catch {
      /* nothing stored */
    }
    if (t) window.google?.accounts.oauth2.revoke(t)
    setToken(null)
    setEvents([])
    setStatus('off')
  }, [])

  return { status, events, connect, disconnect }
}
