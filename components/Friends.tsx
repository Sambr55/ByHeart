'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { track } from '@/engine/analytics'
import { INVITE, INVITE_TEXT } from '@/content/invite'
import { mintShowing } from '@/engine/showing'
import { useLearner } from '@/engine/useLearner'

/**
 * The people you have shown something to, in Yours.
 *
 * WHY IT MOVED HERE. Showing was fully built — mint a card of what you can say, hand it
 * to one person, they show one back and you are a pair — and lived on /proof, a screen
 * almost nobody finds. So the mechanic existed and the relationship it creates was
 * invisible from anywhere a person actually goes. Yours is where somebody looks for their
 * own things, and a friend they have shown something to is one of them.
 *
 * A LIST AND NEVER A NUMBER, which the API already insists on: showingsFor returns rows
 * and refuses to count them. A tally of who has shown you something is a score with extra
 * steps, and DUB exists because scores are the wrong fuel. So this shows who is waiting on
 * you and who you are waiting on, and nothing that could be compared.
 *
 * SYMMETRIC, NOT RANKED, for the same reason. Nobody is ahead of anybody here. The only
 * two states are "they have shown you back" and "not yet", and neither is a position.
 */
interface Mine {
  id: string
  sent: boolean
  returned: boolean
}

/** One invitation, and what became of it. Never a count — see the note on the component. */
interface Invited {
  code: string
  accepted_at: string | null
  landed_at: string | null
}

export function Friends() {
  const learner = useLearner()
  const [mine, setMine] = useState<Mine[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  /*
    THE PEOPLE YOU HAVE BROUGHT IN, which is a different thing from the people you have
    shown something to.

    Showing is one card, once — the mechanic this component was built for. An invitation is
    an ask to come and learn the language of the city you are both in, and it is the half
    Sam is after: "We need to BUILD communities around language and cities."
  */
  const [invites, setInvites] = useState<Invited[] | null>(null)

  useEffect(() => {
    let live = true
    fetch('/api/invite')
      .then((r) => r.json())
      .then((b: { ok: boolean; invites?: Invited[] }) => {
        if (live) setInvites(b.ok ? (b.invites ?? []) : [])
      })
      .catch(() => {
        if (live) setInvites([])
      })
    fetch('/api/showing')
      .then((r) => r.json())
      .then((b: { ok: boolean; showings?: Mine[] }) => {
        if (live) setMine(b.ok ? (b.showings ?? []) : [])
      })
      .catch(() => {
        if (live) setMine([])
      })
    return () => {
      live = false
    }
  }, [busy])

  async function invite() {
    setBusy(true)
    setNote(null)
    const { path, reason } = await mintShowing(learner)
    if (!path) {
      setNote(reason ?? 'Could not make a link.')
      setBusy(false)
      return
    }
    const url = window.location.origin + path
    track('showing_sent', {})
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: 'DUB', url }).catch(() => {})
    } else {
      await navigator.clipboard?.writeText(url).catch(() => {})
      setNote('Link copied.')
    }
    setBusy(false)
  }

  /*
    BRING SOMEBODY, through the operating system's own share sheet.

    Sam chose this over reading the phone book, and it is the right call twice: iOS already
    shows the sender their contacts in a UI they trust, and DUB never sees a phone number —
    which is a ceiling on what this feature can become rather than a first version. The
    consent screen promises the work stays on the phone; an app that then uploads the
    address book would be contradicting it.
  */
  async function bring() {
    setBusy(true)
    setNote(null)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chapter: learner.chapter ?? null }),
      })
      const body = (await res.json()) as { ok: boolean; invite?: Invited & { code: string }; reason?: string }
      if (!body.ok || !body.invite) {
        setNote(body.reason ?? 'Could not make an invitation.')
        setBusy(false)
        return
      }
      const url = window.location.origin + '/come/' + body.invite.code
      track('invite_sent', {})
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'DUB', text: INVITE_TEXT, url }).catch(() => {})
      } else {
        await navigator.clipboard?.writeText(url).catch(() => {})
        setNote('Link copied.')
      }
      setInvites((old) => [body.invite as Invited, ...(old ?? [])])
    } catch {
      setNote('Could not make an invitation.')
    }
    setBusy(false)
  }

  // Before the fetch answers. An empty list flashed at somebody with three friends reads
  // as having lost them.
  if (mine === null) return null

  const paired = mine.filter((m) => m.returned)
  const waiting = mine.filter((m) => !m.returned)

  return (
    /*
      SHOWN AND BROUGHT IN, AS TWO CARDS RATHER THAN TWO HEADINGS.

      These are the only parts of Yours that need another person, and they sat at the foot
      of the screen as an eyebrow, a muted line and a button on bare sand — under a grid of
      the learner's own cards, which all have edges. Framed, they read as the two things
      you can do with what is above them.

      The rule between them is replaced by the gap: two cards a `gap-6` apart say "related
      but separate" more clearly than a hairline ever did, and the hairline was doing the
      work of a border on a section that had no border.
    */
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
        <div className="flex flex-col gap-1">
          <p className="eyebrow text-muted">SHOWN</p>
          {/* The invitation is the content of this card, so it is read at body size. */}
          <p className="text-base leading-relaxed text-muted">
            {mine.length
              ? 'Sentences you handed to somebody, and what came back.'
              : 'Show somebody three things you can say. They can show you theirs.'}
          </p>
        </div>

        {mine.length ? (
          <ul className="flex flex-col gap-1">
            {[...paired, ...waiting].map((m) => (
              <li key={m.id}>
                {/*
                  bg-surface, because this row now sits INSIDE a card. It was bg-bg-elev
                  when its ground was sand; against its own parent that is the same colour
                  and the row would lose its edge. Inset is what a row within a card is.
                */}
                <Link
                  href={'/s/' + m.id}
                  className="tap-target flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3"
                >
                  <span className="text-base">
                    {m.returned ? 'They showed you back' : m.sent ? 'Waiting on them' : 'Waiting on you'}
                  </span>
                  <span className="eyebrow shrink-0 text-muted">{m.returned ? 'BOTH' : 'ONE'}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          data-testid="friends-invite"
          onClick={invite}
          disabled={busy}
          className="tap-target eyebrow rounded border border-line-strong px-5 py-3 text-center disabled:opacity-60"
        >
          {busy ? 'MAKING A LINK' : 'SHOW SOMEBODY'}
        </button>
      </div>

      {/*
        AND THE PEOPLE YOU HAVE BROUGHT IN, which is the other half of community.

        Showing is one card handed to somebody who is already here. This is asking somebody
        who is not — and in an expat city those are different acts with different stakes.
        Its own card rather than a ruled-off half of this one, because conflating them
        would make the invitation read as a share — the separation the rule used to carry
        is now the gap between two edges, which says it more plainly.

        A LIST AND NEVER A COUNT, the rule this component already holds: three states, none
        of them a position. "How many people have you recruited" is a leaderboard with extra
        steps and DUB exists because scores are the wrong fuel.
      */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
        <div className="flex flex-col gap-1">
          <p className="eyebrow text-muted">{INVITE.eyebrow}</p>
          <p className="text-base leading-relaxed text-muted">
            {invites?.length ? INVITE.some : INVITE.empty}
          </p>
        </div>

        {invites?.length ? (
          <ul className="flex flex-col gap-1">
            {invites.map((i) => (
              <li
                key={i.code}
                data-testid={'invite-' + i.code}
                className={
                  /* bg-surface for the same reason the SHOWN rows above take it: a row
                     inside a card is an inset, not a second lift. The landed state keeps
                     its accent tint, which reads against either ground. */
                  'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ' +
                  (i.landed_at ? 'border-accent bg-accent/10' : 'border-line bg-surface')
                }
              >
                <span className="text-base">
                  {i.landed_at
                    ? INVITE.state.landed
                    : i.accepted_at
                      ? INVITE.state.accepted
                      : INVITE.state.waiting}
                </span>
                <span className={'eyebrow shrink-0 ' + (i.landed_at ? 'text-accent' : 'text-muted')}>
                  {i.landed_at ? 'LANDED' : i.accepted_at ? 'STARTED' : 'SENT'}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          data-testid="friends-bring"
          onClick={bring}
          disabled={busy}
          className="tap-target eyebrow rounded bg-accent px-5 py-3 text-center text-accent-ink disabled:opacity-60"
        >
          {busy ? 'MAKING A LINK' : INVITE.cta}
        </button>

        {/*
          What it earns, last and small. It is the second reason to do this and must not
          become the first — a screen that leads on free months is a referral scheme, and a
          referral scheme is how somebody ends up sending twenty links to people who will
          never open them.
        */}
        <p className="text-xs leading-relaxed text-muted">{INVITE.reward}</p>
      </div>

      {/*
        The reason, when there is one, in the words the engine gave — which for a new
        learner is "say something cold first", and is a instruction rather than an error.
      */}
      {note ? <p className="text-xs leading-relaxed text-muted">{note}</p> : null}
    </section>
  )
}
