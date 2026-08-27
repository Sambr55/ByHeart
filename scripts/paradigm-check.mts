/**
 * The paradigm table, checked against the language DUB already teaches.
 *
 *   npm run paradigms
 *
 * This is the gate that makes derived cards safe to generate. It does three jobs.
 *
 * The first is coverage: every lemma the content teaches has a paradigm, so a piece can
 * never be picked for a card whose other forms nobody has vouched for.
 *
 * The second is the interesting one, and it is a real check rather than a rubber stamp.
 * The content already contains sixty-odd forms that were authored one at a time, in
 * context, months apart — `és`, `tens`, `podes`, `não digas`, `esqueci-me`. If the table
 * disagrees with any of them then one of the two is wrong, and it is worth finding out
 * which BEFORE a generator starts producing sentences on the strength of it. Sixty
 * independent samples is not proof, and it is a great deal better than nobody looking.
 *
 * The third is the register. European Portuguese is the entire proposition — `comboio` not
 * `trem`, `dezasseis` not `dezesseis`, `tens` not `você tem` — and generated content is
 * exactly where that promise rots, quietly and at scale. So the markers are checked here,
 * in the one file every generated card will draw its Portuguese from.
 */
import { PIECES } from '../content/roots'
import { PARADIGM, PARADIGMS, everyForm, type Paradigm } from '../content/paradigms'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/**
 * A taught form, reduced to the word the paradigm would list.
 *
 * The content teaches language in use, so a form arrives wearing whatever it needs that
 * day: a negation (`não podes`), a clitic (`Dás-me`), a preposition (`preciso de…`), a
 * capital, an ellipsis, or a whole second word (`Vim aqui`). None of that is the verb.
 */
function words(target: string): string[] {
  return target
    .toLowerCase()
    .replace(/[…"“”'’.,!?]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** `esqueci-me` and `dás-me` are the same verb as `esqueci` and `dás`. */
const CLITIC = /-(me|te|se|nos|lhe|lhes|o|a|os|as)$/

function variants(word: string): string[] {
  const out = new Set<string>([word])
  if (CLITIC.test(word)) out.add(word.replace(CLITIC, ''))
  return [...out]
}

/** Everything a paradigm vouches for, plus the bare forms hiding inside its phrases. */
function known(p: Paradigm): Set<string> {
  const out = new Set<string>()
  for (const form of everyForm(p)) {
    for (const w of words(form)) for (const v of variants(w)) out.add(v)
  }
  return out
}

console.log('\nevery lemma the content teaches has a paradigm\n')
const lemmas = new Map<string, { id: string; target: string; form?: string }[]>()
for (const [id, piece] of Object.entries(PIECES)) {
  const lemma = (piece as { lemma?: string }).lemma
  if (!lemma) continue
  lemmas.set(lemma, [...(lemmas.get(lemma) ?? []), { id, target: piece.target, form: piece.form }])
}
const missing = [...lemmas.keys()].filter((l) => !PARADIGM[l])
ok('all ' + lemmas.size + ' of them', !missing.length, missing.join(' '))

/*
  And nothing spare. A paradigm for a word no learner owns generates cards nobody can be
  shown — the table is scoped to the content on purpose, and this is what keeps it there.
*/
const spare = PARADIGMS.map((p) => p.lemma).filter((l) => !lemmas.has(l))
ok('and no paradigm for a word nobody is taught', !spare.length, spare.join(' '))

console.log('\nand agrees with every form already in the content\n')
let checked = 0
const disagreements: string[] = []
for (const [lemma, taught] of lemmas) {
  const p = PARADIGM[lemma]
  if (!p) continue
  const vouched = known(p)
  for (const t of taught) {
    checked++
    // Any word of the taught phrase matching any vouched form is agreement: the phrase
    // carries prepositions and pronouns the paradigm has no business listing.
    const hit = words(t.target).some((w) => variants(w).some((v) => vouched.has(v)))
    if (!hit) disagreements.push(lemma + ': "' + t.target + '" {' + (t.form ?? '-') + '} is not in the table')
  }
}
console.log('  ' + checked + ' taught forms cross-checked')
ok('the table and the content say the same thing', !disagreements.length)
for (const d of disagreements) console.log('      ' + d)

console.log('\nEuropean Portuguese, in the one file generation draws from\n')
/*
  The markers that separate the two languages, and every one of them is a form an LLM
  produces confidently when asked for "Portuguese".
*/
const BRAZILIAN: [RegExp, string][] = [
  [/\bdezesse(is|te)\b/i, 'dezesseis/dezessete — pt-BR; European is dezasseis/dezassete'],
  [/\bdezenove\b/i, 'dezenove — pt-BR; European is dezanove'],
  [/\btrem\b/i, 'trem — pt-BR; European is comboio'],
  [/\bônibus\b/i, 'ônibus — pt-BR; European is autocarro'],
  [/\bcelular\b/i, 'celular — pt-BR; European is telemóvel'],
  [/\bvocê\s+(tem|és|estás|queres|podes)\b/i, 'você with a tu form — mixes the two registers'],
  [/\bestá\s+\w+ndo\b/i, 'está + gerund — pt-BR; European is está a + infinitive'],
  [/\bvós\b/i, 'vós — gone from the spoken language'],
]
const all = PARADIGMS.flatMap((p) => everyForm(p).map((f) => ({ lemma: p.lemma, f })))
const wrong = all.flatMap(({ lemma, f }) =>
  BRAZILIAN.filter(([re]) => re.test(f)).map(([, why]) => lemma + ' "' + f + '" — ' + why),
)
ok('no Brazilian forms', !wrong.length, wrong.join('; '))

/*
  The classic tell. Negative commands in Portuguese take the present subjunctive, and the
  form that gets generated instead is the indicative — `não diz` for `não digas`. Checked
  structurally: a negative imperative that is merely the affirmative with não in front of
  it is almost certainly wrong.
*/
const lazy = PARADIGMS.filter(
  (p): p is Extract<Paradigm, { kind: 'verb' }> => p.kind === 'verb',
).filter((p) => p.imperative_negative && p.imperative_negative === 'não ' + p.imperative)
ok(
  'negative commands are the subjunctive, not não + the indicative',
  !lazy.length,
  lazy.map((p) => p.lemma).join(' '),
)

console.log('\nthe table is internally sound\n')
const dupes = PARADIGMS.map((p) => p.lemma).filter((l, i, xs) => xs.indexOf(l) !== i)
ok('no lemma appears twice', !dupes.length, dupes.join(' '))

const verbs = PARADIGMS.filter((p): p is Extract<Paradigm, { kind: 'verb' }> => p.kind === 'verb')
const noPresent = verbs.filter((p) => !Object.keys(p.present).length)
ok('every verb has a present', !noPresent.length, noPresent.map((p) => p.lemma).join(' '))

// An impersonal verb has no first or second person — that is what impersonal means, and a
// generator that offered "eu há" would be obeying the table rather than the language.
const badImpersonal = verbs
  .filter((p) => p.impersonal)
  .filter((p) => p.present.eu || p.present.tu || p.present.nos)
ok(
  'impersonal verbs stay in the third person',
  !badImpersonal.length,
  badImpersonal.map((p) => p.lemma).join(' '),
)

const agreements = PARADIGMS.filter((p): p is Extract<Paradigm, { kind: 'agreement' }> => p.kind === 'agreement')
const halfAgreed = agreements.filter((p) => !p.m || !p.f)
ok('every agreement has both genders', !halfAgreed.length, halfAgreed.map((p) => p.lemma).join(' '))

console.log('\nwho has read it\n')
/*
  Deliberately reported and NOT failed. Every form here was authored rather than checked by
  somebody who speaks the language, and saying so in the gate output is the honest way to
  carry that until the reviewer exists — a green tick would be a lie about provenance.
  spec-derived-cards.md §08 blocks generation on this, not the table's existence.
*/
const reviewed = PARADIGMS.filter((p) => p.review === 'reviewed').length
console.log('  ' + reviewed + ' of ' + PARADIGMS.length + ' reviewed by a native speaker')
if (reviewed < PARADIGMS.length) {
  console.log('  ⚠ ' + (PARADIGMS.length - reviewed) + ' still need pt-PT review before any')
  console.log('    generated card built on them is shown to anybody')
}

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nevery taught form is in the table, and the table says nothing the content does not')
