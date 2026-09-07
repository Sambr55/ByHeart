/**
 * Wait until what was pushed is actually being served.
 *
 *   npm run live            wait for the deployment to change, then say so
 *   npm run live -- --now   report what is being served and exit
 *
 * WHY THIS EXISTS. "Pushed" and "testable" are not the same moment and the gap between them
 * is a minute or two of Vercel building — so every report of finished work has been either
 * slightly early or hedged, and the person on the other end has had to guess when to pick
 * up their phone. Guessing wrong means testing the old build and reporting a bug that was
 * fixed twenty minutes ago, which costs far more than the wait.
 *
 * HOW IT KNOWS. The home page is prerendered, so Vercel serves it with an etag that is a
 * fingerprint of the build. A new deployment changes it. That is a weaker signal than asking
 * Vercel's API — it cannot tell you WHICH commit is live — but it needs no token, no CLI and
 * no account access, and it answers the only question being asked: is what is being served
 * different from what was being served before I pushed.
 *
 * It fails honestly. A timeout says the deployment did not land in the time allowed, which
 * is not the same as saying it failed — and never claims a build is live because it got
 * bored waiting.
 */
const URL_ = process.env.BASE_URL ?? 'https://www.thisisdub.club'
const EVERY = 15_000
const GIVE_UP = 12 * 60_000

async function serving(): Promise<string | null> {
  try {
    const res = await fetch(URL_, { method: 'HEAD', cache: 'no-store' })
    return res.headers.get('etag')
  } catch {
    return null
  }
}

const now = process.argv.includes('--now')
const before = await serving()

if (now) {
  console.log(before ? 'serving ' + before : 'no answer from ' + URL_)
  process.exit(0)
}

if (!before) {
  console.log('\nCannot reach ' + URL_ + ' — not waiting for something I cannot see.\n')
  process.exit(1)
}

console.log('\nwaiting for the deploy · was ' + before)
const started = Date.now()

while (Date.now() - started < GIVE_UP) {
  await new Promise((r) => setTimeout(r, EVERY))
  const after = await serving()
  // A failed request is the network, not a deployment. Keep waiting rather than guessing.
  if (!after || after === before) continue
  const secs = Math.round((Date.now() - started) / 1000)
  console.log('\nLIVE after ' + secs + 's · now ' + after + '\n')
  process.exit(0)
}

console.log(
  '\nStill serving the old build after ' +
    Math.round(GIVE_UP / 60_000) +
    ' minutes. That is not the same as a failed deploy — check Vercel.\n',
)
process.exit(1)
