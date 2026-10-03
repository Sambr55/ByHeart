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
 * A press that is refused.
 *
 * Lower and shorter than `tap`, and deliberately NOT a buzzer. The word-picker rejects a
 * tile the moment it lands in the wrong place, and the feeling wanted there is a door that
 * does not open — not a klaxon. Two descending notes say "not that" in about a tenth of a
 * second, which is under the threshold at which a sound starts to feel like a telling-off.
 *
 * It exists because of what `buzz` says below it: iOS Safari has no Vibration API,
 * installed to the home screen or not, so on the phone this product is built for the
 * haptic simply does not fire. Sound is the only channel that reaches every device, so the
 * rejection has one of its own rather than borrowing the press.
 */
export function nope() {
  if (!soundOn()) return
  const c = audio()
  if (!c) return
  try {
    const now = c.currentTime
    tone(c, now, 220, 60, 0.05, 'sine')
    tone(c, now + 0.055, 165, 80, 0.045, 'sine')
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

/**
 * A sentence that landed.
 *
 * THE THIRD SOUND, and the one that had the best reason to exist. Sam: "when an audio is
 * correct it needs to have a subtle ping for success sound." The run-through is the only
 * beat in DUB that marks somebody's work, and until now the marking was entirely visual —
 * which is the wrong channel for it. A learner saying their Legend out loud is looking at
 * the room, or at nothing, or has the phone at their chin. The one moment they are
 * guaranteed NOT to be reading the screen is the moment they are speaking into it.
 *
 * WHY IT IS A RISE AND NOT A CHIME. Two notes a fifth apart, the second above the first,
 * is the smallest gesture that reads as "yes" without reading as a reward — the arcade
 * jingle is three or more and goes up at the end, which is the sound of points being
 * scored. DUB has no points. This is somebody being told they said it, which is a smaller
 * and truer thing, so it gets two notes and stops.
 *
 * E5 then B5, 55ms apart. Triangle rather than sine because a pure sine at 1kHz is a
 * notification and everybody's phone has trained them to ignore it; a triangle has enough
 * upper harmonic to sound struck. Both peaks are under `tap`'s thump on purpose: this
 * plays after speech, and a success that is louder than the voice it is praising is a
 * sound somebody turns off.
 *
 * It rides the same switch as everything else here. Somebody who has silenced the
 * interface has silenced this too, and the visual mark is still there — see the heard
 * panel in components/Legend.tsx, which never depended on sound and still does not.
 */
export function ping() {
  if (!soundOn()) return
  const c = audio()
  if (!c) return
  try {
    const now = c.currentTime
    tone(c, now, 659, 90, 0.035, 'triangle')
    tone(c, now + 0.055, 988, 150, 0.03, 'triangle')
  } catch {
    /* Nothing to do about it, and nothing worth telling anybody. */
  }
}
