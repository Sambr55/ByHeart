'use client'

import { useEffect, useRef, useState } from 'react'
import { googleHref, icsHref, type CalEvent } from '@/content/cal-event'
import { track } from '@/engine/analytics'

/**
 * ADD TO CALENDAR, on every event DUB shows (Sam, 2026-11-05: "Anytime there is an event on
 * a board or anywhere you need to be able to add it to calendar").
 *
 * Two doors, because there are two kinds of calendar: the phone's own (an .ics, which an
 * iPhone opens as the system's Add to Calendar sheet, and which Outlook and Android take
 * too) and Google's, which is a web page. One tap opens the choice; nothing is added until
 * the calendar itself asks.
 *
 * A button, never inside a link: on a card that is itself a link, put this beside it.
 */
export function AddToCalendar({
  event,
  tone = 'light',
  up = false,
  className = '',
}: {
  event: CalEvent
  /** light: on a cream card. dark: on the blue bar or a photograph. */
  tone?: 'light' | 'dark'
  /** Open the choice above the button — in a bottom sheet, below is off the screen. */
  up?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const pick = (where: 'phone' | 'google') => {
    track('cal_add', { kind: event.kind, id: event.id, where })
    setOpen(false)
  }
  const btn =
    tone === 'dark'
      ? 'border-[rgba(255,255,255,0.45)] text-white'
      : 'border-accent/50 bg-bg-elev text-accent'

  return (
    <div ref={box} className={'relative inline-block ' + className}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid={'cal-add-' + event.kind + '-' + event.id}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className={'tap-target eyebrow inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 text-[0.65rem] ' + btn}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />
        </svg>
        Add to calendar
      </button>
      {open ? (
        <div
          role="menu"
          className={'absolute left-0 z-40 flex w-60 ' + (up ? 'bottom-full mb-2 ' : 'top-full mt-2 ') + ' flex-col overflow-hidden rounded-2xl border border-line bg-bg-elev text-fg shadow-lg'}
          data-testid="cal-add-menu"
        >
          <a role="menuitem" href={icsHref(event)} onClick={() => pick('phone')} className="tap-target px-4 py-3 text-sm hover:bg-surface">
            <span className="block font-semibold">This phone’s calendar</span>
            <span className="block text-xs text-muted">Apple Calendar, Outlook, Android</span>
          </a>
          <a
            role="menuitem"
            href={googleHref(event, typeof window === 'undefined' ? 'https://app.thisisdub.club' : window.location.origin)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => pick('google')}
            className="tap-target border-t border-line px-4 py-3 text-sm hover:bg-surface"
          >
            <span className="block font-semibold">Google Calendar</span>
            <span className="block text-xs text-muted">Opens Google with it filled in</span>
          </a>
        </div>
      ) : null}
    </div>
  )
}
