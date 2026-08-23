import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { exportUser } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Everything we hold, as a file. GDPR Article 20, and a decent thing to offer anyway. */
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'sign in first' }, { status: 401 })
  const data = await exportUser(user.id)
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json',
      'content-disposition': 'attachment; filename="dub-my-data.json"',
    },
  })
}
