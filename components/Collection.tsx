'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useLearner } from '@/engine/useLearner'
import { SLOTS, collected, grid, type CollectedCard } from '@/content/collection'
import { progressFor, stageFor } from '@/content/legend'
import { PIECES } from '@/content/roots'

/**
 * THE GRID — five levels, nine slots each, filled by what has been finished.
 *
 * Sam: "the 'game' is to fill the grid with completed cards that the user can revisit,
 * practise and share. The idea is to organise their memory and learning."
 *
 * The three kinds sit together on purpose — a kept cheat sheet, a vibe been through, a
 * Legend question answered. Each is somewhere in the product already and each is in a
 * list of its own, so the one thing nothing says is that they belong to each other. A
 * level is what you could do at the time, and these are what you did.
 *
 * AN EMPTY SLOT IS THE INVITATION, which is why the grid is fixed at nine rather than
 * growing with the content: a shelf that grows can never be filled, and a counter that
 * only goes up is the thing this product refuses everywhere else. A level with nothing in
 * it still renders, for the same reason.
 *
 * NO SCORE ON IT. The count under each level is "4 of 9", which is a position rather than
 * a mark — the same shape as the Legend's own "3 of 7" — and nothing here counts days,
 * ranks levels against each other, or says a level is late.
 */
export function Collection() {
  const learner = useLearner()

  const owned = useMemo(
    () => Object.keys(learner.inventory ?? {}).filter((id) => PIECES[id]),
    [learner.inventory],
  )

  /*
    The level they are in NOW, which is where an unstamped card lands.

    Records written before the grid existed have no level on them, and dropping those
    cards would show somebody who kept nine sheets last week an empty shelf. See
    collected().
  */
  const stageNow = useMemo(
    () =>
      stageFor(
        progressFor({
          words: owned.length,
          through: (learner.sections_completed ?? []).length,
          legend: (learner.legend ?? []).filter((a) => Object.keys(a.values ?? {}).length).length,
          sheets: (learner.sheet_got ?? []).length,
          idioms: (learner.idioms_got ?? []).length,
        }).score,
      ).id,
    [owned.length, learner.sections_completed, learner.legend, learner.sheet_got, learner.idioms_got],
  )

  const rows = useMemo(
    () =>
      grid(
        collected({
          sheet_got: learner.sheet_got ?? [],
          sections_completed: learner.sections_completed ?? [],
          legend: learner.legend ?? [],
          card_levels: learner.card_levels ?? {},
          stageNow,
        }),
      ),
    [learner.sheet_got, learner.sections_completed, learner.legend, learner.card_levels, stageNow],
  )

  return (
    <section data-testid="collection" className="flex flex-col gap-10">
      {rows.map(({ stage, cards }) => (
        <div key={stage.id} className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <h3 className="eyebrow min-w-0 text-accent">{stage.name.toUpperCase()}</h3>
            <span className="h-px flex-1 bg-line" />
            {/*
              A position, not a mark. "4 of 9" says where somebody is on this shelf; a
              percentage or a tick would say whether they have passed it, and there is
              nothing here to pass.
            */}
            <span className="eyebrow shrink-0 tabular-nums text-muted">
              {Math.min(cards.length, SLOTS)} of {SLOTS}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted">{stage.can}</p>
          <ul className="grid grid-cols-3 gap-1">
            {Array.from({ length: SLOTS }).map((_, i) => {
              const card = cards[i]
              return (
                <li key={i}>
                  {card ? (
                    <Filled card={card} />
                  ) : (
                    /*
                      The empty slot, drawn rather than left out: it is the whole of the
                      invitation, and a grid that shows only what is in it is a list.
                    */
                    <span
                      aria-hidden
                      className="block aspect-[3/4] rounded border border-dashed border-line/60 bg-surface/30"
                    />
                  )}
                </li>
              )
            })}
          </ul>
          {/*
            Over nine is a good problem and the extra is still theirs. Said plainly rather
            than by growing the grid, which would make it unfillable.
          */}
          {cards.length > SLOTS ? (
            <p className="text-xs text-muted">
              And {cards.length - SLOTS} more in this level.
            </p>
          ) : null}
        </div>
      ))}
    </section>
  )
}

/**
 * One collected card.
 *
 * It links to the thing itself, because the point of the grid is revisiting: a sheet
 * opens its sheet, a vibe opens the vibe, a Legend question opens the card it answers.
 * Sam: "completed cards that the user can revisit, practise and share."
 */
function Filled({ card }: { card: CollectedCard }) {
  const href =
    card.kind === 'vibe'
      ? '/vibes?open=' + card.id
      : card.kind === 'frame'
        ? '/legend?build=' + card.id
        : '/profile#sheets'

  return (
    <Link
      href={href}
      data-testid={'collected-' + card.kind + '-' + card.id}
      className="tap-target flex aspect-[3/4] flex-col justify-between rounded border border-line bg-bg-elev p-3 transition hover:border-accent/50"
    >
      {/*
        The kind, small, because three kinds on one shelf need telling apart at a glance
        and the label alone does not do it — "Counting to ten" and "The basics, in songs
        you know" are a sheet and a vibe and read the same way.
      */}
      <span className="eyebrow text-[0.5rem] text-muted">
        {card.kind === 'sheet' ? 'SHEET' : card.kind === 'vibe' ? 'VIBE' : 'LEGEND'}
      </span>
      <span className="text-xs leading-tight text-fg">{card.label}</span>
    </Link>
  )
}
