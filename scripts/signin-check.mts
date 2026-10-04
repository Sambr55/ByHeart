/**
 * The magic link actually signs you in.
 *
 *   npm run signin
 *
 * Sam, having tapped the emailed link and arrived in the product: "I'm still signed out."
 * He was. The token had been spent — he landed in DUB rather than on /signin?expired=1 —
 * so the session row existed on the server and the browser had never been told about it.
 *
 * startSession wrote to the `cookies()` jar, and Next attaches that jar's Set-Cookie
 * headers to the response IT builds for a handler. The verify route builds its own, with
 * NextResponse.redirect, and a constructed response does not inherit them. The 307 went
 * out with no Set-Cookie on it at all — and nothing about the cookie's own settings was
 * wrong, which is why it read as a platform problem for an hour.
 *
 * ASSERTED ON THE SOURCE rather than by walking it, and that is a deliberate limitation
 * worth stating. Exercising this for real needs a live token, a mail round trip and a
 * database, which no check here has. What CAN be held is the shape, because the fault was
 * structural: a response constructed by hand has to be given the cookie by hand.
 *
 * So this fails if somebody returns the redirect inline again, or drops the cookie from
 * it, or stops startSession handing one back. It cannot prove a learner ends up signed in;
 * it can prove the one line whose absence meant they never could.
 */
import { readFileSync } from 'node:fs'
/*
  The redirect must carry the cookie. Asserted on the source, because the live route needs
  a real token and a database — and the fault was structural: a constructed response not
  inheriting the jar's headers.
*/
const src = readFileSync('app/api/auth/verify/route.ts', 'utf8')
const fail: string[] = []
const ok = (label: string, cond: boolean) => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label)
  if (!cond) fail.push(label)
}
ok('the redirect is held rather than returned inline', /const out = NextResponse\.redirect/.test(src))
ok('and the session cookie is set on it', /out\.cookies\.set\(session\.name, session\.value, session\.options\)/.test(src))
ok('startSession is awaited into a value', /const session = await startSession/.test(src))
const auth = readFileSync('lib/auth.ts', 'utf8')
ok('startSession hands the cookie back', /return \{ name: SESSION_COOKIE, value: token, options \}/.test(auth))
ok('and still writes the jar for every other caller', /jar\.set\(SESSION_COOKIE, token, options\)/.test(auth))
console.log(fail.length ? '\n' + fail.length + ' problem(s)' : '\nthe magic link carries its own session')
process.exit(fail.length ? 1 : 0)
