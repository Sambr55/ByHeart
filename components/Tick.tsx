'use client'

/**
 * The mark that says yes, drawn rather than dropped in.
 *
 * A correct answer had one signal: the row it lands in turns the correct colour. That is
 * true and it is quiet to the point of being missable, because the row appears at the same
 * moment and there is nothing to notice it against — the screen simply looks different
 * from how it looked, which is not the same as being told.
 *
 * A tick that draws itself is a different thing from a tick that appears. It takes 260ms,
 * it moves in the direction a hand moves, and it is over before anybody could call it a
 * celebration. Nothing bounces, nothing spins, nothing is coloured gold, and there is no
 * second sound — the point is acknowledgement, not applause, and the difference between
 * the two is almost entirely duration.
 *
 * Drawn with stroke-dashoffset over the path's own length, so the line appears from its
 * start to its end rather than fading in along all of it at once.
 */
export function Tick({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={'tick h-5 w-5 shrink-0 ' + className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 12.5 L9.5 17.5 L19.5 7" pathLength={1} />
    </svg>
  )
}
