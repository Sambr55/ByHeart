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
import { readFileSync } from 'node:fs'
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
    /*
      WITH AN ORIGIN, because this fixture is about the age and interest swaps and
      tb_introduce holds its whole specimen until the origin is answered.

      That hold is deliberate — see holdSpecimen in content/legend.ts. "Chamo-me Ana. Sou
      inglês." is the sentence that lesson TEACHES, and putting the reader's own name in
      the first half makes the second half a claim about them. So a fixture with no
      nationality correctly gets Ana's name, and asserting "the name is the learner's"
      against it was testing the wrong learner rather than finding a fault.

      Answering it here keeps every other assertion in this loop pointed at what it is for.
    */
    const me = {
      display_name: NAME,
      profile: { age, into: [interest.id], nationality: 'escocês', from_place: 'Glasgow' },
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

/*
  WHAT THE PROFILE KNOWS IS ON THE CARD.

  Sam: "the first question of the legend is still coming through not populated when the
  user has already asked these questions." His screenshot was the origin card, blank, with
  both halves of the answer on his profile.

  The lessons write the Legend on the tap that answers — but AskOrigin collapses to a
  one-line confirmation as soon as the profile holds a nationality and a town, which
  set-up fills before that lesson is reached. So the button that writes was never drawn:
  profile answered, card empty.

  Asserted as the property rather than on the screen — every frame knownValues can fill
  must be fillable from a record that holds only profile fields — so a fourth frame with a
  profile field behind it is covered without being named here.
*/
console.log('\nwhat the profile knows reaches the card\n')
{
  const jane = {
    display_name: 'Jane',
    profile: { nationality: 'escocesa', from_place: 'Glasgow', age: 40, gender: 'f' as const },
  }
  let filled = 0
  for (const frame of LEGEND_FRAMES) {
    const known = knownValues(frame, jane)
    if (!Object.keys(known).length) continue
    filled += 1
    /*
      Every value knownValues produces must be a real answer for that slot — an empty
      string would be written, counted as answered, and render a card with a blank in it.
    */
    for (const [key, v] of Object.entries(known)) {
      ok(frame.id + '.' + key + ' is a real answer', Boolean(String(v).trim()), JSON.stringify(v))
    }
  }
  ok('the profile fills at least the first three cards', filled >= 3, filled + ' frames')

  /* And origin specifically, which is the one that was reported. */
  const origin = LEGEND_FRAMES.find((f) => f.id === 'origin')
  ok(
    'origin is one of them',
    Boolean(origin && readableFrame(origin, knownValues(origin, jane))),
    'origin',
  )

  /*
    AND THE DECK WRITES THEM. The reader existing is not the fix — the Legend has to put
    them on the record, or every screen that counts answers still counts none. Checked in
    the source because the alternative is driving a browser to a state this file has no
    other reason to build.
  */
  const src = readFileSync('components/Legend.tsx', 'utf8')
  ok(
    'the deck backfills what the profile knows',
    /knownValues\(frame, learner\)/.test(src) && /answerLegendFromLesson\(frame\.id, known\)/.test(src),
    'components/Legend.tsx',
  )
}

/*
  AND A ROOT THAT ASKS A FACT DOES NOT ASSERT IT FIRST.

  Sam: "it also assumed I was Ingles before I told it. So the headline on the
  Chamo-me/Sou ingles page already said Ingles."

  Everything above this checks that an answer IS carried through. This checks the
  opposite and equally important half: that nothing is carried through before it is
  given. tb_introduce asks where you are from and its specimen is "Chamo-me Ana. Sou
  inglês." — personalise swapped the NAME on sight, so the screen about to ask the
  question already read "Chamo-me Sam. Sou inglês." The learner's own name is what turns
  a specimen into a claim about them.

  Asserted for every asking root, not just the one that broke, because the rule is
  general: a lesson may not show an answer it has not been told.
*/
/*
  AND AN ANSWER SHOWS THE MOMENT IT IS GIVEN.

  Sam: "The language selector has just blown up. I selected Scottish and it reverted to
  English in the copy but didnt pull through, just gave me blanks."

  The blanking rule above — do not state a fact before it is answered — was written as one
  condition over BOTH halves of the origin question: blank unless nationality AND town are
  both known. The question asks them one at a time, so the whole middle of that flow had a
  learner looking at "Sou —." having just chosen escocês.

  Losing somebody's answer is worse than the borrowed inglês this replaced: that was wrong
  about them, this throws away what they said. So the two halves are asserted separately,
  which is the only shape that can hold both rules at once.
*/
console.log('\nand a half-answered origin keeps the half that was answered\n')
{
  const root = ROOTS.find((r) => r.root_id === 'tb_introduce')
  if (root) {
    const half = personalise(root, {
      display_name: 'Sam',
      profile: { nationality: 'escocês', from_place: null, gender: 'm', age: null, into: [] },
      legend: [],
    } as Parameters<typeof personalise>[1])
    ok(
      'a chosen nationality shows before the town is typed',
      half.target.includes('escocês') && half.source.includes('Scottish'),
      half.target,
    )
    ok(
      'and the town it does not have yet stays blank',
      !half.target.includes('Londres') && !half.source.includes('London'),
      half.target,
    )
    const townOnly = personalise(root, {
      display_name: 'Sam',
      profile: { nationality: null, from_place: 'Glasgow', gender: 'm', age: null, into: [] },
      legend: [],
    } as Parameters<typeof personalise>[1])
    ok(
      'and the mirror: a town shows before the nationality is chosen',
      (townOnly.branches ?? []).some((b) => b.target.includes('Glasgow')),
      (townOnly.branches ?? []).map((b) => b.target).join(' / '),
    )
  }
}

console.log('\nand nothing is claimed before it is answered\n')
{
  const blank = {
    display_name: 'Sam',
    profile: { nationality: null, from_place: null, gender: null, age: null, into: [] },
    legend: [],
  }
  for (const r of ROOTS) {
    const asks = (r as { asks?: unknown }).asks
    if (!asks) continue
    const shown = personalise(r, blank as Parameters<typeof personalise>[1])
    /*
      THE FACT BEING ASKED FOR MUST NOT APPEAR AS AN ANSWER. Checked against the authored
      specimen's own values — inglês, English, Londres, London — because those are exactly
      what a learner would misread as their own.
    */
    /*
      A FACT NOBODY GAVE IS NEVER STATED — and the NAME is not one of those facts.

      This line has had three wrong rules in two days, and each produced a real complaint:

        name + Ana's nationality   told Sam he was English
        hold everything            "regressed to first name Ana, not pulling through"
        name + a dash              "Sou —." — the shape with its own lesson removed

      All three are the same mistake: treating one sentence as one decision. It holds two
      facts in different states. The NAME was given at set-up and is not what this screen is
      asking about, so it lands. The NATIONALITY is being asked for right below, so it shows
      as the choice on offer rather than as one option pretending to be the answer.

      So the assertion is about the borrowed fact, not the name: an unanswered root must not
      state the specimen's nationality or town as though it were the learner's.
    */
    const stillSpecimen =
      /\bingl(ês|esa)\b/.test(shown.target) && !/\//.test(shown.target)
    ok(
      r.root_id + ' does not state a nationality nobody gave',
      !stillSpecimen,
      shown.target,
    )
    ok(
      r.root_id + ' does not state a town nobody gave',
      !shown.target.includes('Londres') && !shown.source.includes('London'),
      shown.target,
    )
    /*
      AND IT IS STILL A SENTENCE. The fix for the fault above was a dash — "Sou —." — which
      is a shape with the word that explains it removed, on the one screen whose job is to
      teach that shape. Sam read it off his phone. A specimen that has been emptied is not
      a safer specimen, it is a worse lesson.
    */
    ok(
      r.root_id + ' still teaches a whole sentence',
      !shown.target.includes('—') && !shown.source.includes('—'),
      shown.target,
    )
  }
}

if (fail.length) {
  console.log('\n' + new Set(fail).size + ' distinct failure(s), ' + fail.length + ' case(s)')
  process.exit(1)
}
console.log('\nwhat they told us is carried through, in both languages')
