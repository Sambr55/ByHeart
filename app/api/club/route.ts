import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * WHO ELSE IS IN HERE — first names, and nothing else at all.
 *
 * Sam: "It's about community and we will use this to build out new features. For owned
 * I'd like to show a little ticker bar that shows the avatars or images of anyone who has
 * uploaded them (very small and unclickable) at the top of the yours section."
 *
 * NAMES RATHER THAN FACES, AND THE REASON IS IN THIS REPO. engine/avatar.ts keeps a
 * learner's photograph in its own storage key specifically so it stays off the server —
 * "putting a photograph of somebody's face on it would quietly ship their face to a
 * server that has no use for it". Nothing has ever uploaded an avatar, so there is no set
 * of people who have uploaded one to draw a ticker from. Building that means photo
 * upload, a consent step at the point of upload, and a moderation path, which is the
 * "moderation, safety and a different company" problem components/Feed.tsx already names.
 *
 * A first name needs none of that, and the product has already made the argument for it:
 * the note on Identity in components/Profile.tsx says the name syncs, unlike the photo,
 * because "a name is what you would be called in a room and the whole point of having one
 * is that somebody else can read it". That is this endpoint in one sentence.
 *
 * WHAT IT WILL NOT RETURN, ever: no email, no id, no surname, no count, no joined-at, no
 * location, no progress. A row here is a first name and that is the entire record. The
 * query selects one column so a future field cannot leak by being added to the table.
 *
 * ONLY PEOPLE WHO TYPED ONE. display_name is null until somebody fills it in on Yours, so
 * appearing here is the consequence of a deliberate act. Deleted accounts are excluded by
 * the same deleted_at the rest of the product uses, and an anonymised row has its
 * display_name set to null by lib/store.ts — so forgetting somebody removes them from
 * here with no extra step to remember.
 */

/** Only the given name, which is all a room needs. "Sam Brownfield" shows as Sam. */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? ''
}

export async function GET() {
  const sql = db()
  /*
    No database is not an error. DUB runs without one — the whole product works on-device
    — so the honest answer is an empty room rather than a failure, and the ticker draws
    nothing. See components/Ticker.tsx, which renders null on an empty list.
  */
  if (!sql) return NextResponse.json({ names: [] })

  /*
    EVERYBODY BUT THE PERSON READING IT.

    The strip says who ELSE is in here, so the caller's own name has no business in it —
    and at this size the fault is not cosmetic: with two members it rendered "You and
    Sammy" to Sammy, which is a product telling somebody they have company and naming
    them. Excluded in the query rather than filtered in the component, because a name
    that never leaves the server cannot be shown by a future caller that forgets.
  */
  const me = await currentUser()

  try {
    const rows = await sql<{ display_name: string }[]>`
      select display_name
        from users
       where deleted_at is null
         and display_name is not null
         and display_name <> ''
         and (${me?.id ?? null}::uuid is null or id <> ${me?.id ?? null}::uuid)
       order by last_seen_at desc nulls last
       limit 60
    `
    /*
      Deduped on the name rather than on the person, which is deliberate: two members
      called Marta are one name in a ticker, and showing it twice would read as a
      rendering fault rather than as two people. The cap is 24 because this is a decorative
      strip — a bar that scrolls for a minute is a list, and a list invites counting.
    */
    const seen = new Set<string>()
    const names: string[] = []
    for (const row of rows) {
      const first = firstName(row.display_name)
      /*
        Two characters, because a single initial is not a name and is what a mis-filled
        field looks like. Capped at 24 characters so one person cannot stretch the bar.
      */
      if (first.length < 2 || first.length > 24) continue
      const key = first.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      names.push(first)
      if (names.length >= 24) break
    }
    return NextResponse.json({ names })
  } catch {
    /*
      A broken query is an empty room too. This is decoration at the top of a screen whose
      actual content is the learner's own work, and taking Yours down because a marquee
      could not load would be the wrong trade by a long way.
    */
    return NextResponse.json({ names: [] })
  }
}
