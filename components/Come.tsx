'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/engine/analytics'
import { COME } from '@/content/invite'
import { Wordmark } from '@/components/Wordmark'

/**
 * The screen somebody lands on when a friend asks them to learn this.
 *
 * TWO THINGS, IN THE ORDER THEY MATTER: say what this is, then get out of the way. A
 * person here is here because somebody they know asked them to be, which is the warmest
 * any arrival in this product ever gets — and an invitation that opened on a paywall, a
 * form or a signup wall would spend that on admin.
 *
 * THE CODE IS TAKEN UP ON ARRIVAL, not on the tap. Somebody who opens the link, reads it
 * and comes back tomorrow should still be the person their friend invited — and the
 * redemption is what makes the pair a pair. Nothing is granted by it: the reward is paid
 * when they can say their Legend, which is months of real work away. See lib/invites.ts.
 *
 * A SPENT CODE IS NOT AN ERROR. Somebody forwarding an invitation to a group is the normal
 * way these travel, so the second person through gets a sentence saying so and the same
 * way in. Turning them away would be punishing them for somebody else's generosity.
 */
export function Come({ code }: { code: string }) {
  const router = useRouter()
  const [spent, setSpent] = useState(false)

  useEffect(() => {
    let live = true
    track('invite_opened', {})
    fetch('/api/invite', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then((r) => r.json())
      .then((b: { ok: boolean }) => {
        if (live && !b.ok) setSpent(true)
      })
      .catch(() => {
        /* Offline, or no store. They can still start — see the note on the component. */
      })
    return () => {
      live = false
    }
  }, [code])

  return (
    <main className="safe-top mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 pb-10 pt-6 text-fg">
      <Wordmark mark="club" className="h-6" title="DUB Club" />

      {/*
        THE WHITE CARD ON THE INVITATION, which is the warmest arrival in the product and
        was the plainest screen in it.

        Somebody is here because a friend asked them to be. What they met was an eyebrow,
        a headline and three grey paragraphs floating in the middle of a sand page — which
        is the layout of a notice, not of something handed to you.

        flex-1 justify-center stays on the OUTER div so the card still sits in the middle
        of the screen; the card itself only holds the words. Putting flex-1 on the card
        would stretch it to the full height and it would stop being a card.
      */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
          <p className="eyebrow text-accent">{COME.eyebrow}</p>
          <h1 className="display text-balance text-3xl">{COME.headline}</h1>
          <p className="text-sm leading-relaxed text-muted">{COME.body}</p>
          {/*
            What it is not, because an invitation from a friend in an expat group reads —
            reasonably — as another social app, and the honest difference is worth a sentence.
          */}
          <p className="text-sm leading-relaxed text-muted">{COME.note}</p>
          {spent ? (
            <p data-testid="come-spent" className="text-sm leading-relaxed text-accent">
              {COME.spent}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        data-testid="come-start"
        onClick={() => {
          track('invite_accepted', {})
          router.push('/')
        }}
        className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
      >
        {COME.cta}
      </button>
    </main>
  )
}
