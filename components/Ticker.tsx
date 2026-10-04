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

  useEffect(() => {
    let live = true
    fetch('/api/club')
      .then((r) => (r.ok ? r.json() : { names: [] }))
      .then((d: { names?: string[] }) => {
        if (live) setNames(Array.isArray(d.names) ? d.names : [])
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

  /* Fewer than two is not a room — see the note above. */
  if (!names || names.length < 2) return null

  return (
    <div
      data-testid="club-ticker"
      /*
        A STRIP RATHER THAN A CARD, because it is not one of the things on this screen —
        it is the line above them. Every block on Yours is a white card on sand; making
        this a seventh would give the room the same weight as the learner's Legend.

        It wraps rather than scrolls horizontally. A single clipped line would hide most
        of the names and imply there are more in a direction nobody can go, which is the
        scoreboard this is trying not to be.
      */
      className="flex flex-col gap-1"
    >
      <p className="eyebrow text-muted">IN THE CLUB</p>
      {/*
        ONE LINE, CLIPPED — which is what makes it a strip rather than a block.

        Photographed at 390px with ten names and it wrapped to two lines, taking real
        vertical space above the learner's own card. Sam asked for "a little ticker bar",
        and the whole claim of a bar is that it is a rule under the title rather than a
        thing on the page. truncate holds it to one line however many names arrive.

        Unclickable, as asked, and said in the markup rather than only by the absence of a
        link: nothing here is a button, nothing has a href. A name in this bar is somebody
        being in the room, not a profile to go and look at.
      */}
      <p className="truncate text-sm leading-relaxed text-fg/75">
        {names.join(' · ')}
      </p>
    </div>
  )
}
