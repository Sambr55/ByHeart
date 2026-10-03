import type { MetadataRoute } from 'next'

/**
 * WHAT A SEARCH ENGINE MAY KEEP A COPY OF.
 *
 * There was no robots.txt at all — the live URL returned 404 — so every route in the
 * product was crawlable by default, including the ones that exist to be sent to one
 * person.
 *
 * Found the night before DUB went to a Lisbon festival to sign up strangers, which is
 * the moment it would have started to matter: an invite card published a first name, a
 * venue and a night, permanently, for an expat community in one city where that is more
 * than enough to identify somebody.
 *
 * THE RULE: a page addressed to ONE PERSON is not indexed. A page that is the product —
 * the front door, the Club, the shelf — is.
 *
 *   /p/   a share card, minted for a specific recipient
 *   /s/   a showing, same
 *   /come/ an invitation, which carries a code that gets spent
 *   /api/  not pages
 *   /admin, /qa, /reset, /facilitator  not for the public at all
 *
 * The share loop is untouched by this. WhatsApp, iMessage and Signal read og:* tags and
 * ignore robots directives, so the preview still renders for the person the link was sent
 * to. What changes is that nothing keeps a copy afterwards.
 *
 * Each of those routes also sets `robots: { index: false }` in its own metadata. Two
 * belts, deliberately: this file is the catch-all for a route somebody adds later and
 * forgets, and the per-page directive is what a crawler honours if it never reads this.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/p/', '/s/', '/come/', '/api/', '/admin', '/qa', '/reset', '/facilitator'],
    },
  }
}
