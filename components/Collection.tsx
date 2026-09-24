'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useLearner } from '@/engine/useLearner'
import { SLOTS, collected, grid, type CollectedCard } from '@/content/collection'
import { progressFor, stageFor } from '@/content/legend'
import Image from 'next/image'
import { PIECES, type CultureFamily } from '@/content/roots'
import { vibeImage } from '@/content/vibe-images'
import { sheetImage } from '@/content/feed'
import { IMAGE_BANK } from '@/content/images'

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
      {/*
        THE WAY BACK TO THE SHELF, carried over from BEEN THROUGH.

        That section was removed because the grid holds the same vibes — but it carried
        the only route from Yours to the vibe shelf, added after Sam: "cant get back to
        vibes via any nav to continue." The shelf is deliberately not a tab, so losing
        this link would have re-made a dead end that took a report to find.

        Here for the same reason it was there: this is where somebody is looking at what
        they have finished, which is the moment "what next" is actually being asked.
      */}
      <Link
        href="/vibes"
        data-testid="collection-more"
        className="tap-target eyebrow inline-flex items-center text-accent underline underline-offset-4"
      >
        PICK ANOTHER
      </Link>
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
  /*
    REVISION, NOT THE LESSON. Sam: "clicking on a panel should be a revision of what has
    been learned, not the original walk through cards."

    These used to point at the thing itself — /vibes?open= replays the whole sitting — and
    that is right the first time and wrong every time after. One route for all three
    kinds, because revising is one act whatever was collected. See /revise.
  */
  const href = '/revise?kind=' + card.kind + '&id=' + card.id

  /*
    THE PICTURE THE CARD ALREADY HAS. Sam: "we will need to put an image into each
    completed panel."

    Read from the same place the card itself reads it — vibeImage for a crate, sheetImage
    for a set — rather than chosen here, because two answers to "what does this look like"
    is how a card and its shelf come to disagree about the same thing.

    A Legend frame has no photograph and should not borrow one: it is the learner's own
    sentence, and the product's answer to that everywhere else is the accent slab. So a
    frame panel is azulejo blue with its question on it, which also makes the three kinds
    tellable apart at grid size without reading a word.
  */
  const image =
    card.kind === 'vibe'
      ? vibeImage(card.id as CultureFamily)
      : card.kind === 'sheet'
        ? sheetImage(card.id)
        : /*
             A Legend frame's own picture, once the bank has it.

             Sam, with a screenshot of Basics rendered as seven identical blue rectangles:
             "let's add the images." The accent slab was right for one frame among nine
             and wrong for a level made of them — a wall rather than a shelf.

             Falls back to the slab when the picture is not there yet, so the grid is
             never broken by an image that has not been generated: the briefs are in
             content/images.ts and the panels pick them up the moment the files land.
           */
          (IMAGE_BANK['frame-' + card.id.replace(/_/g, '-')] ?? null)

  return (
    <Link
      href={href}
      data-testid={'collected-' + card.kind + '-' + card.id}
      className={
        'tap-target relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded border border-line p-3 transition hover:border-accent/50 ' +
        (image ? 'text-white' : 'bg-accent text-accent-ink')
      }
    >
      {image ? (
        <>
          <Image
            src={image.src}
            alt=""
            fill
            sizes="33vw"
            className="object-cover"
            aria-hidden
          />
          {/*
            The scrim, so type never sits on the photograph itself — the same construction
            the door and the welcome use, and the reason white on an image is legible here
            and nowhere it is not done.
          */}
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
          />
        </>
      ) : null}
      <span className="relative flex flex-col gap-1">
        {/*
          The kind, small, because three kinds on one shelf need telling apart and the
          label alone does not do it — "Counting to ten" and "The basics, in songs you
          know" are a sheet and a vibe and read the same way.
        */}
        <span className={'eyebrow text-[0.5rem] ' + (image ? 'text-white/75' : 'opacity-75')}>
          {card.kind === 'sheet' ? 'SHEET' : card.kind === 'vibe' ? 'VIBE' : 'LEGEND'}
        </span>
        <span className="text-xs leading-tight">{card.label}</span>
      </span>
    </Link>
  )
}
