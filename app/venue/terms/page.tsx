import { PageShell } from '@/components/PageShell'
import { VENUE_TERMS, VENUE_TERMS_UPDATED } from '@/content/venue-terms'

export const metadata = { title: 'DUB venue terms', robots: { index: false, follow: false } }

/** The DUB venue terms (content/venue-terms.ts), linked from every venue's sign-up link. */
export default function VenueTermsPage() {
  return (
    <PageShell eyebrow="DUB FOR VENUES" back="/" backLabel="DUB">
      <article className="flex flex-col gap-6 rounded-2xl border border-line bg-bg-elev px-5 py-6" data-testid="venue-terms">
        <div className="flex flex-col gap-1">
          <h1 className="display text-balance text-3xl">DUB venue terms</h1>
          <p className="text-sm text-muted">Updated {VENUE_TERMS_UPDATED}</p>
        </div>
        {VENUE_TERMS.map((c, i) => (
          <section key={c.title} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">
              {i + 1}. {c.title}
            </h2>
            {c.body.map((p) => (
              <p key={p} className="text-base leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>
    </PageShell>
  )
}
