import { NextResponse } from 'next/server'
import { currentUser, endSession } from '@/lib/auth'
import { deleteUser } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Close the account.
 *
 * Requires the person to type their own email back, because this is not undoable
 * from their side and a mis-tap should not end someone's Portuguese.
 */
export async function POST(request: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'sign in first' }, { status: 401 })

  let confirm = ''
  try {
    confirm = String(((await request.json()) as { confirm?: string }).confirm ?? '')
  } catch {
    /* handled below */
  }
  if (confirm.trim().toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: 'type your email address to confirm' }, { status: 400 })
  }

  await deleteUser(user.id)
  await endSession()
  return NextResponse.json({ ok: true })
}
