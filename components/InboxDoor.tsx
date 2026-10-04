'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DEFAULT_CHAPTER } from '@/content/chapters'
import { inboxFor, unreadCount } from '@/content/inbox'
import { useLearner } from '@/engine/useLearner'

/**
 * The way into the inbox, wherever somebody is standing.
 *
 * Sam: "Add the same inbox to the top of the Yours page."
 *
 * It was declared inside Feed.tsx and used once, in the Club's header. That was right while
 * there was one door; a second surface wanting the identical control is the moment it stops
 * being a local detail — and copying it would be two badges to keep in step about a count,
 * a colour and a size, which is the shape of every drift this codebase has had to unpick.
 *
 * COLOUR BY currentColor, never by a token. The Club's header flips between text-fg on sand
 * and text-white over a photograph, so anything in it naming its own colour is the
 * white-on-white bug waiting for the next imageless card. Yours is always on sand and would
 * not care — which is exactly why the rule has to live in the component rather than at each
 * call site, where the surface that does not care is the one that forgets.
 *
 * The badge is the exception and is deliberate: --telha is neither ground nor accent, so it
 * reads as a badge on sand and on a photograph alike without being told which it is on.
 */
export function InboxDoor() {
  const learner = useLearner()
  /*
    After mount, and null until then.

    `inboxFor` reads the clock — a drop is live or it is not — so computing this during
    render would have the server and the browser disagree about the number in the badge.
    The icon is there either way; only the count waits.
  */
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    setCount(
      unreadCount(
        inboxFor(
          learner.chapter ?? DEFAULT_CHAPTER,
          new Date(),
          (learner.profile?.genres ?? null) as Parameters<typeof inboxFor>[2],
          learner.purpose ?? null,
        ),
        learner.inbox_opened_at ?? null,
      ),
    )
  }, [learner.chapter, learner.profile?.genres, learner.purpose, learner.inbox_opened_at])

  return (
    <Link
      href="/inbox"
      data-testid="inbox-door"
      data-count={count ?? undefined}
      aria-label={
        count ? count + ' new in your inbox' : 'Inbox — what has landed in your Club'
      }
      className="pointer-events-auto tap-target relative flex items-center"
    >
      {/*
        An envelope, because that is what an inbox is and this is not the screen to be
        clever on. currentColor so it inherits the header's own decision about sand or
        photograph — see the note at the call site.
      */}
      {/*
        FIFTEEN PERCENT LARGER, which is h-7 rather than h-6.

        Sam: "make the envelope and indicator 15% larger." 24px to 28px is 16.7% and is the
        nearest step Tailwind's scale offers; the alternative is an arbitrary value, and a
        one-off size on the one piece of furniture in this header is how a scale starts
        leaking. The viewBox is unchanged, so the drawing scales rather than the strokes
        thickening.
      */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
        <path d="m3 8 9 6 9-6" />
      </svg>
      {count ? (
        <span
          data-testid="inbox-count"
          /*
            RED, BECAUSE A COUNT OF UNREAD THINGS IS THE ONE THING IN DUB THAT SHOULD NAG.

            Sam: "make the inbox message indicator red."

            It was the accent, which is the product's blue on sand and WHITE over a
            photograph — chosen so the badge would be legible on both grounds without a
            second colour to keep in step. Reasonable, and it made the badge disappear into
            the header on exactly the cards that carry a picture, which is most of them.

            --telha is the token and its own note says what it is for: "warmth and urgency —
            numerals, counters, short headlines. It clears AA, but it is not a body-text
            colour." A count of things you have not read is a numeral and it is urgent, which
            is the whole of that sentence. It is also the one colour in this palette that is
            neither the ground nor the accent, so it reads as a badge on sand and on a
            photograph alike without being told which it is on.

            NOT THE COACH AMBER, which the palette reserves with a rule in its own comment:
            "wrong answers coach in amber, never red." Unread mail is not a wrong answer.

            White ink on it rather than --accent-ink, because that token means "text on the
            accent" and this is no longer the accent. #a8492f takes white at 4.9:1.

            FIFTEEN PERCENT LARGER with the envelope: h-3.5 and min-w-3.5 against h-3, and
            the type goes up a notch with it so the numeral does not shrink inside a bigger
            circle.
          */
          className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-telha px-1 text-[0.5625rem] font-semibold leading-none text-white"
        >
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Link>
  )
}
