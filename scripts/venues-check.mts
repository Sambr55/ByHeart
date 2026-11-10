/**
 * REWARDS ON THE GROUND — the rules, held still (2026-11-05).
 *
 *   npm run venues
 *
 * Sam: "Completing a board puts a user into a free prize drawer … if 50 people complete a
 * venue it unlocks a 25% discount voucher. If 150 … a free meal … that will require sign-up
 * from the venues themselves … a very simple mechanic." And: accounts yes; 25% at 50 for
 * every venue; venues choose at 150; the holiday behind a switch. This fails if any of that
 * drifts, or if a prize can show without its switch and its approved terms.
 */
import { readFileSync } from 'node:fs'
import { DRAW_TERMS, HOLIDAY_PRIZE, REWARD_TIERS, SECOND_OFFERS, WALK_ORDER, GEO_RADIUS_M, PAIR_TIER } from '../content/board'
import { WALKS, walksIn } from '../content/walks'
import { GEMS } from '../content/gems'
import { countLine, nearEnough, tiersHeld, validPin, MAX_WRONG_PINS, together, pairOffered } from '../lib/venue-rules'
import { pinHash } from '../lib/venue-pin'
import { VENUE_TERMS } from '../content/venue-terms'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label)
}
const src = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')

console.log('\nthe walks are the boards')
for (const [p, ids] of Object.entries(WALK_ORDER)) {
  const bad = ids.filter((id) => !WALKS.some((w) => w.id === id))
  ok(p + ': every board walk is a real walk, none twice', bad.length === 0 && new Set(ids).size === ids.length, bad.join(','))
}
ok('every Lisbon walk is on every Lisbon path somewhere (the towns walk their own first: npm run towns)', walksIn('lisbon').every((w) => Object.values(WALK_ORDER).every((ids) => ids.includes(w.id))))

console.log('\nchecking in')
const g = GEMS.find((x) => x.id === 'micro-padaria-graca')!
ok('at the door counts', nearEnough(g, { lat: g.lat, lng: g.lng, accuracy: 20 }))
ok(`${GEO_RADIUS_M + 100}m away does not`, !nearEnough(g, { lat: g.lat + (GEO_RADIUS_M + 100) / 111000, lng: g.lng, accuracy: 20 }))
ok('a phone that hardly knows where it is does not', !nearEnough(g, { lat: g.lat, lng: g.lng, accuracy: 900 }))
ok('junk does not', !nearEnough(g, { lat: NaN, lng: g.lng, accuracy: 10 }))
const migration = src('db/migrations/015_venues.sql')
ok('one check-in per learner per venue, ever', /primary key \(gem, user_id\)/.test(migration))
ok('check-ins need an account', /if \(!user\) return NextResponse\.json\(\{ error: 'signin' \}/.test(src('app/api/venues/checkin/route.ts')))
ok('the card is asked for in Portuguese', /Tem o cartão DUB\?/.test(src('components/city/CheckIn.tsx')))

console.log('\nunlocking')
const partner = { offer_first: true, offer_second: 'small_item' as const, paused: false }
ok('49 learners: nothing yet', tiersHeld(49, partner).length === 0)
ok(`${REWARD_TIERS.first}: 25% off for everyone checked in, the first fifty included`, tiersHeld(50, partner).join() === '1')
ok(`${REWARD_TIERS.second}: the venue's own choice too`, tiersHeld(150, partner).join() === '1,2')
ok('a venue that has not signed up gives nothing, whatever its count', tiersHeld(500, null).length === 0)
ok('a paused venue gives nothing', tiersHeld(500, { ...partner, paused: true }).length === 0)
ok('a monthly draw is not a voucher', tiersHeld(500, { ...partner, offer_second: 'meal_draw' }).join() === '1')
ok('the count says how far off the next reward is', /13 more and everyone gets 25% off/.test(countLine(37, partner)))
ok('and at a venue not signed up, only the count', countLine(37, null) === '37 DUB learners have said it here.')
ok('venues choose at 150 from four', Object.keys(SECOND_OFFERS).length === 4)

console.log('\nspending')
ok('a PIN is four numbers', validPin('4321') && !validPin('432') && !validPin('abcd'))
ok('a PIN is no use at another venue', pinHash('a', '4321') !== pinHash('b', '4321'))
ok(`five wrong PINs lock a voucher`, MAX_WRONG_PINS === 5 && /wrong_pins/.test(src('lib/venues.ts')))
ok('a voucher is spent once', /where id = \$\{id\} and used_at is null/.test(src('lib/venues.ts')))
ok('a voucher on screen keeps moving (a screenshot will not pass)', /voucher-live/.test(src('components/venues/Rewards.tsx')) && /toLocaleTimeString/.test(src('components/venues/Rewards.tsx')))

console.log('\nbica a dois')
{
  const v = src('lib/venues.ts')
  ok('two check-ins three hours apart are together; four are not', together('2026-11-05T10:00:00Z', '2026-11-05T13:00:00Z') && !together('2026-11-05T10:00:00Z', '2026-11-05T14:00:01Z'))
  ok('only a signed-up venue that chose it, and is not paused', pairOffered({ offer_pair: true, paused: false }) && !pairOffered({ offer_pair: true, paused: true }) && !pairOffered({ offer_pair: false, paused: false }) && !pairOffered(null))
  ok('only friends whose invitation LANDED (they said a room out loud)', /i\.landed_at is not null/.test(v))
  ok('either way round: the one who asked and the one who came', /case when fu = \$\{userId\} then tu else fu end/.test(v))
  ok('once per person per venue, by the voucher table’s own key', /\$\{PAIR_TIER\}\)\s*\n\s*on conflict \(gem, user_id, tier\) do nothing/.test(v))
  ok('the pair voucher is never one of the count tiers', !([1, 2] as number[]).includes(PAIR_TIER))
  ok('a venue opts in on its own sign-up link; off by default', /claim-pair/.test(src('components/venues/VenueClaim.tsx')) && /offer_pair boolean not null default false/.test(src('db/migrations/018_bica_a_dois.sql')))
  ok('the venue card tells a learner how it works', /checkin-pair-hint/.test(src('components/city/CheckIn.tsx')))
}

console.log('\nthe venue terms')
{
  const t = JSON.stringify(VENUE_TERMS)
  ok('the terms exist and the sign-up links them', VENUE_TERMS.length >= 10 && /href="\/venue\/terms"/.test(src('components/venues/VenueClaim.tsx')) && /VENUE_TERMS/.test(src('app/venue/terms/page.tsx')))
  ok('no money either way: DUB makes no revenue from venues (Sam, 2026-11-05)', /You pay DUB nothing/.test(t) && /DUB makes no money from venues/.test(t) && !/commission of|% of sales|monthly fee/i.test(t))
  ok('the terms say what the code does: PIN, five wrong, once each, counts only', /4-digit staff PIN/.test(t) && /Five wrong PINs/.test(t) && /used once/.test(t) && /never receive a learner/.test(t))
  ok('the terms name the rewards the code gives', t.includes(String(REWARD_TIERS.first)) && t.includes(String(REWARD_TIERS.second)) && t.includes('Bica a dois'))
  ok('the terms promise no prize draw with venues', /does not run a prize draw with venues/.test(t))
}

console.log('\nthe switches')
ok('the real holiday stays off until there is a sponsor', HOLIDAY_PRIZE === null)
ok('the draw stays off until its terms are approved', DRAW_TERMS === null)
/* The Férias corner left the board on 2026-11-10 ("it doesn't add anything"), so the holiday prize has nowhere to show on it. */
ok('the holiday is off the board, and still switched by HOLIDAY_DRAW', !/HOLIDAY_PRIZE/.test(src('components/path/Board.tsx')) && /HOLIDAY_DRAW === 'on'/.test(src('lib/venue-rules.ts')))
ok('the draw needs PRIZE_DRAW on AND terms', /!drawOn\(\) \|\| !DRAW_TERMS/.test(src('app/api/draw/route.ts')) && /!drawOn\(\) \|\| !DRAW_TERMS/.test(src('lib/venues.ts')))
ok('a draw entry is checked against the learner’s own record', /lap\.complete/.test(src('app/api/draw/route.ts')))
ok('there is a free way in (some rooms are paid)', /b\.free === true/.test(src('app/api/draw/route.ts')))
ok('a venue can only offer a draw while draws are on', /offerSecond === 'meal_draw' && !drawOn\(\)/.test(src('lib/venues.ts')))

console.log('\nthe learner’s data')
const store = src('lib/store.ts')
ok('deleting an account deletes its check-ins, vouchers and entries', ['venue_checkins', 'venue_vouchers', 'draw_entries'].every((t) => store.includes('delete from ' + t)))
ok('the admin list needs the admin key', /adminKeyValid/.test(src('app/api/admin/venues/route.ts')))

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nreal rewards, held still')
