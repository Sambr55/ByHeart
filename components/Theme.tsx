'use client'

import { useEffect, useState } from 'react'
import { PURPOSES, type Purpose } from '@/content/situations'
import { loadLearner, setPurpose } from '@/engine/learner'
import { setSound, soundOn, tap } from '@/engine/tap'

export type Theme = 'system' | 'light' | 'dark'
const KEY = 'byheart.theme'

/**
 * Reaching the dark theme.
 *
 * It was complete, correct and unreachable: every token had a dark value, every colour
 * cleared its threshold on the dark ground, and `data-theme` was never set by anything
 * in the product. It was OS-preference only, which meant a person who keeps their phone
 * light and wants a dark app — or reads in bed with the OS on light — had no way there.
 *
 * Three states, not two, and that is the important part. "Dark" and "light" are choices;
 * "system" is the absence of one, and it has to stay reachable or somebody who taps once
 * can never get back to following their phone. System stamps NOTHING on the root, which
 * is exactly what the stylesheet expects — the media query is guarded as
 * :root:not([data-theme='light']) precisely so an explicit choice wins in both
 * directions.
 */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    delete root.dataset.theme
    root.style.colorScheme = ''
  } else {
    root.dataset.theme = theme
    root.style.colorScheme = theme
  }
}

export function readTheme(): Theme {
  try {
    const v = window.localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

/**
 * Applied before paint, from the document head.
 *
 * A theme read after hydration means a dark-preferring person watches a white page for a
 * frame every single navigation, which is the thing that makes a toggle feel cheap. This
 * runs synchronously as the head parses, so the first paint is already correct — and it
 * touches only the root element's dataset, so there is nothing for React to disagree
 * with when it hydrates.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${KEY}');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}}catch(e){}})()`

const LABEL: Record<Theme, string> = { system: 'Match my phone', light: 'Light', dark: 'Dark' }

/**
 * Whether controls make a sound.
 *
 * Sits beside the theme because it is the same kind of thing: a fact about this person's
 * copy of DUB rather than a place to go. It exists at all because a tap sound with no way
 * to turn it off is the fastest route from "slick" to "uninstalled" — somebody sitting in
 * a quiet office with the ringer on should be able to keep the app and lose the noise.
 *
 * Default on, because a confirmation nobody discovers is not a confirmation.
 */
export function SoundChoice() {
  const [on, setOn] = useState(true)
  useEffect(() => setOn(soundOn()), [])

  return (
    <div className="flex flex-col gap-1">
      <p className="eyebrow text-muted">TAPS</p>
      <div role="group" aria-label="Tap sound" className="flex gap-1">
        {[true, false].map((choice) => (
          <button
            key={String(choice)}
            type="button"
            data-testid={'sound-' + (choice ? 'on' : 'off')}
            aria-pressed={on === choice}
            onClick={() => {
              setSound(choice)
              setOn(choice)
              // Played after the change, so turning it ON demonstrates what was turned on.
              if (choice) tap()
            }}
            className={
              'tap-target flex-1 rounded border px-3 py-1 text-[0.6rem] uppercase tracking-wider transition ' +
              (on === choice
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-muted hover:text-fg')
            }
          >
            {choice ? 'sound' : 'silent'}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Why you are in the city, changeable.
 *
 * The Club threshold promises this is here, so it has to be — a setting somebody is told
 * they can change and then cannot find is worse than not offering the change at all.
 *
 * Nothing is retracted when it moves. Somebody who arrives for a holiday and decides to
 * stay has not un-learned the bus; they have gained the Junta. So the copy says that
 * plainly rather than leaving somebody to wonder whether changing it costs them anything.
 */
export function PurposeChoice() {
  /*
    'unknown' rather than null, because null had two meanings and one of them hid this.

    It returned null when no purpose was set, which was harmless while the Legend asked the
    question on the way into the deck — anybody without an answer met it there. The Legend
    stopped asking, because set-up asks it now and asking twice is a form. Which left this:
    somebody who swipes past set-up has no purpose, so the one control that would let them
    choose one hides ITSELF on the grounds that they have not chosen.

    The unset state is exactly when this is most worth showing. It is a setting, not a
    prompt, so nothing here nags — it is simply present, with nothing selected.
  */
  const [purpose, setPurposeState] = useState<Purpose | null | 'unknown'>('unknown')
  useEffect(() => setPurposeState(loadLearner().purpose ?? null), [])
  // Only before the browser has read storage. Flashing an empty control at somebody who
  // answered weeks ago is worse than a moment of nothing.
  if (purpose === 'unknown') return null

  return (
    <div className="flex flex-col gap-1">
      <p className="eyebrow text-muted">IN LISBON</p>
      <div role="group" aria-label="Why you are here" className="flex gap-1">
        {PURPOSES.map((p) => (
          <button
            key={p.id}
            type="button"
            data-testid={'purpose-set-' + p.id}
            aria-pressed={purpose === p.id}
            onClick={() => {
              setPurpose(p.id)
              setPurposeState(p.id)
            }}
            className={
              'tap-target flex-1 rounded border px-3 py-1 text-[0.6rem] uppercase tracking-wider transition ' +
              (purpose === p.id
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-muted hover:text-fg')
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Changes what Lisbon offers you. Nothing you have already done goes anywhere.
      </p>
    </div>
  )
}

export function ThemeChoice() {
  // Read after mount. The stored theme is not something the server has, and the head
  // script has already applied it, so there is nothing to flash.
  const [theme, setTheme] = useState<Theme>('system')
  useEffect(() => setTheme(readTheme()), [])

  const choose = (next: Theme) => {
    setTheme(next)
    applyTheme(next)
    try {
      if (next === 'system') window.localStorage.removeItem(KEY)
      else window.localStorage.setItem(KEY, next)
    } catch {
      /* private mode. The choice still holds for this visit. */
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="eyebrow text-muted">APPEARANCE</p>
      <div role="group" aria-label="Appearance" className="flex gap-1">
        {(['system', 'light', 'dark'] as Theme[]).map((t) => (
          <button
            key={t}
            type="button"
            data-testid={'theme-' + t}
            aria-pressed={theme === t}
            onClick={() => choose(t)}
            className={
              'tap-target flex-1 rounded border px-3 py-1 text-[0.6rem] uppercase tracking-wider transition ' +
              (theme === t
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-muted hover:border-accent/50')
            }
          >
            {LABEL[t]}
          </button>
        ))}
      </div>
    </div>
  )
}
