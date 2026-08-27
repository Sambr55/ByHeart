'use client'

import Link from 'next/link'

/**
 * One step back, named.
 *
 * What replaces the burger on the screens that are not tabs. The bar at the foot gets you
 * to the four places that matter; everything else is a room inside one of them, and a room
 * needs a door rather than a directory — an arrow that says where it goes, so nobody has
 * to tap it to find out.
 */
export function Back({ href = '/profile', label = 'YOURS' }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      data-testid="back"
      className="tap-target eyebrow -ml-1 flex shrink-0 items-center gap-1 px-1 text-accent"
    >
      <span aria-hidden>←</span>
      {label}
    </Link>
  )
}
