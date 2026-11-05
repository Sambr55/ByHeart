'use client'

import { useRouter } from 'next/navigation'
import { Booker } from '@/components/Booker'

/**
 * YOUR BOARDING PASS, AGAIN (Sam, 2026-11-05: "there is no natural home page in the app now —
 * or at least you can't get back to the page with the destination drop-down … I want to move to
 * Cascais/Sintra and can't").
 *
 * The same Booker set-up uses, opened for somebody already in: change the destination, the
 * reason, the dates or who with, and fly back to the path. Booking only rewrites those —
 * chapter, purpose, profile goal, dates, company (components/Booker.tsx book()) — never
 * progress, so every room laid stays laid. Reached from the city name on the path header and
 * from Settings.
 */
export function Trip() {
  const router = useRouter()
  return (
    <main data-testid="trip" className="booker mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pt-6 text-fg">
      <Booker onDone={() => router.push('/club')} />
    </main>
  )
}
