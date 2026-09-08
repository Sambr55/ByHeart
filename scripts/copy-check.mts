/**
 * If you can hear it, you can take it.
 *
 *   npm run copy
 *
 * A sentence in DUB is a thing you carry out of the app — said aloud, or pasted into a
 * message to the person you are about to meet. Those are the same act wearing two faces, so
 * the speaker and the copy control belong together, and a line that offers one without the
 * other is a line the product will let you hear and not keep.
 *
 * Asserted on the SOURCE rather than by clicking, because the clipboard is invisible: a
 * browser check would have to read back what it just wrote, which tests the platform rather
 * than the product. What can rot here is a new sentence row shipping with audio and no copy,
 * and that is a shape a file can be read for.
 *
 * The pairing is per FILE rather than per line — a row may lay them out in either order, and
 * some screens legitimately play a question that is not the learner's own sentence. What
 * must not happen is a file gaining audio and never gaining copy at all.
 */
import { readFileSync, readdirSync } from 'node:fs'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/*
  NumberPicker is exempt and says why here rather than in a list somebody has to trust: it
  plays single numbers as they are chosen, which are pieces of a sentence being built rather
  than a sentence anybody would send.
*/
const EXEMPT = new Set(['NumberPicker.tsx'])

console.log('\nevery screen that speaks also lets you take it\n')

const files = readdirSync('components').filter((f) => f.endsWith('.tsx'))
for (const f of files) {
  const src = readFileSync('components/' + f, 'utf8')
  if (!src.includes('<AudioButton')) continue
  if (EXEMPT.has(f)) continue
  const audio = (src.match(/<AudioButton/g) ?? []).length
  const copy = (src.match(/<CopyButton/g) ?? []).length
  ok(
    f + ' offers a way to keep what it says',
    copy > 0,
    copy + ' copy to ' + audio + ' audio',
  )
}

console.log('\nand it copies the Portuguese, nothing else\n')
{
  const src = readFileSync('components/CopyButton.tsx', 'utf8')
  /*
    THE PASTE IS THE SENTENCE, NOT THE LOOKUP.

    Somebody pasting this into a message is sending the Portuguese. A paste that arrives
    carrying its English says "I looked this up", which is the thing the product exists to
    let them not say.
  */
  ok(
    'the clipboard gets one string and it is the text given',
    /writeText\(text\)/.test(src) && !/writeText\([^)]*\+/.test(src),
    'no English, no note, no "pt — en"',
  )
  /*
    And it says so when it works. The clipboard is invisible by definition, so a copy with
    no acknowledgement is indistinguishable from one that failed.
  */
  ok(
    'and it confirms, because a clipboard cannot be seen',
    /setDone\(true\)/.test(src) && /aria-label=\{done \? 'Copied'/.test(src),
    'silence would read as failure',
  )
  /*
    A phone that refuses the modern API still gets the sentence. navigator.clipboard needs a
    secure context and, on some iOS versions, a gesture the browser agrees was one.
  */
  ok(
    'and it still works where the modern API is refused',
    /execCommand\('copy'\)/.test(src),
    'a control that silently does nothing is worse than no control',
  )
}

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nwhat can be heard can be kept')
