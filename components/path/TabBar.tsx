'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * The app-style tab bar, as a proposal. NOT a replacement for components/BottomNav.tsx —
 * that stays the product's bar until the merge decides; this renders on /path only.
 *
 * Phone: a bar along the bottom, like BottomNav. Wide: Simply Guitar's left icon rail,
 * the current tab a white rounded tile.
 *
 * Four tabs: the trip, what is on, practice, yours. Ask is not here because on the path
 * it is the header's job (see PathHome) — going somewhere and asking something are
 * different acts, which is the argument BottomNav already makes for it.
 */
export interface Tab {
  href: string
  label: string
  d: string
  /** Routes that also light this tab. */
  match?: string[]
}

export function pathTabs(practiceHref: string): Tab[] {
  return [
    {
      href: '/path',
      label: 'Trip',
      d: 'M6 20c0-4 4-4 6-8s6-4 6-8M6 20a2 2 0 1 0 0-.01M18 4a2 2 0 1 0 0-.01',
    },
    {
      href: '/calendar',
      label: 'On',
      d: 'M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 10h16M8 4v4M16 4v4',
    },
    {
      href: practiceHref,
      label: 'Practice',
      d: 'M9 3h6v11a3 3 0 0 1-6 0zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21',
      match: ['/revise'],
    },
    { href: '/profile', label: 'Yours', d: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0' },
  ]
}

export function TabBar({ tabs }: { tabs: Tab[] }) {
  const path = usePathname()
  const bar = useRef<HTMLElement | null>(null)

  /* Same contract as BottomNav: publish the bar's height for .nav-clear — but only while
     it is a bottom bar. As a side rail it takes no room below anything. */
  useEffect(() => {
    const el = bar.current
    if (!el) return
    const wide = window.matchMedia('(min-width: 768px)')
    const publish = () =>
      document.documentElement.style.setProperty('--bar-h', wide.matches ? '0px' : el.offsetHeight + 'px')
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(el)
    wide.addEventListener('change', publish)
    return () => {
      ro.disconnect()
      wide.removeEventListener('change', publish)
    }
  }, [])

  return (
    <nav
      ref={bar}
      aria-label="Where to go"
      className="bar nav-bar fixed inset-x-0 bottom-0 z-50 flex md:inset-y-0 md:left-0 md:right-auto md:w-24 md:flex-col md:items-center md:justify-start md:gap-3 md:border-r md:border-t-0 md:px-3 md:py-6"
    >
      {tabs.map((t) => {
        const base = t.href.split('?')[0]
        const here = path === base || (t.match ?? []).some((m) => path.startsWith(m))
        return (
          <Link
            key={t.label}
            href={t.href}
            aria-current={here ? 'page' : undefined}
            className={
              'tap-target flex flex-1 flex-col items-center justify-center gap-1 py-3 md:w-full md:flex-none md:rounded-2xl ' +
              (here ? 'md:bg-bg-elev md:text-accent' : 'opacity-75 md:opacity-90')
            }
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={here ? 2.2 : 1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={t.d} />
            </svg>
            <span className={'text-[0.6rem] uppercase tracking-wider ' + (here ? 'font-bold' : '')}>
              {t.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
