import { SignIn } from '@/components/SignIn'
import { currentUser } from '@/lib/auth'
import { hasDb } from '@/lib/db'
import { debugLinksOn, sendable } from '@/lib/email'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SignInPage() {
  if (await currentUser()) redirect('/account')
  // A database on its own is not enough. Without a way to send the link, asking for an
  // address would be a dead end dressed as a feature — so the screen says so instead.
  return <SignIn accountsReady={hasDb() && (sendable() || debugLinksOn())} />
}
