'use client'

import { INVITE } from '@/content/invite'
import { useInvites } from '@/components/invite/useInvites'

/**
 * YOUR PEOPLE — the friends you have brought in, and the offer for bringing the next one.
 *
 * ONE CARD, NOT TWO (Sam, 2026-11-09: "the show somebody function only sends a link not
 * examples and I think that idea never really worked. Let's remove that and double down on
 * invite a friend"). SHOW A FRIEND sat first here and sent a bare link; it is gone from Yours
 * (showing itself still lives in the feed and on /proof). BRING A FRIEND IN is the card now,
 * and it leads on what it earns — "You both get two weeks free." — in the size a headline is
 * read at, with the rule that keeps it honest underneath: it pays when the friend says a room
 * out loud, not when they sign up (lib/invites.ts).
 *
 * A LIST AND NEVER A COUNT, still: the people you asked, each in one of three states, none
 * of them a position. Sending is the shared hook the board's sheet uses (useInvites).
 */
export function Friends() {
  const brought = useInvites('yours')
  const invites = brought.invites
  return (
    <section id="people" className="scroll-mt-6 flex flex-col gap-3" data-testid="yours-people">
      <h2 className="eyebrow text-telha">Your people</h2>
      <div
        className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border-2 border-[#e5b04a] bg-bg-elev px-5 py-6 shadow-sm"
        data-testid="friends-offer"
      >
        <div className="flex flex-col gap-2">
          <p className="eyebrow text-[0.65rem] text-accent">
            <span lang="pt-PT" className="pt normal-case tracking-normal">
              {INVITE.sheet.eyebrow}
            </span>{' '}
            · bring a friend in
          </p>
          <p className="display text-balance text-3xl leading-tight" data-testid="friends-headline">
            {INVITE.headline}
          </p>
          <p className="text-base leading-relaxed text-muted">{INVITE.empty}</p>
        </div>
        <div className="rounded-2xl bg-surface px-4 py-3">
          <p lang="pt-PT" className="pt text-lg leading-snug text-accent">
            {INVITE.sheet.line.pt}
          </p>
          <p className="text-sm text-muted">{INVITE.sheet.line.en}</p>
        </div>
        <button
          type="button"
          data-testid="friends-bring"
          onClick={brought.bring}
          disabled={brought.busy}
          className="tap-target eyebrow rounded-full bg-accent px-5 py-4 text-center text-base text-accent-ink disabled:opacity-60"
        >
          {brought.busy ? 'MAKING A LINK' : INVITE.cta}
        </button>
        <p className="text-xs leading-relaxed text-muted">{INVITE.reward}</p>
        {invites?.length ? (
          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <p className="eyebrow text-[0.6rem] text-muted">{INVITE.some}</p>
            <ul className="flex flex-col gap-1">
              {invites.map((i) => (
                <li
                  key={i.code}
                  data-testid={'invite-' + i.code}
                  className={
                    'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ' +
                    (i.landed_at ? 'border-accent bg-accent/10' : 'border-line bg-surface')
                  }
                >
                  <span className="text-base">
                    {i.landed_at ? INVITE.state.landed : i.accepted_at ? INVITE.state.accepted : INVITE.state.waiting}
                  </span>
                  <span className={'eyebrow shrink-0 ' + (i.landed_at ? 'text-accent' : 'text-muted')}>
                    {i.landed_at ? 'LANDED' : i.accepted_at ? 'STARTED' : 'SENT'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {brought.note ? <p className="text-xs leading-relaxed text-muted">{brought.note}</p> : null}
      </div>
    </section>
  )
}
