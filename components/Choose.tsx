'use client'

import { useState } from 'react'
import { CHAPTERS } from '@/content/chapters'
import { PAIRS, pairId, type Pair } from '@/content/pairs'
import { track } from '@/engine/analytics'
import { setChapter } from '@/engine/learner'
import { setPair } from '@/engine/pair'

/**
 * WHAT ARE WE LEARNING, AND WHERE — the question the product answers without ever asking.
 *
 * Sam, on the ASK card: "we haven't asked them what language we are learning yet, so how do
 * we know to return the answers in Portuguese. The same goes for the tagline — European
 * Portuguese."
 *
 * He is right, and it has a history rather than being an oversight. WHERE TO asked the city
 * and was removed when the sequence went to eight screens; the city became a silent write
 * inside set-up, and the language was never asked at all — every screen reads DEFAULT_PAIR.
 * So a stranger four cards in is shown European Portuguese, told the header strapline says
 * "European Portuguese, and the places you will use it", and handed a translator that
 * answers in a language nobody offered them.
 *
 * LANGUAGE FIRST, THEN THE CITIES THAT SPEAK IT, and that order is forced by the data
 * rather than chosen for looks. content/chapters.ts says it outright: a chapter is a CITY,
 * not a language, and many chapters share one pair. Lisbon, Porto and the Algarve are all
 * pt-PT. A flat two-column picker would therefore let somebody put French beside Lisbon,
 * which is not a combination that exists — so the city list is derived from the language
 * above it and cannot offer a pairing the product cannot teach.
 *
 * WHY THE UNAVAILABLE ONES ARE HERE AT ALL. Both content files already argue for it and
 * this only follows them: "The unavailable ones are listed rather than hidden because a
 * learner deciding whether this is for them is owed the shape of the plan" (pairs.ts), and
 * greying a closed chapter "says everything the sentence did, in less time, without making
 * the product sound like it is apologising for itself" (chapters.ts).
 *
 * AND A DISABLED ROW IS NEVER AN EMAIL CAPTURE. pairs.ts states the rule and the deal
 * screen makes the promise: nothing here takes an address and offers to let you know. A
 * greyed row is a roadmap, and it stays one.
 */
export function Choose({ onDone }: { onDone?: () => void } = {}) {
  /*
    NOTHING IS PRE-SELECTED, which Destination learned the hard way.

    Its note: reading the stored value meant anybody who had been through set-up once met
    the card with Lisbon already highlighted — "which turns a question into a confirmation
    and makes the one action the card wants look as though it has already been taken."
    The same trap is worse here, because the whole point is that the question has never
    actually been put.
  */
  const [lang, setLang] = useState<Pair | null>(null)
  const [city, setCity] = useState<string | null>(null)

  /*
    The cities that speak the chosen language, and none before one is chosen.

    Empty until a language is picked: a city list under no language would be asking the
    second question first.
  */
  const cities = lang ? CHAPTERS.filter((c) => c.pair === pairId(lang)) : []

  return (
    <div data-testid="choose" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {/*
          NO LABEL OVER THE FIRST LIST. The card face already asked the question.

          Destination's note, and the same fault: "This rendered its own eyebrow and
          headline while the face rendered the same ones, so WHERE TO appeared twice, one
          above the other." Here it was worse by one — the eyebrow said YOUR LANGUAGE, the
          headline asked what we are learning, and then a third line repeated WHAT ARE WE
          LEARNING immediately under it.

          The second list keeps its label because nothing above it says "and where", and
          because it appears late: a list that arrives after a tap needs to say what it is.
        */}
        <ul className="flex flex-col gap-3">
          {PAIRS.map((p) => {
            const id = pairId(p)
            const picked = lang !== null && pairId(lang) === id
            return (
              <li key={id}>
                <button
                  type="button"
                  data-testid={'lang-' + p.target_locale}
                  disabled={!p.available}
                  aria-pressed={picked}
                  onClick={() => {
                    /*
                      Choosing a language DROPS the city, rather than keeping it.

                      Every chapter today is Portuguese, so a stale city could not survive
                      a change of language — and the moment a second language has chapters,
                      keeping the old one would pair Paris with Portuguese. Clearing is the
                      version that stays correct when the content catches up.
                    */
                    setLang(p)
                    setCity(null)
                    track('language_chosen', { locale: p.target_locale })
                  }}
                  /*
                    Solid grounds, because this sits over a photograph.

                    Destination's own note, kept: the closed rows were translucent and
                    legible on sand but a smear on a picture. Greyed has to mean "not
                    available", never "hard to read" — a row somebody squints at reads as
                    a rendering fault rather than as a decision.
                  */
                  className={
                    'tap-target flex w-full items-center justify-between gap-3 rounded border px-4 py-3 text-left transition ' +
                    (!p.available
                      ? 'border-line/60 bg-bg-elev/70 text-muted'
                      : picked
                        ? 'border-accent bg-accent text-accent-ink'
                        : 'border-line bg-bg-elev text-fg')
                  }
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {/* The flag is decoration beside a name, never the name itself. */}
                    <span aria-hidden className="text-lg">
                      {p.flag}
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="display text-lg">{p.label}</span>
                      <span className={'text-sm ' + (picked ? 'opacity-80' : 'text-muted')}>
                        {p.native}
                      </span>
                    </span>
                  </span>
                  {/*
                    COMING, not "not available" — the same fact and the opposite feeling.
                    One is a refusal, the other is a roadmap, and Destination already
                    settled on this word.
                  */}
                  {p.available ? null : <span className="eyebrow shrink-0 text-muted">COMING</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/*
        The second question arrives only once the first is answered.

        Showing both at once would be a form. This is two taps in sequence, and the city
        list is a consequence of the language rather than a second unrelated decision.
      */}
      {lang ? (
        <div className="flex flex-col gap-3">
          <p className="eyebrow text-muted">AND WHERE</p>
          <ul className="flex flex-col gap-3">
            {cities.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  data-testid={'city-' + c.id}
                  disabled={!c.open}
                  aria-pressed={city === c.id}
                  onClick={() => {
                    /*
                      Both facts written together, because they are one answer.

                      setPair before setChapter: the pair decides WHICH learner record is
                      read, so writing the chapter first would land it in the outgoing
                      record. SetUp's finish() has the same ordering for the same reason.
                    */
                    /*
                      The four fields that ARE the pair, not the row that displayed it.

                      PAIRS entries carry label, native, flag and available for rendering.
                      Writing the whole object would put presentation into the learner
                      record and into the key it is stored under — and `available: false`
                      persisted beside somebody's work is a fact about a screen, not about
                      them. DEFAULT_PAIR has exactly these four.
                    */
                    setPair({
                      source_culture: lang.source_culture,
                      target_language: lang.target_language,
                      target_locale: lang.target_locale,
                      day_zone: lang.day_zone,
                    })
                    setChapter(c.id)
                    setCity(c.id)
                    track('chapter_chosen', { chapter: c.id, locale: lang.target_locale })
                    onDone?.()
                  }}
                  className={
                    'tap-target flex w-full items-center justify-between gap-3 rounded border px-4 py-3 text-left transition ' +
                    (!c.open
                      ? 'border-line/60 bg-bg-elev/70 text-muted'
                      : city === c.id
                        ? 'border-accent bg-accent text-accent-ink'
                        : 'border-line bg-bg-elev text-fg')
                  }
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="display text-lg">{c.city}</span>
                    <span className={'text-sm ' + (city === c.id ? 'opacity-80' : 'text-muted')}>
                      {c.country}
                    </span>
                  </span>
                  {c.open ? null : <span className="eyebrow shrink-0 text-muted">COMING</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
