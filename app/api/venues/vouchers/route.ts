import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { vouchersFor } from '@/lib/venues'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ vouchers: [], signedIn: false })
  return NextResponse.json({ vouchers: (await vouchersFor(user.id)) ?? [], signedIn: true })
}
