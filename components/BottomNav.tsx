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
/*
  ASK takes the third slot, and it is the only tab that is not a place.

  Today was a destination nobody was sent to: nothing schedules the daily line, so the tab
  led to a screen that was usually the same as yesterday. The translator is the opposite —
  it is useful at any moment, on any screen, and was reachable only from a rail on the Club
  and a button that hid whenever that rail appeared.

  It opens a panel rather than navigating, so it is a button in a row of links. That is a
  real inconsistency and the right one: going somewhere and asking for something are
  different acts, and a person who taps ASK does not want to lose the screen they are on.
*/
const TABS = [
  { href: '/vibes', label: 'Vibes', d: 'M4 6h7v7H4zM13 6h7v7h-7zM4 15h7v3H4zM13 15h7v3h-7z' },
  { href: '/club', label: 'Lisbon', d: 'M4 20V9l8-5 8 5v11M9 20v-6h6v6' },
  /*
    What is on, and it belongs next to the city rather than out at the end.

    The bar is the shape of the product: the vibes, the city, the tool, your things. A
    calendar is the city with a date on it, so it sits where the city is.
  */
  {
    href: '/calendar',
    label: 'On',
    d: 'M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 10h16M8 4v4M16 4v4',
  },
  {
    href: null,
    label: 'Ask',
    d: 'M9.1 9a3 3 0 1 1 4 2.8c-.8.3-1.1 1-1.1 1.7v.5M12 17.5h.01',
  },
  { href: '/profile', label: 'Yours', d: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0' },
] as const

export function BottomNav() {
  const path = usePathname()
  /*
    One rule for every tab, rather than one rule per tab and one of them showing.

    Each tab used to draw its own marker and the others drew nothing, so moving between
    them was a marker vanishing here and a different one appearing there — two events for
    one movement, which is what makes a bar read as four separate buttons instead of one
    object with a position in it. A single element that slides says the thing that is
    actually true: you are somewhere on this bar, and now you are somewhere else on it.

    -1 while the route is not one of the four (a lesson, a Legend card): the marker leaves
    rather than sitting under a tab nobody is on.
  */
  const hereIndex = TABS.findIndex((t) => path === t.href || (t.href === '/vibes' && path === '/'))

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
      {/*
        The marker itself, positioned by which tab is current. Transform rather than left,
        so it is one compositor property and cannot reflow the bar it sits in.
      */}
      <span
        aria-hidden
        data-testid="nav-marker"
        className="pointer-events-none absolute left-0 top-0 h-1 rounded-full bg-[color:var(--accent)] transition-transform duration-[260ms]"
        style={{
          width: '2.5rem',
          transform:
            hereIndex < 0
              ? 'translateX(-4rem)'
              : /*
                   Divided by the number of tabs, not by four.

                   The 4 was correct for as long as there were four, and a fifth was added
                   for the calendar — so the marker sat off-centre on /vibes, over ASK on
                   /calendar, and entirely off-screen on /profile. The label styling and
                   aria-current stayed right, which is why it read as a stray dash rather
                   than as broken navigation.
                 */
                'translateX(calc(' +
                (hereIndex * 100 + 50) +
                'vw / ' +
                TABS.length +
                ' - 1.25rem))',
          opacity: hereIndex < 0 ? 0 : 1,
        }}
      />
      {TABS.map((t, i) => {
        const here = i === hereIndex
        /*
          One tab is a button, so the row is built from a shared set of props rather than
          from two copies of the same markup that will drift apart the first time anybody
          changes the type scale.
        */
        const shared = {
          'aria-current': here ? ('page' as const) : undefined,
          'data-testid': 'tab-' + t.label.toLowerCase(),
          /*
            White on blue, and the current tab is the WHITEST thing on it.

            The old bar was the page ground with a blue tint on one label, which read as
            recessive — a bar you have to look for is not a permanent navigation, it is a
            footer. On a saturated ground the difference between here and not-here is
            opacity and weight rather than hue, which survives both themes without a second
            colour to keep in step.
          */
          className:
            'tap-target relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition ' +
            (here ? 'text-accent' : 'text-muted'),
        }
        const inside = (
          <>
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
          </>
        )
        return t.href ? (
          <Link key={t.label} href={t.href} {...shared}>
            {inside}
          </Link>
        ) : (
          <button
            key={t.label}
            type="button"
            aria-label="How do I say something"
            onClick={() => window.dispatchEvent(new CustomEvent('dub:ask'))}
            {...shared}
          >
            {inside}
          </button>
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
