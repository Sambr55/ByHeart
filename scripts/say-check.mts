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
  /*
    THE MICROPHONE IS EARNED NOW, NOT GIVEN. Sam: "reverse these so they do the word picker
    first, when that is successful it reveals the Say it loud mechanic."

    So this asserts the opposite of what it used to: nothing to say into on arrival, and
    nothing on screen TELLING somebody to speak — an instruction to do something that is
    not yet possible is the same fault as offering a control that fails when pressed, which
    is the rule the no-recognition case below exists to keep.
  */
  ok('the picker comes first, with no microphone yet', n === 0, String(n))
  const text = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
  ok('and nothing asks for speech before it is possible', !/say it out loud/i.test(text))
  ok('the picker is there to be solved', Boolean(await page.$('[data-testid="tile-pool"]')))

  /*
    AND SOLVING IT HANDS OVER THE MICROPHONE WITHOUT TAKING ANYTHING AWAY.

    Sam: "but dont drop the word picker or copy / listen." Re-queried each tap because the
    pool re-renders — held handles go stale, which is how a first version of this test
    "solved" a three-word sentence with one tap and concluded the reveal was broken.
  */
  for (let k = 0; k < 12; k++) {
    const btns = await page.$$('[data-testid="tile-pool"] button')
    if (!btns.length) break
    await btns[0].click().catch(() => {})
    await page.waitForTimeout(180)
  }
  await page.waitForTimeout(800)
  const after = (await page.evaluate(`(() => {
    const mic = document.querySelector('[data-testid="say-it"]')
    return {
      mic: mic ? Math.round(mic.getBoundingClientRect().width) : 0,
      line: !!document.querySelector('[data-testid="tile-line"]'),
      listen: !!document.querySelector('[data-testid="audio"]'),
      copy: !!document.querySelector('[data-testid="copy-pt"]'),
      arrow: !!document.querySelector('[data-testid="say-next"]'),
      cta: !!document.querySelector('[data-testid="continue"]'),
    }
  })()`)) as { mic: number; line: boolean; listen: boolean; copy: boolean; arrow: boolean; cta: boolean }

  ok('solving it reveals the microphone', after.mic >= 80, after.mic + 'px')
  ok('and the picker is still there', after.line)
  ok('and listen and copy came with it', after.listen && after.copy, after.listen + '/' + after.copy)
  ok('the way on is the arrow, not a CONTINUE bar', after.arrow && !after.cta, 'arrow ' + after.arrow + ', cta ' + after.cta)
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
    /*
      WHAT IT "HEARS" IS SET BY THE TEST, never scraped off the page.

      A first version read [data-testid="say-answer"] — fine while nothing displayed the
      answer, and wrong the moment the picker started revealing it: every attempt became a
      perfect success, which silently advanced the card and made the miss assertions look
      like a broken microphone. The test says what was said.
    */
    FakeRec.prototype.start = function () {
      var self = this
      var said = window.__SAY || 'zzz nothing like it at all'
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

  /*
    No microphone on arrival any more — it is revealed by the picker, which the block above
    walks in full. What matters here is that the picker IS the first thing offered.
  */
  ok('the picker is the first thing offered', Boolean(await page.$('[data-testid="tile-pool"]')))

  /*
    THE SENTENCE IS NOT GIVEN AWAY. A revision asks whether you still have it, so there is
    no reveal — the tiles are the way through without speaking, and they teach.
  */
  ok('no reveal on a revision', !(await page.$('[data-testid="say-show"]')))
  ok('and the tiles are still the fallback', Boolean(await page.$('[data-testid="tile-pool"]')))

  /*
    THE MISS THAT USED TO BE SILENT — after earning the microphone, which is the reversal.
    Re-queried each tap because the pool re-renders; a held handle goes stale.
  */
  for (let k = 0; k < 12; k++) {
    const btns = await page.$$('[data-testid="tile-pool"] button')
    if (!btns.length) break
    await btns[0].click().catch(() => {})
    await page.waitForTimeout(180)
  }
  await page.waitForTimeout(800)
  await page.click('[data-testid="say-it"]')
  await page.waitForTimeout(900)
  const panel = ((await page.textContent('[data-testid="say-heard"]').catch(() => '')) ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  ok('a miss says something now', panel.length > 0, panel || 'nothing on screen')
  ok('and shows what it heard', /zzz/.test(panel), panel)

  /*
    THE THIRD GO AND THE FIFTH, which had nothing between them. Sam: "as soon as they get
    to their third attempt they need some encouraging text, and if they get to five fails -
    never mind we'll come back to this one later."

    Driven by missing on purpose: the fake reads the revealed answer, and nothing is
    revealed on a revision, so every attempt here is a genuine miss.
  */
  await page.click('[data-testid="say-it"]')
  await page.waitForTimeout(800)
  await page.click('[data-testid="say-it"]')
  await page.waitForTimeout(800)
  const third = ((await page.textContent('[data-testid="say-stubborn"]').catch(() => '')) ?? '').replace(/\s+/g, ' ')
  ok('the third go is encouraged', third.length > 0, third.slice(0, 48) || 'nothing')
  ok('and it blames the instrument, not the learner', /microphone/i.test(third), third.slice(0, 48))

  for (let k = 0; k < 2; k++) {
    await page.click('[data-testid="say-it"]')
    await page.waitForTimeout(800)
  }
  const fifth = ((await page.textContent('[data-testid="say-enough"]').catch(() => '')) ?? '').replace(/\s+/g, ' ')
  ok('five goes is let go of', /never mind/i.test(fifth), fifth.slice(0, 52) || 'nothing')
  /* And the encouragement gives way rather than stacking with it. */
  ok('and the third-go note steps aside', !(await page.$('[data-testid="say-stubborn"]')))

  await ctx.close()
}

/*
  AND THE LESSON'S OWN COLD BEAT, which had no microphone at all.

  Sam: "now do the transfer prompt in journey."

  THE SCREEN PROMISED THIS IN WORDS. RELEASE.why says "the next sentence is yours, with
  nothing on screen to copy from" — and the beat then offered tiles, which are something
  on screen to copy from. It is the beat that moves the ladder and writes a line to the
  proof card, and Journey.tsx imported no microphone on any beat: the file somebody spends
  nearly all their time in had no say-it-aloud route anywhere.

  WHAT IS ASSERTED, walked in a real lesson rather than seeded:

    the question is English and is NOT dressed as Portuguese. The Legend asks in
       Portuguese and gets the accent, the `pt` face and a listen button; this asks "Come
       with me." and must get none of them — a listen button here would hand slugFor an
       English string and ask the speech engine to read it in a Portuguese voice.

    a miss leaves the beat alone. The tiles must still be there and nothing may be
       recorded: this is the one beat where a false positive would mark a root played and
       move the ladder on a sentence nobody said.

    a success records CLEAN proof and marks the root played. Clean because a sentence said
       into a microphone with no answer on screen has nothing to copy from by definition —
       unlike the build below it, where `clean` means first attempt and no help.
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
      var said = window.__SAY || 'zzz nothing like it at all'
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
    ([k]) =>
      localStorage.setItem(
        k as string,
        JSON.stringify({
          version: 1,
          deal_accepted_at: '2026-08-01T00:00:00.000Z',
          proof: [],
          inventory: {},
          roots_played: [],
          sections_completed: [],
          legend: [],
          evidence: [],
        }),
      ),
    [KEY] as const,
  )
  await page.goto(BASE + '/vibes')
  await page.waitForTimeout(1600)
  /* Through set-up: why, a name (required — see the consent note in SetUp), then commit. */
  await page.click('[data-testid="setup-why-moving"]').catch(() => {})
  await page.waitForTimeout(800)
  await page.fill('[data-testid="setup-who"]', 'Sam').catch(() => {})
  await page.click('[data-testid="consent-tick"]').catch(() => {})
  await page.click('[data-testid="setup-commit"]').catch(() => {})
  await page.waitForTimeout(1600)

  /* Forward to the beat that has both a question and a build: the transfer prompt. */
  let reached = false
  for (let i = 0; i < 60; i++) {
    if ((await page.$('[data-testid="say-ask"]')) && (await page.$('[data-testid="tile-pool"]'))) {
      reached = true
      break
    }
    const choice = await page.$('[data-testid^="warmup-"]')
    if (choice) {
      await choice.click().catch(() => {})
      await page.waitForTimeout(800)
      continue
    }
    const cont = await page.$('[data-testid="continue"]:not([disabled])')
    if (cont) {
      await cont.click().catch(() => {})
      await page.waitForTimeout(600)
      continue
    }
    /* A build beat before this one: tap it out to get past. */
    const tiles = await page.$$('[data-testid="tile-pool"] button')
    if (tiles.length) {
      for (const t of tiles) {
        await t.click().catch(() => {})
        await page.waitForTimeout(130)
      }
      continue
    }
    await page.waitForTimeout(500)
  }
  ok('the lesson reaches a sayable release', reached)

  if (reached) {
    const look = (await page.evaluate(`(() => {
      const e = document.querySelector('[data-testid="say-ask"]')
      const cs = getComputedStyle(e)
      return {
        px: parseFloat(cs.fontSize),
        colour: cs.color,
        listen: !!(e.parentElement && e.parentElement.querySelector('[data-testid="audio"]')),
        mic: (() => { const m = document.querySelector('[data-testid="say-it"]'); return m ? Math.round(m.getBoundingClientRect().width) : 0 })(),
      }
    })()`)) as { px: number; colour: string; listen: boolean; mic: number }

    ok('it asks at the display size', look.px >= 28, Math.round(look.px) + 'px')
    /*
      THE PICKER FIRST HERE TOO, so there is no microphone until it is solved. That is the
      reversal — see buildFirst in components/SayItCard.tsx.
    */
    ok('no microphone before the picker is solved', look.mic === 0, look.mic + 'px')
    /*
      THE ENGLISH CUE IS NOT DRESSED AS PORTUGUESE. --accent is the Portuguese colour
      everywhere in this product, and the cue is the thing being taken AWAY.
    */
    ok('the English cue is not in the Portuguese colour', look.colour !== 'rgb(31, 93, 140)', look.colour)
    ok('and has no listen button, having no audio', !look.listen)

    /* Earn the microphone: solve the picker, re-querying each tap as the pool re-renders. */
    for (let k = 0; k < 12; k++) {
      const btns = await page.$$('[data-testid="tile-pool"] button')
      if (!btns.length) break
      await btns[0].click().catch(() => {})
      await page.waitForTimeout(180)
    }
    await page.waitForTimeout(800)
    const revealed = (await page.evaluate(
      `(() => { const m = document.querySelector('[data-testid="say-it"]'); return m ? Math.round(m.getBoundingClientRect().width) : 0 })()`,
    )) as number
    ok('solving it reveals the microphone', revealed >= 80, revealed + 'px')
    ok('and the picker stays on screen', Boolean(await page.$('[data-testid="tile-line"]')))

    /* A MISS CHANGES NOTHING BUT THE PANEL. */
    await page.evaluate(() => {
      ;(window as unknown as { __SAY: string }).__SAY = 'zzz nothing like it at all'
    })
    await page.click('[data-testid="say-it"]')
    await page.waitForTimeout(900)
    const missPanel = ((await page.textContent('[data-testid="say-heard"]').catch(() => '')) ?? '')
      .replace(/\s+/g, ' ')
      .trim()
    ok('a miss is marked', missPanel.length > 0, missPanel || 'nothing on screen')
    ok('and the picker is still there', Boolean(await page.$('[data-testid="tile-line"]')))
    /*
      A MISS DOES NOT MOVE THE BEAT ON, which is what matters here now.

      This used to assert that a miss recorded NOTHING, and that was right while the
      microphone came first — nothing had happened yet. Under the reversal the picker is
      solved before the microphone exists, so a proof row and a played root are already
      there and correctly so: the learner did build the sentence. What a miss must not do
      is add a SECOND row or carry the card away, so that is what is measured.
    */
    const afterMiss = (await page.evaluate(
      ([k]) => {
        const st = JSON.parse(localStorage.getItem(k as string) || '{}')
        return { proof: (st.proof || []).length, step: document.body.innerText.slice(0, 80) }
      },
      [KEY] as const,
    )) as { proof: number; step: string }
    ok('a miss adds no second row', afterMiss.proof === 1, String(afterMiss.proof))
    ok('and does not carry the card away', Boolean(await page.$('[data-testid="say-it"]')))

    /* AND A SUCCESS MOVES THE LADDER. */
    const want = (await page.evaluate(
      `(() => { const e = document.querySelector('[data-testid="say-ask"]'); return e ? e.textContent : '' })()`,
    )) as string
    void want
    /*
      Fed the answer the beat is asking for, taken from the tiles — the pool holds exactly
      the words of it, so joining them in any order is close enough for `near`, which
      scores by word overlap rather than sequence.
    */
    const built = (await page.evaluate(
      `(() => { const l = document.querySelector('[data-testid="tile-line"]'); return l ? l.innerText.replace(/\\s+/g, ' ').trim() : '' })()`,
    )) as string
    await page.evaluate((w) => {
      ;(window as unknown as { __SAY: string }).__SAY = w
    }, built)
    await page.click('[data-testid="say-it"]')
    await page.waitForTimeout(1200)
    const hit = ((await page.textContent('[data-testid="say-heard"]').catch(() => '')) ?? '').replace(
      /\s+/g,
      ' ',
    )
    ok('saying it is marked right', /THAT IS IT/.test(hit), hit)

    const after = (await page.evaluate(
      ([k]) => {
        const st = JSON.parse(localStorage.getItem(k as string) || '{}')
        return {
          proof: (st.proof || []).map((p: { pt: string; source: string; clean: boolean }) => p.source + '/' + p.clean),
          played: (st.roots_played || []).length,
        }
      },
      [KEY] as const,
    )) as { proof: string[]; played: number }
    ok('and records a clean release', after.proof.includes('release/true'), JSON.stringify(after.proof))
    ok('and the root counts as played', after.played > 0, String(after.played))
    /*
      THE WAY ON IS THE ARROW. Sam: "removing continue CTA's." And it goes green and nudges
      while the two seconds run, which is the override signal — see the dock in SayItCard.
    */
    const onward = (await page.evaluate(`(() => {
      const a = document.querySelector('[data-testid="say-next"]')
      return {
        there: !!a,
        green: a ? getComputedStyle(a).backgroundColor : '',
        nudging: !!document.querySelector('[data-testid="say-next"] .nudge-right'),
        cta: !!document.querySelector('[data-testid="continue"]'),
      }
    })()`)) as { there: boolean; green: string; nudging: boolean; cta: boolean }
    ok('the arrow is the way on', onward.there && !onward.cta, 'arrow ' + onward.there + ', cta ' + onward.cta)
    ok('it goes green on a success', onward.green === 'rgb(44, 107, 74)', onward.green)
    ok('and nudges while the clock runs', onward.nudging)
  }

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
