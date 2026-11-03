/**
 * THE LEARNER'S OWN ENDING, held (2026-11-03).   npm run speaker
 *
 * Every room in Lisbon taught a woman to say obrigado. The fix is data (`f` on a line,
 * `answer_f` on a release) and one resolver (content/speaker.ts) — and the way it decays
 * is somebody writing the next "Muito obrigado" without its feminine. So this walks every
 * Portuguese line the app can put in front of a learner and fails on one whose words agree
 * with the speaker and carries no `f`.
 *
 * WHAT COUNTS AS AGREEING WITH THE SPEAKER is a list, and a list is the honest shape for
 * it: obrigado, and "sou"/"estou"/"fico" followed by an adjective or noun that inflects.
 * Words about somebody else ("foi simpático" — the person you thank), about a thing ("fica
 * pronto"), or a language ("fala inglês") are not the speaker and are not flagged.
 */
import { SITUATIONS } from '../content/situations'
import { DROP_SITUATIONS } from '../content/drops'
import { GEMS } from '../content/gems'
import { KNOWHOW } from '../content/knowhow'
import { LIFELINES, ROUNDS, QUESTIONS } from '../content/table-night'
import { voiced, said, otherEnding, isRelease } from '../content/speaker'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/* Obrigado anywhere; and the speaker describing themselves with an inflecting word. */
const SELF = /\bobrigado\b|\b(sou|estou|fico|ando|sinto-me|estava|fiquei)\s+(o\s+|um\s+|muito\s+|tão\s+|bem\s+|mesmo\s+|novo\s+)?(ingl[eê]s|escoc[eê]s|irland[eê]s|galês|franc[eê]s|alemão|holand[eê]s|americano|canadiano|australiano|estrangeiro|novo|cansado|perdido|sozinho|casado|divorciado|reformado|solteiro|viúvo|contente|encantado|preocupado|constipado|pronto|ocupado|interessado|atrasado|cheio|enjoado|magoado|ferido|assaltado|roubado|alérgico|vegetariano|diabético|mudado|instalado|registado|inscrito|convidado|apaixonado|nervoso|ansioso|chateado|confuso|enganado|habituado|sentado|vizinho|aluno|cliente\s+novo)\b/i
/* A feminine that still says it the masculine way has not been written. */
const STILL_M = /\bobrigado\b|\bsou ingl[eê]s\b|\bestrangeiro\b|\bo novo vizinho\b/i

type L = { where: string; pt: string; f?: string }
const lines: L[] = []
for (const s of [...SITUATIONS, ...DROP_SITUATIONS]) {
  s.lines.forEach((l, i) => lines.push({ where: s.id + ' line ' + (i + 1), pt: l.pt, f: l.f }))
  lines.push({ where: s.id + ' release', pt: s.release.answer, f: s.release.answer_f })
}
for (const g of GEMS) lines.push({ where: 'gem ' + g.id, pt: g.line.pt, f: g.line.f })
for (const k of KNOWHOW) lines.push({ where: 'know-how ' + k.id, pt: k.line.pt, f: k.line.f })
for (const l of LIFELINES as { pt: string; f?: string }[]) lines.push({ where: 'table lifeline', pt: l.pt, f: l.f })
for (const r of ROUNDS as { id: string; lines?: { pt: string; f?: string }[] }[]) for (const l of r.lines ?? []) lines.push({ where: 'table round ' + r.id, pt: l.pt, f: l.f })
for (const q of QUESTIONS as { pt: string; start?: { pt: string } }[]) {
  lines.push({ where: 'table question', pt: q.pt })
  if (q.start) lines.push({ where: 'table answer start', pt: q.start.pt })
}

console.log('\nevery line about the speaker has a feminine\n')
const missing = lines.filter((l) => SELF.test(l.pt) && !l.f)
ok('no speaker-gendered line without its `f`', missing.length === 0, missing.map((l) => l.where + ': ' + l.pt).slice(0, 5).join(' | ') || lines.length + ' lines read')
const unwritten = lines.filter((l) => l.f && (l.f === l.pt || STILL_M.test(l.f)))
ok('and every `f` is actually the feminine', unwritten.length === 0, unwritten.map((l) => l.where + ': ' + l.f).join(' | ') || lines.filter((l) => l.f).length + ' feminine lines')

console.log('\nthe resolver\n')
{
  const ola = SITUATIONS.find((s) => s.id === 'lisbon_ola')!
  const her = voiced(ola, 'f')
  ok('a woman is taught Obrigada', her.lines.some((l) => l.pt === 'Obrigada.') && her.release.answer === 'Boa tarde. Obrigada.')
  ok('a man, and nobody-said, keep the house line', voiced(ola, 'm') === ola && voiced(ola, null) === ola)
  ok('the same room twice is the same object (no re-render churn)', voiced(ola, 'f') === her)
  const plain = SITUATIONS.find((s) => !s.lines.some((l) => l.f) && !s.release.answer_f)!
  ok('a room with nothing gendered is untouched for a woman', voiced(plain, 'f') === plain, plain.id)
  const save = SITUATIONS.find((s) => s.id === 'lisbon_save')!
  ok('the save says Sou inglesa to a woman', voiced(save, 'f').release.answer.endsWith('Sou inglesa.'))
  const thanks = ola.lines.find((l) => l.f)!
  ok('unknown shows the other ending; known does not', otherEnding(thanks, null) === 'Obrigada.' && otherEnding(thanks, 'f') === null && otherEnding(thanks, 'm') === null)
  ok('said() leaves a line without `f` alone', said({ pt: 'Bom dia.' }, 'f').pt === 'Bom dia.')
  ok('either ending counts as the room said', isRelease('Boa tarde. Obrigado.', her) && isRelease('Boa tarde. Obrigada.', ola) && !isRelease('Boa tarde.', ola))
}

console.log('')
if (problems.length) {
  console.log('✗ ' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('✓ every learner is taught their own ending')
