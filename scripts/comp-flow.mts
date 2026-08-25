/**
 * Can a tester actually get through the gate?
 *
 *   docker run -d --name dub-pg -e POSTGRES_PASSWORD=dub -e POSTGRES_DB=dub \
 *     -p 55432:5432 postgres:16
 *   export DATABASE_URL="postgres://postgres:dub@localhost:55432/dub?sslmode=disable"
 *   npm run db:migrate
 *   FEEDBACK_ADMIN_KEY=test-admin-key npm run dev -- -p 3111
 *   FEEDBACK_ADMIN_KEY=test-admin-key npm run comp:flow
 *
 * Every part of the comp system existed and worked, and the whole was still unreachable:
 * redeeming needed an account, an account needed a magic link, and the magic link needed
 * a mail sender that production does not have. Unit tests on each piece would all have
 * passed. So this walks the actual path a tester walks, over HTTP, with a cookie jar —
 * because the bug was in the JOINS, and only an end-to-end walk sees those.
 *
 * It also guards the two things most likely to be broken later by accident: the admin
 * key, and the fact that access must survive /reset.
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const ADMIN = process.env.FEEDBACK_ADMIN_KEY ?? 'test-admin-key'
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/** One tester = one cookie jar. */
function jar() {
  const cookies = new Map<string, string>()
  return {
    header: () => [...cookies].map(([k, v]) => k + '=' + v).join('; '),
    absorb(res: Response) {
      for (const raw of res.headers.getSetCookie?.() ?? []) {
        const [pair] = raw.split(';')
        const i = pair.indexOf('=')
        if (i > 0) cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim())
      }
    },
    get: (k: string) => cookies.get(k),
  }
}

async function call(j: ReturnType<typeof jar>, path: string, init: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'content-type': 'application/json', cookie: j.header(), ...(init.headers ?? {}) },
  })
  j.absorb(res)
  const text = await res.text()
  let body: Record<string, unknown> = {}
  try { body = JSON.parse(text) as Record<string, unknown> } catch { body = { raw: text.slice(0, 120) } }
  return { status: res.status, body }
}

console.log('\nthe admin key\n')
const admin = jar()
const noKey = await call(admin, '/api/comp/issue', { method: 'POST', body: '{}' })
ok('no key is refused', noKey.status === 404, 'got ' + noKey.status)
const badKey = await call(admin, '/api/comp/issue', {
  method: 'POST', body: '{}', headers: { 'x-admin-key': 'not-the-key' },
})
ok('a wrong key is refused', badKey.status === 404, 'got ' + badKey.status)
// 404 not 401: the route must not confirm its own existence to somebody probing.
ok('refusal does not confirm the route exists', noKey.status === 404 && badKey.status === 404)

console.log('\nissuing\n')
const issued = await call(admin, '/api/comp/issue', {
  method: 'POST',
  headers: { 'x-admin-key': ADMIN },
  body: JSON.stringify({ note: 'flow test', uses: 2, count: 1 }),
})
const codes = (issued.body.codes ?? []) as string[]
ok('a code is minted', issued.status === 200 && codes.length === 1, codes.join(','))
const CODE = codes[0]
const clamp = await call(admin, '/api/comp/issue', {
  method: 'POST',
  headers: { 'x-admin-key': ADMIN },
  body: JSON.stringify({ note: 'clamp', uses: 99999, count: 99999 }),
})
ok('absurd numbers are clamped, not obeyed',
  (clamp.body.uses as number) <= 500 && ((clamp.body.codes as string[]) ?? []).length <= 50,
  'uses=' + clamp.body.uses + ' count=' + ((clamp.body.codes as string[]) ?? []).length)

console.log('\na tester with no account\n')
const tester = jar()
const before = await call(tester, '/api/entitlements')
ok('starts on the free three', (before.body.entitlements as { crates: number }).crates === 3)

const redeemed = await call(tester, '/api/comp', { method: 'POST', body: JSON.stringify({ code: CODE }) })
ok('redeems without signing in', redeemed.status === 200 && redeemed.body.ok === true,
  String(redeemed.body.reason ?? ''))
ok('the grant is bound to the device', redeemed.body.bound === 'device')

const after = await call(tester, '/api/entitlements')
const crates = (after.body.entitlements as { crates: number }).crates
ok('every crate is now open', crates > 3, String(crates))
ok('and it says so', after.body.comped === true)
ok('still signed out', after.body.signedIn === false)

console.log('\nthe reset trap\n')
const deviceBefore = tester.get('dub_device')
const reset = await call(tester, '/api/reset', { method: 'POST' })
ok('reset succeeds', reset.status === 200 && reset.body.ok === true)
const deviceAfter = tester.get('dub_device')
ok('the device id actually changed', Boolean(deviceBefore) && deviceBefore !== deviceAfter)
ok('the grant was carried across', reset.body.kept_comp === true)
const afterReset = await call(tester, '/api/entitlements')
ok('access survives a reset',
  (afterReset.body.entitlements as { crates: number }).crates > 3,
  String((afterReset.body.entitlements as { crates: number }).crates))

console.log('\nspending the code\n')
const second = jar()
await call(second, '/api/entitlements')
const r2 = await call(second, '/api/comp', { method: 'POST', body: JSON.stringify({ code: CODE }) })
ok('a second tester can use the same cohort code', r2.body.ok === true, String(r2.body.reason ?? ''))
const third = jar()
await call(third, '/api/entitlements')
const r3 = await call(third, '/api/comp', { method: 'POST', body: JSON.stringify({ code: CODE }) })
ok('a third is refused once 2 uses are gone', r3.body.ok === false, String(r3.body.reason ?? ''))
const again = await call(tester, '/api/comp', { method: 'POST', body: JSON.stringify({ code: CODE }) })
ok('redeeming twice on the same device is a yes, not a scolding', again.body.ok === true)
const bogus = await call(second, '/api/comp', { method: 'POST', body: JSON.stringify({ code: 'ZZZZ-9999' }) })
ok('a made-up code is refused', bogus.body.ok === false, String(bogus.body.reason ?? ''))

console.log('\nhow people actually type it\n')
// A tester was handed QNCL-D3XW, typed QNCLD3XW, and was told the code did not exist.
// The hyphen is a reading aid; nobody thinks it is part of the code.
const forms = [CODE.replace('-', ''), CODE.toLowerCase(), ' ' + CODE + ' ', CODE.replace('-', ' ')]
for (const f of forms) {
  const j = jar()
  await call(j, '/api/entitlements')
  const r = await call(j, '/api/comp', { method: 'POST', body: JSON.stringify({ code: f }) })
  // Uses may be spent by now — "used up" still proves it FOUND the code, which is the point.
  const found = r.body.ok === true || String(r.body.reason ?? '').includes('used up')
  ok('"' + f + '" finds the code', found, String(r.body.reason ?? ''))
}

console.log('\nthe way in\n')
const page = await fetch(BASE + '/account', { headers: { cookie: jar().header() }, redirect: 'manual' })
ok('/account does not bounce a signed-out tester to /signin',
  page.status === 200, 'got ' + page.status + ' ' + (page.headers.get('location') ?? ''))
const html = await page.text()
ok('and the code box is on it', html.includes('GOT A CODE?'))

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\na tester with a code gets through the gate, keeps it through a reset, and never signs in')
