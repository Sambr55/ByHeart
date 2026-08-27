'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/Feed'
import { CrateIcon } from '@/components/CrateIcon'
import { Menu } from '@/components/Menu'
import { Wordmark } from '@/components/Wordmark'
import { cardById, roomsFor, wordCards, type FeedCard } from '@/content/feed'
import { CRATES, type CultureFamily } from '@/content/roots'
import { PROFILE_COPY } from '@/content/profile-copy'
import { useLearner } from '@/engine/useLearner'

/**
 * Your Lisbon, rather than the next thing.
 *
 * The feed answers "what now"; this answers "what is mine". They are different questions
 * and giving them the same screen is what made the words feel like rooms — everything
 * arriving in one stream reads as one kind of thing.
 *
 * A grid, three-by-four tiles, because that is the shape of a thing you scan for
 * something you already know is there. Tapping opens it full-bleed, and swiping left
 * from there is the same reveal it is everywhere else in the Club.
 */
type Tile =
  | { kind: 'card'; id: string; card: FeedCard }
  | { kind: 'vibe'; id: string; family: CultureFamily; title: string; tone: string }

export function Profile() {
  const learner = useLearner()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState<FeedCard | null>(null)
  useEffect(() => setMounted(true), [])

  const saved = learner.saved ?? []
  const finished = learner.finished_cards ?? []
  const sections = learner.sections_completed ?? []

  const sets = useMemo(() => {
    const asTile = (id: string): Tile | null => {
      const card = cardById(id)
      return card ? { kind: 'card', id, card } : null
    }
    const vibes: Tile[] = sections.flatMap((f) => {
      const crate = CRATES.find((c) => c.id === f)
      return crate
        ? [{ kind: 'vibe' as const, id: crate.id, family: crate.id, title: crate.title, tone: crate.tone }]
        : []
    })
    return {
      done: [...vibes, ...finished.flatMap((id) => asTile(id) ?? [])],
      saved: saved.flatMap((id) => asTile(id) ?? []),
      words: wordCards().map((c): Tile => ({ kind: 'card', id: c.id, card: c })),
    }
  }, [saved.join('|'), finished.join('|'), sections.join('|')])

  if (open) {
    return (
      <main data-stage="REAL WORLD" className="relative h-svh w-full overflow-hidden bg-[#241f1a]">
        <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-3 px-5 pt-6">
          <button
            type="button"
            data-testid="card-close"
            onClick={() => setOpen(null)}
            className="pointer-events-auto tap-target eyebrow text-white"
          >
            ← BACK
          </button>
        </header>
        <div className="h-full">
          <Card
            card={open}
            saved={saved.includes(open.id)}
            liked={(learner.liked ?? []).includes(open.id)}
          />
        </div>
      </main>
    )
  }

  return (
    /*
      No data-stage on purpose.

      REAL WORLD switches the azulejo pattern off — it is the beat where the culture has
      been taken away, and the tiles going plain is the whole point of it. Setting it here
      made every vibe tile render as an empty rectangle, which is the pattern working
      exactly as specified on a screen that had no business claiming that stage.
    */
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 pb-10 pt-6 text-fg">
      <header className="flex items-center gap-3">
        <Link href="/club" className="tap-target">
          <Wordmark mark="club" className="h-6" title="Back to the Club" />
        </Link>
        <span className="flex-1" />
        <Menu />
      </header>

      <div>
        <p className="eyebrow text-muted">{PROFILE_COPY.eyebrow}</p>
        <h1 className="display mt-3 text-balance text-3xl">{PROFILE_COPY.headline}</h1>
      </div>

      {!mounted ? null : (
        <>
          <Section
            label={PROFILE_COPY.done_label}
            note={PROFILE_COPY.done_note}
            empty={PROFILE_COPY.done_empty}
            tiles={sets.done}
            onOpen={setOpen}
          />
          <Section
            label={PROFILE_COPY.saved_label}
            note={PROFILE_COPY.saved_note}
            empty={PROFILE_COPY.saved_empty}
            tiles={sets.saved}
            onOpen={setOpen}
          />
          <Section
            label={PROFILE_COPY.words_label}
            note={PROFILE_COPY.words_note}
            empty=""
            tiles={sets.words}
            onOpen={setOpen}
          />
        </>
      )}
    </main>
  )
}

function Section({
  label,
  note,
  empty,
  tiles,
  onOpen,
}: {
  label: string
  note: string
  empty: string
  tiles: Tile[]
  onOpen: (c: FeedCard) => void
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="eyebrow min-w-0 text-accent">{label}</h2>
        <span className="h-px flex-1 bg-line" />
      </div>
      <p className="text-xs leading-relaxed text-muted">{note}</p>
      {!tiles.length ? (
        <p className="rounded border border-line bg-bg-elev px-4 py-3 text-sm text-muted">{empty}</p>
      ) : (
        /* Two across, three-by-four — the shape of something you scan rather than read. */
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <TileView key={t.kind + t.id} tile={t} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  )
}

function TileView({ tile, onOpen }: { tile: Tile; onOpen: (c: FeedCard) => void }) {
  const shell =
    'tap-target relative block aspect-[3/4] w-full overflow-hidden rounded border border-line text-left'

  if (tile.kind === 'vibe') {
    /*
      A vibe has no photograph and does not need one.

      The shelf has identified vibes by tone and a line drawing since long before there
      were any images in this product, and inventing eleven photographs to fill a grid
      would put stock imagery next to the evidence photographs in the Club — which is the
      exact confusion the two registers exist to avoid.
    */
    return (
      <Link
        href={'/vibes?open=' + tile.family}
        data-testid={'tile-' + tile.id}
        // data-tone, not a style variable: the tone is a NAME the stylesheet maps to a
        // colour, and setting --tone to "reflective" silently produced no pattern at all.
        data-tone={tile.tone}
        className={shell + ' azulejo-block'}
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <CrateIcon crate={tile.family} className="h-10 w-10 text-[color:var(--tone)]" />
        </span>
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/85 to-transparent px-3 pb-3 pt-6">
          <span className="display block text-xs leading-tight">{tile.title}</span>
        </span>
      </Link>
    )
  }

  const card = tile.card
  const image = card.kind === 'situation' ? card.situation.image : card.image
  const title = card.kind === 'situation' ? card.situation.title : card.piece.target
  return (
    <button type="button" data-testid={'tile-' + tile.id} onClick={() => onOpen(card)} className={shell}>
      {image ? (
        <Image src={image.src} alt="" aria-hidden fill sizes="(max-width:448px) 50vw, 224px" className="object-cover" />
      ) : null}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 px-3 pb-3">
        <span className={'display block text-xs leading-tight text-white ' + (card.kind === 'vocab' ? 'pt' : '')}>
          {title}
        </span>
      </span>
    </button>
  )
}
