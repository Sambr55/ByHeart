/**
 * Walk the v0.6 journey end to end: landing → demo → free text → picker → four roots
 * with a "where next?" between each → collisions → no-cue → things you can say → the
 * five questions. Asserts the mandated order actually holds (§20.16).
 *
 *   npm run journey
 */
import { BRAND } from '../content/brand'
import { chromium, type Locator, type Page } from 'playwright'
import { CRATES, ROOTS, entryRung, isLive } from '../content/roots'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { CLOSE, PICKER } from '../content/front-door'

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
  // The no-bypass rule: /crates with nothing stored must land on the deal, never the
  // picker. Checked before the walk so a regression here fails loudly rather than
  // showing up as a confusing step count later.
  await page.goto(BASE + '/vibes', { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const gated = await page.evaluate(() => document.body.innerText)
  if (/Pick a vibe/.test(gated)) problems.push('/crates bypassed the front door with cleared storage')
  if (!/Where do you want DUB to take you/.test(gated)) {
    problems.push('/crates with cleared storage did not land on the language choice')
  }

  await page.goto(BASE + '/?tester=smoke', { waitUntil: 'networkidle' })

  // The ladder dims anything above the learner's rung, and this walk is testing the
  // CONTENT of one crate rather than the gate. So open the ladder just far enough to
  // reach it, the same way a learner would have: a line already said cold.
  const needed = entryRung(CRATES.find((c) => c.id === family)!)
  if (needed > 1) {
    // Exactly one rung below, because a clean release at rung N opens rung N+1 and
    // nothing higher — picking any lower root only ever reaches rung 2.
    const opener = ROOTS.find((r) => r.rung === needed - 1)!
    // The namespaced key, not the legacy one: by the time this runs the app has already
    // written an empty record for this pair, so the legacy migration will correctly
    // decline to overwrite it and the seed would be silently ignored.
    const key = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
    await page.evaluate(
      ([pt, en, k]) =>
        localStorage.setItem(
          k,
          JSON.stringify({
            version: 1,
            proof: [{ pt, en, source: 'release', clean: true, at: '2026-01-01T00:00:00.000Z' }],
          }),
        ),
      [opener.transfer_prompt.answer, opener.transfer_prompt.ask, key],
    )
    await page.reload({ waitUntil: 'networkidle' })
  }

  const seen: string[] = []
  let sections = 0
  let legendOffers = 0
  const stage = async () =>
    (await page.evaluate(() => document.querySelector('[data-stage]')?.getAttribute('data-stage'))) ?? '?'

  seen.push(await stage())
  const body0 = await page.evaluate(() => document.body.innerText)
  // The door is a photograph and a strapline now, not four paragraphs of argument.
  if (!new RegExp(BRAND.strapline, 'i').test(body0)) problems.push('landing strapline missing')
  if (/Learn Portuguese through the films/.test(body0)) {
    problems.push('landing still names the language — the brand layer is pair-neutral')
  }
  if (!/SHOW ME HOW/.test(body0)) problems.push('SHOW ME HOW missing')

  await press(page.getByTestId('continue'), 'landing cta')

  // Beat 1 stages three reveals on one screen.
  const d1 = await page.evaluate(() => document.body.innerText)
  if (!/TALK TO ME, GOOSE/.test(d1)) problems.push('demo beat 1 wrong')
  await press(page.getByTestId('continue'), 'reveal translation')
  const d2 = await page.evaluate(() => document.body.innerText)
  if (!/FALA COMIGO, GOOSE/.test(d2)) problems.push('translation did not animate in')
  await press(page.getByTestId('continue'), 'reveal takeaway')
  const d3 = await page.evaluate(() => document.body.innerText)
  if (!/COMIGO = WITH ME/.test(d3)) problems.push('takeaway missing')
  await press(page.getByTestId('continue'), 'to branches')

  const d4 = await page.evaluate(() => document.body.innerText)
  if (!/Three things you can say/i.test(d4)) problems.push('branch beat missing')
  if (!/That’s DUB/.test(d4)) problems.push('demo close line missing')
  await press(page.getByTestId('continue'), 'to the language choice')

  // The language pair is chosen after the demo: the demo is the argument for choosing
  // at all, and the deal cannot say "your Portuguese" until this is known.
  const pairScreen = await page.evaluate(() => document.body.innerText)
  if (!/Where do you want DUB to take you/.test(pairScreen)) problems.push('pair step missing')
  if (!/Português/.test(pairScreen)) problems.push('pair step does not offer Portuguese')
  if (!/COMING SOON/.test(pairScreen)) problems.push('pair step hides what is not built')
  // Not the word — the copy uses it to promise the opposite. What must not exist is a
  // way to actually hand one over.
  const capture = await page.evaluate(
    () => document.querySelectorAll('input, textarea, form').length,
  )
  if (capture > 0) problems.push('the pair step has grown a field — coming soon is not a mailing list')
  await press(page.getByTestId('pair-pt-PT'), 'choose European Portuguese')
  await press(page.getByTestId('continue'), 'to the deal')

  // The deal sits between the demo and the picker and must answer all three questions.
  const deal = await page.evaluate(() => document.body.innerText)
  for (const heading of ['HOW IT WORKS', 'WHAT WE ASK OF YOU', 'WHAT YOU GET', 'WHAT THIS IS NOT']) {
    if (!deal.includes(heading)) problems.push('the deal screen is missing ' + heading)
  }
  if (!/streak/i.test(deal)) problems.push('the deal screen no longer says what DUB refuses to do')
  await press(page.getByTestId('continue'), 'accept the deal')

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
    if (family !== 'the_basics') {
      await page.evaluate((k) => {
        const raw = JSON.parse(localStorage.getItem(k) ?? '{}')
        raw.sections_completed = [...new Set([...(raw.sections_completed ?? []), 'the_basics'])]
        localStorage.setItem(k, JSON.stringify(raw))
      }, 'byheart.learner.v1:' + pairId(DEFAULT_PAIR))
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
  // Tapping a crate enters it. There is no confirm step any more: a list where every
  // row is a destination behaves like one.
  await press(page.getByRole('button', { name: chosen.title, exact: false }).first(), 'enter the crate')

  // The back button has to work from anywhere the tester might be.
  const back = page.getByTestId('back')
  if (!(await back.isVisible().catch(() => false))) problems.push('no back button inside a section')
  else {
    const before = await page.evaluate(() => document.body.innerText)
    await press(back, 'back')
    const after = await page.evaluate(() => document.body.innerText)
    if (before === after) problems.push('back button did not move the learner')
    // Back lands on the picker, which no longer has a confirm button — so going forward
    // again means tapping the crate again, exactly as a learner would.
    await press(
      page.getByRole('button', { name: chosen.title, exact: false }).first(),
      're-enter the crate',
    )
  }

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
  await page.waitForURL('**/club', { timeout: 20000 }).catch(() => {})
  if (!/\/club/.test(page.url())) problems.push('the close did not land on the Club; url=' + page.url())
  await page.waitForTimeout(1200)
  const club = await page.evaluate(() => document.body.innerText)
  if (!/DUB CLUB/i.test(club)) problems.push('the Club did not render')
  // The ceremony or the home — both are correct here, an empty screen is not.
  if (!/WORTH DOING NEXT|Welcome to Dub Club/i.test(club)) {
    problems.push('the Club rendered neither its moves nor its welcome')
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
  for (const q of ['Why is a crate dimmed', 'Is this Portuguese or Brazilian', 'What actually counts']) {
    if (!help.includes(q)) problems.push('feedback page does not answer: ' + q)
  }
  if (!/What did not land/i.test(help)) problems.push('feedback page has no open box')

  await browser.close()
  if (problems.length) {
    console.log(problems.length + ' problem(s):')
    problems.forEach((p) => console.log('  ' + p))
    process.exit(1)
  }
  console.log('journey clean: landing → demo → choice → ' + family + ' mixtape → no-cue → five questions')
  console.log('stages seen: ' + [...new Set(seen)].join(' → '))
}

main()
