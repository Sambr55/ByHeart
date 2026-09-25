'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useLearner } from '@/engine/useLearner'
import {
  SLOTS,
  collected,
  decks,
  openAtFirst,
  levelLabel,
  type CollectedCard,
  type Deck,
} from '@/content/collection'
import { progressFor, stageFor } from '@/content/legend'
import Image from 'next/image'
import { PIECES, type CultureFamily } from '@/content/roots'
import { vibeImage } from '@/content/vibe-images'
import { sheetImage } from '@/content/feed'
import { IMAGE_BANK } from '@/content/images'

/**
 * THE LIBRARY — five decks, collapsible, holding everything finished.
 *
 * Sam: "essentially I want everything to be cards and everything completed to be saved
 * into decks... The decks will need to be collapsible or there will be too many. The cards
 * become your library where you can retry or remind."
 *
 * This replaced a grid of five LEVELS with nine slots each, which was the right shape for
 * three kinds of card and could not hold five — forty-five slots against a card universe
 * that was already at forty-seven. See content/collection.ts for the whole argument; the
 * short version is that a level is now something a card SAYS rather than the drawer it
 * lives in, and the drawer is the kind.
 *
 * ONE DECK IS OPEN AT A TIME, which is what makes this readable at five decks and still
 * readable at eight. The one that opens first is the one with room left in it — see
 * openAtFirst — because that is where the next card lands.
 *
 * NO SCORE ON IT. A deck says "4 of 13", which is a position rather than a mark, and the
 * two open-ended decks say what they hold instead, because there is no honest denominator
 * for nights out or for words.
 */
export function Collection() {
  const learner = useLearner()

  const owned = useMemo(
    () => Object.keys(learner.inventory ?? {}).filter((id) => PIECES[id]),
    [learner.inventory],
  )

  /*
    The level they are in NOW, which is where an unstamped card lands.

    Records written before the library existed have no level on them, and dropping those
    cards would show somebody who kept nine sheets last week an empty shelf.
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

  const all = useMemo(
    () =>
      collected({
        sheet_got: learner.sheet_got ?? [],
        sections_completed: learner.sections_completed ?? [],
        legend: learner.legend ?? [],
        drops_done: learner.drops_done ?? [],
        inventory: learner.inventory ?? {},
        card_levels: learner.card_levels ?? {},
        stageNow,
      }),
    [
      learner.sheet_got,
      learner.sections_completed,
      learner.legend,
      learner.drops_done,
      learner.inventory,
      learner.card_levels,
      stageNow,
    ],
  )

  const rows = useMemo(() => decks(all), [all])

  /*
    WHICH DRAWER IS OPEN, held here rather than per-deck so only one ever is.

    null means "not chosen yet", which is different from "all shut": the first render
    opens whichever deck has room, and once somebody has touched one, their choice stands
    even if a card lands somewhere else.
  */
  const [opened, setOpened] = useState<string | null>(null)
  const openId = opened ?? openAtFirst(all)

  return (
    <section data-testid="collection" className="flex flex-col gap-3">
      {rows.map((deck) => (
        <DeckDrawer
          key={deck.id}
          deck={deck}
          open={deck.id === openId}
          onToggle={() => setOpened(deck.id === openId ? '' : deck.id)}
        />
      ))}
      {/*
        THE WAY BACK TO THE SHELF, carried over from BEEN THROUGH.

        That section was removed because the library holds the same vibes — but it carried
        the only route from Yours to the vibe shelf, added after Sam: "cant get back to
        vibes via any nav to continue." The shelf is deliberately not a tab, so losing this
        link would have re-made a dead end that took a report to find.
      */}
      <Link
        href="/vibes"
        data-testid="collection-more"
        className="tap-target eyebrow mt-6 inline-flex items-center text-accent underline underline-offset-4"
      >
        PICK ANOTHER
      </Link>
    </section>
  )
}

/**
 * One drawer: a head you can always read, and a grid you can shut.
 *
 * The head is a button rather than a heading with a button in it, because the whole row is
 * the target — a chevron alone is a 24px hit area on a phone, and this is the control the
 * entire screen is built on.
 */
function DeckDrawer({
  deck,
  open,
  onToggle,
}: {
  deck: Deck
  open: boolean
  onToggle: () => void
}) {
  /*
    WHAT THE COUNT SAYS, and the two decks that cannot say it.

    "4 of 13" is a position on a closed deck. NIGHTS and WORDS have no denominator — the
    first because the content pipeline decides how many drops ever exist, the second
    because a shelf is never finished — so they report what they hold. "6 nights" is true;
    "6 of 1" would be a lie about the product, and "6 of 9" a lie about the learner.
  */
  const count =
    deck.total !== undefined
      ? deck.cards.length + ' of ' + deck.total
      : deck.cards.length + (deck.id === 'drops' ? ' saved' : ' started')

  return (
    <div className="flex flex-col gap-3 border-b border-line pb-3">
      <button
        type="button"
        data-testid={'deck-' + deck.id}
        aria-expanded={open}
        onClick={onToggle}
        className="tap-target flex w-full items-center gap-3 py-1 text-left"
      >
        <span
          aria-hidden
          className={'text-xs text-muted transition-transform ' + (open ? 'rotate-90' : '')}
        >
          ▶
        </span>
        <span className="eyebrow min-w-0 flex-1 text-accent">{deck.label}</span>
        <span className="eyebrow shrink-0 tabular-nums text-muted">{count}</span>
      </button>
      {open ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs leading-relaxed text-muted">{deck.holds}</p>
          <ul className="grid grid-cols-3 gap-1">
            {/*
              NINE IS A FLOOR NOW, NOT A CEILING. A deck draws every card it holds, and
              pads out to nine with empty slots when it has fewer — so the invitation is
              still there on a new deck, and a full one is not forced to hide its overflow
              in a footnote the way the fixed grid had to.
            */}
            {Array.from({ length: Math.max(SLOTS, deck.cards.length) }).map((_, i) => {
              const card = deck.cards[i]
              return (
                <li key={i}>
                  {card ? (
                    <Filled card={card} />
                  ) : (
                    <span
                      aria-hidden
                      className="block aspect-[3/4] rounded border border-dashed border-line/60 bg-surface/30"
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

/**
 * One collected card.
 *
 * It links to a REVISION of what it holds rather than to the lesson that taught it. Sam:
 * "clicking on a panel should be a revision of what has been learned, not the original
 * walk through cards" — and now, "the cards become your library where you can retry or
 * remind."
 */
function Filled({ card }: { card: CollectedCard }) {
  const href = '/revise?kind=' + card.kind + '&id=' + card.id

  /*
    THE PICTURE THE CARD ALREADY HAS.

    Read from the same place the card itself reads it — vibeImage for a crate, sheetImage
    for a set — rather than chosen here, because two answers to "what does this look like"
    is how a card and its shelf come to disagree about the same thing.

    Drops and word shelves have no art of their own, so they take a texture keyed on their
    id. sheetImage falls back to azulejo for an id it does not know, which means a new drop
    or a new shelf gets a ground rather than a blue rectangle on the day it is authored.
  */
  const image =
    card.kind === 'vibe'
      ? vibeImage(card.id as CultureFamily)
      : card.kind === 'sheet' || card.kind === 'drop' || card.kind === 'words'
        ? sheetImage(card.id)
        : (IMAGE_BANK['frame-' + card.id.replace(/_/g, '-')] ?? null)

  /*
    WHAT THE CARD SAYS UNDER ITS NAME, which is different for the two living kinds.

    A words card reports what it holds, because it is never finished and a level would be
    a fact about the past. A night reports its date. Everything else reports the level the
    learner was at when they finished it, which is the only place levels appear now.
  */
  const foot =
    card.kind === 'words'
      ? card.holds + (card.holds === 1 ? ' word' : ' words')
      : card.kind === 'drop'
        ? (card.on ?? '')
        : levelLabel(card.level)

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
          <Image src={image.src} alt="" fill sizes="33vw" className="object-cover" aria-hidden />
          {/*
            The scrim, so type never sits on the photograph itself — the same construction
            the door and the welcome use.
          */}
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
          />
        </>
      ) : null}
      <span className="relative flex flex-col gap-1">
        <span className="text-xs leading-tight">{card.label}</span>
        {foot ? (
          <span className={'eyebrow text-[0.5rem] ' + (image ? 'text-white/75' : 'opacity-75')}>
            {foot}
          </span>
        ) : null}
      </span>
    </Link>
  )
}
