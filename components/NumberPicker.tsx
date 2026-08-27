'use client'

import { useState } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { slugFor } from '@/content/audio-manifest'
import { TEN_STEPS, UNIT_STEPS, parts, say, tensLabel, type NumberGender } from '@/content/numbers'

/**
 * A number you can say, not a number you can type.
 *
 * The slot was a text box with inputMode="numeric", so a Legend card came out as "Tenho
 * 56 anos" — a numeral the learner could read and could not pronounce. Somebody who
 * cannot say fifty-six cannot answer "how old are you", which is the whole point of that
 * card.
 *
 * Two columns rather than a wheel, and that is a deliberate downgrade: an iOS-style
 * wheel is a scroll, and a scroll hides everything except the value under the line. The
 * teaching here is that cinquenta e seis IS cinquenta and seis with an e in the middle,
 * and you only see that if the tens and the units are both on screen at once, named.
 */
export function NumberPicker({
  value,
  max = 100,
  gender = 'm',
  onChange,
}: {
  value: string
  max?: number
  gender?: NumberGender
  onChange: (n: string) => void
}) {
  const start = Number.parseInt(value, 10)
  const initial = Number.isFinite(start) && start >= 0 && start <= max ? start : 0
  const [tens, setTens] = useState(Math.floor(initial / 10))
  const [unit, setUnit] = useState(initial % 10)

  const set = (t: number, u: number) => {
    const n = Math.min(max, t * 10 + u)
    setTens(Math.floor(n / 10))
    setUnit(n % 10)
    // The stored value stays the digits. Every frame renders the WORDS from it, so the
    // sentence a learner reads is Portuguese and the thing we keep is unambiguous.
    onChange(String(n))
  }

  const n = Math.min(max, tens * 10 + unit)
  const shown = parts(n, gender)

  /*
    A grid, not a wrapping flex row.

    flex-1 made every cell share the width equally, so "quarenta", "cinquenta" and
    "sessenta" overlapped each other on a 390px screen — the longest words in the set,
    and the ones somebody most needs to read. A grid gives every cell the same box
    regardless of what is in it.
  */
  const cell =
    'tap-target rounded border px-1 py-3 text-center text-xs leading-tight transition '
  const on = 'border-accent bg-accent/10 text-accent font-semibold'
  const off = 'border-line text-muted hover:border-accent/50'

  return (
    <div className="flex flex-col gap-6">
      {/* The answer, said. Big, because it is the thing being learned. */}
      <div className="flex items-center gap-3">
        <AudioButton slug={slugFor(say(n, gender))} text={say(n, gender)} />
        <div className="min-w-0">
          <p className="pt text-balance text-2xl text-accent">{say(n, gender)}</p>
          {/* Its working, shown. Once somebody sees fifty-six come apart they can build
              every number to a hundred without being taught another one. */}
          {shown.length > 1 ? (
            <p className="mt-1 text-xs text-muted">
              {shown.map((p) => p.pt).join(' · ')} — {n}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted">{n}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="eyebrow text-muted">TENS</p>
        <div className="grid grid-cols-5 gap-1">
          {TEN_STEPS.filter((t) => t * 10 <= max).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set(t, unit)}
              className={cell + (t === tens ? on : off)}
            >
              {tensLabel(t)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="eyebrow text-muted">AND</p>
        <div className="grid grid-cols-5 gap-1">
          {UNIT_STEPS.filter((u) => tens * 10 + u <= max).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => set(tens, u)}
              className={cell + (u === unit ? on : off)}
            >
              {/* The unit's own name, which is what it is called when it stands alone —
                  and between ten and twenty the composed name is a different word
                  entirely, so the button shows the truth for the current ten. */}
              {tens === 1 ? say(10 + u, gender) : say(u, gender)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
