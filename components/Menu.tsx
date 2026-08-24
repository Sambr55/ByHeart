'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * The way around the product.
 *
 * Until now every part of DUB that was not the journey — the line, the proof card,
 * accounts — existed at a URL and nowhere else, which meant that as far as anybody
 * using the app was concerned they did not exist at all. This is the fix, and the
 * hints matter as much as the labels: a menu of bare nouns makes somebody guess.
 */
const ITEMS = [
  { href: '/crates', label: 'Crates', hint: 'Everything you can open, and what is still dimmed' },
  { href: '/vocab', label: 'Vocab library', hint: 'Every piece you have kept, by stage' },
  { href: '/drops', label: 'Drops', hint: 'Pegged to something really happening, and expiring' },
  { href: '/line', label: 'Today’s line', hint: 'Twenty seconds, once a day' },
  { href: '/proof', label: 'Proof', hint: 'The sentences you can say cold' },
  { href: '/pro', label: 'DUB membership', hint: 'What it adds, and what the money is for' },
  { href: '/account', label: 'Account', hint: 'Signing in, billing, and your data' },
  { href: '/feedback', label: 'Feedback', hint: 'Tell us what did not land' },
]

export function Menu() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  useEffect(() => setMounted(true), [])
  const panel = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  // Escape closes it, and focus goes back to the button that opened it rather than
  // being dumped at the top of the document.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    panel.current?.querySelector<HTMLElement>('a')?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        ref={trigger}
        type="button"
        data-testid="menu"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="tap-target -mr-2 flex items-center justify-center rounded-lg px-2 text-muted transition hover:text-fg"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/*
        Portalled to the body on purpose. Every header this sits in uses backdrop-blur,
        and a backdrop-filter establishes a containing block — so a `fixed inset-0`
        overlay rendered in place resolves against the 64px header instead of the
        viewport, and the panel collapses to a strip.
      */}
      {open && mounted
        ? createPortal(
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div
            ref={panel}
            role="dialog"
            aria-label="Menu"
            className="relative flex h-full w-[min(20rem,85vw)] flex-col border-l border-line bg-bg-elev"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <span className="eyebrow text-muted">DUB</span>
              <button
                type="button"
                data-testid="menu-close"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="tap-target -mr-2 flex items-center justify-center rounded-lg px-2 text-muted transition hover:text-fg"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {ITEMS.map((item) => {
                const here = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={here ? 'page' : undefined}
                    className={
                      'tap-target rounded-xl border px-4 py-3 transition ' +
                      (here
                        ? 'border-accent bg-accent/10'
                        : 'border-transparent hover:border-line hover:bg-surface')
                    }
                  >
                    <span className="display block text-sm">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      {item.hint}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>,
        document.body,
      )
        : null}
    </>
  )
}
