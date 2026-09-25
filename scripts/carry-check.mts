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
import { personalise, myAge, myName, AUTHORED_NAME, AUTHORED_AGES, LEGEND_FRAMES, knownValues, readableFrame, fillFrame, fillEnglish } from '../content/legend'
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
      /*
        ONLY THEIR OWN FORM IS DRILLED, which is the rule Sam set after three attempts to
        keep both: "EVERYTHING after obrigado or obrigada selection should be gender
        specific."

        This used to assert that both forms are banked, and that assertion is what kept
        the other ending in her session — a second piece screen titled obrigado with two
        masculine branches under it. The pair is still TAUGHT: the line, the bridge and
        the question are all about the difference, and the bridge is checked above for
        naming both words. What is no longer drilled is a word she will never say.
      */
      ok(
        'gender ' + gender + ': only their own form is drilled',
        p.extracts.every((e) => e.target !== (gender === 'f' ? 'obrigado' : 'obrigada')),
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

/*
  AND HOW THINGS STAND, which is the answer that used to be thrown away entirely.

  Sam: "whether you select married or not married it then goes through to I am not
  married." tb_married_work ASKS the question and then taught, whatever anybody said, a
  married specimen line, a NOT-married branch and a cold prompt demanding "I am not
  married" — so one of the two answers was always contradicted and the other was drilled
  on its own negation.

  Every status is asserted rather than the interesting one, because the fault was not in
  any single word: it was that the answer was not read at all.
*/
console.log('\nhow things stand, carried into the root that asked\n')
{
  const raw = ROOTS.find((r) => r.root_id === 'tb_married_work')
  ok('the root that asks about marriage is there', Boolean(raw), 'tb_married_work')
  if (raw) {
    for (const [status, fem, en] of [
      ['casado', 'casada', 'married'],
      ['solteiro', 'solteira', 'single'],
      ['divorciado', 'divorciada', 'divorced'],
    ] as [string, string, string][]) {
      for (const g of ['m', 'f'] as const) {
        const p = personalise(raw, {
          profile: { gender: g },
          legend: [{ frame_id: 'married', values: { status } }],
        })
        const want = g === 'f' ? fem : status
        const where = status + '/' + g
        /* The line they read is about them, in their own word and their own ending. */
        ok('the specimen says what they said', p.target.includes(want), where + ': ' + p.target)
        ok('and its gloss agrees', p.source.includes(en), where + ': ' + p.source)
        /*
          THE COLD PROMPT IS THE ONE THAT MATTERED MOST. It is the sentence a learner is
          asked to produce with nothing on screen, so a wrong one is not a bad example —
          it is being made to say something untrue about themselves.
        */
        ok(
          'the cold prompt asks for their own answer',
          p.transfer_prompt.answer.includes(want),
          where + ': ' + p.transfer_prompt.answer,
        )
        ok(
          'and asks for it in English too',
          p.transfer_prompt.ask.includes(en),
          where + ': ' + p.transfer_prompt.ask,
        )
        /* No other status survives anywhere on the card, in either language. */
        for (const [other, otherF, otherEn] of [
          ['casado', 'casada', 'married'],
          ['solteiro', 'solteira', 'single'],
          ['divorciado', 'divorciada', 'divorced'],
        ] as [string, string, string][]) {
          if (other === status) continue
          const all = [p.target, p.source, p.transfer_prompt.answer, p.transfer_prompt.ask].join(' ')
          ok(
            'no other status survives',
            !all.includes(other) && !all.includes(otherF) && !all.includes(otherEn),
            where + ' still mentions ' + other,
          )
        }
        /*
          AND A SENTENCE ABOUT SOMEBODY ELSE KEEPS ITS OWN ENDING. myForm bends gendered
          pairs to the speaker, which produced "Ela não é casado" for a married man — her
          sentence, his ending.
        */
        for (const b of p.branches) {
          if (!/^(Ela|Ele|Eles|Elas)\b/.test(b.target.trim())) continue
          ok(
            'a third-person line is not bent to the speaker',
            !b.target.includes(' é ' + status) || status === fem,
            where + ': ' + b.target,
          )
          ok('she is she in both languages', /\bShe\b/.test(b.en), where + ': ' + b.en)
        }
      }
    }
    /* Unanswered changes nothing, which is what makes this safe for a new learner. */
    const untouched = personalise(raw, { profile: {} })
    ok('an unanswered card leaves the root alone', untouched.target === raw.target, untouched.target)
  }
}

/*
  NO SCREEN SHOWS A LEARNER A BRACE.

  Sam, on the Legend-open screen: "fix this screen so sou nationality isn't in large script
  and picks up actual nationality." It rendered fillFrame(frame, {}) — an empty values
  object — so the authored `{nationality}` came out verbatim at 3.5rem and wrapped off the
  side of a phone.

  Asserted as the property rather than on that one screen: a frame is shown filled or it is
  not shown as Portuguese at all. readableFrame is the test both sides use, so a frame that
  cannot be completed from the record can never reach the hero slot.
*/
console.log('\nno frame reaches a screen with its braces still in it\n')
{
  const jane = {
    display_name: 'Jane',
    profile: { nationality: 'escocês', from_place: 'Glasgow', age: 30, gender: 'f' as const },
  }
  for (const frame of LEGEND_FRAMES) {
    const known = knownValues(frame, jane)
    /*
      Either every slot is filled, or the caller must not render the Portuguese. What is
      forbidden is the third case: a sentence that is PART template, which is what put a
      brace on Sam's screen.
    */
    if (!readableFrame(frame, known)) continue
    const said = fillFrame(frame, known, 'f')
    const glossed = fillEnglish(frame, known)
    ok('no brace survives in ' + frame.id, !/[{}]/.test(said), said)
    ok('nor in its gloss for ' + frame.id, !/[{}]/.test(glossed), glossed)
  }

  /* And the frame Sam actually hit fills from the profile alone. */
  const origin = LEGEND_FRAMES.find((f) => f.id === 'origin')
  ok('the origin frame exists', Boolean(origin), 'origin')
  if (origin) {
    const known = knownValues(origin, jane)
    ok('origin fills from the profile', readableFrame(origin, known), JSON.stringify(known))
    ok(
      'and it agrees with the speaker',
      fillFrame(origin, known, 'f').includes('escocesa'),
      fillFrame(origin, known, 'f'),
    )
    /* A record that knows nothing must NOT be readable — that is what forces the fallback. */
    ok(
      'an empty record is not sayable',
      !readableFrame(origin, knownValues(origin, { profile: {} })),
      'origin with nothing known',
    )
  }
}

if (fail.length) {
  console.log('\n' + new Set(fail).size + ' distinct failure(s), ' + fail.length + ' case(s)')
  process.exit(1)
}
console.log('\nwhat they told us is carried through, in both languages')
