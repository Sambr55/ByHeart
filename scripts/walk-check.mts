/**
 * Every step of the walk points at a control that is really there.
 *
 *   npm run walk
 *
 * ---------------------------------------------------------------------------
 * THE ONE CLAIM. A step of the walk-through circles a REAL control, at the position that
 * control really has, and says something readable about it.
 *
 * The failure this exists to catch has no symptom in the DOM. content/walk.ts names its
 * targets by `data-testid`, and a testid that has been renamed — or a control that has
 * moved behind a drawer, or a card that only renders for a learner with something in it —
 * produces a step with no hole: a dark screen, a caption about a button nobody can see, and
 * every element present and correct in the markup. The component is written to degrade that
 * way on purpose (a circle over the wrong part of the page is worse than no circle), which
 * means nothing fails loudly. So it is checked here instead.
 *
 * FOUR THINGS, and each is a different way for the walk to be lying:
 *
 *   1. IN THE SOURCE. Every target is a testid that appears somewhere in components/, and
 *      every id and caption is distinct. Cheap, and it catches a typo without a browser.
 *   2. IN THE BROWSER, at 390x844, as a real member. Every step is walked, and each one
 *      must produce a hole whose centre is inside the control it names. That is the
 *      assertion that would have caught both faults found while building this: a step
 *      targeting `collection` put its circle on a Legend tile 400px below the rail, and a
 *      step targeting the wordmark's `<header>` cut a 185px hole over the identity card.
 *   3. THE CAPTION IS READ, not merely present. White type whose computed colour has gone
 *      to something else, or a panel rendered under its own scrim, is the exact class of
 *      bug the brief names: "a panel shipped white-on-white". Checked by composite
 *      contrast against the scrim, computed from what the browser actually resolved.
 *   4. WITH MOTION OFF. The walk teaches the product, so somebody who has turned animation
 *      off still has to be able to finish it. Run again under reducedMotion:'reduce', and
 *      it must reach the end.
 *
 * SABOTAGE-TESTED, three ways, each applied, confirmed failing, and reverted:
 *
 *   · content/walk.ts pointing `inbox-door` at `inbox-doorway` —
 *     check 1 failed, naming the step and the missing testid.
 *   · content/walk.ts pointing `boards` back at `collection` —
 *     check 2 failed: the hole centre landed 406px below the rail's own box.
 *   · the caption's `text-white` changed to `text-white/20` —
 *     check 3 failed at 2.4:1 against the 4.5 it has to clear.
 * ---------------------------------------------------------------------------
 */
import { mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, type Page } from 'playwright'
import { WALK } from '../content/walk'
import { cardFor } from '../content/legend'
import { DEFAULT_PAIR, pairId } from '../content/pairs'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const SHOTS = '.screenshots/walk'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

function walkDir(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === '.next' || n.startsWith('.')) continue
    const p = join(dir, n)
    if (statSync(p).isDirectory()) walkDir(p, out)
    else if (/\.tsx?$/.test(n)) out.push(p)
  }
  return out
}

/* ========================================================================== */
console.log('\n1. every step names a control that exists in the source\n')
/* ========================================================================== */
{
  const src = [...walkDir('components'), ...walkDir('app')]
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n')

  for (const step of WALK) {
    /*
      The literal form and the computed one both count. BottomNav builds its tabs from
      `'tab-' + t.label.toLowerCase()` and Collection builds its boards from
      `'rail-' + deck.id`, so grepping for the finished string would fail on controls that
      are demonstrably there — which would make this check refuse the correct answer.
    */
    const literal = src.includes('data-testid="' + step.target + '"')
    const built =
      /tab-/.test(step.target) ? /'tab-' \+ t\.label\.toLowerCase\(\)/.test(src)
      : /^rail-/.test(step.target) ? /'rail-' \+ deck\.id/.test(src)
      : false
    ok('step ' + step.id + ' targets ' + step.target, literal || built, 'no such data-testid')
  }

  const ids = WALK.map((s) => s.id)
  ok('every step has its own id', new Set(ids).size === ids.length, ids.join(','))
  const says = WALK.map((s) => s.say)
  ok('and its own caption', new Set(says).size === says.length)
  /*
    A caption is one sentence read in two seconds over a control somebody is looking at.
    Past about 110 characters it stops being a caption and starts being a paragraph, and
    on a 390px phone it pushes the button it sits above off the bottom.
  */
  for (const step of WALK) {
    ok(step.id + ' says it in one breath', step.say.length <= 110, step.say.length + ' chars')
    ok(step.id + ' says something', step.say.trim().length > 20, step.say)
  }
  /*
    FOUR OR FEWER: `opens` is a label for what is behind a control, not a menu.

    Written as three first, on the general principle that a list of chips under a caption
    stops being a glance at about that length — and the boards step failed it with the four
    names of the four boards, which is not a list that can be shortened without lying about
    the rail. The rule bends to the content it is describing: four is the rail, and the
    ceiling is the rail's own ceiling, which content/collection.ts sets and argues for.
  */
  for (const step of WALK) {
    if (!step.opens) continue
    ok(step.id + ' lists at most four things', step.opens.length <= 4, step.opens.join(', '))
  }
  /*
    THE WALK COVERS ALL FOUR RAILS. Sam named them — "each icon in the bottom, mid and top
    rails and the Logo tap" — and a step quietly dropped from one of them is a walk that
    still passes every assertion above while no longer doing what it was asked for.
  */
  const targets = new Set(WALK.map((s) => s.target))
  ok('the bottom rail is walked', ['tab-club', 'tab-on', 'tab-ask', 'tab-yours'].every((t) => targets.has(t)))
  ok('the mid rail is walked', targets.has('rail'))
  ok('the top rail is walked', targets.has('inbox-door') && targets.has('yours-settings'))
  ok('and the mark', targets.has('yours-wordmark'))
}

/* ========================================================================== */
/*
  A MEMBER WHO HAS BEEN WELCOMED AND NOT YET WALKED, which is the one state that shows it.

  Lifted from scripts/inbox-check.mts rather than invented, and for the reason that file
  states at length: `club_welcomed_at` alone is not a member. `clubOpen` asks for a Legend
  that has been SAID — one clean proof row per applicable frame — and a thinner record lands
  in the showcase, where Yours has an empty state and four of the nine steps have nothing to
  point at. One row per frame from cardFor, so the seed moves with the card.
*/
const legendCard = cardFor(null).map((f) => ({ frame_id: f.id, values: { x: 'y' } }))
const member = {
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  profile: { goal: 'curious' },
  inventory: {},
  chapter: 'lisbon',
  sections_completed: ['the_basics', 'top_gun', 'james_bond', 'pulp_fiction', 'bridget_jones'],
  finished_cards: ['lisbon_farmacia'],
  saved: ['lisbon_cafe'],
  liked: [],
  asked: [],
  evidence: [],
  roots_played: ['tb_greet'],
  legend: legendCard,
  club_welcomed_at: '2026-08-20T00:00:00.000Z',
  /* Never walked. This is the field the whole feature turns on. */
  club_walked_at: null,
  set_up_at: '2026-08-01T00:00:00.000Z',
  proof: legendCard.map((f, i) => ({
    pt: 'Chamo-me Sam ' + i,
    en: 'My name is Sam',
    source: 'legend',
    clean: true,
    at: String(i + 1),
    frame_id: f.frame_id,
  })),
  inbox_opened_at: null,
}

/**
 * Seed the device ONCE, not on every navigation.
 *
 * The obvious form of this is `addInitScript`, which is what every other browser check in
 * this repo uses — and it is wrong here, because addInitScript runs before EVERY document,
 * so each `goto` wiped the record and wrote the seed back. The one assertion this file
 * exists to make about state — "and never runs a second time" — was therefore testing a
 * device that had been reset between the two visits, and it failed against a product that
 * was behaving correctly. The reduced-motion run proved it by hand: the stamp was written,
 * and the next goto deleted it.
 *
 * So: navigate once to get an origin, write the record, then reload. Nothing re-runs.
 */
async function seed(page: Page) {
  await page.goto(BASE + '/profile', { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ([k, pair, v]) => {
      try {
        localStorage.clear()
        localStorage.setItem('byheart.pair', JSON.stringify(pair))
        localStorage.setItem(k as string, JSON.stringify(v))
      } catch {}
    },
    [KEY, DEFAULT_PAIR, member] as const,
  )
}

/**
 * The WCAG ratio of two pixels.
 *
 * Compositing is done in the page, on a canvas, rather than here — see the note in check 3.
 * A hand-rolled `over()` lived here and was the reason a sabotage run passed: it composited
 * correctly and was handed an ink colour the page had already flattened to opaque white, so
 * it faithfully measured the wrong number. Both pixels now come off the same canvas, in the
 * same stack the screen paints.
 */
function lum(c: [number, number, number]): number {
  const f = (v: number) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])
}
function ratio(a: [number, number, number], b: [number, number, number]) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch()
try {
  /* ====================================================================== */
  console.log('\n2. and on the screen, every hole is on the control it names\n')
  /* ====================================================================== */
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await seed(page)
  await page.goto(BASE + '/profile', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="walkthrough"]', { timeout: 15_000 }).catch(() => {})

  ok('the walk runs for a welcomed member', (await page.locator('[data-testid="walkthrough"]').count()) === 1)

  const shown = Number(
    ((await page.locator('[data-testid="walk-count"]').textContent()) ?? '0/0').split('/')[1],
  )
  /*
    EVERY STEP, not most of them. The component drops a step whose control is absent —
    which is right on an empty Yours and wrong here, where this record has everything.
    A count short of the authored list means a target has gone missing, and that is the
    headline failure this file exists for.
  */
  ok('and walks every authored step', shown === WALK.length, shown + ' of ' + WALK.length)

  for (let i = 0; i < WALK.length; i++) {
    const step = WALK[i]
    /*
      THE CENTRE OF THE HOLE IS INSIDE THE CONTROL'S OWN BOX.

      Not "a hole exists", which the dark-degrade already guarantees nothing about, and not
      "the hole contains the control", which a round hole over a 350px rail cannot do. The
      centre is the claim that survives both shapes: wherever the circle is sized to, it is
      centred on the thing the caption is about.
    */
    const probe = await page.evaluate(
      `(function(){
        var c = document.querySelector('circle[data-testid="walk-hole"]');
        var el = document.querySelector('[data-testid="${step.target}"]');
        if (!el) return { err: 'control missing' };
        if (!c) return { err: 'no hole drawn' };
        var r = el.getBoundingClientRect();
        return {
          cx: Number(c.getAttribute('cx')), cy: Number(c.getAttribute('cy')),
          rr: Number(c.getAttribute('r')),
          x: r.x, y: r.y, w: r.width, h: r.height,
        };
      })()`,
    ) as Record<string, number | string>

    if (probe.err) {
      ok('step ' + step.id + ' has a hole on ' + step.target, false, String(probe.err))
      continue
    }
    const { cx, cy, rr, x, y, w, h } = probe as Record<string, number>
    ok(
      'step ' + step.id + ' circles ' + step.target,
      cx >= x && cx <= x + w && cy >= y && cy <= y + h,
      'hole at ' + Math.round(cx) + ',' + Math.round(cy) + ' — control is ' +
        Math.round(x) + ',' + Math.round(y) + ' ' + Math.round(w) + 'x' + Math.round(h),
    )
    /*
      AND THE CIRCLE IS THE SIZE OF THE THING IT NAMES, which the centre test alone cannot
      say — and the sabotage run proved it.

      Pointing the boards step back at `collection` (a 350x912 card wrapping the whole
      library) put the hole at that card's centre, 400px below the rail, squarely on a
      Legend tile. The centre was INSIDE the control's own box, so "circles collection"
      passed while the picture was completely wrong. That is the precise failure this file
      exists to catch, and it slipped through.

      So: the hole must reach at least a third of the way across the control it names. A
      circle that small against a 912px container is not pointing at the container, it is
      pointing at whatever happens to be in the middle of it — which means the step is
      aimed at a wrapper rather than at a control, and the caption is describing something
      nobody can see highlighted.

      A THIRD rather than full containment, because a round hole over a wide row genuinely
      cannot contain it — see the radius note in components/Walkthrough.tsx. The rail is
      308px wide and 56 tall; its circle is 164, which is well over a third of 308 and
      correctly nowhere near containing a 912px card.
    */
    const reach = (rr * 2) / Math.max(w, h)
    ok(
      'and the circle is the size of ' + step.target,
      reach >= 0.33,
      'hole is ' + Math.round(reach * 100) + '% of the control — it is aimed at a wrapper, ' +
        'not a control (r=' + Math.round(rr) + ' against ' + Math.round(w) + 'x' + Math.round(h) + ')',
    )
    /*
      AND IT IS ROUND, which is the one piece of this Sam specified by itself: "The cut
      outs should be ROUND not square." Asserted on the element rather than on a class name,
      because a rect with a border-radius would pass a class check and look square at these
      sizes. A <circle> cannot be a rectangle.
    */
    ok('and it is round', rr > 0, 'r=' + Math.round(rr))

    await page.screenshot({ path: SHOTS + '/' + String(i + 1).padStart(2, '0') + '-' + step.id + '.png' })

    const nextBtn = page.locator('[data-testid="walk-next"]')
    if (!(await nextBtn.count())) break
    /*
      The LAST step navigates to the Club, so it is not clicked here — this loop is about
      the holes, and check 4 walks the sequence end to end.
    */
    if (i === WALK.length - 1) break
    await nextBtn.click()
    await page.waitForTimeout(500)
  }

  /* ====================================================================== */
  console.log('\n3. the caption is readable over the scrim it sits on\n')
  /* ====================================================================== */
  {
    /*
      READ OFF THE RENDERED PAGE, not off the source.

      "A panel shipped white-on-white" is in the brief as a thing that happened, and it is
      exactly the failure a source grep cannot see: `text-white` is in the className and
      the computed colour is whatever the cascade resolved. So the colour is taken from
      getComputedStyle, composited over the scrim's own measured alpha, and measured.

      RESOLVED THROUGH A CANVAS, for the reason the button's note below gives at length:
      a computed colour may come back as `oklab(…)` and parsing digits out of that string
      yields a number that is not a colour. The browser is asked for the pixel instead.
    */
    const read = (await page.evaluate(
      `(function(){
        var p = document.querySelector('[data-testid="walk-say"] p');
        var scrim = document.querySelector('[data-testid="walk-scrim"] rect[mask]');
        if (!p || !scrim) return { err: 'caption or scrim missing' };
        var s = getComputedStyle(p);
        var fill = scrim.getAttribute('fill');
        var alpha = Number((fill.match(/([\\d.]+)\\s*\\)$/) || [0, 0])[1]);
        var c = document.createElement('canvas'); c.width = 1; c.height = 1;
        var g = c.getContext('2d');
        /*
          THE INK IS PAINTED ONTO THE GROUND IT SITS ON, not onto a bare canvas.

          A bare canvas starts transparent and reads back as the ink's own colour
          regardless of its alpha, so text-white/20 came back as pure white and the
          sabotage run passed on a caption that is unreadable. White over 80% black over
          the palest card on Yours is the real stack, so that is what is painted.
        */
        g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1, 1);
        g.fillStyle = 'rgba(0,0,0,' + alpha + ')'; g.fillRect(0, 0, 1, 1);
        var gd = g.getImageData(0, 0, 1, 1).data;
        var ground = [gd[0], gd[1], gd[2]];
        g.fillStyle = s.color; g.fillRect(0, 0, 1, 1);
        var d = g.getImageData(0, 0, 1, 1).data;
        return {
          rgb: [d[0], d[1], d[2]], ground: ground, colour: s.color,
          size: parseFloat(s.fontSize), weight: s.fontWeight, fill: fill,
        };
      })()`,
    )) as Record<string, string | number | number[]>

    if (read.err) {
      ok('the caption is on screen', false, String(read.err))
    } else {
      const rgb = read.rgb as number[]
      const alpha = Number(String(read.fill).match(/([\d.]+)\s*\)$/)?.[1] ?? '0')
      ok('the scrim is dark enough to carry white type', alpha >= 0.7, 'alpha ' + alpha)
      /*
        THE GROUND IS THE SCRIM OVER THE PALEST THING YOURS OFFERS — white, which is the
        bg-elev card the boards sit in. Same method as the specimen palette in
        scripts/contrast-check.mts: contrast cannot be measured against a photograph, so it
        is measured against the scrim at its weakest, which is the reason the scrim exists.
      */
      const g = read.ground as number[]
      const ground: [number, number, number] = [g[0], g[1], g[2]]
      /* Both pixels came back off the same canvas, already composited. */
      const r = ratio([rgb[0], rgb[1], rgb[2]], ground)
      ok(
        'the caption clears 4.5:1 on the palest ground',
        r >= 4.5,
        r.toFixed(2) + ':1  (' + read.colour + ' over ' + Math.round(alpha * 100) + '% black on white)',
      )
      /* And it is the display size the reference shots show, not body copy. */
      ok('and it is said at display size', Number(read.size) >= 24, read.size + 'px')
    }

    /*
      THE BUTTON IS THE OTHER THING THAT WENT WHITE-ON-WHITE, so it gets the same treatment
      — and getting this right took two goes, both of them instructive.

      THE POINTER IS MOVED OFF IT FIRST. Playwright leaves the mouse where it clicked, so
      the button under it was in :hover and reported `hover:bg-white/90` rather than its
      resting colour. A control measured in a state no stationary reader is ever in is not
      a measurement of what anybody sees.

      AND THE COLOUR IS RESOLVED THROUGH A CANVAS rather than parsed out of the string.
      Modern Tailwind emits `oklab(0.999994 0.0000455678 … / 0.9)` for an alpha-modified
      colour, and a /[\d.]+/g over that yields 0.999994, 0.0000455678 — read as an RGB
      triple it is black, which is how white-on-white came back as 1.00:1 on a button that
      is genuinely 21:1. The browser already knows how to turn any colour syntax into
      pixels, so it is asked.
    */
    await page.mouse.move(5, 5)
    await page.waitForTimeout(150)
    const btn = (await page.evaluate(
      `(function(){
        var b = document.querySelector('[data-testid="walk-next"]');
        if (!b) return { err: 'no button' };
        var s = getComputedStyle(b);
        /* Paint each colour onto a 1x1 canvas and read the pixel back. Whatever syntax the
           stylesheet used, this is the number the screen gets. */
        function px(colour, under) {
          var c = document.createElement('canvas');
          c.width = 1; c.height = 1;
          var g = c.getContext('2d');
          g.fillStyle = under; g.fillRect(0, 0, 1, 1);
          g.fillStyle = colour; g.fillRect(0, 0, 1, 1);
          var d = g.getImageData(0, 0, 1, 1).data;
          return [d[0], d[1], d[2]];
        }
        /* The button sits on the scrim, so a translucent ground composites over black. */
        var bg = px(s.backgroundColor, '#000000');
        return { ink: px(s.color, 'rgb(' + bg.join(',') + ')'), bg: bg, said: b.textContent.trim() };
      })()`,
    )) as { err?: string; ink: [number, number, number]; bg: [number, number, number]; said: string }

    if (btn.err) ok('the way on is on screen', false, String(btn.err))
    else {
      const r = ratio(btn.ink, btn.bg)
      ok(
        'the way on reads against its own ground',
        r >= 4.5,
        r.toFixed(2) + ':1  "' + btn.said + '" rgb(' + btn.ink.join(',') + ') on rgb(' + btn.bg.join(',') + ')',
      )
      ok('and it says what it does', btn.said.length > 0 && btn.said.length <= 14, btn.said)
    }
  }

  /* ====================================================================== */
  console.log('\n4. and it can be finished with no animation at all\n')
  /* ====================================================================== */
  {
    /*
      THE REDUCED-MOTION RUN, and it is not a formality.

      globals.css flattens every duration to 0.001ms under prefers-reduced-motion, which is
      the right default and is also exactly how a walk-through that gates a step on a
      transition ending becomes a dead screen. This walks it to the end and requires that
      the end is reached — the walk TEACHES THE PRODUCT, and somebody who has turned motion
      off still has to learn where the buttons are.
    */
    const quiet = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    })
    const qp = await quiet.newPage()
    await seed(qp)
    await qp.goto(BASE + '/profile', { waitUntil: 'networkidle' })
    await qp.waitForSelector('[data-testid="walkthrough"]', { timeout: 15_000 }).catch(() => {})

    let steps = 0
    while (steps <= WALK.length + 2) {
      const n = qp.locator('[data-testid="walk-next"]')
      if (!(await n.count())) break
      steps++
      if (steps === 1) await qp.screenshot({ path: SHOTS + '/reduced-motion.png' })
      await n.click()
      await qp.waitForTimeout(300)
    }
    ok('motion off still reaches the end', steps === WALK.length, steps + ' of ' + WALK.length + ' steps')
    ok('and the last step lands in the Club', qp.url().endsWith('/club'), qp.url())

    /*
      AND IT DOES NOT RUN TWICE. The walk is stamped on the way out, like the welcome it
      follows, and a walk that reappears on the next visit to Yours is the single most
      annoying thing this feature could do.
    */
    await qp.goto(BASE + '/profile', { waitUntil: 'networkidle' })
    await qp.waitForTimeout(800)
    ok('and never runs a second time', (await qp.locator('[data-testid="walkthrough"]').count()) === 0)

    /* But the deliberate route still shows it, without wiping the device. */
    await qp.goto(BASE + '/walkthrough', { waitUntil: 'networkidle' })
    await qp.waitForSelector('[data-testid="walkthrough"]', { timeout: 10_000 }).catch(() => {})
    ok('/walkthrough shows it again', (await qp.locator('[data-testid="walkthrough"]').count()) === 1)
    const kept = await qp.evaluate(
      `(function(){
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf('byheart.learner') === 0) return JSON.parse(localStorage.getItem(k)).sections_completed.length;
        }
        return -1;
      })()`,
    )
    ok('without resetting the device', Number(kept) === member.sections_completed.length, String(kept))

    await quiet.close()
  }
} finally {
  await browser.close()
}

console.log('\nscreenshots in ' + SHOTS)
if (problems.length) {
  console.log('\n' + problems.length + ' problem(s):')
  problems.forEach((p) => console.log('  ' + p))
  process.exit(1)
}
console.log('every step of the walk points at a control that is really there')
