import { YourTables } from '@/components/table/YourTables'

export const metadata = {
  title: 'Your table — DUB',
  robots: { index: false, follow: false },
}

/*
  YOUR TABLE (2026-11-03): host-led, friends only — content/table-night.ts. The earlier
  stranger-matching table (seats earned by proof, tables made by an admin) was removed on
  2026-11-03; its database tables (`tables`, `seats`, migration 012) are left in place,
  unused, rather than dropped.
*/
export default function TablePage() {
  return <YourTables />
}
