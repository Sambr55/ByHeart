/**
 * Saying it out loud, and what the product is allowed to claim about it.
 *
 *   npm run say
 *
 * Sam: "apps such as Pomospeak, Jumpspeak and Praktika.ai all have call and response ai
 * tooling. Let's look at building that into our say it cold routes and in fact make it a
 * third option on everything, listen, copy or say."
 *
 * THE MATCHING IS THE PRODUCT HERE, so most of this is about it. A recogniser hearing a
 * beginner's Portuguese is a rough instrument — it mishears accents, guesses endings, and
 * is confident either way — so the rules it is judged by have to be generous in the right
 * places and strict in exactly one.
 *
 * WHAT IS ASSERTED:
 *
 *   a correct sentence passes, including when the browser spells it badly. "so cassado"
 *      for "sou casado" is somebody saying it right into a recogniser that cannot spell,
 *      and an early version scored that ZERO — it would have told a learner who was
 *      correct that they were wrong, which is the one outcome this must never produce.
 *
 *   a wrong sentence fails. Obvious, and the thing a too-generous rule quietly loses:
 *      every threshold here was moved at least once while getting the line above to pass.
 *
 *   THE NEGATIVE IS NOT OPTIONAL. "sou casado" against "Não sou casado" scored 0.67 and
 *      passed — arithmetically a small miss, semantically the opposite sentence. Word
 *      overlap cannot see that on its own, so it is a rule of its own.
 *
 *   it degrades to nothing. Where the browser has no recognition the control is not
 *      drawn and neither is the sentence beside it — a caption telling somebody to speak,
 *      next to nothing they can press, is worse than silence.
 */
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { near, CLOSE_ENOUGH } from '../engine/listen'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { LEGEND_CARD } from '../content/legend'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

console.log('\nsaid right, heard badly, still counts\n')
{
  const passes: [string, string, string][] = [
    ['Sou casado.', 'sou casado', 'exactly'],
    ['Sou casado.', 'Sou Casado', 'with capitals'],
    ['Sou casado.', 'so cassado', 'misheard on short words'],
    ['Sou escocesa.', 'sou escossesa', 'the browser guessing a spelling'],
    ['Trabalho em Lisboa.', 'trabalhou em lisboa', 'the browser guessing a tense'],
    ['Não sou casado.', 'nao sou casado', 'accents dropped'],
    ['Tenho trinta anos.', 'tenho trinta anos por favor', 'saying more than asked'],
  ]
  for (const [want, said, why] of passes) {
    const s = near(said, want)
    ok('passes ' + why, s >= CLOSE_ENOUGH, s.toFixed(2) + '  "' + said + '"')
  }
}

console.log('\nand something else does not\n')
{
  const fails: [string, string, string][] = [
    ['Sou casado.', 'bom dia', 'a different sentence'],
    ['Sim.', 'nao', 'the opposite one-word answer'],
    /*
      THE ONE THAT MATTERS MOST. Dropping the negative is a small arithmetic miss and a
      complete reversal of meaning, and it passed at 0.67 before it was made a rule.
    */
    ['Não sou casado.', 'sou casado', 'the negative dropped'],
    ['Sou casado.', '', 'silence'],
  ]
  for (const [want, said, why] of fails) {
    const s = near(said, want)
    ok('fails on ' + why, s < CLOSE_ENOUGH, s.toFixed(2) + '  "' + said + '"')
  }
}

/*
  A RESULT THAT ARRIVES LATE IS STILL A RESULT.

  Sam: "when I speak into the phone there is no resolution. I say something and there is
  no response."

  `onend` fires on every session close, including the one that follows a good transcript,
  and it settled the promise with null. The two events have no guaranteed order — so on any
  build where the session closes as the transcript is delivered, a correct answer was
  thrown away and the control fell back to idle having heard the learner perfectly.

  Asserted on the settle logic rather than through a browser, because the ordering is the
  whole bug and no headless run reproduces a real recogniser's timing. Both orders, and the
  late arrival that the grace window exists for.
*/
console.log('\na result is not lost to the session closing\n')
{
  /* The shape of listenFor's promise, reduced to what decides the answer. */
  const settle = (events: string[], lateResultMs = -1) => {
    let settled = false
    let held: string | null = null
    let out: string | null = 'never settled'
    const done = (h: string | null) => {
      if (settled) return
      settled = true
      out = h
    }
    let waiting = false
    for (const e of events) {
      if (e === 'result') {
        held = 'HEARD'
        done(held)
      }
      if (e === 'end') {
        if (held) done(held)
        else waiting = true
      }
      if (e === 'error') done(held)
    }
    /* The transcript lands inside the grace window rather than after it. */
    if (waiting && lateResultMs >= 0 && lateResultMs <= 250) {
      held = 'HEARD'
      done(held)
    }
    if (!settled) done(held)
    return out
  }

  ok('a result before the close is kept', settle(['result', 'end']) === 'HEARD', String(settle(['result', 'end'])))
  ok(
    'a result just after the close is kept',
    settle(['end'], 40) === 'HEARD',
    String(settle(['end'], 40)),
  )
  ok('and silence still answers', settle(['end'], -1) === null, String(settle(['end'], -1)))
  ok(
    'an error after a result keeps the result',
    settle(['result', 'error']) === 'HEARD',
    String(settle(['result', 'error'])),
  )

  /* And the source says so, because the logic above is a model of it rather than the thing. */
  const src = readFileSync('engine/listen.ts', 'utf8')
  ok('onend does not discard a held result', /rec\.onend = \(\) => \{[\s\S]{0,200}if \(held\) return done\(held\)/.test(src))
  ok('and gives a late one a window', /window\.setTimeout\(\(\) => done\(held\), 250\)/.test(src))
}

console.log('\nthe control is on the routes that ask for it\n')
const browser = await chromium.launch()
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/')
  await page.evaluate(
    ([k, pair, frames]) => {
      localStorage.setItem('byheart.pair', JSON.stringify(pair))
      localStorage.setItem(
        k as string,
        JSON.stringify({
          version: 1,
          deal_accepted_at: '2026-08-01T00:00:00.000Z',
          set_up_at: '2026-08-01T00:00:00.000Z',
          chapter: 'lisbon',
          purpose: 'visiting',
          display_name: 'Sam',
          profile: { goal: 'trip', gender: 'm', nationality: 'ingles', from_place: 'London' },
          proof: [],
          inventory: {},
          roots_played: [],
          sections_completed: ['the_basics', 'top_gun'],
          legend: (frames as string[]).map((id) => ({ frame_id: id, values: { x: 'y' }, at: '1' })),
          legend_prompt: 'accepted',
          club_welcomed_at: '2026-08-20T00:00:00.000Z',
        }),
      )
    },
    [KEY, DEFAULT_PAIR, LEGEND_CARD.map((f) => f.id)] as const,
  )
  await page.goto(BASE + '/revise?kind=frame&id=name')
  await page.waitForTimeout(2200)
  const n = (await page.evaluate(`document.querySelectorAll('[data-testid="say-it"]').length`)) as number
  ok('revision offers it', n > 0, String(n))
  const text = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
  ok('and says what to do', /say it out loud/i.test(text))
  await ctx.close()
}

console.log('\nand where the browser cannot listen, nothing is offered\n')
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  /*
    GENUINELY ABSENT, not stubbed. Headless Chromium ships the API, so a first version of
    this "tested" the unsupported path against a browser that supports it and reported a
    pass either way.
  */
  await ctx.addInitScript(
    `Object.defineProperty(window,'SpeechRecognition',{get:()=>undefined,configurable:true});
     Object.defineProperty(window,'webkitSpeechRecognition',{get:()=>undefined,configurable:true})`,
  )
  const page = await ctx.newPage()
  await page.goto(BASE + '/')
  await page.evaluate(
    ([k, pair]) => {
      localStorage.setItem('byheart.pair', JSON.stringify(pair))
      localStorage.setItem(
        k as string,
        JSON.stringify({
          version: 1,
          deal_accepted_at: '2026-08-01T00:00:00.000Z',
          set_up_at: '2026-08-01T00:00:00.000Z',
          chapter: 'lisbon',
          purpose: 'visiting',
          display_name: 'Sam',
          profile: { goal: 'trip', gender: 'm' },
          proof: [],
          inventory: {},
          roots_played: [],
          sections_completed: ['the_basics', 'top_gun'],
          legend: [{ frame_id: 'name', values: { name: 'Sam' }, at: '1' }],
          club_welcomed_at: '2026-08-20T00:00:00.000Z',
        }),
      )
    },
    [KEY, DEFAULT_PAIR] as const,
  )
  await page.goto(BASE + '/revise?kind=frame&id=name')
  await page.waitForTimeout(2200)
  const n = (await page.evaluate(`document.querySelectorAll('[data-testid="say-it"]').length`)) as number
  ok('no control is drawn', n === 0, String(n))
  const text = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
  /* And nothing tells them to speak, which is the half a first version left behind. */
  ok('and nothing asks them to speak', !/say it out loud/i.test(text))
  /* The tile build is still there, so the screen still works. */
  ok('the build is still offered', /tap the pieces/i.test(text))
  await ctx.close()
}

await browser.close()

console.log('')
if (problems.length) {
  console.log('✗ ' + problems.length + ' problem' + (problems.length === 1 ? '' : 's'))
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
}
console.log('it hears a right answer through a bad transcript, and refuses a wrong one')
