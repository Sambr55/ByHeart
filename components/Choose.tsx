'use client'

import { useEffect, useRef, useState } from 'react'
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
export function Choose({
  onDone,
  onSand = true,
}: {
  onDone?: () => void
  /*
    Which ground this is drawn on, because one line in here has to know.

    The rows carry their own colours — they are solid by design, so they read the same on
    sand or on a photograph. The AND WHERE label does not: it is an `eyebrow text-muted`,
    which is rgb(99,92,80) on sand and near-invisible on a dark doorway. Measured that way
    on the set-up card: topmost element, full opacity, and unreadable.

    Wrapping the whole selector in `.shown-on-photo` fixed the label and broke the rows —
    that scope redefines --accent to white, and a selected row is `bg-accent
    text-accent-ink`, so Portuguese and Lisbon rendered white on white. One line needs the
    ground, so one line gets it.
  */
  onSand?: boolean
} = {}) {
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
    THE SECOND QUESTION HAS TO BE ON SCREEN TO BE ANSWERED.

    The city list appears below the five languages, and five rows plus the card's own
    headline and body is taller than the card: measured, Lisbon's row landed at y=712 with
    the bottom bar at 776, and The Algarve at 875 — off the bottom of a 844 screen
    entirely. So answering the first question revealed a second one that looked like
    nothing had happened, with the only clue below the fold.

    Scrolled to rather than re-laid-out, because the order is the point — the cities are a
    consequence of the language, so they belong under it. `block: 'center'` rather than
    'start' so the chosen language stays visible above them: the answer to the first
    question is the context for the second, and pushing it off the top would make the city
    list look like a screen of its own.

    In an effect keyed on `lang` rather than inside the click handler, because the section
    does not exist in the DOM until the render that follows the choice.
  */
  const cities_ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!lang) return
    const el = cities_ref.current
    if (!el) return
    /*
      Respecting the setting that asks for less movement: 'auto' still brings the list
      into view, it simply does not travel there.
    */
    const still =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    /*
      Scrolled so the BOTTOM of the section clears the bar, which is the only version that
      fits.

      Three tries, each measured. 'center' put the cities on screen and pushed the AND
      WHERE label off the top. 'nearest' kept the label and left The Algarve under the
      bottom bar at 844. The list plus its label is 262px and the space above the bar is
      776, so both fit — the browser's presets simply do not aim at that.

      So it is aimed by hand: put the section's bottom edge a gap above the bar, and the
      label comes with it. `.card-face` is the scroller here, which is why this is
      scrollTop arithmetic rather than another scrollIntoView.
    */
    const face = el.closest('.card-face') as HTMLElement | null
    if (!face) return
    const nav = document.querySelector('[data-testid="bottom-nav"]')
    const room = nav ? nav.getBoundingClientRect().top : window.innerHeight
    /* 16px, the product's own gap between a thing and the furniture under it. */
    const overshoot = el.getBoundingClientRect().bottom - room + 16
    if (overshoot <= 0) return
    face.scrollTo({ top: face.scrollTop + overshoot, behavior: still ? 'auto' : 'smooth' })
  }, [lang])

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
                  /*
                    A GROUND DARK ENOUGH TO BE A ROW, on the card that sits on a doorway.

                    Sam: "Darken the scrim on this page." The scrim itself was already
                    doing its job — the setup card takes the heavy inset-0 gradient and the
                    headline and body are legible on it. What was not legible was the list:
                    --bg-elev is the palette's lifted surface, tuned for a PAGE, and at 70%
                    for an unavailable row it let a photograph of a doorway through the
                    middle of five language names.

                    The note above this component already worked out why the obvious answer
                    fails: wrapping the selector in .shown-on-photo fixes the label and
                    turns a selected row white on white. So the ground is stated here
                    instead of inherited — near-black rather than the palette's slate,
                    because this surface sits on an image and has no page behind it to
                    relate to, and at 88% so the picture is faintly present rather than
                    punched out.

                    THE UNAVAILABLE ROWS ARE 82%, NOT 70%. Greyed has to mean "not
                    available" and never "hard to read" — Destination's own note, and the
                    reason those rows are solid at all. At 70% a bright doorway came
                    through the middle of French, Spanish and Italian, which reads as a
                    rendering fault rather than as a decision. The distinction between an
                    open row and a closed one is carried by the ink and the COMING label,
                    which is where it belongs.
                  */
                  className={
                    'tap-target flex w-full items-center justify-between gap-3 rounded border px-4 py-3 text-left transition ' +
                    (!p.available
                      ? 'border-line/60 text-muted ' + (onSand ? 'bg-bg-elev/70' : 'bg-[rgba(12,14,18,0.82)]')
                      : picked
                        ? 'border-accent bg-accent text-accent-ink'
                        : 'border-line text-fg ' + (onSand ? 'bg-bg-elev' : 'bg-[rgba(12,14,18,0.88)]'))
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
        <div ref={cities_ref} className="flex flex-col gap-3">
          <p className={'eyebrow ' + (onSand ? 'text-muted' : 'text-white/80')}>AND WHERE</p>
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
                  /* Same ground as the languages above — see the note on that row. */
                  className={
                    'tap-target flex w-full items-center justify-between gap-3 rounded border px-4 py-3 text-left transition ' +
                    (!c.open
                      ? 'border-line/60 text-muted ' + (onSand ? 'bg-bg-elev/70' : 'bg-[rgba(12,14,18,0.82)]')
                      : city === c.id
                        ? 'border-accent bg-accent text-accent-ink'
                        : 'border-line text-fg ' + (onSand ? 'bg-bg-elev' : 'bg-[rgba(12,14,18,0.88)]'))
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
