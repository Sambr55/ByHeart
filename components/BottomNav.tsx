'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Four places, always there.
 *
 * The burger was eleven destinations behind a tap, ordered by nothing in particular, and
 * it had become the place things went when there was no obvious home for them — Proof,
 * Drops, the Vocab library, membership, feedback, the account, all peers of Dub Club in
 * a flat list. A menu that long is a filing cabinet, and a filing cabinet is where a
 * product hides the fact that it has not decided what matters.
 *
 * So: four. Learning, the city, today, and yours. Everything else is reachable from
 * inside one of them, which is a claim about what those things ARE rather than a way of
 * saving space — Proof and the Vocab library and your Legend are all answers to "what
 * have I got", and that question has a screen now.
 *
 * Not on a lesson. The teaching beats are a held sequence and a persistent bar offering
 * three ways out is an invitation to leave in the middle of the one thing that works.
 */
const TABS = [
  { href: '/vibes', label: 'Vibes', d: 'M4 6h7v7H4zM13 6h7v7h-7zM4 15h7v3H4zM13 15h7v3h-7z' },
  { href: '/club', label: 'Lisbon', d: 'M4 20V9l8-5 8 5v11M9 20v-6h6v6' },
  { href: '/line', label: 'Today', d: 'M5 4h14v16l-7-4-7 4zM9 9h6' },
  { href: '/profile', label: 'Yours', d: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0' },
] as const

export function BottomNav() {
  const path = usePathname()
  return (
    <nav
      data-testid="bottom-nav"
      aria-label="Where to go"
      /*
        pb accounts for the home indicator. Without it the last row of a scrolling page
        sits under the bar on every modern iPhone, which is the single most common way a
        bottom bar goes wrong.
      */
      /* The home-indicator clearance is on .bar.nav-bar in globals.css, with the rest of
         the inset handling, so there is one place the phone's furniture is described. */
      className="bar nav-bar fixed inset-x-0 bottom-0 z-50 flex"
    >
      {TABS.map((t) => {
        const here = path === t.href || (t.href === '/vibes' && path === '/')
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={here ? 'page' : undefined}
            data-testid={'tab-' + t.label.toLowerCase()}
            /*
              White on blue, and the current tab is the WHITEST thing on it.

              The old bar was the page ground with a blue tint on one label, which read as
              recessive — a bar you have to look for is not a permanent navigation, it is a
              footer. On a saturated ground the difference between here and not-here is
              opacity and weight rather than hue, which survives both themes without a
              second colour to keep in step.
            */
            className={
              'tap-target relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition ' +
              (here ? 'text-accent' : 'text-muted')
            }
          >
            {here ? (
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 mx-auto h-1 w-10 rounded-full bg-[color:var(--accent)]"
              />
            ) : null}
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={here ? 2 : 1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={t.d} />
            </svg>
            <span className="text-[0.6rem] uppercase tracking-wider">{t.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * The room the bar leaves. Sits at the foot of a scrolling page so its last line is
 * readable rather than tucked behind the nav.
 *
 * Collapses to nothing when the page it is on has a dock.
 *
 * A dock IS the clearance — it is sticky 4.5rem off the bottom and holds itself above the
 * bar — and it can only rest there if nothing sits under it in the flow. A spacer under one
 * pushes it up by the spacer's height plus the column's gap, which put the Legend's SAVE IT
 * 136px off the bottom while every other button in the product sat at 72. Screens that
 * switch between docked and undocked views (the Legend deck against a Legend card) cannot
 * make that decision at the call site without threading state through for it, so the CSS
 * makes it: :has() asks whether this page has a dock, which is exactly the question.
 */
export function BottomNavSpace() {
  return <div aria-hidden className="nav-clear shrink-0" />
}
