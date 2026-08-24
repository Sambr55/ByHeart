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
  /** Read the deal and carried on. The first real commitment in the funnel. */
  | 'deal_accepted'
  /* The Line — the daily habit, measured separately from the ten-minute session. */
  | 'line_view'
  | 'line_said'
  | 'line_subscribed'
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
  | 'qualitative_feedback'
  // Mission 02 — Appendix C event taxonomy
  | 'mission02_start'
  | 'cold_recall'
  | 'cold_recall_score'
  | 'culture_categories'
  | 'culture_free_text'
  | 'next_world_choice'
  | 'bond_familiarity'
  | 'target_encounter'
  | 'target_acquired'
  | 'target_reinforced'
  | 'cross_world_combo'
  | 'bond_mixed_recall'
  | 'bond_transfer'
  | 'compound_inventory_view'
  | 'crossover_begin'
  | 'crossover_item'
  | 'crossover_score'
  | 'mental_model_transfer'
  | 'post_experience_intent'
  | 'deck_generated'
  | 'deck_card_review'
  | 'deck_download_click'
  | 'delayed_recall'
  | 'delayed_recall_score'
  | 'interview_tag'
  // v0.6 journey — §17.13
  | 'culture_start_choice'
  | 'next_root_choice'
  | 'root_view'
  | 'root_familiarity'
  | 'branch_reveal'
  | 'build_attempt'
  | 'voice_choice'
  | 'voice_reflection'
  | 'collision_attempt'
  | 'no_cue_attempt'
  | 'capability_view'
  | 'session_sync'
  | 'section_decision'
  | 'return_home'
  | 'osmosis_view'
  | 'profile_answer'
  | 'profile_skip'

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
