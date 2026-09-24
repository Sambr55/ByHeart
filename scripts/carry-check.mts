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
import { INSIGHTS } from '../content/osmosis'
import { personalise, myAge, myName, AUTHORED_NAME, AUTHORED_AGES } from '../content/legend'
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
        target: string; branches: { target: string; demonstrates?: string[] }[]
        transfer_prompt?: { answer?: string }
        semantic_bridge: string
        extracts: { id: string; target: string }[]
      }
      /*
        THE LINE THE LEARNER IS HANDED, not every line on the root.

        This asserted that NO line says the other form, and that was too strong: this root
        teaches the pair, so one branch exists precisely to show the other ending. Holding
        it to "no obrigada anywhere" forced every branch to bend, which starved the other
        piece — its screen read "0 things you can say with it", which Sam then reported.

        What must be true is narrower and is the actual promise: the sentence at the top
        of the screen, and the one the learner is asked to produce, use their own form. A
        branch tagged as demonstrating the other ending is the example beside it.
      */
      const spoken = [p.target, p.transfer_prompt?.answer ?? '']
      for (const line of spoken) {
        ok(
          'gender ' + gender + ': the line they say uses ' + mine,
          !new RegExp(theirs, 'i').test(line),
          '"' + line + '"',
        )
      }
      /* And every branch NOT teaching the contrast is theirs too. */
      for (const b of p.branches) {
        if ((b.demonstrates ?? []).includes(theirs)) continue
        ok(
          'gender ' + gender + ': branch uses ' + mine,
          !new RegExp(theirs, 'i').test(b.target),
          '"' + b.target + '"',
        )
      }
      /*
        AND EVERY PIECE HAS SOMETHING TO SAY WITH IT.

        Sam: "apparently there are 0 things she can say with it." A piece screen lists the
        branches tagged to that extract, so a bend that retags or rewrites every branch
        leaves one of the pair with none — and the screen says so, in those words. Both of
        my first two attempts did exactly that, in opposite directions.

        Asserted per extract rather than per root, because the failure is always one
        starved piece beside a healthy one.
      */
      for (const e of p.extracts) {
        const own = p.branches.filter((b) => (b.demonstrates ?? []).includes(e.id))
        ok(
          'gender ' + gender + ': ' + e.target + ' has something to say with it',
          own.length > 0,
          '0 branches tagged ' + e.id,
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

/*
  AND THE OSMOSIS INSIGHTS, which are a fourth surface showing authored specimens.

  The age insight's body was written with fifty-six hardcoded — a number that happened to
  be Sam's while he was testing — above evidence reading "Tenho trinta anos. I am thirty."
  Two different wrong ages on one card, on a card about the learner's age.

  Same test as the roots and the collisions: what somebody called Fred, aged 77, actually
  reads. A specimen surviving anywhere on it is the fault.
*/
{
  const mine = (t: string) => myAge(myName(t, 'Fred'), 77)
  for (const insight of INSIGHTS) {
    const lines = [
      insight.headline,
      insight.body,
      ...insight.evidence.flatMap((e) => [e.pt, e.en]),
    ].map(mine)
    for (const line of lines) {
      for (const specimen of AUTHORED_AGES) {
        ok(
          'insight ' + insight.id + ': no specimen age survives',
          !line.includes(say(specimen)) && !new RegExp('\\b' + sayEn(specimen) + '\\b').test(line),
          '"' + line.slice(0, 90) + '"',
        )
      }
      ok(
        'insight ' + insight.id + ': the name is the learner\'s',
        !line.includes(AUTHORED_NAME),
        '"' + line.slice(0, 90) + '"',
      )
      /*
        AND NO OTHER AGE HARDCODED. fifty-six is not one of AUTHORED_AGES, so no swap ever
        reached it and no check was looking for it — which is exactly how it survived in
        the body of a card about the learner's own age.

        Every spelled age on a personalised line should now be the learner's. Anything
        else is a number somebody typed, which is the fault.
      */
      if (insight.id.includes('age')) {
        for (const other of [30, 32, 40, 50, 56, 60, 70, 80, 90]) {
          if (other === 77) continue
          /*
            NOT FOLLOWED BY A HYPHEN, because "seventy" is inside "seventy-seven" and the
            learner's own age must not trip a check looking for somebody else's.
          */
          ok(
            'insight ' + insight.id + ': "' + sayEn(other) + '" is not hardcoded',
            !new RegExp('\\b' + sayEn(other) + '\\b(?!-)').test(line),
            '"' + line.slice(0, 90) + '"',
          )
        }
      }
    }
  }
}

/*
  AND WHERE THEY SAID THEY WERE FROM.

  Sam: "I selected Scottish as my nationality and it showed me as English all the way
  through." personalise carried the name, the age, the interest and the form that agrees
  with the speaker, and left inglês and Londres exactly as authored.

  Both halves in both languages, and the right gender: a Scottish woman must read "Sou
  escocesa", not escocês, and never "I am from Londres" — a sentence in neither language,
  which is what replacing only the Portuguese produced.
*/
{
  const root = ROOTS.find((r) => r.root_id === 'tb_introduce')
  if (!root) { console.log('  ✗ tb_introduce is gone'); fail.push('origin root') }
  else {
    const cases = [
      { gender: 'm', nationality: 'escocês', expect: 'escocês', en: 'Scottish' },
      { gender: 'f', nationality: 'escocesa', expect: 'escocesa', en: 'Scottish' },
      { gender: 'f', nationality: 'americana', expect: 'americana', en: 'American' },
    ] as const
    for (const c of cases) {
      const p = personalise(root as never, {
        display_name: 'Fred',
        profile: { gender: c.gender, nationality: c.nationality, from_place: 'Glasgow', into: [] },
      }) as unknown as { target: string; source: string; branches: { target: string; en: string }[] }
      const lines = [{ target: p.target, en: p.source }, ...p.branches]
      const where = c.nationality + '/' + c.gender
      for (const line of lines) {
        ok(
          where + ': no authored nationality survives',
          !/ingl[êe]s|inglesa/.test(line.target),
          '"' + line.target + '"',
        )
        ok(where + ': no authored town survives', !/Londres|London/.test(line.target + line.en), '"' + line.target + ' / ' + line.en + '"')
        ok(
          where + ': the English follows',
          !/\bEnglish\b/.test(line.en),
          '"' + line.en + '"',
        )
        /* And the nationality on any line agrees with the speaker. */
        const wrong = c.gender === 'f' ? /\bescocês\b|\bamericano\b/ : /\bescocesa\b|\bamericana\b/
        ok(where + ': the nationality agrees with the speaker', !wrong.test(line.target), '"' + line.target + '"')
      }
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
