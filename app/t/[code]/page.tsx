import { TableInvite } from '@/components/table/TableInvite'

/* An invitation from a friend: not for search engines, and not shared further than they chose. */
export const metadata = { title: 'You’re invited to a table — DUB', robots: { index: false, follow: false } }

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return <TableInvite code={code} />
}
