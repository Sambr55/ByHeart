import { NextResponse } from 'next/server'
import { absoluteUrl, endSession } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  await endSession()
  return NextResponse.json({ ok: true })
}

/** GET too, so a plain link works with no JavaScript. */
export async function GET() {
  await endSession()
  return NextResponse.redirect(absoluteUrl('/'))
}
