import { PathHome } from '@/components/path/PathHome'

export const metadata = { title: 'Your Lisbon trip — DUB' }

/**
 * /path — preview of the app-style home: the Lisbon visitor path.
 *
 * Standalone for now so it can be looked at without touching the Club; at merge the Club
 * home renders <PathHome /> directly. Everything on it is the learner's own record, read
 * on the device, so there is nothing to render on the server beyond the shell.
 */
export default function PathPage() {
  return <PathHome />
}
