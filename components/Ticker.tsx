'use client'

import { useEffect, useState } from 'react'

/**
 * WHO ELSE IS IN HERE, at the top of the one screen that is about you.
 *
 * Sam: "It's about community and we will use this to build out new features. For owned
 * I'd like to show a little ticker bar that shows the avatars or images of anyone who has
 * uploaded them (very small and unclickable) at the top of the yours section."
 *
 * NAMES RATHER THAN FACES, which is the one place this departs from the brief and the
 * reason is in the repo rather than in an opinion. engine/avatar.ts puts a learner's photo
 * in its own storage key SO THAT it stays off the server — "putting a photograph of
 * somebody's face on it would quietly ship their face to a server that has no use for
 * it". Nothing in DUB has ever uploaded one, so there is no set of people who have
 * uploaded an avatar to draw from: the ticker would have had to show the six stock
 * portraits from the Club intro card, which are not members, on the screen that is
 * entirely the learner's own real work.
 *
 * The product had already made the case for the alternative. The note on Identity in
 * components/Profile.tsx: the photo never syncs, the name does, "because a name is what
 * you would be called in a room and the whole point of having one is that somebody else
 * can read it". This is that sentence, rendered.
 *
 * NOT A TICKER IN THE SCROLLING SENSE, and that is a constraint rather than a shortcut.
 * The motion scale is 120/260/420/620ms and scripts/motion-check.mts fails a fifth value
 * — a marquee needs tens of seconds, so it cannot be built here without breaking the rule
 * the whole product keeps. The rule is also right: the only looping animation DUB allows
 * is the tutorial arrows, where "the movement is the instruction rather than decoration".
 * A bar of names that never stops moving at the top of Yours is decoration that never
 * stops moving. So the names arrive once, on load, and then sit still.
 *
 * SMALL AND UNCLICKABLE, as asked. No link, no count, no avatars, no "and 12 others" —
 * a number would make it a scoreboard and the Club intro card already settled that one:
 * "a number is honest and cold; six faces is what the room looks like when you walk in".
 * This is the same argument in text.
 *
 * NOTHING IS SHOWN UNTIL THERE IS SOMEBODY TO SHOW. An empty room renders null rather
 * than a bar saying nobody is here, and one name renders nothing either — "IN THE CLUB:
 * Sam" to Sam is a mirror, not a community. Two is the first honest number.
 */
export function Ticker() {
  /*
    After mount and never on the server, like every other read in this product that
    depends on something outside the render. Null means "not asked yet" and is different
    from an empty list, which means "asked, and the room is empty".
  */
  const [names, setNames] = useState<string[] | null>(null)
  /* Those of them signed in and active in the last fifteen minutes — app/api/club. */
  const [here, setHere] = useState<string[]>([])

  useEffect(() => {
    let live = true
    fetch('/api/club')
      .then((r) => (r.ok ? r.json() : { names: [] }))
      .then((d: { names?: string[]; here?: string[] }) => {
        if (!live) return
        setNames(Array.isArray(d.names) ? d.names : [])
        setHere(Array.isArray(d.here) ? d.here : [])
      })
      /*
        A failed fetch is an empty room. This sits above somebody's own work and must
        never be the reason the screen looks broken.
      */
      .catch(() => live && setNames([]))
    return () => {
      live = false
    }
  }, [])

  /*
    NOTHING UNTIL THE ANSWER IS KNOWN, and then something honest whatever it is.

    This used to return null below two names, on the argument that showing somebody their
    own name is a mirror rather than a room. The argument was right and the behaviour was
    wrong: DUB has two signed-in learners, so the strip has never once appeared on Sam's
    phone — he asked where it was, which is the only review that counts.

    A feature that is invisible until the product succeeds is not cautious, it is absent.
    And the honest version at this stage is better than silence, because being early is
    the one thing a small room can offer that a large one cannot: "You and Sammy" says
    there is somebody else here, and "You are the first one in" is true, flattering, and
    an invitation rather than an apology.

    Still nothing at all while `names` is null — that is "not asked yet", which is
    different from "nobody here", and a strip that flickered a claim before the server
    answered would be the one thing worse than being absent.
  */
  /*
    AND NOTHING WHILE IT IS ONLY YOU (2026-11-04). "You are the first one in" sat at the
    top of Yours above the learner's own name, a line about an empty room in the place the
    screen should start on them. The review of Yours took it out: the strip comes back the
    moment anybody else is in (the caller is never in `names`), and says who is here
    rather than who is not.
  */
  if (!names || names.length === 0) return null

  /*
    WHO'S IN THE CLUB RIGHT NOW (Sam, 2026-11-05: "show it like the users at the top of the
    table screen"). The table's own look — overlapping gold initials on the header blue —
    with whoever is here this minute first and marked with a green dot, and one line that
    says who is here now, or who was in earlier when nobody is. Still first names only,
    still nothing to tap, and still no number: past eight the circles simply stop.
  */
  const now = names.filter((n) => here.includes(n))
  const order = [...now, ...names.filter((n) => !here.includes(n))]
  const list = (xs: string[]) => (xs.length <= 3 ? xs.join(xs.length === 2 ? ' and ' : ', ') : xs.slice(0, 3).join(', ') + ' and others')
  const line = now.length
    ? list(now) + (now.length === 1 ? ' is here now' : ' are here now')
    : names.length === 1
      ? /* Under "right now", "You and Sammy" would claim Sammy is here. Early days, and honest about it. */
        names[0] + ' was in earlier. Early days.'
      : 'Nobody else this minute. ' + list(names) + ' were in earlier.'

  return (
    <div data-testid="club-ticker" className="border-b border-black/15 bg-[var(--bar-bg)] px-5 pb-4 pt-3 text-[var(--bar-ink)]">
      <div className="mx-auto flex w-full max-w-md flex-col gap-2">
      <p className="eyebrow text-[0.6rem] text-[#e5b04a]">Who’s in the Club right now</p>
      <div className="flex items-center gap-3">
        <span className="flex shrink-0 items-center" aria-hidden>
          {order.slice(0, 8).map((n, i) => (
            <span
              key={n}
              title={n}
              /* The first on top, so each one's here-now dot sits over its neighbour, not under it. */
              style={{ zIndex: 10 - i }}
              className={
                'relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#1f5d8c] bg-[#e5b04a] text-sm font-bold text-[#0f1f33] ' +
                (i ? '-ml-2' : '')
              }
            >
              {n.charAt(0).toUpperCase()}
              {here.includes(n) ? (
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#1f5d8c] bg-[#4cc38a]" />
              ) : null}
            </span>
          ))}
        </span>
        <p className="min-w-0 truncate text-sm text-white/85">{line}</p>
      </div>
      </div>
    </div>
  )
}
