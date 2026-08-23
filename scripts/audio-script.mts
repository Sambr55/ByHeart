/**
 * Produce the recording script and manifest for every spoken line in DUB.
 *
 *   npm run audio:script
 *
 * Writes two files that say the same thing to two different audiences:
 *
 *   audio/RECORDING-SCRIPT.md    a person in a booth reads this top to bottom
 *   audio/recording-manifest.json a TTS run or a studio's asset pipeline reads this
 *
 * The direction beside each line is not decoration. A learner meets most of these
 * exactly once, and a line delivered in the wrong register teaches the wrong thing:
 * "Vai à merda" read pleasantly is a different sentence. Where the content already
 * says how something lands — a root's subtext, a voice option's register — that
 * wording is carried straight through rather than reinvented here.
 *
 * Gendered lines are marked. "Obrigado" and "obrigada" are not two takes of one
 * asset; they are a man and a woman, and the whole gender lesson collapses if one
 * person reads both.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { COLLISIONS, FAMILIES, ROOTS, ROOTS_BY_FAMILY } from '../content/roots'
import { NO_CUE_PROMPTS } from '../content/front-door'
import { AGE_PAIR, GENDER_PAYOFF } from '../content/profile'
import { slugFor } from '../content/audio-manifest'

type Speaker = 'any' | 'man' | 'woman'

interface Line {
  slug: string
  pt: string
  en: string
  /** How to say it. Read by a human, ignored by a machine. */
  direction: string
  speaker: Speaker
  crate: string
  root: string | null
  /** recognise | piece | branch | voice | release | collision | prompt */
  role: string
}

/**
 * Words whose ending changes with the speaker's gender. A line containing one is
 * split into a man's take and a woman's take rather than recorded once.
 */
const GENDERED: [RegExp, string][] = [
  [/\bobrigad[oa]\b/i, 'obrigado / obrigada'],
  [/\bcansad[oa]\b/i, 'cansado / cansada'],
  [/\bpront[oa]\b/i, 'pronto / pronta'],
  [/\bfart[oa]\b/i, 'farto / farta'],
  [/\bingl[eê]s(a)?\b/i, 'inglês / inglesa'],
  [/\bcabr(ão|a)\b/i, 'cabrão / cabra'],
]

function genderOf(pt: string): Speaker {
  for (const [re] of GENDERED) {
    const m = pt.match(re)
    if (!m) continue
    // The feminine forms are the ones that end in -a; everything else is the man's take.
    return /a\b|inglesa|cabra/i.test(m[0]) ? 'woman' : 'man'
  }
  return 'any'
}

const lines: Line[] = []
const seen = new Set<string>()

function add(l: Omit<Line, 'slug' | 'speaker'> & { speaker?: Speaker }) {
  const slug = slugFor(l.pt)
  const key = slug + '|' + (l.speaker ?? genderOf(l.pt))
  if (seen.has(key)) return
  seen.add(key)
  lines.push({ ...l, slug, speaker: l.speaker ?? genderOf(l.pt) })
}

for (const family of FAMILIES) {
  for (const root of ROOTS_BY_FAMILY[family.id] ?? []) {
    add({
      pt: root.pt_natural,
      en: root.meaning_en,
      direction: root.subtext,
      crate: family.title,
      root: root.root_id,
      role: 'recognise',
    })
    for (const e of root.extracts) {
      add({
        pt: e.pt,
        en: e.gloss,
        direction: 'Isolated, unhurried. This is the piece being handed over — clear enough to copy.',
        crate: family.title,
        root: root.root_id,
        role: 'piece',
      })
    }
    for (const b of root.branches) {
      add({
        pt: b.pt,
        en: b.en,
        direction: 'Ordinary conversational pace. This is the learner hearing what they are about to say.',
        crate: family.title,
        root: root.root_id,
        role: 'branch',
      })
    }
    for (const v of root.voice_options ?? []) {
      add({
        pt: v.pt,
        en: v.en,
        direction: v.register + ' — ' + v.when,
        crate: family.title,
        root: root.root_id,
        role: 'voice',
      })
    }
    add({
      pt: root.transfer_prompt.answer,
      en: root.transfer_prompt.ask,
      direction:
        'Said cold, with no film behind it: ' + root.transfer_prompt.context.toLowerCase(),
      crate: family.title,
      root: root.root_id,
      role: 'release',
    })
  }
}

/**
 * The profile payoffs.
 *
 * These pairs exist only to be heard side by side, so both halves have to be
 * recorded — by different people. A man reading "obrigada" would teach the exact
 * mistake the screen exists to prevent.
 */
for (const g of ['m', 'f'] as const) {
  for (const pair of GENDER_PAYOFF[g]) {
    add({
      pt: pair.yours,
      en: pair.en,
      direction:
        'Said about yourself, unremarkably. The ' + (g === 'm' ? 'man' : 'woman') +
        '\u2019s form of the same sentence.',
      speaker: g === 'm' ? 'man' : 'woman',
      crate: 'Speaking as a man or a woman',
      root: null,
      role: 'profile',
    })
  }
}
add({
  pt: AGE_PAIR.tu,
  en: AGE_PAIR.en,
  direction: 'The tu form. To a friend, a colleague, someone your own age.',
  crate: 'Who you are speaking to',
  root: null,
  role: 'profile',
})
add({
  pt: AGE_PAIR.voce,
  en: AGE_PAIR.en,
  direction: 'The formal form. One letter shorter, and a completely different level of respect.',
  crate: 'Who you are speaking to',
  root: null,
  role: 'profile',
})

for (const c of COLLISIONS) {
  add({
    pt: c.answer,
    en: c.ask,
    direction: 'Neutral. ' + c.context,
    crate: 'Collisions',
    root: null,
    role: 'collision',
  })
}

for (const p of NO_CUE_PROMPTS) {
  add({
    pt: p.answer,
    en: p.ask,
    direction: 'Neutral, real-world. No cultural colour at all.',
    crate: 'No cue',
    root: null,
    role: 'prompt',
  })
}

// ---------------------------------------------------------------------------

const out = join(process.cwd(), 'audio')
await mkdir(out, { recursive: true })

await writeFile(
  join(out, 'recording-manifest.json'),
  JSON.stringify({ locale: 'pt-PT', generated_from: 'content/roots.ts', count: lines.length, lines }, null, 2) + '\n',
)

const byCrate = new Map<string, Line[]>()
for (const l of lines) {
  if (!byCrate.has(l.crate)) byCrate.set(l.crate, [])
  byCrate.get(l.crate)!.push(l)
}

const men = lines.filter((l) => l.speaker === 'man').length
const women = lines.filter((l) => l.speaker === 'woman').length

const md: string[] = [
  '# DUB — European Portuguese recording script',
  '',
  '**' + lines.length + ' lines.** ' + (lines.length - men - women) + ' either voice, ' + men +
    ' a man, ' + women + ' a woman.',
  '',
  'European Portuguese only. A Brazilian delivery fails the product: the whole point is',
  'that a learner arrives in Lisbon and recognises what they hear.',
  '',
  '## How to read this',
  '',
  '- **Say it as you would say it.** These are not pronunciation samples, they are lines',
  '  a person would actually use. Contractions, elisions and swallowed vowels are correct;',
  '  a careful teacher-voice is not.',
  '- **Direction is binding where it names a register.** A line marked ONLY WITH PEOPLE WHO',
  '  LAUGH read sincerely teaches an insult the learner will misuse.',
  '- **Leave 0.5s of silence at each end.** The player trims nothing.',
  '- **One take per line, per marked voice.** Where a line is marked MAN or WOMAN, that is',
  '  a different line, not a different take of the same one — the gender lesson is built on',
  '  hearing both.',
  '- **File name = the slug in the left column**, as `<slug>.mp3`, dropped into',
  '  `public/audio/pt-PT/`. Anything already there is never overwritten by the generator.',
  '',
]

for (const [crate, group] of byCrate) {
  md.push('', '## ' + crate, '')
  let root: string | null | undefined
  for (const l of group) {
    if (l.root !== root) {
      root = l.root
      if (root) md.push('', '### ' + root, '')
    }
    const voice = l.speaker === 'any' ? '' : ' **[' + l.speaker.toUpperCase() + ']**'
    md.push('- `' + l.slug + '`' + voice + ' — **' + l.pt + '**  ')
    md.push('  _' + l.en + '_  ')
    md.push('  → ' + l.direction)
  }
}

md.push(
  '',
  '---',
  '',
  '## The Booth',
  '',
  'Every line here can also be spoken by a real person through the app. A studio take is',
  'the reference; community takes are what make it sound like a country rather than a',
  'product. Both are stored against the same slug, so a learner can hear the reference',
  'first and a Porto accent second without any content changing.',
  '',
)

await writeFile(join(out, 'RECORDING-SCRIPT.md'), md.join('\n'))

console.log(
  lines.length + ' lines → audio/RECORDING-SCRIPT.md and audio/recording-manifest.json (' +
    men + ' man, ' + women + ' woman, ' + (lines.length - men - women) + ' either)',
)
