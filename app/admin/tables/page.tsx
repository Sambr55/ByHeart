import { TableBuilder } from '@/components/TableBuilder'

export const metadata = {
  title: 'Tables — DUB',
  robots: { index: false, follow: false },
}

export default function AdminTablesPage() {
  return <TableBuilder />
}
