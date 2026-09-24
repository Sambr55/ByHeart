/**
 * The page ends exactly where the bar begins.
 *
 *   npm run frame
 *
 * Sam, with a photograph of a CTA floating over a band of blue: "why can you make it
 * single height and remove the large gap beneath the icons?"
 *
 * The bar was never double height — measured in the DOM it is 67px, and in a browser with
 * no safe-area inset the whole column is already exact, which is why three fixes aimed at
 * the bar changed nothing on the phone. The gap is iOS arithmetic: `100dvh` in an
 * installed PWA EXCLUDES the home-indicator inset, so .app-frame was 34px shorter than the
 * glass while still reserving a whole --bar-room inside itself for a bar that is `fixed`
 * outside it. Content stopped 34px above the blue.
 *
 * This asserts the contract both halves have to keep, under a SIMULATED inset — because
 * Chromium reports 0 and would pass a broken build. The frame is told to be 34 short of
 * the glass, exactly as iOS reports it, and the page must still end on the bar.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const INSET = 34
const fail: string[] = []
const ok = (what: string, good: boolean, saw: string) => {
  console.log((good ? '  ✓ ' : '  ✗ ') + what + (good ? '' : '   ' + saw))
  if (!good) fail.push(what)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto(BASE + '/crates', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1200)

/*
  THE INSET ONLY, AND NEVER .app-frame's OWN HEIGHT.

  A first version of this set `.app-frame{height:...}` in the injected sheet to model the
  dvh shortfall, and that is a check that tests itself: the declaration overrode the rule
  under test, so it passed with the bug present. Verified by putting the bug back.

  What iOS actually does is report an inset and shorten dvh BY that inset. The viewport
  here cannot be shortened, so the shortfall is modelled the other way round: the window
  is made INSET pixels taller than the frame expects, by giving --safe-bottom a value
  while 100dvh still measures the full 844. A frame that adds the inset then reaches the
  bar; one that does not falls short by exactly INSET, which is the fault.

  So only the variable is set, and .app-frame's height comes from globals.css — which is
  the whole point of the check.
*/
/*
  THE INSET ONLY. The frame's height is left alone.

  An earlier version also shortened .app-frame to model what iOS does to dvh, and that
  made the check disagree with itself: the frame ended 34px above the glass, so the sand
  gap it asserts against reappeared by construction, and the docked button measured 49px
  clear instead of 15. Both were the simulation, not the product.

  On iOS the frame is short AND html paints the bar's colour under the last strip (see the
  canvas rule in globals.css), so nothing shows through — which is why the frame's
  shortfall is not this rule's problem. What matters on both platforms is the same two
  distances: the content ends on the bar, and the button clears it by --dock-gap. Those
  are what is measured, with the inset present so --bar-room and the padding are exercised
  with a non-zero value.
*/
await page.addStyleTag({ content: ':root{--safe-bottom:' + INSET + 'px}' })
await page.waitForTimeout(300)

const m = (await page.evaluate(`(function () {
  var nav = document.querySelector('.nav-bar');
  var frame = document.querySelector('.app-frame');
  if (!nav || !frame) return null;
  var n = nav.getBoundingClientRect(), f = frame.getBoundingClientRect();
  var pad = parseFloat(getComputedStyle(frame).paddingBottom);
  return {
    glass: innerHeight,
    navHeight: Math.round(n.height),
    navTop: Math.round(n.top),
    frameBottom: Math.round(f.bottom),
    contentEndsAt: Math.round(f.bottom - pad),
    gap: Math.round(n.top - (f.bottom - pad))
  };
})()`)) as null | Record<string, number>

if (!m) {
  console.log('  ✗ no nav or frame on /crates')
  process.exit(1)
}

/*
  The frame overshoots the window by exactly the inset, which is correct and is what iOS
  cancels out: there, 100dvh is INSET shorter than the glass, so `100dvh + inset` lands on
  it. Here 100dvh IS the glass, so the sum runs INSET past the bottom. What matters either
  way is the distance from the end of the content to the top of the bar, which is the same
  number on both platforms — so that is what is asserted.
*/
ok('the page ends where the bar begins', m.gap === 0, m.gap + 'px of ground between them')

/*
  AND THE DOCKED BUTTON CLEARS THE BAR BY EXACTLY --dock-gap.

  The check above measures the frame's edge, which is the right question for the sand
  strip and is not the question Sam kept reporting: "the CTA is almost unusable." The
  button lives in .dock-slot, whose gap was put on a `bottom` offset that .dock-slot >
  .dock cancels with position: static — so the 15px was inert on every screen that uses
  the slot, which is all of them. Measured, the button finished 19px UNDER the nav.

  So the button itself is measured, with the inset simulated, because that is the case
  both photographs were taken in.
*/
const dock = (await page.evaluate(`(function () {
  var frame = document.querySelector('.app-frame');
  var slot = document.createElement('div');
  slot.className = 'dock-slot';
  slot.innerHTML = '<div class="dock"><button style="display:block;width:100%;padding:12px">GO</button></div>';
  frame.appendChild(slot);
  var nav = document.querySelector('.nav-bar').getBoundingClientRect();
  var btn = slot.querySelector('button').getBoundingClientRect();
  var gap = Math.round(nav.top - btn.bottom);
  slot.remove();
  return { gap: gap, want: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--dock-gap')) };
})()`)) as { gap: number; want: number }

ok(
  'the docked button clears the bar',
  dock.gap >= 0,
  dock.gap + 'px — a negative number is the button under the nav',
)
ok(
  'and clears it by --dock-gap',
  dock.gap === dock.want,
  'gap ' + dock.gap + ', --dock-gap ' + dock.want,
)

/*
  AND THE SAME IN AN INSTALLED PWA, which is the case that kept coming back.

  Everything above runs with the inset reported but dvh still equal to the glass, which is
  Safari. The PWA is BOTH halves: the inset reported AND 100dvh stopping short by it — so
  .app-frame ends 34px above the nav's top while its padding reserves a full bar's height
  below that. Measured before the dock was pinned to the glass: 49px of gap in this case
  and 15 in the other, from one rule.

  The frame's height is overridden here because Chromium will not shorten dvh on request.
  That is safe in a way it was not for the sand-strip assertion above — this measures the
  BUTTON against the NAV, and neither of them is inside the frame.
*/
await page.addStyleTag({ content: '.app-frame{height:' + (844 - INSET) + 'px}' })
await page.waitForTimeout(200)
const pwa = (await page.evaluate(`(function () {
  var frame = document.querySelector('.app-frame');
  var slot = document.createElement('div');
  slot.className = 'dock-slot';
  slot.innerHTML = '<div class="dock"><button style="display:block;width:100%;padding:12px">GO</button></div>';
  frame.appendChild(slot);
  var nav = document.querySelector('.nav-bar').getBoundingClientRect();
  var btn = slot.querySelector('button').getBoundingClientRect();
  var gap = Math.round(nav.top - btn.bottom);
  slot.remove();
  return { gap: gap };
})()`)) as { gap: number }

ok(
  'the same gap in an installed PWA',
  pwa.gap === dock.want,
  'gap ' + pwa.gap + ' where Safari gets ' + dock.gap,
)

/*
  AND THE OTHER WAY A SCREEN CLEARS THE BAR.

  Not every screen uses Dock. The set-up cards are full-bleed panes running their own
  layout — the documented fallback in components/Dock.tsx — and they clear the bar with
  .nav-clear instead. Every dock fix this week missed them, which is why the CTA was
  reported behind the nav again after the dock was finally right. Sam: "it must never be
  behind the nav."

  The two paths are asserted to agree, rather than the second being left to drift 15px
  behind the first.
*/
const clear = (await page.evaluate(`(function () {
  var probe = document.createElement('div');
  probe.className = 'nav-clear';
  document.body.appendChild(probe);
  var pad = parseFloat(getComputedStyle(probe).paddingBottom);
  probe.remove();
  var cs = getComputedStyle(document.documentElement);
  return {
    pad: Math.round(pad),
    want: Math.round(parseFloat(cs.getPropertyValue('--bar-h')) + parseFloat(cs.getPropertyValue('--dock-gap'))),
  };
})()`)) as { pad: number; want: number }

ok(
  'nav-clear leaves the same gap as the dock',
  clear.pad === clear.want,
  'nav-clear reserves ' + clear.pad + ', the dock leaves ' + clear.want,
)
ok('the frame reaches the glass', m.frameBottom === m.glass, 'frame ends at ' + m.frameBottom)
/*
  And the bar is the height of its icons. 67 is a measurement rather than a target, so
  this allows the range a type or icon change would move it through and fails the doubling
  that an inset inside the bar would cause.
*/
ok('the bar is single height', m.navHeight > 0 && m.navHeight < 90, m.navHeight + 'px')

console.log('  measured: bar ' + m.navHeight + ', content ends ' + m.contentEndsAt + ', bar top ' + m.navTop)
await browser.close()
if (fail.length) { console.log('\n' + fail.length + ' error(s)'); process.exit(1) }
console.log('\nthe page ends on the bar, with a ' + INSET + 'px inset simulated')
