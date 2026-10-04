'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Back } from '@/components/Back'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { PushToggle } from '@/components/PushToggle'
import { chapterById, DEFAULT_CHAPTER } from '@/content/chapters'
import { inboxFor, type InboxMessage } from '@/content/inbox'
import { markInboxOpened } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'
import type { Genre } from '@/content/calendar'

/**
 * The inbox — what has landed in your feed.
 *
 * Sam: "in your Club page there should be an inbox, where a user gets an in-app message
 * (they can also enable notifications if they want to) as to new content that has dropped
 * into their feed."
 *
 * A LIST, NOT A FEED, and the difference is the whole screen. The Club is one full-bleed
 * card at a time because the Club is asking you to do something; this is asking you to
 * scan. So it is the card idiom on sand, stacked, oldest at the bottom — the shape every
 * person on earth already knows how to read without being taught, which is the same
 * argument the feed makes for borrowing TikTok.
 *
 * NO PHOTOGRAPHS. Every drop has images on its rooms and it was tempting to put one behind
 * each row, and that is exactly the bug that shipped this morning: `bg-bg-elev` over a
 * picture, with `.shown-on-photo` repointing --fg to white, is white on white. A list that
 * has to be legible at a glance is the last place to spend that risk, and eleven thumbnails
 * at 390px is a contact sheet rather than an inbox.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS SCREEN CANNOT DO, which is the property worth protecting.
 *
 * It cannot show a message about content that is not in the feed. Not because it is careful
 * — because there is nowhere for such a message to come from. `inboxFor` calls `dropsFor`,
 * the same function the Club calls, with this learner's own chapter, genres and purpose;
 * there is no stored list of messages anywhere in the product, so a drop that expires takes
 * its message with it and a drop that was never live never had one.
 *
 * scripts/inbox-check.mts asserts that against the real content and against the rendered
 * page, because a property this load-bearing should not rest on a docblock.
 * ---------------------------------------------------------------------------
 */
export function Inbox({ pushReady }: { pushReady: boolean }) {
  const learner = useLearner()
  /*
    The clock after mount, for the same reason every other dated screen in the product
    does it: `dropsFor` filters on `now`, so rendering it on the server and again in the
    browser can disagree about whether a drop opened — and a countdown that differs
    between the two tears the tree down on hydration.
  */
  const [now, setNow] = useState<Date | null>(null)
  /*
    THE MARK IS TAKEN BEFORE IT IS MOVED, in the same effect and in that order.

    `markInboxOpened` writes the current time and `useLearner` is subscribed, so reading
    `learner.inbox_opened_at` for the "new since" line after the write would always find
    today — and every message would render as old the instant the screen appeared. The
    badge would clear correctly and the screen would have nothing to show for it, which is
    the one way an inbox can be both right and useless.

    So the previous mark is captured into state on the first render, and that captured
    value is what this screen reads for as long as it is open.
  */
  const [was, setWas] = useState<string | null>(null)
  useEffect(() => {
    setNow(new Date())
    setWas(learner.inbox_opened_at ?? null)
    markInboxOpened()
    /* Once, on mount. Re-running it on every learner change would re-capture the mark it
       has just moved, which is the bug the note above describes. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chapter = learner.chapter ?? DEFAULT_CHAPTER
  /*
    The CITY, not the chapter's name.

    `chapterName` returns "Dub Club — Lisbon", which is the right label on a masthead and
    wrong inside a sentence: "11 drops have opened in Dub Club — Lisbon since you last
    looked" names the product where it means to name the place. Seen in a screenshot at
    390px rather than in the DOM, which is the only way that sort of thing is ever caught.
  */
  const city = chapterById(chapter).city
  const messages = useMemo<InboxMessage[]>(
    () =>
      now
        ? inboxFor(
            chapter,
            now,
            (learner.profile?.genres ?? null) as Genre[] | null,
            learner.purpose ?? null,
          )
        : [],
    [chapter, now, learner.profile?.genres, learner.purpose],
  )

  /*
    New since they last looked, by arrival date.

    Compared against the CAPTURED mark rather than the live one — see `was`. A learner who
    has never opened this gets everything marked new, which is what makes the first open
    worth having rather than a wall of grey rows.
  */
  const isNew = (m: InboxMessage) => !was || m.at > was.slice(0, 10)
  const fresh = messages.filter(isNew).length

  return (
    <main
      data-stage="CHOICE"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-bg text-fg"
    >
      {/*
        THE BAR REMAPS ITS OWN ACCENT, because the global rule that was supposed to has
        lost the line that did it.

        globals.css:1658 says of .bar: "The inversion of --accent is the important line: on
        a coloured bar, white IS the accent. A selected control becomes white-on-blue
        instead of blue-on-blue, which was the failure exactly." The comment is right and
        the declaration is not there — .bar sets background, color and a border, and
        nothing touches --accent. So `Back` renders text-accent, which resolves to #1f5d8c,
        on a #1f5d8c bar: the arrow and the word CLUB are invisible.

        MEASURED, AND NOT ONLY HERE. /drops and /vocab compute the same colour on the same
        element — rgb(31,93,140) on rgb(31,93,140) — so this is a product-wide fault that
        predates the inbox and is reported rather than fixed here: putting the missing
        declaration back on .bar is a one-line change to a rule that paints every header
        and both navigation bars in the product, which is not a change to make inside a
        feature and not one to make without seeing all of them.

        What this does is local and reversible: the two tokens the bar needs, scoped to
        this header only. The day .bar carries them again, this becomes a no-op rather than
        a conflict.
      */}
      <header
        className="bar sticky top-0 z-30 flex items-center gap-3 px-5 py-3"
        style={
          {
            '--accent': 'var(--bar-ink)',
            '--accent-ink': 'var(--bar-bg)',
          } as React.CSSProperties
        }
      >
        {/* Back to the Club, because that is the only place this is reached from and the
            thing every message is about. The default destination is Yours, which would
            send somebody somewhere they were not. */}
        <Back href="/club" label="CLUB" />
        <span className="eyebrow flex-1">Inbox</span>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 pb-10 pt-6">
        <div>
          <h1 className="display text-balance text-2xl">What landed in your Club.</h1>
          {/*
            THE HEADLINE SENTENCE IS A FACT ABOUT THE LIST, not a greeting.

            It says how many of these arrived since the last look and what they are about,
            which is the only thing somebody opening an inbox wants to know. It never says
            how long it has been, never asks where they have been, and there is no streak
            here — the same promise the Club masthead makes, on the one screen in the
            product whose whole genre is built on breaking it.
          */}
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {!now
              ? 'Every drop that has opened in your city, newest first.'
              : !messages.length
                ? 'Nothing has opened in your city yet. A drop appears here the day its window opens — a few weeks before the night itself — and goes the morning after.'
                : fresh
                  ? fresh +
                    (fresh === 1 ? ' drop has' : ' drops have') +
                    ' opened in ' +
                    city +
                    ' since you last looked. Each one is already in your feed.'
                  : 'Everything open in ' +
                    city +
                    ' is below, newest first. Each one is already in your feed.'}
          </p>
        </div>

        {/*
          THE OPT-IN SITS ABOVE THE LIST, and only once there is a list.

          Offering to send notifications about new content to somebody who has just been
          shown that there is none is the product asking for permission it has not earned
          yet. Below the first message it would be an interruption; above an empty list it
          would be a lie.

          And the copy is honest about what the switch actually is. A browser gets one push
          subscription per origin, so there is no subscribing to the inbox alone — tapping
          this turns on the morning line too, and saying otherwise would mean somebody
          tapping twice for a thing that happened once. See components/PushToggle.tsx.
        */}
        {messages.length ? (
          <div className="rounded-2xl border border-line bg-bg-elev px-5 py-6">
            <span className="eyebrow text-accent">ON YOUR PHONE</span>
            <p className="mt-3 text-sm leading-relaxed">
              These are here whether or not you turn anything on. If you would rather hear
              about a drop when it opens, DUB can tell you — the same switch as the morning
              line, because a phone only has the one.
            </p>
            <div className="mt-6">
              <PushToggle
                ready={pushReady}
                cta="TELL ME WHEN ONE OPENS"
                on="A line every morning, and a word when a drop opens. Nothing else."
                install="A word when a drop opens, on your lock screen."
                from="inbox"
              />
            </div>
          </div>
        ) : null}

        {messages.length ? (
          <section className="flex flex-col gap-3">
            {messages.map((m) => (
              <article
                key={m.id}
                data-testid="inbox-message"
                data-drop={m.id}
                data-new={isNew(m) || undefined}
                /*
                  The card idiom, and the only difference between new and read is the
                  border.

                  Not a dot, not a bold row, not a background tint. A dot is a thing to be
                  cleared and the clearing becomes the point; a tinted row makes the read
                  ones look broken. A hairline going from --line to the accent says "this
                  one is since you last looked" and says nothing at all about obligation.
                */
                className={
                  'rounded-2xl border bg-bg-elev px-5 py-6 ' +
                  (isNew(m) ? 'border-accent/45' : 'border-line')
                }
              >
                <div className="flex items-baseline justify-between gap-3">
                  {/*
                    WHAT ARRIVED, not when you were told. "Opened 12 Jul" is the honest
                    timestamp — see dropOpensOn — and it is the day the thing entered the
                    feed rather than the day anybody wrote a message about it.
                  */}
                  <span className="eyebrow min-w-0 text-accent">
                    {isNew(m) ? 'OPENED' : 'IN YOUR FEED'}
                  </span>
                  <span className="shrink-0 text-[0.6rem] uppercase tracking-wider text-muted">
                    {m.left <= 0 ? 'last day' : m.left === 1 ? '1 day left' : m.left + ' days left'}
                  </span>
                </div>
                <h2 className="display mt-3 text-base leading-tight">{m.headline}</h2>
                <p className="mt-1 text-xs text-muted">
                  {m.where} · {m.when}
                </p>
                {/*
                  THE ROOMS IT BROUGHT, which is the part that is about Portuguese.

                  A message naming only the gig is a listings site. "Getting in, getting
                  there, asking somebody to come" is what actually landed in the feed, and
                  it is also the claim the check verifies against the drop itself — so this
                  line cannot describe rooms the drop does not have.
                */}
                <p className="mt-3 text-xs leading-relaxed text-muted">{m.rooms.join(' · ')}</p>
                <Link
                  href="/club"
                  className="tap-target eyebrow mt-6 inline-flex text-accent underline underline-offset-4"
                >
                  Open it
                </Link>
              </article>
            ))}
          </section>
        ) : null}

        {/*
          WHERE THE REST IS. Not an empty-state apology — a pointer at the screen that
          answers the question this one cannot: what is coming but not open yet.
        */}
        {now ? (
          <Link
            href="/drops"
            className="tap-target text-center text-xs text-muted underline underline-offset-4"
          >
            Everything with a date on it
          </Link>
        ) : null}
      </div>
      <BottomNavSpace />
      <BottomNav />
    </main>
  )
}
