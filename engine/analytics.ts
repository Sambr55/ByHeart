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
  /**
   * A non-member tapped a crate they cannot open. The clearest statement of intent in
   * the product — they named the crate they want — and worth measuring on its own,
   * because which crate it is says more than the count does.
   */
  | 'crate_locked_tapped'
  /* City Clubs. A Situation is pulled, not pushed, so opening one is a statement of
     intent about a real errand somebody has to do — the most useful signal in the
     product about what to write next. */
  /* The Club feed. A like is a signal about what to write more of and nothing else — it
     is never counted back to the learner, because a feed with a score on it starts
     asking to be fed. */
  /* Showing. The three numbers the spec asks for, and no others: whether anybody mints
     one unprompted, whether the person at the other end shows one back — which is the
     real question, since it separates an artefact worth sending from a link that gets
     ignored — and whether anybody does it twice. None of these is ever shown back to a
     learner as a total. */
  | 'showing_sent'
  | 'showing_opened'
  | 'showing_returned'
  /* Derived cards. `derived_said` is the one that matters — it is a collision produced
     cold, with nothing Portuguese on the screen, which is the only thing DUB counts.
     `derived_kept` is a teaching card being finished with, and it is not the same claim. */
  /* Rebuilding a line after being shown it. Worth knowing separately from build_help:
     one is asking for the answer, the other is going back and earning it. */
  | 'build_retry'
  /* A tile put in the wrong place, which now bounces out rather than waiting for CHECK. */
  | 'build_misplaced'
  /* A photograph sent to be read. One per photo, which is also one metered ask. */
  /* A sentence taken out of the app — pasted into a message, a note, somebody else's chat. */
  | 'sentence_copied'
  | 'lens_read'
  | 'lens_opened'
  | 'derived_said'
  | 'derived_kept'
  | 'feed_like'
  | 'feed_save'
  | 'feed_share'
  | 'errand_cold'
  | 'errand_done'
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
  | 'build_help'
  | 'pair_chosen'
  | 'feedback_open'
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
  /* The library's dead end, which is the best content signal the product collects. */
  | 'vocab_search_miss'
  /* Dub Club — the home a returning learner actually lands on. */
  | 'club_welcome'
  | 'club_move'
  /* Your Legend — the proposition, and the one goal that exists outside the app. */
  | 'legend_offered'
  | 'legend_declined'
  | 'legend_card_answered'
  | 'legend_card_skipped'
  | 'legend_rehearse'
  | 'legend_cold_open'
  | 'legend_unlocked'
  /*
    A vibe just made a Legend question answerable, and the learner was told so on a screen
    of its own. `took` is the whole point of measuring it: the screen is only worth its
    interruption if people answer the question there and then rather than nodding it away.
  */
  | 'legend_opened'
  /* The truth about what happens when you get it wrong. Once per learner, ever. */
  | 'switch_shown'
  /* Whether people install, and which of the two routes they were offered. */
  | 'install_dismissed'
  | 'install_accepted'
  /*
    Somebody told that installing would start them from nothing, and choosing to save
    first. The most useful number on the install strip: it measures how many people were
    one tap from losing their work without knowing it.
  */
  | 'install_save_first'
  /*
    Somebody put what is on into their own calendar, with what they chose to see and how
    much of it they were willing to take. The two numbers are the whole question a feed
    like this asks — a learner who takes one a week is telling us something different from
    one who takes seven, and neither is turning up more often than the other.
  */
  | 'calendar_subscribed'
  /*
    The translator, and the one number on it that matters.

    translate_ask is traffic. translate_kept is demand — the sentences somebody decided
    they would need again, which is the closest thing DUB has to a content brief written
    by its own learners.
  */
  | 'translate_opened'
  | 'translate_ask'
  | 'translate_kept'
  /*
    The translator answering a slot rather than a person.

    Distinct from translate_kept on purpose: kept is somebody deciding a sentence is worth
    having later, used is the Legend borrowing one word because its pick list did not cover
    the job. A rising count here names the fields the list should have had.
  */
  | 'translate_used'
  /*
    Why people say they are here.

    The single most useful number in the product for deciding what to author next: three
    purposes, and the split between them is the answer to "which block of ten do we write".
  */
  | 'purpose_chosen'
  | 'demo_played'
  | 'card_rejected'
  | 'card_rewound'
  | 'purpose_skipped'
  | 'chapter_chosen'
  /*
    The language, asked at last and therefore worth counting.

    Separate from chapter_chosen because they are now two taps rather than one: the pair
    used to travel silently with the city, so choosing Lisbon chose pt-PT and there was
    nothing to record. The interesting number is how many people pick the language and
    stop — a row greyed COMING is a roadmap, and which one they reach for is the only
    honest demand signal the product collects.
  */
  | 'language_chosen'
  /*
    Cheat sheets, and the two numbers that decide whether they belong in the feed at all.

    `sheet_tested` is interest — somebody studied a group and chose to be asked.
    `sheet_dismissed` is the honest opposite, and it is the more useful of the two — a
    sheet nobody wants is a card taking up a slot in a feed, and the only way to know is
    to let people say so.

    STILL NOT A SCORE, though the test now banks what somebody got.

    This said DUB "does not mark recall anywhere else", which was the reason the test
    asked nothing and therefore could never move the ticks — so a learner could sit it
    twice and watch nothing change. The half that is true survives: nothing is counted
    back at them, no percentage, no streak. What changed is that a yes ACQUIRES the piece,
    exactly as a vibe's release does, because a word you can say cold is yours no matter
    which screen you said it on. Self-marked, like every cold prompt in the journey.
  */
  /*
    The soft gate, one vibe from the Legend, and whether it was taken.

    The number worth having is the ratio: an offer nobody accepts is an interruption, and
    an offer everybody accepts was probably owed earlier. It fires once per learner.
  */
  /*
    An invitation minted from a drop, which is the only thing in DUB somebody sends TO a
    person rather than posts at nobody.

    Distinct from showing_sent, which is the proof card: that is a claim about the sender,
    and this is an ask addressed to a reader who may not have heard of DUB at all. The
    interesting number is the ratio against the invite room being finished — a sentence
    people learn and never send is a nice exercise, and one they send is the product
    leaving the app.
  */
  | 'invite_sent'
  | 'save_offered'
  | 'sheet_tested'
  | 'sheet_dismissed'
  /* A looked-up sentence spent, which is the only thing that clears it from the feed. */
  | 'asked_done'
  /* The one Club room given away before anything was earned, and which one it was. */
  | 'room_tasted'

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
  sent = 0
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

/**
 * Everything not yet sent, handed over and marked as gone.
 *
 * Until this existed there was no analytics egress in DUB at all. Seventy-seven event
 * names were declared, sixty-four of them fired, `addSink` had never once been called,
 * and every event a tester generated lived in sessionStorage until they closed the tab.
 * The server route to receive them had been written and was reachable — nothing ever
 * posted to it.
 *
 * Drained rather than copied, so a sync that succeeds does not send the same rows again
 * on the next one. If the post fails the caller hands them back with `returnEvents`,
 * because losing telemetry is cheap and double-counting it is not.
 */
let sent = 0

export function drainEvents(): AnalyticsEvent[] {
  const out = buffer.slice(sent)
  sent = buffer.length
  return out
}

/** A failed send, put back. The next sync will try again. */
export function returnEvents(n: number) {
  sent = Math.max(0, sent - n)
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
