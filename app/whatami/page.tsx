import { WhatAmI } from '@/components/WhatAmI'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'What am I running — DUB' }

/**
 * Which build this is, and what this device is holding.
 *
 * Built because three separate reports — "showing all events again", "not seeing the
 * invite", "the fix you made earlier hasnt landed" — all tested clean on the deployed
 * site, and there was no way to tell from a phone whether it was running the code I had
 * just pushed or something from an hour before. Guessing at that from symptoms wasted a
 * round trip; this answers it in one screen.
 *
 * Not linked from anywhere. It is a thing you type the address of when something looks
 * wrong, which is the only time it is worth having.
 */
export default function WhatAmIPage() {
  /*
    The commit, from the build rather than from the client.

    Vercel exposes it to the server at build time. Read here and passed down so the
    answer is about the DEPLOYMENT, not about whatever the browser has cached — which is
    precisely the distinction the page exists to draw.
  */
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? 'local'
  const built = process.env.VERCEL_GIT_COMMIT_MESSAGE ?? ''
  return <WhatAmI sha={sha} built={built} />
}
