import { Suspense } from 'react'
import { Revise } from '@/components/Revise'

export const metadata = { title: 'Revision — DUB' }

/** Suspense because Revise reads ?kind and ?id — the card the grid sent it. */
export default function RevisePage() {
  return (
    <Suspense fallback={null}>
      <Revise />
    </Suspense>
  )
}
