import { COLLISIONS, CRATES, PIECES, type CultureFamily, type Piece } from '@/content/roots'
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

export type DerivedKind = 'next_person' | 'near_miss' | 'collision'

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
  /**
   * For a collision: each piece and the vibe it came from, kept apart.
   *
   * These used to be flattened into `because` as
   * "sim — The basics, in songs you know   ·   três — The world of wizardry", set in the
   * Portuguese face, at the top of the card. Two languages, two registers and two vibes in
   * one line of one typeface, and it read exactly as it looks written out: as though the
   * app had confused a song with a wizard. The claim being made — you learned these in
   * different places and nobody taught you the combination — was the most interesting
   * thing on the screen and it was illegible.
   */
  sources?: { target: string; vibe: string }[]
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

  /*
    A bare infinitive is not a person, and that is a card rather than a dead end.

    `deixar` and `mudar` arrive as the naked verb — somebody who has met "to change" cannot
    yet say "I change", so the first person is exactly what is missing. Everything else
    still has to come from a plain present: extending `queria` (softened) or `falei` (past)
    to a second person would teach two new things at once.
  */
  const infinitive = piece.target.trim().toLowerCase() === p.infinitive.toLowerCase()
  const have = personOf(piece.form)
  if (!infinitive) {
    if (!have) return null
    if (!isPresent(p, have, piece.target)) return null
  }

  // Every person of this verb the learner already holds, so the card never offers one back.
  const held = new Set<Person>()
  for (const other of Object.values(PIECES) as Piece[]) {
    if (other.lemma !== lemma) continue
    const who = personOf(other.form)
    if (who && owned.has(keyOf(other))) held.add(who)
  }
  if (have) held.add(have)

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

  /*
    Substituted into the phrase rather than served bare.

    Half of these live inside something somebody actually says — `estou farto`, `não sou
    bom` — and a card that answered with the lone word `farta` would be a dictionary entry.
    Swapping the one word keeps the sentence, which is the thing they will use.
  */
  const bare = piece.target.trim()
  const swap = (from: string, to: string): string | null => {
    const re = new RegExp('(^|\\s)' + from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|\\s|[.,!?])', 'i')
    return re.test(bare) ? bare.replace(re, (_m, lead: string) => lead + to) : null
  }
  const other = swap(p.m, p.f) ?? swap(p.f, p.m)
  if (!other) return null
  const newWord = other.toLowerCase().includes(p.f.toLowerCase()) ? p.f : p.m
  // See nextPerson: the pair is frequently taught in one vibe, and telling somebody about
  // a word they already own is the failure this whole family exists to avoid.
  if (ownedForms.has(other.toLowerCase())) return null

  const saidBy = /said by a (man|woman)/i.exec(piece.form ?? '')
  /*
    Written from the reader's side of the screen. "The other one agrees with a feminine
    noun" is ambiguous on a card whose whole subject IS the other one — so it names which
    way the agreement runs, and for obrigado it names the mistake worth not making.
  */
  const feminine = newWord.toLowerCase() === p.f.toLowerCase()
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

/**
 * Family 1 — collisions, which were already written and were barely being met.
 *
 * Sixty-eight of these are authored, each requiring two pieces from different vibes, each
 * carrying a provenance line somebody wrote by hand: "A Beatles single and a Bridget Jones
 * disaster, in one order." They are the best evidence in the product that unrelated
 * memories have started behaving like one language.
 *
 * And the journey serves at most ONE per session, so a learner eight vibes in has unlocked
 * thirty and met a handful. Nothing here is generated — this is authored content being
 * scheduled by what somebody owns, which is what `requires` was for, and it is the highest
 * quality supply available with no invention risk whatsoever.
 */
function collisions(owned: Set<string>, done: Set<string>): DerivedCard[] {
  return COLLISIONS.filter(
    (c) => !done.has('derived_collision_' + c.id) && c.requires.every((p) => owned.has(p)),
  ).flatMap((c): DerivedCard[] => {
    const pieces = c.requires.map((id) => ({ id, piece: PIECES[id] })).filter((x) => x.piece)
    if (!pieces.length) return []
    /*
      The picture comes from the vibe that is NOT the basics where there is one. Every
      collision leans on the basics — that is what the basics are for — so taking the first
      required piece would put the same photograph on most of them.
    */
    const lead = pieces.find((x) => x.piece.family !== 'the_basics') ?? pieces[0]
    return [
      {
        id: 'derived_collision_' + c.id,
        kind: 'collision',
        from: {
          id: lead.id,
          target: lead.piece.target,
          gloss: lead.piece.gloss,
          family: lead.piece.family,
        },
        /*
          The face gets the pieces alone, which is what a glance can take: two Portuguese
          words joined by a plus. Where they came from is the payoff, and it belongs on the
          screen that has room to say it in a sentence.
        */
        because: pieces.map((x) => x.piece.target.trim()).join(' + '),
        sources: pieces.map((x) => ({
          target: x.piece.target.trim(),
          vibe: vibeName(x.piece.family),
        })),
        target: c.answer,
        en: c.ask,
        note: c.provenance,
      },
    ]
  })
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
  /*
    An authored collision is vouched by having been authored — its sentence went through
    `npm run lint:content` and the QA sheet like every other line in the product. The
    paradigm table is the guarantee for the forms this file ASSEMBLES, and a sentence
    somebody wrote needs a different one, not a weaker one.
  */
  if (card.kind === 'collision') return true
  /*
    Per word, because a near-miss card carries a phrase now: `estou farta` is one word out
    of the table and one word carried through from something the learner already owns. The
    rule is that nothing NEW appears which the table has not vouched for — carried context
    was already authored, somewhere else, and vouched for there.
  */
  const carried = new Set(card.from.target.toLowerCase().split(/\s+/))
  return card.target
    .toLowerCase()
    .split(/\s+/)
    .every((w) => VOUCHED.has(w) || carried.has(w))
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
  const out: DerivedCard[] = [...collisions(owned, done)]
  const seen = new Set<string>(out.map((c) => c.id))

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

  /*
    Near misses first — they correct something somebody is doing wrong today, and being
    wrong beats being incomplete. Then collisions, which are the best cards here and the
    whole compounding claim made visible. Then the next person, which adds something new
    rather than joining up what is already there.
  */
  const rank: Record<DerivedKind, number> = { near_miss: 0, collision: 1, next_person: 2 }
  return out.sort((a, b) => rank[a.kind] - rank[b.kind])
}

export type { Paradigm }


/**
 * A derived card by id, ignoring whether it has been done.
 *
 * `derivedFor` deliberately hides what is finished, because that is what stops it coming
 * round again. The profile needs the opposite: it is the record of what HAS been done, and
 * a card it cannot resolve is a card that silently disappears from somebody's history.
 */
export function derivedById(
  id: string,
  inventory: Record<string, unknown>,
): DerivedCard | undefined {
  return derivedFor({ inventory, finished: [] }).find((c) => c.id === id)
}
