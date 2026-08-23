import { NextResponse } from 'next/server'
import { absoluteUrl, currentUser } from '@/lib/auth'
import { portalUrl } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'sign in first' }, { status: 401 })
  const url = await portalUrl(user.id, absoluteUrl('/account'))
  if (!url) return NextResponse.json({ error: 'no billing account yet' }, { status: 400 })
  return NextResponse.json({ url })
}
