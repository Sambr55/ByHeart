/**
 * Walk the journey a new learner actually takes, end to end.
 *
 *   npm run journey
 *
 * door → COME IN → the Club's showcase → /vibes → set-up → the shelf → one whole vibe
 * (roots, collisions, no-cue) → the proof card → the close → the Club.
 *
 * IT WAS DEAD, and silently. This walked "v0.6": landing → demo → free text → picker,
 * waiting for testid `continue` and the words SHOW ME HOW on a front door that has said
 * COME IN for some time. It failed at its FIRST TAP, so none of the 470 lines behind it
 * had run in a long while, and nothing else noticed — every other check stayed green
 * because each one covers a screen rather than the path between them.
 *
 * That is what this file is for, and why it is worth repairing rather than deleting: it
 * is the only check that walks the product the way a person does. Three of the four
 * things it then found were the same bug in different places — a check describing an
 * older product — which is the failure mode to watch for here:
 *
 *   · the front door became the Club's feed, so the demo corridor is gone
 *   · a vibe grew a cover screen, so entering one and STARTING one are two taps
 *   · the Club went behind the Legend, so one finished vibe no longer opens it
 *   · the help copy says "vibe" where this still said "crate"
 *
 * Where possible it now reads the product's own content files instead of restating them,
 * so a rewording moves the check with it rather than breaking it.
 */
import { BRAND } from '../content/brand'
import { chromium, type Locator, type Page } from 'playwright'
import { CRATES, ROOTS, entryRung, isLive } from '../content/roots'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { CLOSE, PICKER } from '../content/front-door'
import { HELP } from '../content/help'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
// Must default to a crate a brand-new learner can actually open: the ladder now
// dims anything above rung 1 until something has been said cold.
const family = process.env.FAMILY ?? 'pulp_fiction'
const problems: string[] = []
const seenText: string[] = []

async function press(l: Locator, what: string) {
  await l.waitFor({ state: 'visible', timeout: 20000 })
  if (await l.isDisabled()) throw new Error(what + ' is disabled')
  await l.evaluate((el) => (el as HTMLElement).click())
}

async function solveTiles(page: Page) {
  const line = page.getByTestId('tile-line')
  const answer = await line.getAttribute('data-answer')
  if (!answer) return false
  for (const word of answer.split(' ')) {
    const b = page.getByTestId('tile-pool').getByRole('button', { name: word, exact: true }).first()
    if (await b.isVisible().catch(() => false)) await press(b, 'tile "' + word + '"')
  }
  const check = page.getByRole('button', { name: 'CHECK', exact: true })
  if (await check.isVisible().catch(() => false)) await press(check, 'CHECK')
  return !(await page.getByTestId('tile-pool').isVisible().catch(() => false))
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.on('pageerror', (e) => problems.push('page error: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.location().url.includes('/audio/') && !m.location().url.includes('/api/'))
      problems.push('console: ' + m.text().slice(0, 160))
  })
  page.setDefaultTimeout(20000)
  /*
    THE FRONT DOOR IS THE CLUB NOW, and this walk was still knocking on the old one.

    It waited for testid "continue" and the words SHOW ME HOW on a landing page that has
    said COME IN for some time, so `npm run journey` had been dead at its first tap — the
    whole 470-line walk unreachable, silently, while every other check stayed green.

    What changed in the product: WELCOME, HOW_IN, the demo and THE_WAY used to be four
    screens of argument delivered to somebody who had not seen the product yet and could
    not skip any of them. They are cards in the Club's feed now (Journey.tsx:552-562), so
    the landing CTA goes straight to /club?in=1 and the corridor's remaining job is the
    two screens that were never pitch: set-up, and the shelf.

    So the walk enters the way a new learner actually does — /vibes, which is what
    `enter: 'vibes'` routes (engine/journey.tsx:604-683) — and the demo assertions are
    gone rather than rewritten: the demo is feed cards, and the feed has its own checks.
  */

  /*
    The no-bypass rule, still real and still worth asserting: a cleared device must meet
    set-up, never the shelf. What it lands on changed — the pair chooser became set-up's
    three questions — so this asserts the rule rather than the old screen's words.
  */
  await page.goto(BASE + '/vibes', { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const gated = await page.evaluate(() => document.body.innerText)
  if (/Pick a vibe/.test(gated)) problems.push('/vibes bypassed set-up with cleared storage')
  if (!/What brings you to/i.test(gated)) {
    problems.push('/vibes with cleared storage did not land on set-up; got: ' + gated.slice(0, 80))
  }

  /*
    THE LANDING PAGE STILL HAS TO OPEN, and it is one tap to the Club.

    Kept because it is the first thing a Lisbon tester will see, and because the testid
    drift this whole repair is about is exactly the sort of thing that goes unnoticed
    when nothing walks it.
  */
  await page.goto(BASE + '/?tester=smoke', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  const door = await page.evaluate(() => document.body.innerText)
  if (!new RegExp(BRAND.strapline, 'i').test(door)) problems.push('landing strapline missing')
  if (/Learn Portuguese through the films/.test(door)) {
    problems.push('landing still names the language — the brand layer is pair-neutral')
  }
  if (!(await page.getByTestId('landing-cta').isVisible().catch(() => false))) {
    problems.push('the front door has no way in')
  } else {
    await press(page.getByTestId('landing-cta'), 'come in')
    await page.waitForURL('**/club**', { timeout: 20000 }).catch(() => {})
    if (!/\/club/.test(page.url())) {
      problems.push('COME IN did not reach the Club; url=' + page.url())
    }
  }

  /*
    SET-UP: one screen of why, then a name. Both are real commitments and both write the
    record the rest of the walk depends on — profile.goal is what stops a finished
    learner being asked again (engine/journey.tsx:650-670).
  */
  await page.goto(BASE + '/vibes', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  const why = await page.evaluate(() => document.body.innerText)
  if (!/There is no wrong answer/i.test(why)) problems.push('set-up no longer says the last answer is real')
  await press(page.getByTestId('setup-why-curious'), 'why: just curious')
  await page.getByTestId('setup-who').fill('Sam')
  await press(page.getByTestId('setup-commit'), 'finish set-up')
  await page.waitForTimeout(1500)

  /*
    The ladder dims anything above the learner's rung, and this walk tests the CONTENT of
    one vibe rather than the gate — so it opens the ladder just far enough to reach it,
    the way a learner would have: one line already said cold.
  */
  const needed = entryRung(CRATES.find((c) => c.id === family)!)
  if (needed > 1) {
    // Exactly one rung below: a clean release at rung N opens N+1 and nothing higher.
    const opener = ROOTS.find((r) => r.rung === needed - 1)!
    /*
      Merged into the record rather than written over it. Set-up has just written the
      deal, the goal and the name, and replacing the blob would throw all three away —
      sending the walk straight back to the question it has just answered.
    */
    const key = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
    await page.evaluate(
      ([pt, en, k]) => {
        const raw = JSON.parse(localStorage.getItem(k) ?? '{}')
        raw.proof = [
          ...(raw.proof ?? []),
          { pt, en, source: 'release', clean: true, at: '2026-01-01T00:00:00.000Z' },
        ]
        localStorage.setItem(k, JSON.stringify(raw))
      },
      [opener.transfer_prompt.answer, opener.transfer_prompt.ask, key],
    )
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(900)
  }

  const seen: string[] = []
  let sections = 0
  let legendOffers = 0
  let unlocks = 0
  const stage = async () =>
    (await page.evaluate(() => document.querySelector('[data-stage]')?.getAttribute('data-stage'))) ?? '?'

  const b2 = await page.evaluate(() => document.body.innerText)
  /*
    Read from the copy rather than restated here, and BOTH headlines are legitimate: the
    picker says "start here" while the basics doorway is shut and "pick a crate you
    connect with" once there is something to pick between.
  */
  if (!b2.includes(PICKER.headline) && !b2.includes(PICKER.basics_first_headline)) {
    problems.push('picker headline wrong')
  }
  // The silent five-tier sort is labelled now, and the labels are the feature.
  if (!/OPEN NOW/i.test(b2)) problems.push('the crates screen no longer labels its groups')
  if (/WHAT DO YOU ALREADY KNOW BY HEART/.test(b2)) problems.push('free-text screen still present')
  // An expired drop is meant to be absent from the picker, so the smoke walk only
  // insists on the ones that should be there today.
  const live = CRATES.filter((c) => isLive(c))
  for (const f of live) {
    if (!b2.includes(f.title)) problems.push('picker missing crate ' + f.title)
  }
  for (const f of CRATES.filter((c) => !isLive(c))) {
    if (b2.includes(f.title)) problems.push('expired drop still in the picker: ' + f.title)
  }

  /*
    THE DOORWAY, asserted before the smoke walks past it.

    A brand-new learner can open exactly one crate: the basics. Five of the eleven have
    nothing at rung 1 at all, so picking Marcus Aurelius first meant meeting rung-2 Stoic
    philosophy before you could say hello.

    Checked here rather than assumed, and then stepped over — recording one finished
    basics section, which is what the doorway actually asks for — so the rest of this
    walk can exercise whichever crate it was told to.
  */
  {
    const basics = CRATES.find((c) => c.id === 'the_basics')!
    const others = live.filter((c) => c.id !== 'the_basics' && !c.drop)
    const openNow = b2.split('OPENS AS YOU GO')[0] ?? ''
    if (!openNow.includes(basics.title)) {
      problems.push('a new learner cannot open the basics, which is the only thing they can open')
    }
    for (const c of others) {
      if (openNow.includes(c.title)) {
        problems.push(c.title + ' is open to a brand-new learner — the basics doorway is not holding')
      }
    }
    /*
      DOOR=1 walks the vibe that OPENS THE LEGEND, which is the only sitting that may
      announce anything.

      The unlock screen fires once, on the fifth completed vibe, carrying everything banked
      on the way — so an ordinary run of this walk finishes ONE section and correctly sees
      nothing. Without a way to reach the door the screen is untestable in a browser, and
      it is the moment the whole feature exists for.

      Seeds four OTHER vibes as completed, so the one being walked is the fifth.
    */
    const others4 = live
      .filter((c) => c.id !== family && !c.drop)
      .slice(0, 4)
      .map((c) => c.id)
    const seedSections =
      process.env.DOOR === '1' ? others4 : family !== 'the_basics' ? ['the_basics'] : []
    if (seedSections.length) {
      /*
        A COMPLETED VIBE COMES WITH ITS WORDS, and seeding one without them is not a
        learner that exists.

        The first DOOR run announced nothing and the component looked wrong. It was not:
        this seeded four completed sections and an EMPTY inventory, so the learner had
        finished four vibes and owned no vocabulary — every Legend frame correctly read
        "not ready", and there was nothing to announce. `frameReady` was doing its job on a
        person who could not exist.

        So the words come with the sections, which is also what makes the assertion mean
        something: the screen is supposed to carry what five vibes actually banked.
      */
      const words = ROOTS.filter((r) => seedSections.includes(r.culture_family)).flatMap((r) =>
        r.extracts.map((e) => e.id),
      )
      await page.evaluate(
        ([k, add, pieces]) => {
          const raw = JSON.parse(localStorage.getItem(k) ?? '{}')
          raw.sections_completed = [...new Set([...(raw.sections_completed ?? []), ...add])]
          raw.inventory = { ...(raw.inventory ?? {}) }
          for (const id of pieces) raw.inventory[id] ??= { at: '2026-01-01T00:00:00.000Z' }
          localStorage.setItem(k, JSON.stringify(raw))
        },
        ['byheart.learner.v1:' + pairId(DEFAULT_PAIR), seedSections, words] as const,
      )
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(600)
    }
  }

  // Anything at rung 1 is open from the start, whatever the learner has done since.
  const openable = live.filter((f) => entryRung(f) <= Math.max(1, needed))
  /*
    A drop outside its window is not walkable, and that is the product working.

    Drops open a few weeks before the event they are about, so for most of the year one
    is simply not on the shelf. Crashing on `undefined` here read like a broken harness
    when it was a correct calendar.
  */
  const chosen = live.find((f) => f.id === family)
  if (!chosen) {
    console.log(
      family + ' is not on the shelf today — a drop outside its window, or a crate that ' +
        'does not exist. Nothing to walk.',
    )
    await browser.close()
    return
  }
  /*
    A VIBE HAS A DOORWAY AGAIN, and this walk had the older shape of it.

    "There is no confirm step any more" was true when it was written; tapping a vibe now
    opens a cover — the image, the blurb and TAP TO BEGIN — and the session starts on
    `vibe-begin`. Walking past that step is why this reported zero sections while sitting
    on the cover screen: the walk had entered the vibe and never started it.
  */
  await press(page.getByTestId('vibe-' + chosen.id).first(), 'open the vibe')
  await page.waitForTimeout(900)

  // The way out has to work from the cover, before anything has been committed to.
  const back = page.getByTestId('vibe-close')
  if (!(await back.isVisible().catch(() => false))) problems.push('no way out of a vibe cover')
  else {
    const before = await page.evaluate(() => document.body.innerText)
    await press(back, 'back')
    await page.waitForTimeout(900)
    const after = await page.evaluate(() => document.body.innerText)
    if (before === after) problems.push('back button did not move the learner')
    await press(page.getByTestId('vibe-' + chosen.id).first(), 're-open the vibe')
    await page.waitForTimeout(900)
  }

  await press(page.getByTestId('vibe-begin'), 'begin the vibe')
  await page.waitForTimeout(1200)

  // Walk roots until the close.
  for (let guard = 0; guard < 260; guard++) {
    /*
      Stop at the close.

      The loop's job is to get through a session; the close is handled explicitly below,
      and pressing its way through it meant the loop navigated to Dub Club, came back,
      and spent the remaining two hundred iterations pressing whatever it found. The
      close is the end of the walk, so the walk ends there.
    */
    if ((await page.evaluate(() => document.body.innerText)).includes(CLOSE.sub)) break
    const body = await page.evaluate(() => document.body.innerText)
    seenText.push(body)
    seen.push(await stage())

    if (/YOU ALREADY KNOW MORE THAN YOU THINK/.test(body)) break

    if (/Where next\?/.test(body)) {
      problems.push('a "where next?" appeared inside a section')
      break
    }
    // A profile question can appear between sections; answer the first option.
    const gender = page.getByTestId('profile-m')
    const age = page.getByTestId('profile-under25')
    const goal = page.getByTestId('profile-trip')
    for (const q of [gender, age, goal]) {
      if (await q.isVisible().catch(() => false)) {
        await press(q, 'profile answer')
        break
      }
    }

    /*
      THE UNLOCK SCREEN TAKES THE SCREEN, and a walk that does not know it exists stalls
      on it — which is how this found it: FAMILY=the_basics hung at the close waiting for
      a `continue` that was two taps away behind a screen the walk had never seen.

      It is deliberately interposed before the session summary (SectionComplete), so it is
      handled here rather than treated as a fault. What IS asserted is that it keeps its
      promise: it must name a question, in Portuguese, and it must be declinable — a screen
      you cannot get past at the end of every vibe is the nag the product refuses to be.
    */
    if (await page.getByTestId('opened-later').isVisible().catch(() => false)) {
      const unlocked = await page.evaluate(() => document.body.innerText)
      /*
        ASSERT THE PROMISE, NOT THE WORDING.

        These matched two exact sentences and both went stale the moment the screen grew
        its door variant — a check failing on copy that is working as intended, which is
        how a check earns itself an --ignore. What must be true on either variant is the
        structure: somebody else's question, and the sentence the learner can now say in
        reply. That is the whole claim the screen makes.
      */
      if (!/THEY ASK/i.test(unlocked)) {
        problems.push('the unlock screen does not show the question being asked')
      }
      if (!/YOU SAY/i.test(unlocked)) {
        problems.push('the unlock screen does not show what the learner can now say')
      }
      unlocks++
      await press(page.getByTestId('opened-later'), 'past the unlock screen')
      await page.waitForTimeout(900)
      continue
    }

    const done = page.getByTestId('im-done')
    if (await done.isVisible().catch(() => false)) {
      /*
        The thread's loud moment, checked where it actually happens.

        A crate that opens Legend cards must say so, once, here — and the first time it
        must OFFER the Legend rather than referring to one the learner has never seen.
        This is the only screen where that state is real.
      */
      const complete = await page.evaluate(() => document.body.innerText)
      const offered = /YOUR LEGEND/.test(complete)
      legendOffers += offered ? 1 : 0
      if (offered) {
        if (!/enough Portuguese to start your Legend/i.test(complete)) {
          problems.push('the Legend was offered without saying what it is')
        }
        if (!(await page.getByTestId('legend-decline').isVisible().catch(() => false))) {
          problems.push('the Legend offer cannot be declined — a goal you did not choose is a nag')
        }
      }

      // Take one more crate the first time, then finish — so the test exercises both
      // exits from a section.
      const another = page.getByTestId('another-crate')
      const takeAnother = sections === 0 && (await another.isVisible().catch(() => false))
      sections++
      await press(takeAnother ? another : done, 'section exit')
      if (takeAnother) {
        await press(
          page.getByRole('button', { name: openable.find((f) => f.id !== family)!.title, exact: false }).first(),
          'second crate',
        )
      }
      continue
    }
    if (await page.getByTestId('tile-pool').isVisible().catch(() => false)) {
      const ok = await solveTiles(page)
      if (!ok) {
        problems.push('could not solve a build at step ' + guard)
        break
      }
    }
    const voice = page.locator('button[aria-pressed]')
    if ((await voice.count()) > 0 && /two ways to say it/i.test(body)) {
      await press(voice.first(), 'voice')
      // The rule the pair teaches is the reason the screen exists — it must appear.
      const after = await page.evaluate(() => document.body.innerText)
      // Matched loosely on purpose: the label is an eyebrow and eyebrows are capped at
      // fourteen characters, so restating one here verbatim makes this test fail the
      // next time the copy is tightened. What matters is that the rule appeared.
      if (!/THE RULE/i.test(after)) {
        problems.push('a voice pair taught no rule at step ' + guard)
      }
    }
    const cta = page.getByTestId('continue')
    if (await cta.isVisible().catch(() => false)) {
      await press(cta, 'cta')
    } else {
      /*
        One screen in DUB deliberately has no way forward, and only for 620ms: the drain,
        where the culture is leaving and the ask has not arrived. A person waits through
        it without noticing; a walker has to be told.

        Waited for once rather than tolerated in a loop — if a second look still finds
        nothing, the screen really is a dead end and that is worth failing on.
      */
      await page.waitForTimeout(1100)
      if (await cta.isVisible().catch(() => false)) {
        await press(cta, 'cta after the drain')
      } else if (await page.getByTestId('tile-pool').isVisible().catch(() => false)) {
        if (!(await solveTiles(page))) {
          problems.push('could not solve the build after the drain')
          break
        }
      } else {
        problems.push('no way forward at step ' + guard + ': ' + body.slice(0, 120).replace(/\n/g, ' | '))
        break
      }
    }
  }

  // The proof card is the anti-streak, and its number must be earned rather than
  // counted from taps — an empty card at the end of a full run means nothing recorded.
  const proofSeen = seenText.find((s) => /WHAT I CAN SAY/.test(s))
  if (!proofSeen) problems.push('never saw the proof card')
  else {
    // The count moved below the sentence when the card inverted, so it is no longer the
    // first thing after the eyebrow. Matched on the sentence it appears in instead.
    const n = proofSeen.match(/(\d+)\s+sentences?\s+said with nothing on screen/)
    if (!n || Number(n[1]) < 1) problems.push('proof card counted nothing after a full run')
    else console.log('proof card: ' + n[1] + ' sentences produced cold')
  }
  console.log('legend offered at ' + legendOffers + ' of ' + sections + ' section ends')
  {
  }

  /*
    Register, seen rather than asserted from the data.

    age_band decides which version of an addressed line a learner is taught, and the
    other version sits underneath it. That was the finding the whole slice exists to fix
    — a screen promising a behaviour the code did not have — so the walk checks the
    behaviour is actually on a screen, not merely in the model.
  */
  const sawRegister = seenText.some((t) => /\b(tu|formal): /.test(t))
  console.log('register shown on screen: ' + (sawRegister ? 'yes' : 'not in this walk'))

  const end = await page.evaluate(() => document.body.innerText)
  console.log('stages: ' + seen.join(' '))
  console.log('ended on: ' + end.slice(0, 200).replace(/\n+/g, ' | '))
  /*
    The close ends on the sentence, not on a compliment.

    It used to assert the old headline verbatim, which is exactly the kind of restated
    literal that fails the next time the copy is tightened. What matters is that the
    screen carries something the learner produced — CLOSE.sub is there either way.
  */
  if (!end.includes(CLOSE.sub)) {
    problems.push('never reached the close')
  } else if (!/YOU SAID/.test(end) && !/YOU ALREADY KNOW MORE THAN YOU THINK/.test(end)) {
    problems.push('the close carried neither a sentence nor its fallback')
    problems.forEach((x) => console.log('  ' + x))
    await browser.close()
    process.exit(1)
  }
  if (!/You can now/.test(seen.join(' ')) && !/THINGS YOU CAN SAY/.test(end)) {
    // capability screen precedes the close; check it was seen
  }

  /**
   * The close returns you to the product, not out to a form about it. The end of a good
   * session is the worst possible moment to hand somebody a survey — feedback is a
   * standing menu item and one quiet line on that screen instead.
   */
  if (!/Something not land/i.test(end)) problems.push('the close offers no way to report anything')
  /*
    And it lands on the Club, not back at the picker.

    This is the assertion the whole session exists to earn: a learner who has been all
    the way through arrives somewhere that knows it. Landing back on the crate picker is
    what made the product read as one session repeated.
  */
  /*
    The thread's loud moment, asserted where it actually happens.

    A crate that opens Legend cards must say so, once, at section-complete — and it must
    OFFER the Legend the first time rather than referring to one the learner has never
    seen. This runs at the end of a real section, which is the only place the state is
    real.
  */
  await press(page.getByTestId('continue'), 'into Dub Club')
  await page.waitForURL('**/club**', { timeout: 20000 }).catch(() => {})
  if (!/\/club/.test(page.url())) problems.push('the close did not land on the Club; url=' + page.url())
  await page.waitForTimeout(1500)
  const club = await page.evaluate(() => document.body.innerText)
  /*
    ONE VIBE DOES NOT OPEN THE CLUB, and asserting that it did was this walk describing an
    older product.

    The Club is behind the Legend now (`clubOpen`, content/legend.ts) and the Legend opens
    at five completed vibes. This walk finishes ONE, so the honest thing on screen is the
    explainer — and a walk that demanded "DUB CLUB" and "WORTH DOING NEXT" here was
    requiring the gate to be broken in order to pass.

    So what is asserted is the rule: arriving from the close either lands INSIDE the Club,
    for somebody who has earned it, or on an explainer that says what opens it. An empty
    screen is the only failure, and it is the one that used to hide here.
  */
  const inside = /WORTH DOING NEXT|Welcome to Dub Club/i.test(club)
  const explained = /this opens with your Legend|It opens when your Legend does/i.test(club)
  if (!inside && !explained) {
    problems.push('the Club rendered neither its moves nor an explanation; got: ' + club.slice(0, 90))
  }
  /*
    And the explainer must name the way in rather than just refusing. A locked door with
    no sign on it is the failure this pairs with.
  */
  if (!inside && !/Legend/i.test(club)) {
    problems.push('the Club explainer does not say what opens it')
  }

  // Finishing a section is what unlocks the Club, so it has to have been recorded.
  const sectionsDone = await page.evaluate((k) => {
    try {
      return (JSON.parse(localStorage.getItem(k) ?? '{}').sections_completed ?? []).length
    } catch {
      return 0
    }
  }, 'byheart.learner.v1:' + pairId(DEFAULT_PAIR))
  if (!sectionsDone) problems.push('finishing a section did not record it against the learner')

  // And the research instrument still exists, behind the flag a moderator sends.
  await page.goto(BASE + '/feedback?study=1', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const study = await page.evaluate(() => document.body.innerText)
  for (const r of ['what do you think this product is', 'biggest reason you would NOT come back']) {
    if (!study.toLowerCase().includes(r.toLowerCase())) {
      problems.push('the study instrument lost: ' + r)
    }
  }

  // The open feedback page answers before it asks.
  await page.goto(BASE + '/feedback', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const help = await page.evaluate(() => document.body.innerText)
  /*
    READ FROM THE COPY, not restated here.

    These were three hand-typed question strings, and one of them still said "Why is a
    CRATE dimmed" — the word the product dropped for "vibe" some time ago. So this failed
    on a question the page answers perfectly well, which is a check reporting a content
    bug that does not exist while saying nothing about the one that might.

    Asking HELP for its own questions means a rewording moves the check with it, and what
    is actually asserted is the thing worth asserting: every question the content file
    promises is on the page.
  */
  for (const item of HELP) {
    if (!help.includes(item.q)) problems.push('feedback page does not answer: ' + item.q)
  }
  /*
    A FLOOR, because reading from HELP alone cannot catch a deletion.

    Iterating the content file fixes the false positive — a rewording moves the check with
    it — but it also means DELETING a question removes it from the page and from the list
    in the same stroke, and the loop above sails through. Verified by deleting one: the
    walk stayed green.

    So the count is asserted against a number that lives here. Five is what the page
    carries today; adding a sixth is free, and dropping to four has to be a deliberate
    edit in two files rather than a quiet loss in one.
  */
  if (HELP.length < 5) {
    problems.push('the feedback page answers only ' + HELP.length + ' questions; it had 5')
  }
  if (!/What did not land/i.test(help)) problems.push('feedback page has no open box')

  await browser.close()

  /*
    THE RULE, ASSERTED IN BOTH DIRECTIONS.

    Sam: "these unlockers shouldn't show while doing the first five vibes." An ordinary run
    finishes one vibe with the Legend still shut, so it must see NOTHING; a DOOR=1 run
    finishes the fifth, so it must see exactly one. Asserting only the first would pass on a
    screen that never fires at all, which is the failure this feature has already had once.
  */
  if (process.env.DOOR === '1') {
    if (unlocks !== 1) {
      problems.push('the vibe that opens the Legend announced ' + unlocks + ' times, not once')
    }
  } else if (unlocks > 0) {
    problems.push(unlocks + ' unlock screens interrupted a walk with the Legend still shut')
  }

  if (problems.length) {
    console.log(problems.length + ' problem(s):')
    problems.forEach((p) => console.log('  ' + p))
    process.exit(1)
  }
  console.log(
    'journey clean: door → club → set-up → shelf → ' + family + ' → cold → proof → the close',
  )
  console.log('stages seen: ' + [...new Set(seen)].join(' → '))
  console.log('legend questions announced during the walk: ' + unlocks)
}

main()
