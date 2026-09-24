import { AsLearner } from '@/components/AsLearner'

export const metadata = {
  title: 'Club as a new member — DUB',
  /* A testing tool that writes to the learner record. Not for search engines. */
  robots: { index: false, follow: false },
}

/**
 * /club-member — the Club's own welcome, which is the one Sam meant.
 *
 * "Club-new took me to the main intro not the CLUB intro." The nine INTRO_CARDS are the
 * product's argument; the Club's own intro is the ceremony — YOU ARE IN — and it fires
 * only for somebody whose seven are answered and who has never opened the Club since.
 *
 * Building that by hand is a whole Legend, which is exactly the walk this route exists to
 * save.
 */
export default function ClubMemberPage() {
  return <AsLearner mode="member" />
}
