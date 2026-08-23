'use client'

import type { Screen } from '@/content/types'
import { useCopy } from '@/engine/session'

/**
 * Shared screen header. Rendering order is fixed so hierarchy never drifts between
 * screens: eyebrow, cultural hook, scene, prompt, gloss, supporting line.
 * Portuguese always outranks English when both are present (spec §7).
 */
/**
 * The moment, kept in view. Small enough to stay out of the way of the exercise,
 * present enough that the learner never loses the thread back to why this language
 * turned up at all.
 */
export function SourceStrip({ source }: { source: NonNullable<Screen['source']> }) {
  return (
    <div className="rounded-lg border border-line/70 bg-surface/50 px-3 py-2">
      {source.from ? (
        <p className="text-[0.6rem] uppercase tracking-wider text-muted">{source.from}</p>
      ) : null}
      <p className="mt-0.5 text-xs text-muted">“{source.line}”</p>
      <p className="pt mt-1 text-sm text-accent/70">
        <KeyedLine pt={source.pt} keyWord={source.key} />
      </p>
    </div>
  )
}

/** Lifts the target out of the line without hiding the rest of it. */
function KeyedLine({ pt, keyWord }: { pt: string; keyWord?: string }) {
  if (!keyWord) return <>{pt}</>
  const at = pt.toLowerCase().indexOf(keyWord.toLowerCase())
  if (at < 0) return <>{pt}</>
  return (
    <>
      {pt.slice(0, at)}
      <span className="font-semibold text-accent underline decoration-accent/40 underline-offset-4">
        {pt.slice(at, at + keyWord.length)}
      </span>
      {pt.slice(at + keyWord.length)}
    </>
  )
}

export function Prompt({ screen: raw }: { screen: Screen }) {
  const screen = useCopy(raw)
  return (
    <header className="space-y-3">
      {screen.eyebrow ? (
        <p className="eyebrow text-accent">{screen.eyebrow}</p>
      ) : null}

      {screen.hook ? (
        <div>
          <p className="display text-balance text-2xl text-fg sm:text-3xl">
            <span className="text-muted">“</span>
            {screen.hook}
            <span className="text-muted">”</span>
          </p>
          {screen.source?.pt ? (
            <p className="pt mt-2 text-base text-accent/75">
              <KeyedLine pt={screen.source.pt} keyWord={screen.source.key} />
            </p>
          ) : null}
        </div>
      ) : screen.source ? (
        <SourceStrip source={screen.source} />
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
