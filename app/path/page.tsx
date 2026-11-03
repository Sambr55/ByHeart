import { redirect } from 'next/navigation'

/** One home (2026-11-03): the path lives at /club. Kept as a redirect for old links. */
export default function PathPage() {
  redirect('/club')
}
