import { HomeView } from './view'

/**
 * The front door — and the one URL everything else points at.
 *
 * NOT CACHED AT THE EDGE, for the reason written at length on app/vibes/page.tsx.
 * Measured here too: `x-vercel-cache: HIT` with an age of 239 seconds, on the route that
 * is `start_url` in the manifest. So an installed app opening cold got whatever build the
 * edge last filled, which is the worst place in the product for staleness — it is the
 * first screen after somebody puts DUB on their phone.
 *
 * Nothing is lost. The page draws itself from the learner's own storage after hydration,
 * so the cached HTML was an empty shell: all of the staleness, none of the speed.
 */
export const dynamic = 'force-dynamic'

export default function Page() {
  return <HomeView />
}
