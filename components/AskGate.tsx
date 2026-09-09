'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NotYet } from '@/components/NotYet'
import { useClub } from '@/engine/useClub'

/**
 * What ASK is, for somebody who cannot use it yet.
 *
 * The tab opens a panel rather than navigating, so before the Club there was nowhere for
 * it to send anybody. This is the somewhere.
 *
 * A MEMBER MUST NEVER LAND HERE. The tab sends them to the panel instead, but the URL is
 * real and can be reached by a back gesture, a bookmark, or a link — and a member reading
 * "not yet" about a tool they already have would be the product forgetting who they are.
 * So the page checks for itself and bounces, which is the same rule stated in the same
 * terms rather than a second opinion about the door.
 */
export function AskGate() {
  const router = useRouter()
  const club = useClub()

  useEffect(() => {
    if (!club.mounted || !club.open) return
    router.replace('/club')
    /* The panel is not a route, so it is asked for once the Club has rendered. */
    const t = setTimeout(() => window.dispatchEvent(new CustomEvent('dub:ask')), 400)
    return () => clearTimeout(t)
  }, [club.mounted, club.open, router])

  if (!club.mounted || club.open) return <div className="min-h-svh bg-bg" aria-hidden />

  return (
    <NotYet
      what="ASK"
      line="Say what you need in English and get it back in Portuguese you can actually use — with the register right for who you are talking to. Point your camera at a menu and it reads it."
    />
  )
}
