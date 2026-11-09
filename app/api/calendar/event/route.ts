import { CHAPTERS } from '@/content/chapters'
import { CALENDAR } from '@/content/calendar'
import { DROPS } from '@/content/drops'
import { generatedDrops } from '@/content/generated'
import { recurringDrops } from '@/content/recurring'
import { eventOfDrop, eventOfRow, type CalEvent } from '@/content/cal-event'
import { icsOne } from '@/lib/ics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * ONE EVENT AS AN .ics — what every Add to calendar button opens (2026-11-05).
 *
 * On an iPhone, opening a text/calendar URL shows the system's own "Add to Calendar"
 * sheet; on Android and desktop it opens or downloads into the calendar app. No sign-in:
 * an event in Lisbon is not private.
 *
 * LOOKED UP, NEVER SPELT OUT IN THE URL. ?drop=<id> or ?row=<id> names something DUB
 * authored, and the text comes from the content. A route that wrote whatever title it was
 * handed would let anybody send an invitation "from" this domain saying anything.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const now = new Date()
  let e: CalEvent | null = null

  const dropId = url.searchParams.get('drop')
  const rowId = url.searchParams.get('row')
  if (dropId) {
    const all = [...DROPS, ...CHAPTERS.flatMap((c) => [...generatedDrops(c.id, now), ...recurringDrops(c.id, now)])]
    const d = all.find((x) => x.id === dropId)
    if (d) e = eventOfDrop(d)
  } else if (rowId) {
    const r = CALENDAR.find((x) => x.id === rowId)
    if (r) e = eventOfRow(r)
  }
  if (!e) return new Response('No such event', { status: 404 })

  const file = e.title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'event'
  return new Response(icsOne(e, url.origin, now), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="' + file + '.ics"',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
