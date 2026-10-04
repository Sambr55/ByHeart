import { VibesView } from './view'

/**
 * The picker, addressable.
 *
 * The menu, a bookmark and the back button all want somewhere to point that means
 * "my vibes" rather than "start DUB from the beginning". Guarded rather than open:
 * arriving here without having accepted the deal lands on the deal, not the picker.
 *
 * NOT CACHED AT THE EDGE, and this is the whole reason the route is a server component.
 *
 * Sam, three times in one morning, on three separate fixes that were already deployed:
 * "still cant get out of this screen", "i didnt see the new jump off screen", "oh for
 * heavens sake, I am still stuck on 1234". Each time the code was live and his phone was
 * not seeing it.
 *
 * Measured rather than guessed: `curl -I` on this route returned `x-vercel-cache: HIT`
 * with an `age` that climbed on every request. The edge was holding the HTML, so a phone
 * asking for the page got a build from before the fix however many times it was refreshed.
 * The service worker was innocent — it already fetches navigations with `cache: 'reload'`
 * — and so were the assets, which Next hashes per build.
 *
 * Nothing is lost by not caching it. Every pixel on this page is drawn from the learner's
 * own storage after hydration, so the cached HTML was an empty shell being reused: all of
 * the staleness, none of the speed.
 *
 * It matters most on the one day it was found. Somebody who installs DUB at a festival and
 * opens it on the train home must get the product as it is, not as it was when the edge
 * last filled.
 */
export const dynamic = 'force-dynamic'

export default function VibesPage() {
  return <VibesView />
}
