import { redirect } from 'next/navigation'

/**
 * The old address for the shelf.
 *
 * "Crate" was the product's word for a long time, so it is in testers' open tabs, in
 * bookmarks, and in every link that has already been sent to somebody. Renaming the
 * route without this would have broken all of them at once, for a change that is only
 * about a word — and a 404 is a much worse thing to hand a tester than an old noun.
 */
export default function CratesRedirect() {
  redirect('/vibes')
}
