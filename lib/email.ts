import 'server-only'

/**
 * Transactional email.
 *
 * Resend if RESEND_API_KEY is set, otherwise the link goes to the server log and,
 * when AUTH_DEBUG_LINKS is on, back to the caller. That fallback is what lets a
 * facilitated test session work before any email domain has been verified: Sam
 * can read the link off /admin and hand it over.
 *
 * AUTH_DEBUG_LINKS must never be set in production with real users. `sendable()`
 * is what the sign-in route uses to decide whether to admit that.
 */

const FROM = process.env.EMAIL_FROM ?? 'DUB <hello@dub.study>'

export function sendable(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export function debugLinksOn(): boolean {
  return process.env.AUTH_DEBUG_LINKS === '1'
}

interface Mail {
  to: string
  subject: string
  text: string
  html: string
}

async function deliver(mail: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log('[email:undelivered] ' + mail.to + ' — ' + mail.subject + '\n' + mail.text)
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html }),
    })
    if (!res.ok) {
      console.error('[email:failed] ' + res.status + ' ' + (await res.text()).slice(0, 300))
      return false
    }
    return true
  } catch (err) {
    console.error('[email:threw]', err)
    return false
  }
}

/** The tone here is the product's tone. It is the first thing a new person reads. */
export async function sendLoginLink(to: string, url: string): Promise<boolean> {
  const text =
    'Here is your way in.\n\n' +
    url +
    '\n\nThe link works once and expires in twenty minutes. If you did not ask for it, ' +
    'nothing has happened and you can ignore this.\n\n— DUB'

  const html = `<!doctype html>
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:34rem;margin:0 auto;padding:32px 24px;color:#111">
  <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#888;margin:0 0 24px">DUB</p>
  <h1 style="font-size:26px;line-height:1.2;margin:0 0 16px">Here is your way in.</h1>
  <p style="font-size:16px;line-height:1.55;color:#444;margin:0 0 28px">
    One tap and you are back where you left off.
  </p>
  <p style="margin:0 0 28px">
    <a href="${url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-size:14px;letter-spacing:.08em;text-transform:uppercase">Open DUB</a>
  </p>
  <p style="font-size:13px;line-height:1.5;color:#888;margin:0">
    The link works once and expires in twenty minutes. If you did not ask for it, nothing has
    happened and you can ignore this.
  </p>
</div>`

  return deliver({ to, subject: 'Your DUB link', text, html })
}
