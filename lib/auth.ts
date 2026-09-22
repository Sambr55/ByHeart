import 'server-only'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { db } from './db'

/**
 * Sign-in by emailed link. No passwords, ever.
 *
 * Three reasons, in order of how much they matter:
 *
 *   1. The product's whole promise is "open it and learn something in ninety
 *      seconds". A password form is the single most expensive screen we could put
 *      in front of that.
 *   2. Nothing we store can be used to log in. Tokens and session ids are hashed
 *      at rest, so a database disclosure is embarrassing rather than catastrophic.
 *   3. Apple does not require Sign in with Apple when the only alternative is
 *      email. Adding Google or Facebook later would trigger that requirement, so
 *      the decision to stay email-only is also a decision about App Store scope.
 */

const SESSION_COOKIE = 'dub_session'
const DEVICE_COOKIE = 'dub_device'
const SESSION_DAYS = 90
const TOKEN_MINUTES = 20

const sha = (s: string) => createHash('sha256').update(s).digest('hex')

/** URL-safe, 256 bits. Long enough that guessing is not a threat model. */
const secret = () => randomBytes(32).toString('base64url')

// ---------------------------------------------------------------------------
// Device identity — exists before, and independently of, any account
// ---------------------------------------------------------------------------

/**
 * The anonymous id that a learner's progress hangs off.
 *
 * Read-only: route handlers and server actions can mint one with `ensureDevice`,
 * but a server component rendering a page cannot set cookies, so this returns
 * null rather than throwing when there is nothing yet.
 */
export async function deviceId(): Promise<string | null> {
  return (await cookies()).get(DEVICE_COOKIE)?.value ?? null
}

/** Mint the device cookie if it is missing. Only valid where cookies are writable. */
export async function ensureDevice(): Promise<string> {
  const jar = await cookies()
  const existing = jar.get(DEVICE_COOKIE)?.value
  if (existing) return existing
  const id = secret()
  jar.set(DEVICE_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 * 2,
  })
  return id
}

// ---------------------------------------------------------------------------
// Magic links
// ---------------------------------------------------------------------------

export interface IssuedLink {
  token: string
  url: string
  expiresAt: Date
}

/**
 * Where a sign-in link is allowed to land, and nowhere else.
 *
 * Sam signed in two vibes from his Legend and came back to the billing page with no way
 * forward: "it took me back here and I couldn't return to where I was." The link always
 * went to /account, because where somebody came from was never captured.
 *
 * A LIST RATHER THAN THE PATH ITSELF. /api/auth/request is public and unauthenticated —
 * anybody can ask it to email a link to any address — so a `next` it will echo into a
 * redirect is an open redirect with a delivery mechanism attached. What this accepts is a
 * small set of in-app screens, matched exactly, and everything else falls back to the
 * account page it used to go to.
 *
 * Deliberately not a prefix or a regex. "//evil.example" and "/club@evil.example" both
 * start with a slash, and a rule clever enough to allow /vibes?open=top_gun is a rule
 * somebody has to keep being right about.
 */
const CAN_RETURN_TO = new Set(['/vibes', '/club', '/profile', '/legend', '/line', '/proof', '/vocab', '/drops'])

export function returnTo(path: string | null | undefined): string {
  const want = (path ?? '').trim()
  return CAN_RETURN_TO.has(want) ? want : '/account?welcome=1'
}

export async function issueLoginToken(
  emailRaw: string,
  /** Where to land once the link is spent. Filtered through returnTo, never trusted. */
  next?: string | null,
): Promise<IssuedLink | null> {
  const sql = db()
  if (!sql) return null
  const email = emailRaw.trim().toLowerCase()
  const token = secret()
  const expiresAt = new Date(Date.now() + TOKEN_MINUTES * 60_000)
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  await sql`
    insert into login_tokens (token_hash, email, expires_at, request_ip)
    values (${sha(token)}, ${email}, ${expiresAt}, ${ip})
  `
  /*
    The destination rides on the link rather than in the row.

    It is filtered before it is written, so what travels is already one of the allowed
    screens — and carrying it on the URL means it cannot outlive the token or be edited
    independently of it. The verify route filters again on the way out, because a value
    that has been through a mail client is a value from outside.
  */
  const land = returnTo(next)
  const url = absoluteUrl(
    '/api/auth/verify?token=' + token + (land === '/account?welcome=1' ? '' : '&next=' + encodeURIComponent(land)),
  )
  return { token, url, expiresAt }
}

/** Spends the token and returns the email it was issued to. Single use. */
export async function consumeLoginToken(token: string): Promise<string | null> {
  const sql = db()
  if (!sql || !token) return null
  const rows = await sql<{ email: string }[]>`
    update login_tokens
       set used_at = now()
     where token_hash = ${sha(token)}
       and used_at is null
       and expires_at > now()
    returning email
  `
  return rows[0]?.email ?? null
}

// ---------------------------------------------------------------------------
// Users and sessions
// ---------------------------------------------------------------------------

export interface DubUser {
  id: string
  email: string
  display_name: string | null
  target_language: string
  ui_locale: string
  marketing_opt_in: boolean
  created_at: Date
}

export async function upsertUser(email: string): Promise<DubUser | null> {
  const sql = db()
  if (!sql) return null
  const rows = await sql<DubUser[]>`
    insert into users (email)
    values (${email.trim().toLowerCase()})
    on conflict (email) do update
      set last_seen_at = now(),
          deleted_at   = null
    returning id, email, display_name, target_language, ui_locale, marketing_opt_in, created_at
  `
  return rows[0] ?? null
}

export async function startSession(userId: string): Promise<void> {
  const sql = db()
  if (!sql) return
  const token = secret()
  const ua = (await headers()).get('user-agent') ?? null
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000)

  await sql`
    insert into sessions (id, user_id, expires_at, user_agent)
    values (${sha(token)}, ${userId}, ${expiresAt}, ${ua})
  `
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

/**
 * Forget this device entirely.
 *
 * The device cookie is httpOnly, which is correct — no script should be able to read or
 * forge it — and it is exactly why clearing localStorage was not enough to reset a
 * phone. The cookie survived, the server still held a learner row keyed to it, and the
 * next page load merged it all straight back in.
 *
 * Deleting the cookie rather than minting a new one here: the next request that needs
 * a device will call ensureDevice() and get a fresh id, which keeps the "one place mints
 * a device" rule intact.
 */
export async function forgetDevice(): Promise<void> {
  ;(await cookies()).delete(DEVICE_COOKIE)
}

export async function endSession(): Promise<void> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  const sql = db()
  if (token && sql) await sql`delete from sessions where id = ${sha(token)}`
  jar.delete(SESSION_COOKIE)
}

/** The signed-in user, or null. Safe to call from anywhere, including with no db. */
export async function currentUser(): Promise<DubUser | null> {
  const sql = db()
  if (!sql) return null
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null

  const rows = await sql<DubUser[]>`
    select u.id, u.email, u.display_name, u.target_language, u.ui_locale,
           u.marketing_opt_in, u.created_at
      from sessions s
      join users u on u.id = s.user_id
     where s.id = ${sha(token)}
       and s.expires_at > now()
       and u.deleted_at is null
  `
  const user = rows[0]
  if (!user) return null
  // Fire-and-forget: last_seen drives the retention numbers and must never be able
  // to fail a page render.
  void sql`update sessions set last_seen_at = now() where id = ${sha(token)}`.catch(() => {})
  return user
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/** Constant-time compare so the admin key cannot be discovered a byte at a time. */
export function adminKeyValid(supplied: string | null | undefined): boolean {
  const expected = process.env.FEEDBACK_ADMIN_KEY
  if (!expected || !supplied) return false
  const a = Buffer.from(sha(supplied))
  const b = Buffer.from(sha(expected))
  return a.length === b.length && timingSafeEqual(a, b)
}

// ---------------------------------------------------------------------------

export function absoluteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL
      : 'http://localhost:3000')
  return base.replace(/\/$/, '') + path
}
