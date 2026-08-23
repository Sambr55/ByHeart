import type { Screen } from '@/content/types'

/**
 * Shared screen header. Rendering order is fixed so hierarchy never drifts between
 * screens: eyebrow, cultural hook, scene, prompt, gloss, supporting line.
 * Portuguese always outranks English when both are present (spec §7).
 */
export function Prompt({ screen }: { screen: Screen }) {
  return (
    <header className="space-y-3">
      {screen.eyebrow ? (
        <p className="eyebrow text-accent">{screen.eyebrow}</p>
      ) : null}

      {screen.hook ? (
        <p className="display text-balance text-2xl text-fg sm:text-3xl">
          <span className="text-muted">“</span>
          {screen.hook}
          <span className="text-muted">”</span>
        </p>
      ) : null}

      {screen.context ? (
        <p className="text-sm font-semibold text-fg">{screen.context}</p>
      ) : null}

      {screen.headlinePt ? (
        <p className="pt text-balance text-3xl text-accent sm:text-4xl">
          {screen.headlinePt}
        </p>
      ) : null}

      {screen.headline ? (
        <h1
          className={
            'display text-balance ' +
            (screen.hook || screen.headlinePt
              ? 'text-xl text-fg sm:text-2xl'
              : 'text-3xl text-fg sm:text-4xl')
          }
        >
          {screen.headline}
        </h1>
      ) : null}

      {screen.sub ? (
        <p className="text-pretty text-sm leading-relaxed text-muted">{screen.sub}</p>
      ) : null}

      {screen.note ? (
        <p className="pt text-sm text-accent/90">{screen.note}</p>
      ) : null}
    </header>
  )
}
