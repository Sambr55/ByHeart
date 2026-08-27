import type { Candidate } from '@/lib/draft'
import { stationFor, type Source } from '@/lib/harvest'

/**
 * The sources, and what each one is allowed to be trusted for.
 *
 * Ordered most-trusted first, because a duplicate event keeps the first version of itself.
 * A venue's own page is better than a listings site, and a listings site is better than an
 * aggregator, for the same reason a primary source always is.
 *
 * Terms are recorded per source and are not decoration: Google Places forbids storing what
 * it returns, so it is not here; OpenStreetMap is ODbL and requires attribution, which the
 * drop page does. If a source's terms cannot be established, it does not go in.
 */

/**
 * A venue that publishes its own diary as JSON.
 *
 * Written against a shape rather than a specific site because every venue that does this
 * does it differently, and the adapter is the part that is expected to be rewritten. What
 * it must not do is fill a gap: no venue, no station, no candidate.
 */
export function venueFeed(opts: {
  id: string
  about: string
  terms: string
  url: string
  venue: { name: string; area: string }
  /** Pull the events out of whatever shape this particular site returns. */
  parse(body: unknown): { title: string; date: string; link?: string }[]
}): Source {
  return {
    id: opts.id,
    about: opts.about,
    terms: opts.terms,
    async fetch(now: Date): Promise<Candidate[]> {
      const station = stationFor(opts.venue.name)
      if (!station) {
        // Not an error worth throwing: it is a fact we do not have, and the honest response
        // is no candidates rather than a guess about how somebody gets there.
        return []
      }
      const res = await fetch(opts.url, { headers: { accept: 'application/json' } })
      if (!res.ok) throw new Error(opts.id + ' returned ' + res.status)
      const rows = opts.parse(await res.json())
      const checked = now.toISOString().slice(0, 10)

      return rows
        .filter((r) => r.title?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(r.date ?? ''))
        .filter((r) => new Date(r.date + 'T00:00:00Z') >= now)
        .map((r): Candidate => ({
          id:
            opts.id +
            '_' +
            r.date.replace(/-/g, '') +
            '_' +
            r.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24),
          kind: 'concert',
          chapter: 'lisbon',
          event: r.title.trim(),
          venue: opts.venue,
          station,
          on: r.date,
          link: r.link ? { href: r.link, label: 'TICKETS' } : undefined,
          sources: [
            {
              fact: r.title.trim() + ' is at ' + opts.venue.name + ' on ' + r.date,
              where: opts.about,
              checked,
            },
            {
              fact: opts.venue.name + ' is served by ' + station,
              where: 'metrolisboa.pt, checked by hand',
              checked,
            },
          ],
        }))
    },
  }
}

/**
 * Configured, and switched off until somebody has read the terms.
 *
 * Left in the repo rather than in a note, because the next person to work on this needs the
 * shape more than they need the URL — and an adapter that is present and disabled is a
 * decision, where an absent one is an oversight.
 */
export const SOURCES: Source[] = []
