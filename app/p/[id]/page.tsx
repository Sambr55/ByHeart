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
  return {
    title: card.count + ' things they can say in Portuguese — DUB',
    description:
      'Learned off ' +
      (card.worlds === 1 ? 'one thing they already knew' : card.worlds + ' completely unrelated things') +
      '. No streak involved.',
  }
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = await getShareCard(id)
  if (!card) notFound()

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
          DUB teaches European Portuguese through culture you already know.
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
