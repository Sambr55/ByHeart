/**
 * WHAT A PHONE IS SENT, decided without a database (2026-11-04).
 *
 * Sam asked for a notification strategy. The answer, in one file so it can be read and
 * checked in one place (scripts/push-check.mts):
 *
 *   THE MORNING LINE comes from your path. At eight, the next sentence you will actually
 *   need — the first line of the next room on your path, then the one after it — in your
 *   own ending, and a tap opens that room. It used to be a sentence from the old crates,
 *   chosen for what you owned, which had nothing to do with the paperwork room you were
 *   halfway through. The old picker stays as the fallback for somebody with no path yet.
 *
 *   HOW OFTEN IS YOURS: every day, Monday-Wednesday-Friday, or never. No streaks and no
 *   "we miss you" — a line is worth reading on the lock screen or it is not sent.
 *
 *   MONDAY'S PLACE: the gem of the week, at ten in the morning, with its one line.
 *   TABLES: who is coming to the table you are hosting, and a reminder before it sits.
 *   Both are written here and sent only when PUSH_WEEKLY / PUSH_TABLES say 'on'.
 *
 *   Every URL carries ?n=<kind>, which the app reads on arrival (components/Native.tsx)
 *   to count opens. Without it nobody can tell whether any of this is worth sending.
 */
import { pathUnits } from '@/content/path'
import type { Purpose } from '@/content/situations'
import { said } from '@/content/speaker'
import { chapterOfBairro, gemOfTheWeekIn, weekStart } from '@/content/gems'
import { chapterById, chapterIdOf, type ChapterId } from '@/content/chapters'
import { pathView, type PathRecord } from '@/components/path/progress'
import { isFreeRoom } from '@/lib/entitlements'

export type Cadence = 'daily' | 'three' | 'off'
export const CADENCES: Cadence[] = ['daily', 'three', 'off']
export type Topic = 'week' | 'table'
export const TOPICS: Topic[] = ['week', 'table']

export interface Push {
  /** Recorded in push_subscriptions.sent, so nothing goes twice. */
  id: string
  title: string
  body: string
  url: string
  /** The notification tag on the phone: a new one of the same kind replaces the old. */
  tag: string
  /** The room a path line comes from, for a nudge to name (lib/nudge.ts). */
  room?: string
}

export function isCadence(x: unknown): x is Cadence {
  return typeof x === 'string' && (CADENCES as string[]).includes(x)
}

/** Monday, Wednesday and Friday for 'three'. `weekday` is 0 = Sunday, in their time zone. */
export function dueToday(cadence: string | null | undefined, weekday: number): boolean {
  if (cadence === 'off') return false
  if (cadence === 'three') return weekday === 1 || weekday === 3 || weekday === 5
  return true
}

/*
  Not these, for the same reasons the opener gives: the save is a room of its own but is
  the safety net rather than an opening; Who you are speaks as a sample person ("Chamo-me
  Ana"); and a fun tile is not a place anybody walks into.
*/
const SKIP = (id: string) => id === 'lisbon_save' || id === 'lisbon_legend' || id.startsWith('fun_')

/**
 * The next line from the path, or null when there is no path or nothing left unsent.
 *
 * Walks the rooms in path order from the glowing one, taking each room's lines in the
 * order they are said, and returns the first this phone has not been sent (and that is a
 * sentence rather than a single word). So a learner
 * who does nothing for a week still gets a new sentence each morning — the rest of the
 * room they are stuck on, then the next — rather than the same one five times.
 */
export function pathLine(
  state: (PathRecord & { purpose?: Purpose | null; profile?: { gender?: 'm' | 'f' | null } | null }) | null | undefined,
  sent: readonly string[],
  member: boolean,
  now: Date = new Date(),
): Push | null {
  if (!state) return null
  const purpose = state.purpose ?? null
  if (!purpose) return null
  const units = pathUnits(undefined, now, purpose)
  const view = pathView(state, units, (id) => (member || isFreeRoom(id, purpose) ? 'open' : 'paid'), now)
  const had = new Set(sent)
  const gender = state.profile?.gender ?? null
  const rooms = view.units
    .flatMap((u) => u.nodes)
    .filter((n) => (n.state === 'next' || n.state === 'open') && !SKIP(n.room.id))
    .map((n) => n.room)
  /*
    A sentence, not a word. "Olá." alone on a lock screen at eight in the morning teaches
    nothing a person did not already know, so lines under three words are passed over —
    and nor are counting lists ("um, dois, três…"). They are in the room, and the room is
    one tap away.
  */
  const worth = (pt: string) => pt.trim().split(/\s+/).length >= 3 && (pt.match(/,/g) ?? []).length < 3
  for (const room of rooms) {
    for (let i = 0; i < room.lines.length; i++) {
      const id = 'room:' + room.id + ':' + i
      if (had.has(id) || !worth(room.lines[i].pt)) continue
      const line = said(room.lines[i], gender)
      return {
        id,
        title: line.pt,
        body: line.en + ' — ' + room.title,
        url: '/errand/' + room.id + '?n=line',
        tag: 'dub-line',
        room: room.title,
      }
    }
  }
  return null
}

/**
 * Monday's place: this week's gem and its line. One per week, by the week's Monday — in the
 * subscriber's own city or town (2026-11-05: Cascais and Sintra have their own).
 */
export function weeklyGem(now: Date = new Date(), gender: 'm' | 'f' | null = null, chapter: ChapterId | string | null = null): Push | null {
  /* The cron reads raw stored state, so an old town id is mapped here too. */
  const gem = gemOfTheWeekIn(chapterIdOf(chapter), now)
  if (!gem) return null
  const line = said(gem.line, gender)
  return {
    id: 'week:' + weekStart(now),
    title: 'This week in ' + chapterById(chapterOfBairro(gem.bairro)).city + ': ' + gem.name,
    body: '“' + line.pt + '” — ' + line.en,
    url: '/city?gem=' + gem.id + '&n=week',
    tag: 'dub-week',
  }
}

/** Short and local: "Thu 7pm". The time zone is the subscriber's, so it reads as theirs. */
export function when(at: string | Date, tz: string): string {
  try {
    const d = new Date(at)
    const day = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short' }).format(d)
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true })
      .format(d)
      .replace(':00', '')
      .replace(' ', '')
    return day + ' ' + time
  } catch {
    return ''
  }
}

/** To the host, when somebody new takes a seat. */
export function tableJoined(o: { code: string; guest: string; place: string; sits_at: string }, tz: string): Push {
  return {
    id: 'table:' + o.code + ':join:' + o.guest.toLowerCase(),
    title: o.guest + ' is coming to your table',
    body: o.place + ' · ' + when(o.sits_at, tz),
    url: '/t/' + o.code + '?n=table',
    tag: 'dub-table-' + o.code,
  }
}

/** To everybody at it, a few hours before it sits. */
export function tableSoon(o: { code: string; place: string; sits_at: string; hosting: boolean }, tz: string): Push {
  return {
    id: 'table:' + o.code + ':soon',
    title: (o.hosting ? 'Your table' : 'Your table tonight') + ' · ' + when(o.sits_at, tz),
    body: o.hosting
      ? o.place + '. The evening’s kit is ready when you are.'
      : o.place + '. Have a look at the kit before you go.',
    url: '/t/' + o.code + '?n=table',
    tag: 'dub-table-' + o.code,
  }
}

/** The local hour, date and weekday for a subscriber, in their own time zone. */
export function local(tz: string, when: Date = new Date()): { hour: number; day: string; weekday: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      hour: '2-digit',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    }).formatToParts(when)
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
    return {
      hour: Number(get('hour')) % 24,
      day: get('year') + '-' + get('month') + '-' + get('day'),
      weekday: weekday < 0 ? when.getUTCDay() : weekday,
    }
  } catch {
    return { hour: when.getUTCHours(), day: when.toISOString().slice(0, 10), weekday: when.getUTCDay() }
  }
}
