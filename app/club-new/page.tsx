import { AsLearner } from '@/components/AsLearner'

export const metadata = {
  title: 'Club as a first-timer — DUB',
  /* A testing tool that writes to the learner record. Not for search engines. */
  robots: { index: false, follow: false },
}

/**
 * /club-new — the Club as somebody who has never been through set-up.
 *
 * Sam: "give me an easy url to go to 1) Club-new 2) Club-ret (returning)." Testing the
 * showcase meant resetting the device and walking the whole front door every time, which
 * is minutes per look at a screen that takes seconds to judge.
 *
 * It clears the record and goes to /club, so what renders is what a first-timer sees.
 */
export default function ClubNewPage() {
  return <AsLearner mode="new" />
}
