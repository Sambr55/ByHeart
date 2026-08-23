'use client'

/**
 * Event layer. Spec §10 "Events to instrument".
 *
 * The prototype's source of truth is the in-session buffer, which the observer
 * downloads as JSON per tester. `sink` is the seam: point it at PostHog/Amplitude
 * later without touching a single call site.
 */

export type EventName =
  | 'session_start'
  | 'landing_cta_tap'
  | 'briefing_continue'
  | 'culture_selected'
  | 'top_gun_familiarity'
  | 'screen_view'
  | 'choice_submitted'
  | 'tile_order_submitted'
  | 'answer_correct'
  | 'answer_incorrect'
  | 'hint_shown'
  | 'answer_revealed'
  | 'audio_played'
  | 'block_intro'
  | 'block_acquired'
  | 'inventory_view'
  | 'generativity_view'
  | 'checkpoint_result'
  | 'lisbon_test_start'
  | 'final_item_result'
  | 'final_score'
  | 'next_world_interest'
  | 'continue_intent'
  | 'session_complete'

export interface AnalyticsEvent {
  seq: number
  /** ms since session_start — response latency analysis needs a monotonic clock. */
  t: number
  name: EventName
  props: Record<string, unknown>
}

const STORAGE_KEY = 'byheart.events.v1'
const SESSION_KEY = 'byheart.session.v1'

let buffer: AnalyticsEvent[] = []
let seq = 0
let t0 = 0
let sessionId = ''

type Sink = (event: AnalyticsEvent) => void
let sinks: Sink[] = []

export function addSink(sink: Sink) {
  sinks.push(sink)
  return () => {
    sinks = sinks.filter((s) => s !== sink)
  }
}

export function initAnalytics(): string {
  if (typeof window === 'undefined') return ''
  if (sessionId) return sessionId
  sessionId =
    window.sessionStorage.getItem(SESSION_KEY) ??
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Math.floor(performance.now() * 1000)))
  window.sessionStorage.setItem(SESSION_KEY, sessionId)
  t0 = performance.now()
  buffer = []
  seq = 0
  return sessionId
}

export function track(name: EventName, props: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  const event: AnalyticsEvent = {
    seq: seq++,
    t: Math.round(performance.now() - t0),
    name,
    props,
  }
  buffer.push(event)
  sinks.forEach((s) => s(event))
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(buffer))
  } catch {
    // Storage full or blocked — the in-memory buffer is still authoritative.
  }
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[byheart]', name, props)
  }
}

export function getEvents(): AnalyticsEvent[] {
  return buffer
}

export function getSessionId(): string {
  return sessionId
}

/** Everything an observer needs from one tester, as a single file. */
export function exportSession(extra: Record<string, unknown> = {}) {
  return {
    session_id: sessionId,
    exported_at: new Date().toISOString(),
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    ...extra,
    events: buffer,
  }
}

export function downloadSession(extra: Record<string, unknown> = {}) {
  const blob = new Blob([JSON.stringify(exportSession(extra), null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'byheart-' + (sessionId || 'session').slice(0, 8) + '.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
