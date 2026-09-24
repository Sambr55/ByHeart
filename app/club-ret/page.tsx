import { AsLearner } from '@/components/AsLearner'

export const metadata = {
  title: 'Club as a returning learner — DUB',
  /* A testing tool that writes to the learner record. Not for search engines. */
  robots: { index: false, follow: false },
}

/**
 * /club-ret — the Club as somebody who has been through set-up and has no Legend.
 *
 * The other half of /club-new. This is the state most real learners are in for most of
 * their time in DUB: past the intro, short of the door — so it should show the explainer
 * rather than the nine-card sequence, and this is how to look at that in one tap.
 */
export default function ClubRetPage() {
  return <AsLearner mode="returning" />
}
