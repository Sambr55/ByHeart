import { TableLive } from '@/components/table/TableLive'

export const metadata = { title: 'At the table — DUB', robots: { index: false, follow: false } }

export default async function LivePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return <TableLive code={code} />
}
