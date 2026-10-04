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

/**
 * A shutter, three times.
 *
 * Sam, on the ASK card: "Put a triple flash on the ASK page photograph panel and a
 * photograph clicking sound."
 *
 * THE ONE SOUND IN THIS FILE THAT IS NOT INTERFACE FEEDBACK, and it is allowed because it
 * is not pretending to be. Everything above answers something the learner did: a press, a
 * refusal, a sentence that landed or did not. This answers nothing — it is part of a
 * demonstration, the audio half of a picture being taken, on the one card that has to show
 * what photographing a sign is like before anybody has done it.
 *
 * NOISE, NOT A NOTE. A camera click is a mechanism — a mirror and a blade, both broadband
 * — so `tone` is the wrong instrument entirely: any oscillator at any frequency reads as a
 * beep, and a beep is a notification. This is a burst of white noise through a high-pass,
 * which is what a click actually is.
 *
 * TWO BURSTS PER FRAME, 38ms apart, because a shutter has two edges: the blade opening and
 * the blade closing, and a single burst sounds like a switch rather than a camera. The
 * second is quieter than the first for the same reason it is in life.
 *
 * QUIETER THAN EVERYTHING ELSE HERE. It fires without being asked for — nobody pressed
 * anything — and an unrequested sound has to be further under the threshold than one that
 * answers a finger. It is also three of them in a row, and three of anything at tap's
 * volume is a nuisance.
 *
 * It rides the same switch as the rest of the file: silence the interface and this goes
 * with it. The flash is still there, which is the half that carries the meaning.
 */
export function shutter(times = 3, gap = 0.42) {
  if (!soundOn()) return
  const c = audio()
  if (!c) return
  try {
    const now = c.currentTime
    for (let i = 0; i < times; i++) {
      const at = now + i * gap
      click(c, at, 0.02)
      /* The blade closing: later, shorter, softer. */
      click(c, at + 0.038, 0.012)
    }
  } catch {
    /* Nothing to do about it, and nothing worth telling anybody. */
  }
}

/**
 * One edge of a shutter: a few milliseconds of filtered noise.
 *
 * Built as a buffer rather than an oscillator because the sound has no pitch — see the
 * note on `shutter`. The high-pass takes out the rumble that makes unfiltered noise sound
 * like wind rather than a mechanism, and the envelope is the same two-millisecond attack
 * `tone` uses, for the same reason: a gain that steps produces a click of its own on top
 * of the click being synthesised.
 */
function click(c: AudioContext, at: number, peak: number) {
  const ms = 9
  const frames = Math.max(1, Math.floor((c.sampleRate * ms) / 1000))
  const buf = c.createBuffer(1, frames, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < frames; i++) {
    /* Decaying noise: the energy is all at the start, which is what makes it a snap. */
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  }
  const src = c.createBufferSource()
  src.buffer = buf
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.setValueAtTime(1800, at)
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + ms / 1000)
  src.connect(hp).connect(gain).connect(c.destination)
  src.start(at)
  src.stop(at + ms / 1000 + 0.02)
}

/**
 * A sentence that did not land.
 *
 * Sam: "we also need a failed noise." The ping tells somebody they said it without asking
 * them to look up from the room they are speaking into; before this, the absence of a ping
 * was the only audible signal — and silence is also what a broken microphone sounds like.
 * So a miss gets a sound of its own, for the same reason the success did.
 *
 * WHY IT IS NOT `nope`, WHICH ALREADY EXISTS. That one refuses a PRESS — a tile landing in
 * the wrong place — and it is pitched to feel like a door that does not open. A miss here
 * is a different event: the learner did the thing asked of them and the browser could not
 * make it out, which is nobody's fault and certainly not a refusal. Reusing the rejection
 * sound would tell them they had done something wrong.
 *
 * SO IT FALLS, GENTLY, AND STOPS. Two notes a tone apart going down, slower and quieter
 * than the ping, with no third note to make a phrase of it. The shape is "not that one"
 * rather than "wrong" — and it is deliberately the quietest thing in this file, because a
 * learner who keeps missing will hear it five times in a row and a sound that nags is a
 * sound that makes somebody stop practising.
 */
export function missed() {
  if (!soundOn()) return
  const c = audio()
  if (!c) return
  try {
    const now = c.currentTime
    tone(c, now, 392, 110, 0.026, 'triangle')
    tone(c, now + 0.075, 330, 170, 0.022, 'triangle')
  } catch {
    /* Nothing to do about it, and nothing worth telling anybody. */
  }
}
