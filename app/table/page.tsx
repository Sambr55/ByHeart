import { YourTables } from '@/components/table/YourTables'

export const metadata = {
  title: 'Your table — DUB',
  robots: { index: false, follow: false },
}

/*
  YOUR TABLE (2026-11-03): host-led, friends only — content/table-night.ts. This page used
  to offer seats at tables DUB matched strangers onto (components/Tables.tsx, lib/tables.ts);
  that flow is no longer linked from anywhere a learner goes.
*/
export default function TablePage() {
  return <YourTables />
}
