/**
 * City chapters.
 *
 * A chapter is a CITY, not a language. Lisbon and Faro both speak pt-PT, so the pair
 * cannot be the chapter — and a city is the right size for what a Club is actually for:
 * the people, places and references that make you belong somewhere. Those are
 * Lisbon-specific. Portugal is an abstraction; Lisbon is a street.
 *
 * Three layers decide what a second chapter costs:
 *
 *   language — pt-PT, the ladder, the vibes.        Shared by every chapter here.
 *   country  — the NIF, the Junta, national figures. Shared by every chapter here.
 *   city     — places, local people, local moments.  One chapter only.
 *
 * That split is the whole reason Faro is cheap. If a chapter needed the language layer
 * rebuilt, chapters would not scale and there would only ever be one.
 */
import { DEFAULT_PAIR, pairId } from '@/content/pairs'

export type ChapterId = 'lisbon' | 'cascais' | 'sintra' | 'porto' | 'algarve'

export interface Chapter {
  id: ChapterId
  /** What it is called, everywhere. */
  name: string
  city: string
  /** On screen, in the language they are learning: Lisboa, Cascais, Sintra. */
  pt: string
  /** The three letters on the boarding pass (components/Booker.tsx). Not airport codes: DUB's own. */
  code: string
  country: string
  /** The language its members are learning. Many chapters, one pair. */
  pair: string
  /** IANA zone, for anything time-pegged. */
  zone: string
  /**
   * Open chapters have members. A chapter that is not open is named honestly as not
   * open — never as "coming soon" with a form attached, which is the thing the language
   * picker already refuses to do.
   */
  open: boolean
  /**
   * THE AGE AT WHICH SOMEBODY MAY CONSENT TO THEIR OWN DATA, in this country.
   *
   * GDPR Article 8 sets the default at 16 and lets each member state lower it to 13.
   * Portugal chose 13; so did the UK and Denmark. Ireland and the Netherlands kept 16.
   * That variation is the reason this is a property of the place rather than a constant:
   * a learner in Lisbon and a learner in Amsterdam are owed different answers, and a
   * hardcoded 16 would lock out thirteen-year-olds who are legally entitled to be here.
   *
   * It is ALSO the lesson, which is the whole point of it being content. Sam: "Obviously
   * yes we block 13 unders — or whatever is specific to the country. Again I see that as
   * part of the learning. In Portugal you must be..." So the number a learner is told is
   * a fact about the country they are learning about, said in Portuguese, rather than a
   * checkbox they tick.
   *
   * Not legal advice and not the only rule that applies — see content/consent.ts, which
   * says what is actually done with it.
   */
  consent_age: number
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'lisbon',
    name: 'Dub Club — Lisbon',
    city: 'Lisbon',
    pt: 'Lisboa',
    code: 'LIS',
    country: 'Portugal',
    pair: pairId(DEFAULT_PAIR),
    zone: 'Europe/Lisbon',
    open: true,
    consent_age: 13,
  },
  /*
    CASCAIS AND SINTRA (Sam, 2026-11-05: "In a while we are going to stand up Cascais and
    Sintra as an alternative to Lisbon … lets do the cascais and sintra from airline selector
    onwards"). Towns of the same language and country, forty minutes from Lisbon on the train
    — so the language layer, the country layer and every room are shared, and only the city
    layer is their own: bairros, gems, walks, venues (content/towns/).

    `open: true` here means BUILT. Whether the selector offers it is chapterOpen() below: a
    town opens only once it has venues a person has checked (production shows verified gems
    only), so until then the live app names it as not open yet and preview builds show it
    whole for review.
  */
  {
    id: 'cascais',
    name: 'Dub Club — Cascais',
    city: 'Cascais',
    pt: 'Cascais',
    code: 'CAS',
    country: 'Portugal',
    pair: pairId(DEFAULT_PAIR),
    zone: 'Europe/Lisbon',
    open: true,
    consent_age: 13,
  },
  {
    id: 'sintra',
    name: 'Dub Club — Sintra',
    city: 'Sintra',
    pt: 'Sintra',
    code: 'SNT',
    country: 'Portugal',
    pair: pairId(DEFAULT_PAIR),
    zone: 'Europe/Lisbon',
    open: true,
    consent_age: 13,
  },
  /*
    The two that are not open yet, listed and greyed rather than explained.

    They were one chapter with a paragraph of copy about which was built and which was not.
    A closed door does not need a speech: greying it out says everything the sentence did,
    in less time, without making the product sound like it is apologising for itself.

    Porto and the Algarve rather than Faro, because they are the two places somebody
    choosing Portugal would actually name — Faro is an airport more than a destination.
  */
  {
    id: 'porto',
    name: 'Dub Club — Porto',
    city: 'Porto',
    pt: 'Porto',
    code: 'OPO',
    country: 'Portugal',
    pair: pairId(DEFAULT_PAIR),
    zone: 'Europe/Lisbon',
    open: false,
    consent_age: 13,
  },
  {
    id: 'algarve',
    name: 'Dub Club — The Algarve',
    city: 'The Algarve',
    pt: 'Algarve',
    code: 'FAO',
    country: 'Portugal',
    pair: pairId(DEFAULT_PAIR),
    zone: 'Europe/Lisbon',
    open: false,
    consent_age: 13,
  },
]

export const DEFAULT_CHAPTER: ChapterId = 'lisbon'

export function chapterById(id: ChapterId | null | undefined): Chapter {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0]
}

/** The chapters a learner on this pair could belong to. */
export function chaptersFor(pair: string): Chapter[] {
  return CHAPTERS.filter((c) => c.pair === pair)
}

export function openChapters(): Chapter[] {
  return CHAPTERS.filter((c) => c.open)
}
