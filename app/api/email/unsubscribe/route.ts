import { db } from '@/lib/db'
import { unsubscribeValid } from '@/lib/unsubscribe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * STOP THE NUDGE EMAILS — GET from the link in the email, POST from the mail client's own
 * one-click button (RFC 8058, List-Unsubscribe-Post). Both do the same one thing.
 */
async function stop(request: Request): Promise<boolean> {
  const url = new URL(request.url)
  const u = url.searchParams.get('u') ?? ''
  const t = url.searchParams.get('t') ?? ''
  if (!unsubscribeValid(u, t)) return false
  const sql = db()
  if (!sql) return false
  await sql`update users set nudge_email = false where id = ${u}::uuid`
  return true
}

const page = (ok: boolean) =>
  new Response(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>DUB</title>
<div style="font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;max-width:30rem;margin:15vh auto;padding:0 24px;color:#14243a">
<p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#1f5d8c">DUB</p>
<h1 style="font-size:26px;line-height:1.2">${ok ? 'Done. No more reminder emails.' : 'That link did not work.'}</h1>
<p style="font-size:16px;line-height:1.55;color:#555">${
      ok
        ? 'You can switch them back on any time in Account. Everything you have learned is still there.'
        : 'It may have been copied incompletely. You can switch reminders off in Account instead.'
    }</p>
<p><a href="/account" style="color:#1f5d8c">Open Account</a></p></div>`,
    { status: ok ? 200 : 400, headers: { 'content-type': 'text/html; charset=utf-8' } },
  )

export async function GET(request: Request) {
  return page(await stop(request))
}

export async function POST(request: Request) {
  const ok = await stop(request)
  return new Response(ok ? 'ok' : 'invalid', { status: ok ? 200 : 400 })
}
