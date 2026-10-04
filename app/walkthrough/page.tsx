import { WalkHere } from '@/components/Walkthrough'

export const metadata = {
  title: 'Where everything is — DUB',
  /* Reachable on purpose, not by search. It is a replay of something already seen. */
  robots: { index: false, follow: false },
}

/**
 * /walkthrough — the walk, on demand, without wiping anything.
 *
 * Sam: "Also make it reachable deliberately — a route, so Sam can show it at a festival
 * without resetting a device."
 *
 * It does NOT reset and it does not clear the stamp. /club-member and /reset both exist
 * and both are destructive by design — which is the right bargain for a route that has to
 * reproduce a STATE, and the wrong one for a route that only has to show a screen. A
 * phone handed across a table at a festival keeps everything on it.
 *
 * So this is a redirect with a marker on it: /profile?walk=1, which components/Profile.tsx
 * reads as "show the walk whatever the record says". The walk itself is the same component
 * in the same place over the same real controls — a second copy of it on a page of its own
 * would be a tour of a screenshot, which is the one thing it exists not to be.
 */
export default function WalkthroughPage() {
  return <WalkHere />
}
