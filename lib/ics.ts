import type { Drop } from '@/content/drops'
import { BRAND } from '@/content/brand'

/**
 * A calendar feed, in the format every phone already understands.
 *
 * WHY A SUBSCRIPTION RATHER THAN A NOTIFICATION. A push arrives once, in a list of other
 * pushes, and is gone. A calendar entry sits next to the things somebody has actually
 * decided to do, survives the app being deleted, and needs no permission prompt — on iOS
 * notifications do not exist at all until a site is on the home screen, and a subscribed
 * calendar works from a browser tab. It is the strongest nudge DUB can make and the one
 * that asks least.
 *
 * Which is also why it has to behave. A feed that fills somebody's diary is a feed they
 * remove, so the per-week cap is real and enforced here rather than trusted to the
 * content staying sparse.
 *
 * THE EVENT'S OWN NAME, AND NOTHING ELSE IN THE TITLE. Sam: "Event name only, DUB in the
 * description." A line in somebody's calendar reading "DUB: Benfica v Celtic" is an
 * advertisement wearing a commitment's clothes — the entry is about the match, and the
 * only honest thing in the summary is the match. What DUB has to do with it belongs in
 * the description, where somebody who taps the entry finds it.
 */

/** RFC 5545 wants CRLF, and Google Calendar is the one that actually enforces it. */
const CRLF = '\r\n'

/**
 * Escaping, which is the whole of the format's sharp edges.
 *
 * Commas and semicolons separate values in this format and a backslash escapes them, so a
 * venue called "Coliseu dos Recreios, Lisboa" silently becomes two fields without this.
 * Newlines become a literal \n rather than a break, because a real break inside a value
 * ends the property.
 */
function esc(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => '\\' + c).replace(/\r?\n/g, '\\n')
}

/**
 * Long lines are folded at 75 octets, continued by a space.
 *
 * Not decoration: parsers are entitled to reject a longer line, and an event name plus a
 * venue passes 75 easily. Counted in BYTES rather than characters — "Estádio" is eight
 * characters and nine bytes, and folding by character length puts the break in the middle
 * of a multi-byte one, which is how an accented venue name arrives as mojibake.
 */
function fold(line: string): string {
  const bytes = Buffer.from(line, 'utf8')
  if (bytes.length <= 75) return line
  const out: string[] = []
  let start = 0
  while (start < bytes.length) {
    const width = out.length === 0 ? 75 : 74
    let end = Math.min(start + width, bytes.length)
    /* Never split a UTF-8 continuation byte off its lead. */
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--
    out.push(bytes.subarray(start, end).toString('utf8'))
    start = end
  }
  return out.join(CRLF + ' ')
}

/** YYYYMMDD, which is what an all-day event wants. */
function stamp(iso: string): string {
  return iso.replace(/-/g, '')
}

function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export interface FeedOptions {
  /** Where the app lives, for the link back into the drop. */
  origin: string
  /** The city, said as a person would. */
  city: string
  /** Most events to place in any one week. See the note above. */
  perWeek: number
  now?: Date
}

/**
 * Trim to the cap, week by week, keeping the soonest.
 *
 * A cap applied across the whole feed would let one busy fortnight spend the entire month
 * and leave the rest empty — which is the opposite of what somebody asking for "three a
 * week" means. Weeks are counted from the Monday, the same boundary the fortnight view
 * uses, so what lands in the diary matches what the app showed.
 */
export function capPerWeek(drops: Drop[], perWeek: number): Drop[] {
  const byWeek = new Map<number, Drop[]>()
  for (const d of [...drops].sort((a, b) => a.on.localeCompare(b.on))) {
    const on = new Date(d.on + 'T00:00:00Z')
    const monday = on.getTime() - ((on.getUTCDay() + 6) % 7) * 86_400_000
    const week = byWeek.get(monday) ?? []
    if (week.length >= perWeek) continue
    byWeek.set(monday, [...week, d])
  }
  return [...byWeek.values()].flat().sort((a, b) => a.on.localeCompare(b.on))
}

export function icsFor(drops: Drop[], opts: FeedOptions): string {
  const now = opts.now ?? new Date()
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DUB//' + esc(BRAND.name) + '//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    /* Both spellings, because Apple reads X-WR-CALNAME and nothing else does. */
    'NAME:' + esc('What is on in ' + opts.city),
    'X-WR-CALNAME:' + esc('What is on in ' + opts.city),
    'X-WR-CALDESC:' + esc('Things happening in ' + opts.city + ', and the Portuguese for being there.'),
    /*
      How often a phone may re-read this. Twelve hours rather than an hour: the content
      changes weekly and a feed that asks to be polled constantly is one a phone starts
      ignoring.
    */
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
  ]

  for (const d of drops) {
    const on = new Date(d.on + 'T00:00:00Z')
    const next = new Date(on.getTime() + 86_400_000)
    lines.push(
      'BEGIN:VEVENT',
      /*
        Stable across every fetch, so a phone updates the entry somebody already has
        rather than adding a second one beside it. A calendar that duplicates on refresh
        is the single most common way a subscription feed becomes an enemy.
      */
      'UID:' + esc(d.id) + '@thisisdub.club',
      'DTSTAMP:' + utcStamp(now),
      /* All-day. A drop is a date rather than a time — the door time belongs to the venue
         and guessing it would put somebody outside an hour early. */
      'DTSTART;VALUE=DATE:' + stamp(d.on),
      'DTEND;VALUE=DATE:' + stamp(next.toISOString().slice(0, 10)),
      'SUMMARY:' + esc(d.event),
      'LOCATION:' + esc(d.place.name + (d.place.area ? ', ' + d.place.area : '')),
      /*
        DUB in the description, where somebody who opened the entry finds it — and the
        link that opens the card. The order matters: what the night is, then what we can
        do about it, then the way in.
      */
      'DESCRIPTION:' +
        esc(
          'From DUB — the Portuguese for being there: where it is, how to get there, and ' +
            'how to ask somebody to come.\n\n' +
            opts.origin +
            '/club?drop=' +
            d.id,
        ),
      'URL:' + esc(opts.origin + '/club?drop=' + d.id),
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return lines.map(fold).join(CRLF) + CRLF
}
