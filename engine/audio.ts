'use client'

/**
 * pt-PT playback. Spec §7: every Portuguese reveal has a speaker; a second tap plays
 * at roughly 0.8x. No phonetic English spellings.
 *
 * Primary source is a pre-generated mp3 per phrase under /audio/pt-PT/. Until those
 * assets exist the module falls back to the browser's pt-PT speech synthesis so the
 * build stays testable — every fallback is flagged in the event payload, because
 * device voice quality varies and must never be mistaken for the shipped audio.
 */

import { track } from './analytics'

export interface Utterance {
  slug: string
  text: string
}

const RATE_SLOW = 0.8
const cache = new Map<string, HTMLAudioElement | null>()

function src(slug: string) {
  return '/audio/pt-PT/' + slug + '.mp3'
}

function load(slug: string): Promise<HTMLAudioElement | null> {
  if (cache.has(slug)) return Promise.resolve(cache.get(slug) ?? null)
  return new Promise((resolve) => {
    const el = new Audio(src(slug))
    const done = (value: HTMLAudioElement | null) => {
      cache.set(slug, value)
      resolve(value)
    }
    el.addEventListener('canplaythrough', () => done(el), { once: true })
    el.addEventListener('error', () => done(null), { once: true })
    el.load()
  })
}

function speak(text: string, slow: boolean): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'pt-PT'
  u.rate = slow ? RATE_SLOW : 1
  const voice = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang === 'pt-PT' || v.lang === 'pt_PT')
  if (voice) u.voice = voice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
  return true
}

export async function play(u: Utterance, opts: { slow?: boolean; screenId?: string } = {}) {
  const slow = opts.slow ?? false
  const el = await load(u.slug)
  let source: 'asset' | 'tts' | 'none' = 'none'
  if (el) {
    el.playbackRate = slow ? RATE_SLOW : 1
    el.currentTime = 0
    try {
      await el.play()
      source = 'asset'
    } catch {
      source = speak(u.text, slow) ? 'tts' : 'none'
    }
  } else {
    source = speak(u.text, slow) ? 'tts' : 'none'
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

/** Warm the iOS audio pipeline on the first user gesture. */
export function primeAudio() {
  if (typeof window === 'undefined') return
  if ('speechSynthesis' in window) window.speechSynthesis.getVoices()
}
