import { DUB, DUB_CLUB, DUB_MARK, type Mark } from '@/content/marks'

const MARKS: Record<string, Mark> = { dub: DUB, club: DUB_CLUB, mark: DUB_MARK }

/**
 * The wordmark, in one place.
 *
 * Every screen was hand-rolling the name as live Archivo text, which is why there was
 * nowhere to put a logo when one arrived. Six placements, one component.
 *
 * Inline SVG rather than <img src="/brand/dub.svg">, and that is the whole reason this
 * is a component at all: the header is blue and needs a white mark, and an <img> cannot
 * inherit `currentColor`. Inline, the mark takes the colour of whatever it sits in — ink
 * on sand, white on the bar, the crate's own tone if it ever wants it — from one file.
 *
 * `mark="mark"` is the U on its own, carrying the speech-bubble tail. That is the icon
 * everywhere something is too small for words: three letters do not survive 16px, and
 * the tail is the part of this mark that means anything.
 *
 * Sizing is by height. A wordmark has one correct dimension and it is not width.
 */
export function Wordmark({
  mark = 'dub',
  className = '',
  title,
}: {
  mark?: 'dub' | 'club' | 'mark'
  className?: string
  /** Overrides the accessible name. Use when the mark sits inside a link that says more. */
  title?: string
}) {
  const m = MARKS[mark]
  return (
    <svg
      viewBox={m.viewBox}
      className={'w-auto ' + className}
      role="img"
      aria-label={title ?? m.label}
      // The mark is one path with a subpath per glyph, so the counters are holes.
      fill="currentColor"
      fillRule="evenodd"
    >
      <path d={m.d} />
    </svg>
  )
}
