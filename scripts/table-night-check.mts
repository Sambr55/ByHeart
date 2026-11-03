/**
 * YOUR TABLE — the host-led table (content/table-night.ts, lib/hosted.ts). Pure checks:
 * the rounds, the shared picks every phone must agree on, and the privacy promises.
 */
import { readFileSync } from 'node:fs'
import { HOUSE_RULES, QUESTIONS, ROUNDS, LIFELINES, arriveLine, houseRule, questionAt, starterFor, inviteText } from '../content/table-night'

let failed = 0
const ok = (cond: unknown, msg: string) => {
  if (!cond) {
    failed++
    console.log('✗ ' + msg)
  } else console.log('✓ ' + msg)
}

ok(ROUNDS.length === 5, 'five rounds')
ok(ROUNDS[0].id === 'arrive' && ROUNDS[ROUNDS.length - 1].id === 'toast', 'arrive first, the toast last')
ok(ROUNDS.every((r) => r.pt && r.en && r.how && r.lines.length), 'every round has a name in both languages, a how and lines')
ok(HOUSE_RULES.length === 3 && houseRule('nope').id === 'ten', 'three house rules; unknown falls back to ten minutes')
ok(LIFELINES.length >= 3, 'lifelines on every round')
ok(QUESTIONS.length >= 20 && new Set(QUESTIONS.map((q) => q.pt)).size === QUESTIONS.length, '20+ question cards, no repeats')
ok(QUESTIONS.every((q) => q.start.pt && q.start.en), 'every question has an answer starter')

/* Every phone at the table names the same starter for a round. */
const names = ['Sam', 'Rita', 'Tom', 'Ana']
ok(starterFor('abc', 2, names) === starterFor('abc', 2, [...names]), 'starter is the same on every phone')
ok(new Set([1, 2, 3, 4, 5].map((r) => starterFor('k3x9', r, names))).size > 1, 'starter moves round the table')
ok(starterFor('abc', 1, []) === null, 'nobody at the table: no starter')

/* A phone's deck: every card before any repeats. */
const deck = Array.from({ length: QUESTIONS.length }, (_, i) => questionAt('t:me', i).pt)
ok(new Set(deck).size === QUESTIONS.length, 'a phone draws every card before a repeat')
ok(questionAt('t:me', 0).pt !== questionAt('t:you', 0).pt || questionAt('t:me', 1).pt !== questionAt('t:you', 1).pt, 'two phones draw different runs')

ok(/^Boa noite!.*Sam/.test(arriveLine('Sam', '2026-11-06T20:30:00').pt), 'boa noite for an evening table, in the host’s name')
ok(/^Boa tarde!/.test(arriveLine('Sam', '2026-11-06T13:00:00').pt), 'boa tarde at lunch')
ok(/Vens\?/.test(inviteText({ host: 'Sam', place: 'X', when: 'Fri', rule: 'ten', url: 'u' })), 'the invite asks in Portuguese')

/* Friends only, and nothing about devices leaves the server. */
const sql = readFileSync('db/migrations/013_hosted_tables.sql', 'utf8').replace(/--[^\n]*/g, '')
ok(!/\b(drop|alter|truncate)\s|^\s*(delete|update)\s/im.test(sql), 'the migration only adds')
ok(!/email|phone|contact/i.test(sql), 'no email, phone number or contacts stored')
const lib = readFileSync('lib/hosted.ts', 'utf8')
const view = lib.slice(lib.indexOf('export function publicView'))
ok(!/device:|host_device:/.test(view.slice(view.indexOf('return {'))), 'the public view carries no device ids')
ok(/host_device = \$\{device\}/.test(lib), 'only the host’s device moves the round or calls it off')
const route = readFileSync('app/api/hosted/route.ts', 'utf8')
ok(!/export async function GET[\s\S]*openTables|list all/i.test(route), 'there is no list of other people’s tables')

if (failed) {
  console.log('\n' + failed + ' failed')
  process.exit(1)
}
console.log('\nYour table: all checks hold.')
