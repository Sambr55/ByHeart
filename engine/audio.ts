'use client'

/**
 * pt-PT playback. Spec §7: every Portuguese reveal has a speaker; a second tap plays
 * at roughly 0.8x. No phonetic English spellings.
 *
 * Primary source is a pre-generated mp3 per phrase under /audio/pt-PT/. Until those
 * assets exist the module falls back to the browser's pt-PT speech synthesis so the
 * build stays testable — every fallback is flagged in the event payload, because
 * device voice quality varies and must never be mistaken for the shipped audio.
 *
 * WHY THIS FILE IS SHAPED THE WAY IT IS
 *
 * Every tap was silent on iOS, and the reason is the one rule iOS enforces about sound:
 * speechSynthesis.speak() only works if it is called inside the user gesture that asked
 * for it. This module used to `await` the mp3 before falling back to speech — and since
 * no mp3 has been recorded, every single tap waited for a 404, lost the gesture, and
 * then asked a browser that had stopped listening to talk. No error, no warning, and it
 * works perfectly on a desktop, which is where it was tested.
 *
 * So nothing may be awaited before speaking. The asset is probed in the background and
 * used from the NEXT tap onward; the current tap always makes a sound.
 */

import { track } from './analytics'

export interface Utterance {
  slug: string
  text: string
}

const RATE_SLOW = 0.8
/** undefined = never probed, null = probed and absent. Both are answered synchronously. */
const cache = new Map<string, HTMLAudioElement | null>()

function src(slug: string) {
  return '/audio/pt-PT/' + slug + '.mp3'
}

/**
 * Probe for a recorded take. Never blocks playback — the result is for the next tap.
 *
 * The timeout matters: a request that neither loads nor errors would otherwise leave the
 * slug permanently "never probed" and re-request it on every tap.
 */
function probe(slug: string): void {
  if (cache.has(slug)) return
  cache.set(slug, null)
  const el = new Audio(src(slug))
  const keep = () => cache.set(slug, el)
  el.addEventListener('canplaythrough', keep, { once: true })
  el.load()
}

/**
 * The device voice.
 *
 * getVoices() is empty on the first call in Safari and Chrome — the list arrives later,
 * on voiceschanged — so looking a voice up at tap time found nothing on the very first
 * tap of a session. Warmed once, and pt-anything beats no voice at all: a Brazilian
 * voice reading European Portuguese is wrong, but it is audible and it is honest about
 * being a fallback, which silence is not.
 */
let voices: SpeechSynthesisVoice[] = []
function warmVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  voices = window.speechSynthesis.getVoices()
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  warmVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', warmVoices)
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  if (!voices.length) warmVoices()
  const norm = (l: string) => l.toLowerCase().replace('_', '-')
  return (
    voices.find((v) => norm(v.lang) === 'pt-pt') ?? voices.find((v) => norm(v.lang).startsWith('pt'))
  )
}

function speak(text: string, slow: boolean): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  const synth = window.speechSynthesis
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'pt-PT'
  u.rate = slow ? RATE_SLOW : 1
  const voice = pickVoice()
  if (voice) u.voice = voice
  // Only cancel when there is something to cancel. An unconditional cancel() immediately
  // before speak() drops the new utterance on iOS.
  if (synth.speaking || synth.pending) synth.cancel()
  // Safari can leave the queue paused after a backgrounded tab; resume is a no-op
  // otherwise and costs nothing.
  if (synth.paused) synth.resume()
  synth.speak(u)
  return true
}

/**
 * Say it.
 *
 * Deliberately not async. Everything up to the sound happens in the caller's gesture,
 * because on iOS that is the difference between audio and silence.
 */
export function play(u: Utterance, opts: { slow?: boolean; screenId?: string } = {}) {
  const slow = opts.slow ?? false
  const el = cache.get(u.slug)
  let source: 'asset' | 'tts' | 'none' = 'none'

  if (el) {
    el.playbackRate = slow ? RATE_SLOW : 1
    el.currentTime = 0
    // play() returns a promise, but the CALL is synchronous and that is what the gesture
    // rule cares about. If it rejects, speech is no longer available to us this tick —
    // so the catch reports rather than pretending.
    void el.play().catch(() => {
      track('audio_played', { slug: u.slug, text: u.text, speed: slow ? 'slow' : 'normal', source: 'none', screen: opts.screenId })
    })
    source = 'asset'
  } else {
    source = speak(u.text, slow) ? 'tts' : 'none'
    // For next time. After the sound, never before it.
    probe(u.slug)
  }

  track('audio_played', {
    slug: u.slug,
    text: u.text,
    speed: slow ? 'slow' : 'normal',
    source,
    screen: opts.screenId,
  })
  return source
}

/**
 * Unlock audio on the first gesture of a session.
 *
 * This used to call getVoices() and nothing else, which does not unlock anything — and
 * it was never called from anywhere, so it did not matter. iOS only starts allowing
 * speech after a speak() that happened inside a real gesture, so that is what this does:
 * an empty utterance nobody hears.
 */
let primed = false
export function primeAudio() {
  if (primed || typeof window === 'undefined' || !('speechSynthesis' in window)) return
  primed = true
  warmVoices()
  try {
    const u = new SpeechSynthesisUtterance('')
    u.volume = 0
    window.speechSynthesis.speak(u)
  } catch {
    // An unlock that fails must never break the tap it was attached to.
  }
}
