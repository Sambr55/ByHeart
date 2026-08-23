import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { entitlementsForUser, subscriptionFor } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ user: null, entitlements: null })
  return NextResponse.json({
    user,
    subscription: await subscriptionFor(user.id),
    entitlements: await entitlementsForUser(user.id),
  })
}

/** Account settings. Only the fields a person is allowed to change about themselves. */
export async function PATCH(request: Request) {
  const user = await currentUser()
  const sql = db()
  if (!user || !sql) return NextResponse.json({ error: 'sign in first' }, { status: 401 })

  let body: { display_name?: string; marketing_opt_in?: boolean; target_language?: string; ui_locale?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const name = body.display_name?.trim().slice(0, 60) || null
  const optIn = Boolean(body.marketing_opt_in)
  const target = /^[a-z]{2}-[A-Z]{2}$/.test(body.target_language ?? '') ? body.target_language! : user.target_language
  const locale = /^[a-z]{2}-[A-Z]{2}$/.test(body.ui_locale ?? '') ? body.ui_locale! : user.ui_locale

  const [updated] = await sql`
    update users
       set display_name = ${name},
           marketing_opt_in = ${optIn},
           target_language = ${target},
           ui_locale = ${locale}
     where id = ${user.id}
    returning id, email, display_name, target_language, ui_locale, marketing_opt_in, created_at
  `
  return NextResponse.json({ user: updated })
}
