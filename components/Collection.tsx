'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useLearner } from '@/engine/useLearner'
import {
  SLOTS,
  collected,
  decks,
  levelLabel,
  type CollectedCard,
  type Deck,
  type DeckId,
} from '@/content/collection'
import { progressFor, stageFor } from '@/content/legend'
import Image from 'next/image'
import { PIECES, type CultureFamily } from '@/content/roots'
import { vibeImage } from '@/content/vibe-images'
import { idiomImage, sheetImage } from '@/content/feed'
import { IMAGE_BANK } from '@/content/images'
import { IDIOMS } from '@/content/idioms'

/**
 * THE BOARDS — a rail of icons and one grid, the way a profile works.
 *
 * Sam, with his own Instagram and TikTok profiles beside Yours: "I want to make the Yours
 * section much more akin to Instagram/TikTok profiles... remove the 9 things you can say
 * and say it cold block and load the boards under the profile. The default board should be
 * Your Legend."
 *
 * WHAT THIS REPLACES. Ten collapsible drawers stacked down the page, one open at a time,
 * each with a count on the right. That shape came from "there will be too many" and it
 * answered the wrong half of the problem: it made ten decks fit, and it made every one of
 * them look like an administrative row. A profile does the opposite — the boards are a rail
 * of icons and the grid below is whichever is selected, so the content is the screen and
 * the navigation is one line of it.
 *
 * FOUR IN THE RAIL, THE REST BEHIND MORE. Sam set the ceiling from the apps themselves —
 * three icons on Instagram, four on TikTok. See DECKS in content/collection.ts for which
 * four and why.
 *
 * THE LEGEND IS THE DEFAULT, always, rather than whichever deck has room. openAtFirst
 * picked the deck where the next card would land, which is a sensible answer to "what is
 * this person working on" and the wrong answer to "what is this screen about". It is about
 * the Legend, and the first card on it is the one that practises it.
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
          cheats: (learner.cheats_used ?? []).length,
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
        cheats_used: learner.cheats_used ?? [],
        idioms_got: learner.idioms_got ?? [],
        asked: learner.asked ?? [],
        inventory: learner.inventory ?? {},
        card_levels: learner.card_levels ?? {},
        stageNow,
      }),
    [
      learner.sheet_got,
      learner.sections_completed,
      learner.legend,
      learner.drops_done,
      learner.cheats_used,
      learner.idioms_got,
      learner.asked,
      learner.inventory,
      learner.card_levels,
      stageNow,
    ],
  )

  const rows = useMemo(() => decks(all), [all])
  const rail = rows.filter((d) => d.rail)
  const more = rows.filter((d) => !d.rail)

  /* The Legend, always — see the note above. */
  const [open, setOpen] = useState<DeckId>('legend')
  const [drawer, setDrawer] = useState(false)
  const showing = rows.find((d) => d.id === open) ?? rows[0]

  return (
    <section data-testid="collection" className="flex flex-col gap-6">
      {/*
        THE RAIL. Four boards, a MORE toggle, and a rule under the selected one — which is
        the whole of how a profile says which grid you are looking at.
      */}
      <div className="flex items-stretch border-b border-line">
        {rail.map((d) => (
          <RailTab
            key={d.id}
            deck={d}
            on={d.id === open && !drawer}
            onPick={() => {
              setOpen(d.id)
              setDrawer(false)
            }}
          />
        ))}
        <button
          type="button"
          data-testid="rail-more"
          aria-expanded={drawer}
          onClick={() => setDrawer((v) => !v)}
          className={
            'tap-target flex flex-1 flex-col items-center gap-1 border-b-2 pb-2 pt-1 transition ' +
            (drawer ? 'border-accent text-accent' : 'border-transparent text-muted')
          }
        >
          <span aria-hidden className="text-lg leading-none">
            {drawer ? '\u25b4' : '\u25be'}
          </span>
          <span className="eyebrow text-[0.5rem]">MORE</span>
        </button>
      </div>

      {/*
        THE DRAWER, open in place rather than as a screen of its own. Six boards that are
        real but rarely the reason somebody came here — see DECKS.
      */}
      {drawer ? (
        <ul data-testid="rail-drawer" className="animate-bank flex flex-col">
          {more.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                data-testid={'drawer-' + d.id}
                onClick={() => {
                  setOpen(d.id)
                  setDrawer(false)
                }}
                className="tap-target flex w-full items-baseline justify-between gap-3 border-b border-line/60 py-3 text-left transition hover:text-accent"
              >
                <span className="min-w-0">
                  <span className="eyebrow block text-accent">{d.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">{d.holds}</span>
                </span>
                <span className="eyebrow shrink-0 tabular-nums text-muted">{count(d)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showing ? <Board deck={showing} /> : null}

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
        className="tap-target eyebrow inline-flex items-center text-accent underline underline-offset-4"
      >
        PICK ANOTHER
      </Link>
    </section>
  )
}

/**
 * What the count says, and the decks that cannot say it.
 *
 * "4 of 13" is a position on a closed deck. DROPS, WORDS and YOU ASKED FOR have no
 * denominator — the first because the content pipeline decides how many drops ever exist,
 * the second because a shelf is never finished — so they report what they hold.
 */
function count(deck: Deck): string {
  if (deck.total !== undefined) return deck.cards.length + ' of ' + deck.total
  return (
    deck.cards.length +
    (deck.id === 'drops' ? ' saved' : deck.id === 'asked' ? ' kept' : ' started')
  )
}

/**
 * One icon in the rail.
 *
 * A GLYPH AND A WORD, not a glyph alone. Instagram can use a bare grid icon because
 * everybody already knows what it means; four boards called Legend, Vibes, Cheats and
 * Drops are this product's own idea and an unlabelled icon for one of them is a puzzle.
 * The word is an eyebrow, which is the size this product gives to labels.
 */
function RailTab({ deck, on, onPick }: { deck: Deck; on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      data-testid={'rail-' + deck.id}
      aria-pressed={on}
      onClick={onPick}
      className={
        'tap-target flex flex-1 flex-col items-center gap-1 border-b-2 pb-2 pt-1 transition ' +
        (on ? 'border-accent text-accent' : 'border-transparent text-muted')
      }
    >
      <RailIcon id={deck.id} />
      <span className="eyebrow text-[0.5rem]">{deck.label.replace('YOUR ', '')}</span>
    </button>
  )
}

/** The four marks. Line art at one weight, so the rail reads as one row. */
function RailIcon({ id }: { id: DeckId }) {
  const common = {
    viewBox: '0 0 24 24',
    className: 'h-5 w-5',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  /* A card with a line on it — the Legend is a card you carry. */
  if (id === 'legend')
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 10h6M7 14h4" />
      </svg>
    )
  /* The grid, for the rooms somebody has been through. */
  if (id === 'vibes')
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  /* A key: a cheat opens something you could not otherwise say. */
  if (id === 'cheats')
    return (
      <svg {...common}>
        <circle cx="8" cy="12" r="4" />
        <path d="M12 12h9M18 12v4M15 12v3" />
      </svg>
    )
  /* A ticket, for what is on. */
  return (
    <svg {...common}>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" />
      <path d="M12 6v8" strokeDasharray="2 2" />
    </svg>
  )
}

/**
 * One board: what it holds, and the cards.
 *
 * NINE IS A FLOOR, NOT A CEILING. A board draws every card it holds and pads to nine with
 * empty slots when it has fewer — so the invitation is still there on a new board, and a
 * full one is not forced to hide its overflow in a footnote.
 */
function Board({ deck }: { deck: Deck }) {
  return (
    <div data-testid={'board-' + deck.id} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs leading-relaxed text-muted">{deck.holds}</p>
        <span className="eyebrow shrink-0 tabular-nums text-muted">{count(deck)}</span>
      </div>
      <ul className="grid grid-cols-3 gap-1">
        {deck.id === 'legend' ? (
          <li>
            <PractiseCard />
          </li>
        ) : null}
        {Array.from({
          length: Math.max(SLOTS - (deck.id === 'legend' ? 1 : 0), deck.cards.length),
        }).map((_, i) => {
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
  )
}

/**
 * PRACTISE YOUR LEGEND — pinned to the top of its own board.
 *
 * Sam: "the first card pinned to the top being a PRACTISE YOUR LEGEND card, which would
 * open up the current say it loud / run it through functionality."
 *
 * It carries the work the blue slab used to carry. That block — the number, the level bar
 * and SAY IT ALL, COLD — was the top third of Yours and said four things at once; this
 * says one, in the place somebody is already looking, and it is the only card on the grid
 * that is a verb rather than a thing collected.
 *
 * ?run=1 is the run-through — see components/Legend.tsx, which walks the whole card in
 * order and offers GO AND GET IT on anything not answered yet.
 */
function PractiseCard() {
  return (
    <Link
      href="/legend?run=1"
      data-testid="practise-legend"
      className="tap-target flex aspect-[3/4] flex-col justify-between rounded bg-accent p-3 text-accent-ink transition hover:opacity-90"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
      <span className="text-xs leading-tight">Practise your Legend</span>
    </Link>
  )
}

/**
 * The clue photograph for a collected idiom, if the id is one.
 *
 * Looked up rather than cast: a collected card carries an id and a kind, and the idiom it
 * names may have been retired from the content since it was collected. Missing means the
 * texture below, which is what every other kind already falls back to.
 */
function idiomClue(id: string): { src: string; alt: string } | undefined {
  const idiom = IDIOMS.find((i) => i.id === id)
  return idiom ? idiomImage(idiom) : undefined
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
      : card.kind === 'idiom'
        ? /*
             An idiom has its own clue photograph, which is the whole card — the picture is
             the hint you get before the punchline.

             AND IT NEVER ASKED FOR IT. This read IMAGE_BANK['vibe-<id>'] and fell through
             to a texture, so 29 of 30 idioms showed the same azulejo tile while their 30
             authored clue photographs sat unused in public/idioms. The one that worked —
             bobs_your_uncle — worked by accident: it collides with a `vibe-` slug, so the
             shelf was showing the VIBE still rather than the idiom's own clue.

             The comment above it claimed the photograph was the whole card, which was true
             of the feed and false here: idiomImage() has resolved all thirty since the
             photographs were authored, and this is the one surface that never called it.
             A comment describing what the code was supposed to do is how a fault like this
             survives an audit.
           */
          (idiomClue(card.id) ??
            IMAGE_BANK['vibe-' + card.id.replace(/_/g, '-')] ??
            sheetImage(card.id))
        : card.kind === 'sheet' ||
            card.kind === 'drop' ||
            card.kind === 'words' ||
            card.kind === 'asked' ||
            card.kind === 'cheat'
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
        : card.kind === 'asked'
          ? /* The day you wanted it, which is the only fact this card has about itself. */
            (card.on ?? '').slice(0, 10)
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
