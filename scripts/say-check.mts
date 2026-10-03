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
import { near, bandFor, missedWords, CLOSE_ENOUGH } from '../engine/listen'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { LEGEND_CARD } from '../content/legend'
import { ROOTS } from '../content/roots'

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

/*
  THE GRADED FEEDBACK, and the one way it could lie.

  Sam: "Is there any way we can get the feedback a bit more advanced on the audio? At the
  moment it says just not quite." So "not quite" became four bands and a list of the words
  to aim at — and both are derived from the same score `near` already returned, which means
  neither may contradict it.

  THE RULE THAT MATTERS: a sentence that PASSES must never be told a word is missing. The
  bands and the word list walk the target separately from `near`, so a drift between them
  would have the product congratulating somebody and then pointing at a word in the same
  panel. Asserted on the exact transcripts the matcher was built around.
*/
{
  const band = (said: string, want: string) =>
    bandFor({ said, close: near(said, want) >= CLOSE_ENOUGH, score: near(said, want) })

  ok("a pass is 'got'", band('sou casado', 'Sou casado') === 'got')
  ok('a badly spelled pass is still a pass', band('so cassado', 'Sou casado') === 'got')
  ok('nothing heard is never graded', band('', 'Sou casado') === 'no')

  /*
    THE MIDDLE BANDS EXIST, which is the whole point of the change. A long sentence with
    one word gone must not land in the same bucket as an unrelated sentence — if both come
    back 'no' then nothing has been added and the copy is lying about being more advanced.
  */
  const long = 'Chamo-me Sam e sou de Inglaterra'
  /*
    BOTH MIDDLE BANDS, AT THE SCORES THEY ACTUALLY SIT AT. The first draft of this
    assertion used a transcript missing two of seven words and expected a middle band —
    it scores 0.71 and PASSES, because `near` divides by the expected words and is
    generous on purpose. The test was wrong about the matcher rather than the other way
    round, which is the useful kind of failure: these are measured, not guessed.
  */
  ok('most of a long sentence is nearly', band('chamo-me Sam e', long) === 'nearly', band('chamo-me Sam e', long))
  ok('a fragment of one is some of it', band('chamo-me', long) === 'some', band('chamo-me', long))
  ok('and something unrelated is neither', band('bom dia', long) === 'no')
  /*
    AND THE BANDS DO NOT OVERLAP THE PASS MARK. Nothing at or above CLOSE_ENOUGH may come
    back as a miss — that would be the panel disagreeing with the proof row it just wrote.
  */
  ok(
    'no band contradicts the pass mark',
    ['chamo-me Sam e', 'chamo-me', 'bom dia', ''].every((t) =>
      near(t, long) >= CLOSE_ENOUGH ? band(t, long) === 'got' : band(t, long) !== 'got',
    ),
  )

  /* The words to aim at are the ones that went missing, and only those. */
  ok(
    'it names the missing word',
    missedWords('sou de', 'Sou de Inglaterra').join(' ') === 'Inglaterra',
    missedWords('sou de', 'Sou de Inglaterra').join(' '),
  )
  /*
    AND IT FORGIVES WHAT `near` FORGIVES. "so cassado" is a pass, so there is nothing to
    aim at — a word list here would contradict the verdict in the same panel.
  */
  ok('a forgiven transcript has nothing to aim at', missedWords('so cassado', 'Sou casado').length === 0)
  /* Punctuation is not a word somebody can aim at. */
  ok('no punctuation in the list', !/[,.?]/.test(missedWords('sou', 'Sou casado, sim').join('')))

  /*
    THE FIVE-GO RULE, asserted against the source because it is a product promise rather
    than a function. Sam: "after 5 goes they need to be given a we'll try again later
    message, but not block the legend opening."

    The number and the NOT-BLOCKING are both checked: the flag writes to `rough`, and
    nothing in the door's own reckoning may read it. That second half is the one that would
    break silently — a later change that gated the Club on rough sentences would turn a
    browser speech scorer into a lock.
  */
  const legend = readFileSync('components/Legend.tsx', 'utf8')
  ok('five goes is the mark', /const ENOUGH_GOES = 5/.test(legend))
  ok('and it sets the sentence down', /markRough\(\{/.test(legend))
  ok('landing it clears the flag', /clearRough\(answer\)/.test(legend))
  const learnerSrc = readFileSync('engine/learner.ts', 'utf8')
  ok(
    'nothing gates on a rough sentence',
    !/\brough\b[^\n]*(toGo|clubOpen|legendOpen|canOpen)/.test(learnerSrc) &&
      !/(toGo|clubOpen|legendOpen|canOpen)[^\n]*\brough\b/.test(learnerSrc),
  )
  /* And the success sound is the one in engine/tap, not a second voice on the button. */
  const say = readFileSync('components/SayButton.tsx', 'utf8')
  ok('the ping comes from engine/tap', /from '@\/engine\/tap'/.test(say) && /if \(h\.close\) ping\(\)/.test(say))
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

/*
  AND REVISION MARKS THE WORK, which it did not.

  Sam: "do revise first." The other cold beat asked its question at caption size, put a
  48px microphone beside a line of small grey text, and marked a miss with
  `if (!h.close) return` — so saying something wrong changed NOTHING on screen. That is the
  exact fault reported on the run-through ("the say it loud gives no indication it is
  listening or has heard or has any feedback"), still live on the same act a day after
  being fixed there.

  THE MISS IS WHAT IS ASSERTED, deliberately. A success was always visible — it advanced
  the card — so the regression that matters is the silent failure. The fake recogniser
  reads the revealed answer off the page, and revision does not reveal it, so what it hands
  back is gibberish: exactly the case that used to produce nothing.

  Also asserted: the question is at the display size and the card is its own surface. Those
  were the two halves of "much of our text is too small", and a token change is all it
  takes to lose them.
*/
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(`
    function FakeRec() {
      this.lang = ''
      this.continuous = false
      this.interimResults = false
      this.maxAlternatives = 1
      this.onresult = null
      this.onerror = null
      this.onend = null
    }
    FakeRec.prototype.start = function () {
      var self = this
      var el = document.querySelector('[data-testid="say-answer"]')
      var said = el ? el.textContent : 'zzz nothing like it at all'
      setTimeout(function () {
        if (self.onresult) self.onresult({ results: { length: 1, 0: { length: 1, 0: { transcript: said } } } })
        if (self.onend) self.onend()
      }, 50)
    }
    FakeRec.prototype.stop = function () {}
    window.SpeechRecognition = FakeRec
    window.webkitSpeechRecognition = FakeRec
  `)
  const page = await ctx.newPage()
  await page.goto(BASE)
  await page.evaluate(
    ([k, blob]) => localStorage.setItem(k as string, JSON.stringify(blob)),
    [
      KEY,
      {
        version: 1,
        learner_id: 'say',
        created_at: '2026-08-20T00:00:00.000Z',
        pair: DEFAULT_PAIR,
        deal_accepted_at: '2026-08-01T00:00:00.000Z',
        inventory: Object.fromEntries(
          ROOTS.flatMap((r) => r.extracts).map((e) => [e.id, 'strong']),
        ),
      },
    ] as const,
  )
  await page.goto(BASE + '/revise?kind=vibe&id=the_basics')
  await page.waitForTimeout(1800)

  const askPx = (await page.evaluate(
    `(() => { const e = document.querySelector('[data-testid="say-ask"]'); return e ? parseFloat(getComputedStyle(e).fontSize) : 0 })()`,
  )) as number
  ok('revision asks at the display size', askPx >= 28, Math.round(askPx) + 'px')

  const lifted = (await page.evaluate(`(() => {
    const e = document.querySelector('[data-testid="say-ask"]')
    const card = e && e.closest('[class*="bg-bg-elev"]')
    if (!card) return null
    const lum = (c) => {
      const [r, g, b] = (c.match(/\\d+/g) || []).slice(0, 3).map(Number)
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const bg = getComputedStyle(card).backgroundColor
    const page = getComputedStyle(document.querySelector('.app-frame') || document.body).backgroundColor
    return { bg, page, lifted: lum(bg) > lum(page) }
  })()`)) as { bg: string; page: string; lifted: boolean } | null
  ok('on its own card, lifted off the ground', Boolean(lifted?.lifted), lifted ? lifted.bg + ' on ' + lifted.page : 'no card')

  const mic = (await page.evaluate(
    `(() => { const e = document.querySelector('[data-testid="say-it"]'); return e ? Math.round(e.getBoundingClientRect().width) : 0 })()`,
  )) as number
  ok('the microphone is the control, not an ornament', mic >= 80, mic + 'px')

  /*
    THE SENTENCE IS NOT GIVEN AWAY. A revision asks whether you still have it, so there is
    no reveal — the tiles are the way through without speaking, and they teach.
  */
  ok('no reveal on a revision', !(await page.$('[data-testid="say-show"]')))
  ok('and the tiles are still the fallback', Boolean(await page.$('[data-testid="tile-pool"]')))

  /* THE MISS THAT USED TO BE SILENT. */
  await page.click('[data-testid="say-it"]')
  await page.waitForTimeout(900)
  const panel = ((await page.textContent('[data-testid="say-heard"]').catch(() => '')) ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  ok('a miss says something now', panel.length > 0, panel || 'nothing on screen')
  ok('and shows what it heard', /zzz/.test(panel), panel)

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
