/**
 * ONE EVENT, READY FOR SOMEBODY'S OWN CALENDAR (Sam, 2026-11-05: "Anytime there is an
 * event on a board or anywhere you need to be able to add it to calendar").
 *
 * DUB has two kinds of thing with a date: a DROP (a night with rooms of Portuguese in it)
 * and a CALENDAR ROW (what is on, as the board's What's-on squares show it). Both become
 * the same CalEvent here, so every Add to calendar button — on the What's on cards, the
 * board, a drop's rooms, the Drops page — says the same thing in the same words, and the
 * subscription feed (lib/ics.ts) writes them the same way too.
 *
 * Pure and client-safe: the Google link is built in the browser, the .ics is served by
 * /api/calendar/event, which looks the event up rather than trusting the URL.
 */
import type { Drop } from '@/content/drops'
import type { CalendarRow } from '@/content/calendar'

export type CalKind = 'drop' | 'row'

export interface CalEvent {
  kind: CalKind
  id: string
  /** The event's own name and nothing else — "DUB:" belongs in the description. See lib/ics.ts. */
  title: string
  /** ISO day. All-day: the door time belongs to the venue. */
  on: string
  /** Last day, for a run of days. */
  until?: string
  location: string
  /** Where in DUB the Portuguese for it lives. */
  path: string
}

export function eventOfDrop(d: Drop): CalEvent {
  return {
    kind: 'drop',
    id: d.id,
    title: d.event,
    on: d.on,
    location: d.place.name + (d.place.area ? ', ' + d.place.area : ''),
    path: '/club?drop=' + d.id,
  }
}

export function eventOfRow(r: CalendarRow): CalEvent {
  const w = r.where
  return {
    kind: 'row',
    id: r.id,
    title: r.name,
    on: r.on,
    until: r.until && r.until !== r.on ? r.until : undefined,
    location: w ? w.name + (w.area ? ', ' + w.area : '') : '',
    path: '/calendar',
  }
}

export const CAL_DESCRIPTION =
  'From DUB — the Portuguese for being there: where it is, how to get there, and how to ask somebody to come.'

/** The day after an ISO day, for an all-day event's exclusive end. */
export function dayAfter(iso: string): string {
  return new Date(Date.parse(iso + 'T00:00:00Z') + 86_400_000).toISOString().slice(0, 10)
}

/** The .ics for this one event — Apple Calendar, Outlook, and any phone's own. */
export function icsHref(e: Pick<CalEvent, 'kind' | 'id'>): string {
  return '/api/calendar/event?' + e.kind + '=' + encodeURIComponent(e.id)
}

/** Google Calendar's own "add this" page, filled in. */
export function googleHref(e: CalEvent, origin: string): string {
  const d = (iso: string) => iso.replace(/-/g, '')
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: d(e.on) + '/' + d(dayAfter(e.until ?? e.on)),
    details: CAL_DESCRIPTION + '\n\n' + origin + e.path,
    location: e.location,
  })
  return 'https://calendar.google.com/calendar/render?' + q.toString()
}
