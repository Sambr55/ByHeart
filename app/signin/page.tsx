import { SignIn } from '@/components/SignIn'
import { currentUser } from '@/lib/auth'
import { hasDb } from '@/lib/db'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SignInPage() {
  if (await currentUser()) redirect('/account')
  return <SignIn accountsReady={hasDb()} />
}
