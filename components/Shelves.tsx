'use client'

import { useMemo, useState } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { slugFor } from '@/content/audio-manifest'
import { PIECES, SHELVES, displayForm, fold, formsOf, type Piece, type Shelf } from '@/content/roots'

/**
 * Pieces, shelved.
 *
 * The vocab rebuild replaced the flat wall of chips on /vocab and never touched the two
 * places inside the journey that render the same thing — so the fix looked unimplemented
 * when it simply was not there. This is that list, extracted: one implementation, three
 * surfaces.
 *
 * A flat flex-wrap of every piece a learner owns grows every session and says nothing
 * about what just happened, which is what made the end of a crate feel like a mess.
 */

export interface ShelfEntry {
  key: string
  head: Piece
  headId: string
  shelf: Shelf
  forms: { id: string; piece: Piece }[]
  owned: boolean
  ownedForms: number
}

/** Collapse the forms of one word into a single entry. */
export function buildEntries(owned: Set<string>, pool?: Set<string>): ShelfEntry[] {
  const out: ShelfEntry[] = []
  const claimed = new Set<string>()
  for (const [id, piece] of Object.entries(PIECES)) {
    if (claimed.has(id)) continue
    if (pool && !pool.has(id) && !piece.lemma) continue
    if (piece.lemma) {
      const all = formsOf(piece.lemma)
      all.forEach((f) => claimed.add(f.id))
      if (pool && !all.some((f) => pool.has(f.id))) continue
      const seen = new Set<string>()
      const forms = all.filter((f) => {
        const k = fold(f.piece.target)
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
      const lead = forms.find((f) => owned.has(f.id)) ?? forms[0]
      out.push({
        key: 'lemma:' + piece.lemma,
        head: lead.piece,
        headId: lead.id,
        shelf: piece.shelf,
        forms,
        owned: forms.some((f) => owned.has(f.id)),
        ownedForms: forms.filter((f) => owned.has(f.id)).length,
      })
    } else {
      claimed.add(id)
      out.push({
        key: id,
        head: piece,
        headId: id,
        shelf: piece.shelf,
        forms: [{ id, piece }],
        owned: owned.has(id),
        ownedForms: owned.has(id) ? 1 : 0,
      })
    }
  }
  return out
}

/**
 * Shelved, collapsed, and marking what is new.
 *
 * `highlight` is what makes this usable at the end of a crate: the point of that screen
 * is what you gained just now, not an inventory that grows for ever.
 */
export function Shelves({
  owned,
  pool,
  highlight,
  startOpen,
  rows,
}: {
  owned: Set<string>
  /** Restrict to these pieces. Omit to shelve the whole bank. */
  pool?: Set<string>
  /** Drawn in the accent and marked new. */
  highlight?: Set<string>
  startOpen?: Shelf
  /**
   * A ROW PER WORD, ON A CARD — what a summary screen asks for, rather than the chips.
   *
   * Sam, on the end-of-sitting screen: "a better Hinge based approach to how we display
   * these summary words." What was there was a wrapped line of bare Portuguese sitting
   * directly on the sand — `ser · inglês · adeus · chamo-me… · obrigado · olá` — with no
   * English beside it, no way to hear any of it, and a hairline rule for a heading.
   * The screen's one job is to answer "what did I just get", and the answer was a list of
   * words the learner had met twenty seconds ago and could neither translate nor
   * pronounce without going and finding them again.
   *
   * So on a summary the shelf becomes what the rest of the product already is: a white
   * card on the sand, a row per word, and on each row the speaker, the Portuguese, and
   * what it means. Three facts, in the order you need them.
   *
   * WHY IT IS A FLAG AND NOT A SECOND COMPONENT. The grouping, the lemma collapse, the
   * sorting and the pooling are the hard half of this file and they are identical in both
   * shapes — splitting would be the two-definitions-of-one-thing fault this codebase has
   * paid for repeatedly. Only the drawing differs, so only the drawing branches.
   *
   * The chips stay the default because /vocab and any inventory view want density: a
   * learner with 170 pieces does not want 170 rows, and there the words are being scanned
   * rather than read.
   */
  rows?: boolean
}) {
  const [open, setOpen] = useState<Shelf | null>(startOpen ?? null)
  const entries = useMemo(() => buildEntries(owned, pool), [owned, pool])

  const byShelf = useMemo(() => {
    const m = new Map<Shelf, ShelfEntry[]>()
    for (const e of entries) m.set(e.shelf, [...(m.get(e.shelf) ?? []), e])
    for (const [k, v] of m) {
      m.set(
        k,
        [...v].sort((a, b) =>
          fold(a.head.lemma ?? displayForm(a.head)).localeCompare(
            fold(b.head.lemma ?? displayForm(b.head)),
          ),
        ),
      )
    }
    return m
  }, [entries])

  if (rows) {
    return (
      <div className="flex flex-col gap-3">
        {SHELVES.map((shelf) => {
          const list = byShelf.get(shelf.id) ?? []
          if (!list.length) return null
          const expanded = open === shelf.id
          /*
            SIX BEFORE IT ASKS. The chips cut at six and so does this, for the same reason
            — but a row is taller than a chip, so six rows plus a header is already most of
            a phone. Every shelf a sitting produces is well under that; the cut is for the
            capability screen, where the pool is the learner's whole bank.
          */
          const shown = expanded ? list : list.slice(0, 6)
          return (
            <section
              key={shelf.id}
              /*
                THE WHITE CARD, which is what the rest of the product looks like.

                `rounded-2xl border border-line bg-bg-elev` on the sand ground, exactly as
                SayItCard has it. The words had no container at all before, so a shelf was
                a heading, a hairline, and some loose type — nothing on the screen said
                these belonged together or that they were the thing being handed over.
              */
              className="animate-bank flex flex-col overflow-hidden rounded-2xl border border-line bg-bg-elev"
            >
              {/*
                THE SHELF NAME, AND ONE NUMBER.

                It carried two: "+4 NEW" beside a "4", which on a summary are the same
                fact twice — everything on this screen is new, that is what the screen is.
                The count that earns its place is how many words, so the plain count goes
                and the one that says "these are yours as of just now" stays.

                On the capability screen, where the pool is the whole bank and `highlight`
                is absent, there is nothing new to mark and the count returns — there it is
                the only number, and it is the useful one.
              */}
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : shelf.id)}
                className="tap-target flex w-full items-center gap-3 border-b border-line bg-surface px-5 py-3 text-left"
              >
                <span className="eyebrow min-w-0 flex-1 text-accent">{shelf.label}</span>
                {highlight ? (
                  <span className="eyebrow shrink-0 tabular-nums text-telha">
                    +{list.filter((e) => e.forms.some((f) => highlight.has(f.id))).length} new
                  </span>
                ) : (
                  <span className="eyebrow shrink-0 tabular-nums text-muted">{list.length}</span>
                )}
              </button>

              <ul className="flex flex-col">
                {shown.map((e, i) => {
                  /*
                    THE FORM THEY OWN, NOT THE DICTIONARY ENTRY.

                    The chips print `e.head.lemma ?? displayForm(e.head)`, so a learner who
                    had just been taught "sou" was shown "ser" — the infinitive, which is
                    not a word they can say and not a word they met. Fine as a filing label
                    in a dense list; wrong as the answer to "what did I just get".

                    `head` is already the owned form (buildEntries picks the first form the
                    learner has), so the row shows that, with its own gloss beside it.
                  */
                  const word = displayForm(e.head)
                  /*
                    THE FORM, ONLY WHERE THE ENGLISH HAS NOT ALREADY SAID IT.

                    `form` is two different things wearing one field. On a verb it is the
                    person — "I", "you", "we" — and the gloss already carries it: the row
                    came out `sou · I` over `I am`, which is the same fact twice and reads
                    as a stray letter beside the word.

                    On a gender or register form it is the whole point and nothing else
                    says it: inglês and inglesa both gloss to "English", obrigado and
                    obrigada both to "thank you", and without the note the row cannot tell
                    a learner which one is theirs — the exact question the obrigado lesson
                    stops to ask.

                    Tested against the gloss rather than listed, so a form authored
                    tomorrow is judged on whether it adds anything rather than on whether
                    somebody remembered to add it here.
                  */
                  const form =
                    e.head.form && !fold(e.head.gloss).includes(fold(e.head.form))
                      ? e.head.form
                      : null
                  return (
                    <li
                      key={e.key}
                      className={
                        'flex items-center gap-3 px-5 py-3' + (i ? ' border-t border-line/60' : '')
                      }
                    >
                      {/*
                        THE SPEAKER, because these are words met minutes ago.

                        The whole gap this screen left was that a learner could read the
                        word and not say it. `slugFor` always returns something and the
                        audio engine falls back to pt-PT speech, so there is no row that
                        cannot be heard.
                      */}
                      <AudioButton slug={slugFor(e.head.target)} text={e.head.target} size="sm" />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        {/*
                          THE WORD AND WHICH FORM OF IT, on one line.

                          STRONGER, NOT BIGGER. Sam: "Don't use super large text that you
                          have a tendency to do - just stronger." So text-base and
                          semibold against text-lg-and-up, and `.t-said` stays where it
                          belongs — on a sentence the learner produced cold.

                          The form rides WITH the Portuguese rather than with the English,
                          because it qualifies the word: "said by a man" is a fact about
                          obrigado, not about "thank you". It sat on the gloss line first
                          and pushed it out of the row — "thank you · said by a …" — which
                          truncated the one thing the row exists to add.
                        */}
                        <span className="flex min-w-0 items-baseline gap-2">
                          <span className="pt truncate text-base font-semibold text-accent">
                            {word}
                          </span>
                          {form ? (
                            <span className="shrink-0 text-xs text-muted">{form}</span>
                          ) : null}
                        </span>
                        {/*
                          AND WHAT IT MEANS, which was simply not on this screen.

                          text-fg rather than text-muted: the English is half of what a
                          word is, not a footnote to it, and it gets the whole width —
                          nothing shares this line, so no gloss is ever cut.
                        */}
                        <span className="text-base leading-snug text-fg">{e.head.gloss}</span>
                      </div>
                      {/*
                        NO FORMS COUNT. It was here — "2 FORMS", "5 FORMS" — and it was the
                        loudest thing in the row: an eyebrow's uppercase and tracking, set
                        against the one place the eye goes looking for the meaning. It also
                        answered a question nobody asks at the end of a sitting. How many
                        forms a verb has is a library question, and the library answers it.
                      */}
                    </li>
                  )
                })}
              </ul>

              {!expanded && list.length > 6 ? (
                <button
                  type="button"
                  onClick={() => setOpen(shelf.id)}
                  className="tap-target eyebrow border-t border-line px-5 py-3 text-left text-muted"
                >
                  +{list.length - 6} more
                </button>
              ) : null}
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {SHELVES.map((shelf) => {
        const list = byShelf.get(shelf.id) ?? []
        if (!list.length) return null
        const expanded = open === shelf.id
        const fresh = highlight ? list.filter((e) => e.forms.some((f) => highlight.has(f.id))) : []
        return (
          <section key={shelf.id} className="flex flex-col gap-3">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : shelf.id)}
              className="tap-target flex w-full items-center gap-3 text-left"
            >
              <span className="eyebrow min-w-0 text-accent">{shelf.label}</span>
              <span className="h-px flex-1 bg-line" />
              {fresh.length ? (
                <span className="eyebrow shrink-0 text-telha">+{fresh.length} new</span>
              ) : null}
              <span className="eyebrow shrink-0 tabular-nums text-muted">{list.length}</span>
            </button>
            {/*
              THE WORDS ARE THE PAYOFF, so they are not the smallest thing on the screen.

              This shelf is what somebody just earned — the whole answer to "what did that
              session give me" — and it was set at text-xs, smaller than the label above it
              and the footnote below it. Everything on the screen was louder than the thing
              the screen is about. Reported as "make these words larger, they are
              important", which is the correct reading of a hierarchy that had them last.
            */}
            <p className="pt flex flex-wrap gap-x-3 gap-y-1 text-lg">
              {(expanded ? list : list.slice(0, 6)).map((e) => {
                const isNew = highlight
                  ? e.forms.some((f) => highlight.has(f.id))
                  : false
                return (
                  <span
                    key={e.key}
                    className={
                      'pt ' +
                      (isNew ? 'text-telha' : e.owned ? 'text-accent' : 'text-muted')
                    }
                  >
                    {e.head.lemma ?? displayForm(e.head)}
                  </span>
                )
              })}
              {!expanded && list.length > 6 ? (
                <span className="text-muted">+{list.length - 6} more</span>
              ) : null}
            </p>
          </section>
        )
      })}
    </div>
  )
}
