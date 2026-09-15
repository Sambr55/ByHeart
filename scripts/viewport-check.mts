/**
 * No full-bleed screen measures itself with the SHORT viewport height.
 *
 *   npm run viewport
 *
 * `svh` is the small viewport height: how tall the screen is when the browser's own chrome
 * is SHOWING. `dvh` is the dynamic one, which is what a screen painting edge to edge under
 * hidden chrome actually gets.
 *
 * Get it the wrong way round on a screen that fills the phone and it ends short by exactly
 * the height of the hidden toolbar — the page ground shows through beneath the bottom bar.
 * Reported from a real iPhone as "there is a gap beneath the bottom nav", and the gap was
 * not in the nav at all: the nav sat flush against the bottom of a `main` that stopped too
 * soon. Two screens had it, the Club feed and the vibe cover, and both are the full-bleed
 * ones — which is the tell, because `min-h-svh` on an ordinary scrolling page is fine and
 * common.
 *
 * DESKTOP CANNOT REPRODUCE IT. Chrome makes svh and dvh equal, so every browser check in
 * this repo passed while a phone showed a sand stripe. That is why this is a source check
 * and not another Playwright walk.
 *
 * THE RULE: a fixed-height, full-bleed container (h-svh / h-screen, as opposed to
 * min-h-svh) must use dvh. A scrolling page with a minimum height may use whatever suits.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const fail: string[] = []

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) return []
    if (statSync(full).isDirectory()) return walk(full)
    return /\.tsx?$/.test(name) ? [full] : []
  })

const files = [...walk('components'), ...walk('app')]

for (const file of files) {
  const raw = readFileSync(file, 'utf8')
  /*
    COMMENTS ARE NOT CODE, and stripping them line by line is not enough.

    A first version flagged the two-line note explaining why a screen had STOPPED using
    h-svh — a check punishing its own documentation, which is exactly the false positive
    that gets a check switched off. Block comments span lines, so they are removed from
    the whole file before anything is scanned, with the line count preserved so the
    reported line number still points at the real thing.
  */
  const src = raw
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '')

  src.split('\n').forEach((code, i) => {
    /*
      `min-h-svh` is deliberately allowed: it sets a FLOOR on a page that scrolls, so the
      page simply grows past it and nothing is left short. What must not appear is a fixed
      full-bleed height in the short unit — `h-svh`, or `h-screen`, which is the older
      100vh and ignores browser chrome entirely.
    */
    const bad = /(?<!min-)\bh-svh\b/.test(code) || /(?<!min-)\bh-screen\b/.test(code)
    if (!bad) return
    fail.push(`${file}:${i + 1} uses a short fixed viewport height — use h-dvh`)
  })
}

/*
  And the frame that every ordinary screen hangs off must stay dynamic. It is the one
  place the rule is written in CSS rather than a class, so it is asserted separately
  rather than assumed.
*/
const css = readFileSync('app/globals.css', 'utf8')
if (!/\.app-frame\s*\{[^}]*height:\s*100dvh/.test(css)) {
  fail.push('.app-frame no longer measures itself in dvh')
}

if (fail.length) {
  for (const f of fail) console.log('  FAIL  ' + f)
  console.log(`\n${fail.length} error(s)`)
  process.exit(1)
}
console.log(`${files.length} files · every full-bleed screen measures itself in dvh`)
