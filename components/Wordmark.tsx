import { CLUB } from '@/content/club'

/**
 * The wordmark, in one place.
 *
 * Every screen has been hand-rolling the name as live Archivo text, which is why there
 * was nowhere to put a logo when one arrived. This is that seam: swap the branch below
 * for the SVG and all six placements change at once.
 *
 * BLOCKED ON ASSETS. public/ holds a service worker and an audio manifest and nothing
 * else — the two logo files do not exist in the repo, so the text lock-up below is still
 * what renders. When public/brand/dub.svg and public/brand/dub-club.svg land, this
 * component is the only file that needs editing.
 *
 * Two things whoever supplies them should know. SVG rather than PNG, because a 200px
 * PNG is too small for the app icon at 512, the Apple icon at 180 or the share image at
 * 1200, and it cannot be recoloured — the header is blue and needs a white mark, which
 * one SVG handles through currentColor and two PNGs do not. And the browser tab wants
 * the U's speech-bubble tail on its own rather than the wordmark: three letters do not
 * survive 16px, and the tail is the distinctive part.
 *
 * next/og cannot read any of this. The share image resolves no CSS variables and no
 * component tree, so it will need the mark inlined as a data URI or fetched by absolute
 * URL — worth expecting rather than discovering.
 */
export function Wordmark({
  mark = 'dub',
  className = '',
}: {
  mark?: 'dub' | 'club'
  className?: string
}) {
  const text = mark === 'club' ? CLUB.name : 'DUB'
  return (
    <span
      className={'display inline-flex items-center text-sm font-bold tracking-[0.35em] ' + className}
      aria-label={text}
    >
      {text}
    </span>
  )
}
