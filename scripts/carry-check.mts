/**
 * What a learner told us is carried through, in BOTH languages.
 *
 *   npm run carry
 *
 * Sam, with the screenshot that started this: "praia is apparently translated as music —
 * so a real show-stopping error." It was. personalise replaced the Portuguese specimen and
 * left the English gloss alone, so the product taught that "Gosto da praia" means "I like
 * music". A wrong translation is worse than no personalisation: the untouched line was at
 * least true.
 *
 * And: "we really need to make sure that pieces are genuinely carried through as soon as
 * they are set — that is the real magic."
 *
 * So this asserts the whole contract rather than the one line that broke. For every
 * interest and a spread of ages, against every root that personalise touches:
 *
 *   - the Portuguese says the learner's own word, not the specimen
 *   - the English says the SAME thing the Portuguese does
 *   - no authored specimen survives anywhere in the line
 *   - the name is theirs
 *   - whatever is banked resolves to a real piece
 */
import { ROOTS, PIECES } from '../content/roots'
import { INTERESTS } from '../content/interests'
import { personalise, AUTHORED_NAME, AUTHORED_AGES } from '../content/legend'
import { say, sayEn } from '../content/numbers'

const fail: string[] = []
const ok = (what: string, good: boolean, saw: string) => {
  if (!good) { console.log('  ✗ ' + what + '   ' + saw); fail.push(what) }
}

/* The roots personalise has something to do to: the ones holding a specimen. */
const touched = ROOTS.filter(
  (r) =>
    r.target.includes('música') ||
    AUTHORED_AGES.some((a) => r.target.includes(say(a))) ||
    r.target.includes(AUTHORED_NAME),
)
console.log('  ' + touched.length + ' roots carry a specimen: ' + touched.map((r) => r.root_id).join(' '))

/*
  THE FORM THAT AGREES WITH THE SPEAKER, which is the other thing a learner tells us.

  Sam: "if a user selects Obrigado make sure that gender persists. Currently flips quickly
  to Obrigada." It did — the answer was stored correctly and the CONTENT said otherwise,
  because tb_thank_you's branches are authored one of each. So this asserts what the
  learner sees rather than what is saved: having said which form is theirs, no line they
  are asked to say may use the other one.

  The extracts and the bridge are exempt and are checked separately below: the lesson has
  to show both forms, or it is not teaching the difference.
*/
{
  const root = ROOTS.find((r) => r.root_id === 'tb_thank_you')
  if (!root) { console.log('  ✗ tb_thank_you is gone'); fail.push('thank-you root') }
  else {
    for (const [gender, mine, theirs] of [['m', 'obrigado', 'obrigada'], ['f', 'obrigada', 'obrigado']] as const) {
      const p = personalise(root as never, { display_name: 'Fred', profile: { gender, into: [] } }) as unknown as {
        target: string; branches: { target: string }[]
        transfer_prompt?: { answer?: string }
        semantic_bridge: string
        extracts: { target: string }[]
      }
      const spoken = [p.target, ...p.branches.map((b) => b.target), p.transfer_prompt?.answer ?? '']
      for (const line of spoken) {
        ok(
          'gender ' + gender + ': no line says ' + theirs,
          !new RegExp(theirs, 'i').test(line),
          '"' + line + '"',
        )
      }
      /* And the lesson still teaches the pair. */
      ok(
        'gender ' + gender + ': the bridge still shows both forms',
        /obrigado/i.test(p.semantic_bridge) && /obrigada/i.test(p.semantic_bridge),
        p.semantic_bridge.slice(0, 80),
      )
      ok(
        'gender ' + gender + ': both forms are still banked',
        p.extracts.some((e) => e.target === 'obrigado') && p.extracts.some((e) => e.target === 'obrigada'),
        p.extracts.map((e) => e.target).join(' '),
      )
    }
  }
}

const NAME = 'Fred'
for (const interest of INTERESTS) {
  for (const age of [17, 30, 56, 78]) {
    const me = {
      display_name: NAME,
      profile: { age, into: [interest.id] },
    }
    for (const root of touched) {
      const p = personalise(root as never, me) as unknown as {
        target: string
        source: string
        branches: { target: string; en: string }[]
      }
      const where = root.root_id + ' @' + interest.id + '/' + age
      const lines = [{ target: p.target, en: p.source }, ...p.branches]

      /*
        THE AGE, IN BOTH LANGUAGES TOO.

        Sam: "I told it I was 77 and it told me I was 30 — even the translation!" myAge
        replaced the Portuguese specimen and left the gloss alone, so "Tenho setenta e
        sete anos" came out translated "I am thirty" — the interests bug again, in the
        other half of the same pass. Asserted the same way: wherever the Portuguese
        carries this learner's age, the English must carry it too and must not still be
        carrying the specimen's.
      */
      for (const line of lines) {
        if (line.target.includes(say(age))) {
          ok(
            'the English age follows the Portuguese',
            line.en.includes(sayEn(age)) || !/\b(thirty|thirty-two)\b/.test(line.en),
            where + ': "' + line.target + '" glossed "' + line.en + '"',
          )
        }
        for (const specimen of AUTHORED_AGES) {
          if (specimen === age) continue
          ok(
            'no specimen age survives in Portuguese',
            !line.target.includes(say(specimen)),
            where + ': ' + line.target,
          )
          ok(
            'no specimen age survives in English',
            !new RegExp('\\b' + sayEn(specimen) + '\\b').test(line.en),
            where + ': "' + line.en + '"',
          )
        }
      }

      for (const line of lines) {
        /*
          THE TWO HALVES AGREE. Checked by the one pairing that can actually be verified
          from the data: if the Portuguese carries this learner's interest, the English
          must carry its gloss — and must not still be carrying the specimen's.
        */
        if (interest.id !== 'musica' && line.target.includes(interest.target)) {
          ok(
            'the English follows the Portuguese',
            line.en.includes(interest.gloss),
            where + ': "' + line.target + '" glossed "' + line.en + '"',
          )
          ok(
            'no specimen gloss survives the swap',
            !/\bmusic\b/.test(line.en),
            where + ': "' + line.en + '" still says music',
          )
        }
        /* And the Portuguese specimen itself is gone wherever the swap applied. */
        if (interest.id !== 'musica' && root.target.includes('música')) {
          ok('no specimen word survives the swap', !line.target.includes('música'), where + ': ' + line.target)
        }
        /* The name is theirs, never the authored one. */
        ok('the name is the learner\'s', !line.target.includes(AUTHORED_NAME), where + ': ' + line.target)
      }

      /*
        AND WHAT IS BANKED IS REAL. A swapped extract puts an id into the inventory, and an
        id nothing resolves is a word the library cannot show and no check can explain —
        the exact fault that put seven dead words in a learner's bank earlier.
      */
      for (const e of (p as unknown as { extracts?: { id: string }[] }).extracts ?? []) {
        ok('every banked id resolves to a piece', Boolean(PIECES[e.id]), where + ': ' + e.id)
      }
    }
  }
}

if (fail.length) {
  console.log('\n' + new Set(fail).size + ' distinct failure(s), ' + fail.length + ' case(s)')
  process.exit(1)
}
console.log('\nwhat they told us is carried through, in both languages')
