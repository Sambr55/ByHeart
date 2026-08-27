import { CRATES, PIECES, type CultureFamily, type Piece } from '@/content/roots'
import {
  PARADIGM,
  PERSON_ORDER,
  VOUCHED,
  type Paradigm,
  type Person,
  type VerbParadigm,
} from '@/content/paradigms'

/**
 * Cards assembled from what somebody already owns.
 *
 * The third supply. Not written by us and not written by members — built out of a piece
 * they learned three weeks ago, in a sentence they have not met. Supply proportional to
 * how much they have learned, which is the right shape: two vibes in you get a handful,
 * eight vibes in there is more than you can get through.
 *
 * The rule the whole thing hangs on, from spec-derived-cards.md §02:
 *
 *   A derived card ASSEMBLES. It never invents. Every Portuguese word it shows already
 *   exists in the repo, authored and reviewed.
 *
 * Nothing in this file writes Portuguese. It picks a form out of the paradigm table and
 * puts it beside the piece the learner already has, and `assertVouched` is the belt to
 * that braces — a card whose target is not in the table does not get made.
 *
 * And the principle that stops it feeling like Duolingo, from §00: **repeat the piece,
 * never repeat the card.** A piece can come back twenty times. A card is used once.
 */

export type DerivedKind = 'next_person' | 'near_miss'

export interface DerivedCard {
  /** Stable, so a card that has been done can never be made again. */
  id: string
  kind: DerivedKind
  /** The piece they already have. */
  from: { id: string; target: string; gloss: string; family: CultureFamily }
  /**
   * Provenance, as a fragment that sits UNDER the eyebrow rather than repeating it.
   *
   * "BECAUSE YOU LEARNED / you have been saying bom" said it twice and read as a stammer.
   * The eyebrow carries the sentence; this carries the evidence — the word, and where.
   */
  because: string
  /** The new form. Every character of this came out of the paradigm table. */
  target: string
  en: string
  /** One sentence saying what changed. Never two — one new thing per card. */
  note: string
}

/** Which vibe it came from, said the way a person would say it. */
function vibeName(family: CultureFamily): string {
  return CRATES.find((c) => c.id === family)?.title ?? 'a vibe'
}

/**
 * The English for a person, assembled from the two authored strings.
 *
 * `impersonal` verbs have no first or second person to speak of, so `há` is "there is"
 * whoever is talking, and the person label would be a lie.
 */
function englishFor(p: VerbParadigm, person: Person): string {
  if (p.impersonal) return p.en.third
  const verb = person === 'ele' ? p.en.third : p.en.base
  const subject: Record<Person, string> = {
    eu: 'I',
    tu: 'you',
    ele: 'he',
    nos: 'we',
    eles: 'they',
  }
  // "am/are" is one string doing two jobs, because I and you disagree in English and
  // nowhere else. Resolved here rather than authored twice.
  const resolved = verb.includes('/')
    ? verb.split('/')[person === 'eu' ? 0 : 1]
    : verb
  return subject[person] + ' ' + resolved
}

/** Which person a taught `form` string names. The content writes them in prose. */
function personOf(form: string | undefined): Person | null {
  if (!form) return null
  const f = form.toLowerCase()
  // Order matters: "he/she" contains no "I", but "I, negative" starts with one.
  if (/^we\b/.test(f)) return 'nos'
  if (/^they\b/.test(f)) return 'eles'
  if (/^(he|she|it)\b/.test(f)) return 'ele'
  if (/^you\b/.test(f)) return 'tu'
  if (/^i\b/.test(f)) return 'eu'
  return null
}

/** Is this a form of the verb rather than a tense they have not met? */
function isPresent(p: VerbParadigm, person: Person, target: string): boolean {
  const bare = target.toLowerCase().replace(/[…".,!?]/g, '').trim()
  const form = p.present[person]
  return Boolean(form && bare.includes(form.toLowerCase()))
}

/**
 * Family 3 — the next person.
 *
 * The grammar family, and the reason the paradigm table had to exist. Somebody who owns
 * `quero` can order and cannot offer; `queres` is the sentence they need next. A
 * conjugation arrives as a person they can now speak to, never as a paradigm.
 *
 * Persons come in life's order — eu, tu, ele, nós, eles — because you arrive needing
 * things, then include somebody, then talk about somebody. Never a table, and never more
 * than one step at a time.
 */
function nextPerson(
  piece: Piece & { id: string },
  owned: Set<string>,
  ownedForms: Set<string>,
): DerivedCard | null {
  const lemma = piece.lemma
  if (!lemma) return null
  const p = PARADIGM[lemma]
  if (!p || p.kind !== 'verb' || p.impersonal) return null

  const have = personOf(piece.form)
  if (!have) return null
  // Only from a plain present form. Extending `queria` (softened) or `falei` (past) to a
  // second person would be teaching two new things at once.
  if (!isPresent(p, have, piece.target)) return null

  // Every person of this verb the learner already holds, so the card never offers one back.
  const held = new Set<Person>()
  for (const other of Object.values(PIECES) as Piece[]) {
    if (other.lemma !== lemma) continue
    const who = personOf(other.form)
    if (who && owned.has(keyOf(other))) held.add(who)
  }
  held.add(have)

  /*
    And never a form they already hold under a different piece.

    Holding the PERSON is not the same as holding the FORM. the_basics teaches obrigado and
    obrigada as two separate pieces, and james_bond teaches both genders of inglês — so a
    card derived from one of a pair happily offered the other, which is being handed a word
    you have been using for a month. The most Duolingo-ish failure available here, and it
    was live until the gate went looking.
  */
  const next = PERSON_ORDER.find(
    (who) => !held.has(who) && p.present[who] && !ownedForms.has(p.present[who]!.toLowerCase()),
  )
  if (!next) return null
  const target = p.present[next]!

  return {
    id: 'derived_next_' + lemma + '_' + next,
    kind: 'next_person',
    from: { id: piece.id, target: piece.target, gloss: piece.gloss, family: piece.family },
    because: piece.target.trim() + ' — ' + vibeName(piece.family),
    target,
    en: englishFor(p, next),
    note: NOTE[next] ?? 'Same verb, a different person.',
  }
}

/**
 * What changes, in one sentence, and never two.
 *
 * `tu` gets the longest note because it is not a grammar point in Lisbon — it is a social
 * judgement about closeness that somebody has to make out loud, to a stranger, at a
 * counter. Teaching the second person IS teaching a piece of culture, and it is why this
 * does not read as a conjugation drill.
 */
const NOTE: Partial<Record<Person, string>> = {
  eu: 'Same verb. This is the one you say about yourself.',
  tu: 'Same verb. You have been asking for things — this is the one you say to somebody else. Portugal still uses tu with people it is warm towards, which is a choice you get to make.',
  ele: 'Same verb, talking about somebody rather than to them.',
  nos: 'Same verb, making a plan. This is the one an invitation is built out of.',
  eles: 'Same verb, more than one of them.',
}

/**
 * Family 4 — the near miss.
 *
 * `obrigado` agrees with whoever is SAYING it, which is the commonest mistake an English
 * speaker makes in Portuguese and among the most useful things anybody can be told.
 */
function nearMiss(piece: Piece & { id: string }, ownedForms: Set<string>): DerivedCard | null {
  const lemma = piece.lemma
  if (!lemma) return null
  const p = PARADIGM[lemma]
  if (!p || p.kind !== 'agreement') return null

  const bare = piece.target.trim().toLowerCase()
  const other = bare === p.m.toLowerCase() ? p.f : bare === p.f.toLowerCase() ? p.m : null
  if (!other) return null
  // See nextPerson: the pair is frequently taught in one vibe, and telling somebody about
  // a word they already own is the failure this whole family exists to avoid.
  if (ownedForms.has(other.toLowerCase())) return null

  const saidBy = /said by a (man|woman)/i.exec(piece.form ?? '')
  /*
    Written from the reader's side of the screen. "The other one agrees with a feminine
    noun" is ambiguous on a card whose whole subject IS the other one — so it names which
    way the agreement runs, and for obrigado it names the mistake worth not making.
  */
  const feminine = other.toLowerCase() === p.f.toLowerCase()
  const note = saidBy
    ? 'It agrees with whoever is saying it, not with the person you are saying it to. Say ' +
      p.f +
      ' if you are a woman, ' +
      p.m +
      ' if you are a man.'
    : feminine
      ? 'This is the one that goes with a feminine noun.'
      : 'This is the one that goes with a masculine noun.'

  return {
    id: 'derived_near_' + lemma,
    kind: 'near_miss',
    from: { id: piece.id, target: piece.target, gloss: piece.gloss, family: piece.family },
    because: piece.target.trim() + ' — ' + vibeName(piece.family),
    target: other,
    en: p.gloss,
    note,
  }
}

/** The inventory is keyed by piece id, and Piece drops its own id. Recover it. */
const KEY = new Map<Piece, string>()
for (const [id, piece] of Object.entries(PIECES)) KEY.set(piece, id)
function keyOf(p: Piece): string {
  return KEY.get(p) ?? ''
}

/**
 * Every Portuguese string on a card exists in the table. The belt to §02's braces.
 *
 * Cheap, exact, and it is what makes the difference between infinite supply you can trust
 * and infinite supply that quietly teaches Brazilian. A card that fails this is dropped
 * rather than shown, because a wrong card is worse than an empty feed.
 */
export function vouched(card: DerivedCard): boolean {
  return VOUCHED.has(card.target.toLowerCase())
}

/**
 * The cards this learner could be shown, best first.
 *
 * Deliberately returns everything rather than a page of them. Rationing is a decision for
 * the feed — §06 of the spec is clear that a bottomless supply of derived cards is the
 * Duolingo treadmill rebuilt out of better parts — and it belongs where the ordering
 * happens, not here.
 */
export function derivedFor(opts: {
  inventory: Record<string, unknown>
  /** Cards already performed. A card is used once, ever. */
  finished: string[]
}): DerivedCard[] {
  const owned = new Set(Object.keys(opts.inventory ?? {}))
  const done = new Set(opts.finished ?? [])
  // Every Portuguese string this learner already holds, however they came by it.
  const ownedForms = new Set(
    [...owned].map((id) => PIECES[id]?.target.trim().toLowerCase()).filter(Boolean) as string[],
  )
  const out: DerivedCard[] = []
  const seen = new Set<string>()

  for (const id of owned) {
    const piece = PIECES[id]
    if (!piece) continue
    const withId = { ...piece, id }
    for (const card of [nextPerson(withId, owned, ownedForms), nearMiss(withId, ownedForms)]) {
      if (!card) continue
      if (seen.has(card.id) || done.has(card.id)) continue
      if (!vouched(card)) continue
      seen.add(card.id)
      out.push(card)
    }
  }

  // Near misses first: they correct something somebody is doing wrong today, where a next
  // person adds something they cannot do yet. Being wrong beats being incomplete.
  return out.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'near_miss' ? -1 : 1))
}

export type { Paradigm }
