'use client'

import { useCallback, useEffect, useState } from 'react'
import { track } from '@/engine/analytics'
import { INVITE_TEXT } from '@/content/invite'
import { useLearner } from '@/engine/useLearner'

/** One invitation, and what became of it. Never a count — see components/Friends.tsx. */
export interface Invited {
  code: string
  accepted_at: string | null
  landed_at: string | null
}

/**
 * BRINGING SOMEBODY IN, as one hook: the list of your invitations and the act of sending
 * one. Shared by Yours (components/Friends.tsx) and the board's "Convida um amigo" sheet
 * (components/invite/InviteSheet.tsx), so the two can never send different things.
 *
 * Through the operating system's own share sheet, never the contact list (app/api/invite).
 * Where there is no share sheet the link is copied AND handed back, so the sheet can show
 * it — "Link copied" with nothing to see is a promise somebody has to take on trust.
 */
export function useInvites(via: 'yours' | 'board') {
  const learner = useLearner()
  const [invites, setInvites] = useState<Invited[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    fetch('/api/invite')
      .then((r) => r.json())
      .then((b: { ok: boolean; invites?: Invited[] }) => {
        if (live) setInvites(b.ok ? (b.invites ?? []) : [])
      })
      .catch(() => {
        if (live) setInvites([])
      })
    return () => {
      live = false
    }
  }, [])

  const bring = useCallback(async () => {
    setBusy(true)
    setNote(null)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chapter: learner.chapter ?? null }),
      })
      const body = (await res.json()) as { ok: boolean; invite?: Invited; reason?: string }
      if (!body.ok || !body.invite) {
        setNote(body.reason ?? 'Could not make an invitation.')
        setBusy(false)
        return
      }
      const url = window.location.origin + '/come/' + body.invite.code
      track('invite_sent', { via })
      setLink(url)
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'DUB', text: INVITE_TEXT, url }).catch(() => {})
      } else {
        await navigator.clipboard?.writeText(url).catch(() => {})
        setNote('Link copied.')
      }
      setInvites((old) => [body.invite as Invited, ...(old ?? [])])
    } catch {
      setNote('Could not make an invitation.')
    }
    setBusy(false)
  }, [learner.chapter, via])

  return { invites, busy, note, link, bring }
}
