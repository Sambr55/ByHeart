import { BRAND } from '@/content/brand'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getShareCard } from '@/lib/share'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Somebody else's proof card, in public.
 *
 * Written for a reader who has never heard of DUB. It leads with their sentences in
 * Portuguese, says in one line what the thing is, and does not ask for anything — no
 * sign-up wall, no email box. The claim is doing the work: these are sentences a person
 * produced with nothing on screen to copy from, which is not a claim any streak can make.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = await getShareCard(id)
  if (!card) return { title: 'DUB' }
  /*
    The preview a messaging app shows, which for an invite is the whole point — most
    recipients will read this line and never open the page.
  */
  if (card.invite) {
    return {
      title: card.invite.from
        ? card.invite.from + ' is asking you out — in Portuguese'
        : 'You are being asked out — in Portuguese',
      description: [card.invite.pt, card.invite.event].filter(Boolean).join(' · '),
    }
  }
  return {
    title: card.count + ' things they can say in Portuguese — DUB',
    description:
      'Learned off ' +
      (card.worlds === 1 ? 'one thing they already knew' : card.worlds + ' completely unrelated things') +
      '. No streak involved.',
  }
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** The night, spelled out. UTC so the server and the reader agree on which day it is. */
function nightOf(on: string): string {
  if (!on) return ''
  const d = new Date(on + 'T00:00:00Z')
  return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = await getShareCard(id)
  if (!card) notFound()

  /*
    AN INVITATION IS A DIFFERENT PAGE, and it is the one somebody was actually sent.

    A proof card is a claim made to nobody in particular — "here is what I can say". An
    invite is addressed: it asks one person to come to one thing on one night, and the
    Portuguese is the point rather than the evidence. So it leads with the ask, at the size
    this product reserves for language somebody produced, and the night is underneath it.

    The English is there. A card only the sender can read is a joke between them and
    themselves, and the recipient most likely to say yes is the one who has no Portuguese.
  */
  if (card.invite) {
    const inv = card.invite
    return (
      <main
        data-stage="REAL WORLD"
        className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 bg-bg px-5 py-10 text-fg"
      >
        <p className="eyebrow text-muted">
          {inv.from ? inv.from.toUpperCase() + ' IS ASKING' : 'SOMEBODY IS ASKING'}
        </p>
        <h1 className="pt display text-balance text-3xl text-accent">{inv.pt}</h1>
        {inv.en ? <p className="text-base leading-relaxed text-fg/80">{inv.en}</p> : null}

        {inv.event ? (
          <div className="flex flex-col gap-1 border-t border-line pt-6">
            <p className="display text-lg">{inv.event}</p>
            <p className="text-sm text-muted">
              {[nightOf(inv.on), inv.venue].filter(Boolean).join(' · ')}
            </p>
          </div>
        ) : null}

        {/*
          One line about what this is, for a reader who has never heard of DUB, and no
          sign-up wall — the same restraint the proof card takes. Somebody who has just
          been invited out is not in the market for an account.
        */}
        <p className="text-xs leading-relaxed text-muted">
          They wrote this in Portuguese with {BRAND.name}.
        </p>
        <Link
          href="/"
          className="tap-target eyebrow w-full rounded border border-line px-5 py-3 text-center text-muted"
        >
          WHAT IS {BRAND.name.toUpperCase()}
        </Link>
      </main>
    )
  }

  return (
    <main
      data-stage="REAL WORLD"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 bg-bg px-5 py-10 text-fg"
    >
      <div>
        <p className="eyebrow text-muted">SAID COLD</p>
        <h1 className="display mt-3 text-balance text-3xl">
          {card.count} {card.count === 1 ? 'thing' : 'things'} they can say in Portuguese.
        </h1>
      </div>

      <ul className="flex flex-col gap-3">
        {card.lines.map((l) => (
          <li key={l.pt} className="rounded border border-line bg-surface px-4 py-3">
            <p className="pt text-lg text-accent">{l.pt}</p>
            <p className="mt-1 text-sm text-muted">{l.en}</p>
          </li>
        ))}
      </ul>

      <p className="text-sm leading-relaxed text-muted">
        Learned off{' '}
        {card.worlds === 1 ? 'one thing they already knew' : card.worlds + ' completely unrelated things'} —
        whatever was already in their head. No streak involved.
      </p>

      <div className="border-t border-line pt-6">
        <p className="display text-balance text-lg">
          {BRAND.description}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          It counts only the sentences you can say with nothing on screen to copy from,
          which is why that number is hard to inflate and worth showing.
        </p>
        <Link
          href="/"
          className="eyebrow mt-6 inline-block rounded-full bg-accent px-5 py-3 text-accent-ink"
        >
          TRY IT
        </Link>
      </div>
    </main>
  )
}
