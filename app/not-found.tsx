import Link from 'next/link'
import { Wordmark } from '@/components/Wordmark'
import { Dock, Framed } from '@/components/Dock'

export const metadata = { title: 'Not here — DUB' }

/**
 * A 404 that belongs to the product.
 *
 * There was no not-found.tsx at all, so a mistyped URL, an old share link or a dead
 * bookmark rendered the Next.js default: a bare sans-serif "404 | This page could not be
 * found" on white, in a product whose entire visual argument is that it comes from
 * somewhere. Share links are the one surface strangers arrive on, and a share card that
 * has been deleted lands exactly here.
 *
 * Two ways out rather than one, because the two people who see this screen want
 * different things: somebody who uses DUB wants their own page, and somebody who has
 * never heard of it wants to know what this is.
 */
export default function NotFound() {
  return (
    <div
      data-stage="REAL WORLD"
      /* app-frame: one scrolling region, dock beneath it. See components/Dock.tsx. */
      className="app-frame safe-top bg-bg text-fg"
    >
      <Framed className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 pb-10 pt-6">
      <Wordmark className="h-3 text-muted" />
      <div className="flex flex-1 flex-col justify-center gap-3">
        <p className="eyebrow text-accent">NOT HERE</p>
        <h1 className="display text-balance text-3xl">This page does not exist.</h1>
        <p className="text-sm leading-relaxed text-muted">
          Either the address is wrong, or it was a share card somebody has since taken
          down. Nothing you have learned is affected — that lives with your account, not
          with a link.
        </p>
      </div>
      <Dock>
        <Link
          href="/club"
          className="tap-target eyebrow block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
        >
          GO TO DUB CLUB
        </Link>
        <Link
          href="/"
          className="tap-target eyebrow block w-full rounded border border-line-strong px-5 py-3 text-center text-muted"
        >
          FROM THE TOP
        </Link>
      </Dock>
      </Framed>
    </div>
  )
}
