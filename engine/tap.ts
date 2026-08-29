/**
 * The sound a control makes, synthesised rather than downloaded.
 *
 * No file, for three reasons that all matter more than they sound. A request on the first
 * tap of a session arrives after the tap it is confirming, which is worse than silence. A
 * cached file is still a decode. And a tone built from two oscillators can be TUNED — the
 * difference between a soft wooden tock and a game boop is about forty milliseconds and one
 * frequency, and neither is something you can adjust in an asset pipeline.
 *
 * What it is: a low thump at 170Hz that falls away in 70ms, with a much quieter click on
 * top of it at 1.7kHz lasting 14ms. The click is what makes it read as a mechanism rather
 * than a note; the thump is what stops it reading as a notification. Both are far below
 * speech level, because this plays on every press and anything you notice twice is
 * something you will want turned off by the third.
 */
const PREF = 'byheart.sound'

let ctx: AudioContext | null = null

/** Off is a real answer, and it is remembered. Default on. */
export function soundOn(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(PREF) !== 'off'
  } catch {
    return true
  }
}

export function setSound(on: boolean) {
  try {
    window.localStorage.setItem(PREF, on ? 'on' : 'off')
  } catch {
    /* Private mode. It stays on for this session, which is the harmless failure. */
  }
}

/**
 * The audio context, made on a gesture and never before one.
 *
 * A context created on page load starts suspended on both iOS and Chrome, and a suspended
 * context that is resumed later has a habit of swallowing the first sound it is asked for
 * — which would mean the first tap of every session is the silent one. Built inside the
 * handler instead, where a gesture is by definition in progress.
 */
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(c: AudioContext, at: number, hz: number, ms: number, peak: number, type: OscillatorType) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(hz, at)
  /*
    Ramped rather than switched.

    A gain that steps from 0 to its value produces a click of its own — a real one, the
    discontinuity kind — on top of the click being synthesised. Two milliseconds of attack
    is inaudible as a fade and removes it entirely.
  */
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + ms / 1000)
  osc.connect(gain).connect(c.destination)
  osc.start(at)
  osc.stop(at + ms / 1000 + 0.02)
}

/**
 * One press.
 *
 * Silent and harmless when the preference is off, when there is no audio at all, or when
 * the browser refuses — a control that throws because it could not make a noise is a
 * control that is broken for the sake of a decoration.
 */
export function tap() {
  if (!soundOn()) return
  const c = audio()
  if (!c) return
  try {
    const now = c.currentTime
    tone(c, now, 170, 70, 0.055, 'sine')
    tone(c, now, 1700, 14, 0.012, 'triangle')
  } catch {
    /* Nothing to do about it, and nothing worth telling anybody. */
  }
}

/**
 * And the same press, felt.
 *
 * Android only, and said plainly rather than discovered later: iOS Safari implements no
 * Vibration API at all, installed to the home screen or not. There is no polyfill worth
 * having — the tricks that appear to work rely on a switch control's native haptic and
 * fire at the wrong moment for the wrong reason. So this is a bonus on the platforms that
 * have it, and the sound is what carries the confirmation everywhere else.
 */
export function buzz(ms = 8) {
  if (!soundOn()) return
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* Some browsers throw rather than returning false. */
  }
}
