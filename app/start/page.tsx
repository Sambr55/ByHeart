import { Suspense } from 'react'
import { Start } from './Start'

export const metadata = { title: 'Start — DUB' }

export default function StartPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-bg" aria-hidden />}>
      <Start />
    </Suspense>
  )
}
