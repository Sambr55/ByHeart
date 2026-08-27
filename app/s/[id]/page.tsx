import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Showing } from '@/components/Showing'
import { ShowingCard } from '@/components/ShowingCard'
import { SHOWING_COPY } from '@/content/showing-copy'
import { currentUser, deviceId } from '@/lib/auth'
import { openShowing } from '@/lib/showings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * A showing, addressed to one person.
 *
 * Deliberately NOT /p/[id]. That page is a proof card posted in public — the growth loop,
 * meant to be seen by strangers who have never heard of DUB. This one carries consent:
 * opening it is what makes you the recipient, and offering "show them yours back" to
 * everybody who clicks a link on Twitter would make the mutual step meaningless. Two
 * different things, two different URLs, and the public one gains nothing from this.
 */
export function generateMetadata() {
  // No name, no count, no sentences. A link sent to one person should not render a
  // preview card in whatever group chat it passes through on the way.
  return { title: 'DUB', description: 'Somebody showed you something.', robots: { index: false } }
}

export default async function ShowingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await currentUser()
  const seen = await openShowing(id, { userId: user?.id ?? null, deviceId: await deviceId() })

  if (seen.state === 'gone' || seen.state === 'blocked') {
    return <Ended head={SHOWING_COPY.gone_head} body={SHOWING_COPY.gone_body} />
  }
  if (seen.state === 'taken') {
    return <Ended head={SHOWING_COPY.taken_head} body={SHOWING_COPY.taken_body} />
  }
  if (seen.state === 'expired') {
    return <Ended head={SHOWING_COPY.expired_head} body={SHOWING_COPY.expired_body} />
  }

  // The sender, looking at their own. No action here: they have already done their part
  // and there is nothing to press until the other person answers.
  if (seen.state === 'mine') {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 py-10 text-fg">
        <div>
          <p className="eyebrow text-muted">{SHOWING_COPY.mine_label}</p>
          <h1 className="display mt-3 text-balance text-3xl">
            {seen.back ? SHOWING_COPY.their_head : SHOWING_COPY.mine_head}
          </h1>
          {!seen.back ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {SHOWING_COPY.mine_waiting_body}
            </p>
          ) : null}
        </div>
        {seen.back ? <ShowingCard card={seen.back} whose="THEIRS" /> : null}
        <ShowingCard card={seen.card} whose="YOURS" />
        {seen.back ? <Showing id={id} state="paired" /> : null}
      </main>
    )
  }

  if (!seen) notFound()

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 py-10 text-fg">
      <div>
        <p className="eyebrow text-accent">{SHOWING_COPY.eyebrow}</p>
        <h1 className="display mt-3 text-balance text-3xl">{SHOWING_COPY.head}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{SHOWING_COPY.body}</p>
      </div>

      <ShowingCard card={seen.card} whose="THEIRS" />

      {seen.state === 'theirs' && seen.back ? (
        <>
          <ShowingCard card={seen.back} whose="YOURS" />
          <Showing id={id} state="paired" />
        </>
      ) : (
        <Showing id={id} state="open" />
      )}

      <p className="border-t border-line pt-6 text-xs leading-relaxed text-muted">
        DUB counts only the sentences you can say with nothing on screen to copy from.
        {' '}
        <Link href="/" className="text-accent underline underline-offset-4">
          What this is
        </Link>
      </p>
    </main>
  )
}

function Ended({ head, body }: { head: string; body: string }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 bg-bg px-5 py-10 text-fg">
      <h1 className="display text-balance text-3xl">{head}</h1>
      <p className="text-sm leading-relaxed text-muted">{body}</p>
      <Link
        href="/"
        className="tap-target eyebrow rounded bg-accent px-5 py-3 text-center text-accent-ink"
      >
        WHAT THIS IS
      </Link>
    </main>
  )
}
