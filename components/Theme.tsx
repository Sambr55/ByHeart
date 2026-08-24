'use client'

import { useEffect, useState } from 'react'

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
