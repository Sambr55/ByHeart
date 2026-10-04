'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { noticed, type Notice } from '@/content/noticed'
import { AudioButton } from '@/components/AudioButton'
import { slugFor } from '@/content/audio-manifest'
import { loadLearner } from '@/engine/learner'
import { PageShell } from '@/components/PageShell'

/**
 * What DUB has noticed, said back to the person it noticed it about.
 *
 * Sam: "we can silently monitor their progress but how do we intervene… It's like you could
 * do five years at school learning Portuguese, or you could push yourself (and be pushed) to
 * learn more and improve."
 *
 * THE MONITORING IS NOT SILENT, which is the one place I argued with the brief and the
 * argument is this: a product that watches you and says nothing is surveillance, and a
 * product that watches you and shows you what it saw is a teacher. Showing the whole of it
 * is also the feature — "you have said these eleven sentences with nothing on screen, these
 * three keep slipping" is the moment somebody believes DUB is paying attention, and no
 * notification can do that work because a notification is one line.
 *
 * READ-ONLY. This screen writes nothing — not a seen-stamp, not a dismissal, nothing. Every
 * observation is derived from the record on every open, so a line disappears when the thing
 * it is about stops being true rather than when somebody taps it away. That is the same
 * design as the inbox and for the same reason: a stored message outlives its content.
 *
 * NOTHING HERE IS A NUMBER except where the number IS the sentence — see the rule in
 * content/noticed.ts. No bar, no score, no comparison to last week.
 */
export function Noticed() {
  /*
    After mount, like everything that reads the record: the server has no learner, and
    deciding what to say during render is the hydration mismatch this codebase has paid for
    more than once.
  */
  const [notes, setNotes] = useState<Notice[] | null>(null)
  useEffect(() => setNotes(noticed(loadLearner())), [])

  return (
    <PageShell eyebrow="NOTICED" stage="REAL WORLD">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
          <h1 className="display text-balance text-2xl">What I have noticed.</h1>
          {/*
            THE PROPOSITION, SAID ONCE AND PLAINLY.

            Sam's own framing: five years of not quite learning it, or being pushed. The
            second half of that is the promise this screen has to make good on, so it says
            what it is doing rather than describing itself as a feature.
          */}
          <p className="text-sm leading-relaxed text-muted">
            You could spend five years not quite learning Portuguese. I am paying attention
            so that does not happen — this is everything I have spotted.
          </p>
        </div>

        {notes === null ? null : notes.length === 0 ? (
          /*
            NOTHING YET, SAID WITHOUT APOLOGY.

            A learner who has not spoken has nothing to notice, and inventing something
            would be the first lie this screen tells. It names what would make it say
            something instead, which is the useful thing and is also the nudge.
          */
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
            <p className="text-sm leading-relaxed text-fg">
              Nothing yet — you have not said anything out loud. Do one sentence with the
              screen off and I will have something to tell you.
            </p>
            <Link
              href="/legend?run=1"
              data-testid="noticed-go"
              className="tap-target eyebrow mt-3 w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
            >
              RUN YOUR LEGEND
            </Link>
          </div>
        ) : (
          <ul data-testid="noticed-list" className="flex flex-col gap-6">
            {notes.map((n) => (
              <li
                key={n.id}
                data-testid={'notice-' + n.id}
                /*
                  ONE CARD EACH, AND THE TONE IS A KEYLINE RATHER THAN A COLOUR WASH.

                  A stuck observation is not a warning and must not look like one — the
                  rule the microphone follows is that a miss is coached in amber and never
                  in red, and the same holds here. So the border carries it and the ground
                  stays the card everything else in the product uses.
                */
                className={
                  'flex flex-col gap-3 rounded-2xl border bg-bg-elev px-5 py-6 ' +
                  (n.tone === 'won'
                    ? 'border-correct/60'
                    : n.tone === 'stuck'
                      ? 'border-coach/60'
                      : 'border-accent/60')
                }
              >
                <p
                  className={
                    'eyebrow ' +
                    (n.tone === 'won'
                      ? 'text-correct'
                      : n.tone === 'stuck'
                        ? 'text-coach'
                        : 'text-accent')
                  }
                >
                  {n.tone === 'won' ? 'NICE' : n.tone === 'stuck' ? 'THIS ONE' : 'GO ON'}
                </p>
                <p className="text-base leading-relaxed text-fg">{n.say}</p>
                {/*
                  THE SENTENCE IT IS ABOUT, WITH A WAY TO HEAR IT.

                  This is what stops an observation being a statistic — it has a subject,
                  and the subject is a line of Portuguese the learner has actually met. The
                  play button is the point of the stuck ones: "have another listen" with
                  nothing to listen to would be advice rather than help.
                */}
                {n.about ? (
                  <span className="flex items-center gap-3">
                    <AudioButton slug={slugFor(n.about)} text={n.about} size="sm" />
                    <span className="pt display min-w-0 flex-1 text-lg text-accent">
                      {n.about}
                    </span>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  )
}
