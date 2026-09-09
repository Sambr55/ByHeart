'use client'

import Image from 'next/image'
import { vibeImage } from '@/content/vibe-images'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/Feed'
import { CrateIcon } from '@/components/CrateIcon'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { Friends } from '@/components/Friends'
import { PurposeChoice, SoundChoice, ThemeChoice } from '@/components/Theme'
import { Wordmark } from '@/components/Wordmark'
import { askedCards, cardById, cardFace, derivedCards, roomsFor, wordCards, type FeedCard } from '@/content/feed'
import { derivedById } from '@/engine/derive'
import { CRATES, ROOTS, type CultureFamily } from '@/content/roots'
import { LEGEND_FRAMES, legendStatus } from '@/content/legend'
import { PROFILE_COPY } from '@/content/profile-copy'
import { getAvatar, setAvatarFromFile } from '@/engine/avatar'
import { setDisplayName } from '@/engine/learner'
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
  | {
      kind: 'vibe'
      id: string
      family: CultureFamily
      title: string
      tone: string
      /** False while there is still something in it. The tile says so rather than lying. */
      through: boolean
    }

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
    /*
      Every vibe they have actually been into, not only the ones they signed out of.

      sections_completed is written in exactly one place: the two buttons on the
      end-of-session screen. That was sound while a lesson was a held sequence with no way
      out — and it stopped being sound the moment the bottom bar went onto the beats, which
      it did deliberately. Leaving a vibe part-way is now the ordinary thing to do, and
      doing the ordinary thing recorded nothing: somebody could work through four vibes and
      find this shelf empty, which reads as the product having lost their week.

      roots_played is the honest record — it is written at each release, by the tap that
      banks a sentence, and nothing else touches it. So the shelf is built from that, and
      the union with sections_completed keeps anybody who did sign out properly.
    */
    const played = new Set(learner.roots_played ?? [])
    const been = new Set<string>(sections)
    for (const root of ROOTS) if (played.has(root.root_id)) been.add(root.culture_family)

    const vibes: Tile[] = [...been].flatMap((f) => {
      const crate = CRATES.find((c) => c.id === f)
      if (!crate) return []
      const rootsHere = ROOTS.filter((r) => r.culture_family === crate.id)
      return [
        {
          kind: 'vibe' as const,
          id: crate.id,
          family: crate.id,
          title: crate.title,
          tone: crate.tone,
          // All the way through means every root in it, or the learner said so themselves.
          through:
            sections.includes(crate.id) ||
            (rootsHere.length > 0 && rootsHere.every((r) => played.has(r.root_id))),
        },
      ]
    })
    /*
      A finished derived card, recovered.

      These leave the feed by id, and `cardById` only knows about rooms and words — so
      without this a collision somebody said cold vanished from their history the moment
      they said it, which is the exact opposite of what finishing one should do.
    */
    const derivedTiles: Tile[] = finished
      .filter((id) => id.startsWith('derived_'))
      .flatMap((id) => {
        const card = derivedById(id, learner.inventory ?? {})
        if (!card) return []
        const feedCard = derivedCards([card])[0]
        return feedCard ? [{ kind: 'card' as const, id, card: feedCard }] : []
      })

    /*
      The sentences somebody asked for, which had nowhere to be.

      keepAsk writes them to the learner and the feed offers them back as practice — but
      Yours never rendered them, so KEEP THIS was a button that appeared to do nothing. The
      record was right the whole time; the screen that holds your things did not hold these.

      `all` because this is a record rather than a queue: a sentence should not vanish from
      your own history the moment you have said it.
    */
    const askedTiles: Tile[] = askedCards(learner.asked ?? [], finished, true).map(
      (c): Tile => ({ kind: 'card', id: c.id, card: c }),
    )

    return {
      done: [...vibes, ...derivedTiles, ...finished.flatMap((id) => asTile(id) ?? [])],
      saved: saved.flatMap((id) => asTile(id) ?? []),
      asked: askedTiles,
      words: wordCards().map((c): Tile => ({ kind: 'card', id: c.id, card: c })),
    }
  }, [
    saved.join('|'),
    finished.join('|'),
    sections.join('|'),
    (learner.roots_played ?? []).join('|'),
    learner.inventory,
  ])

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

  /*
    EMPTY WHEN IT IS EMPTY — which is not the same question as whether the Club is open.

    Reported as: "The Yours page should be accessible but EMPTY because no content has been
    selected yet. It is currently full of content even after reset." It was — every section
    rendered against empty arrays, so a device with nothing on it got BEEN THROUGH, SAVED,
    YOUR PORTUGUESE and a Legend, all of them headings over nothing.

    The first fix put Yours behind the Club door with the other three, and that was wrong in
    a way the gate caught: feed-check seeds a learner who has finished the basics, completed
    one card and saved another, with no Legend yet — and my gate told them "not yet" about
    their own saved words. Yours is not a room you are admitted to; it is a record of what
    you have done, and hiding somebody's own work from them is a worse failure than the one
    being fixed.

    So the test is the CONTENT, which is what the report actually said. Nothing kept, nothing
    finished, no vibe been through: the explainer, because there is genuinely nothing here.
    Anything at all: their things, however few. The other three tabs stay on the Club door,
    because a room, a calendar of that room's events and the tool inside it are all things
    you are let into — this one you fill.
  */
  /*
    EMPTY OF CONTENT, NOT EMPTY OF SCREEN.

    Reported as: "The Yours page should be accessible but EMPTY because no content has been
    selected yet. It is currently full of content even after reset." It was — BEEN THROUGH,
    SAVED, KEPT and WORTH HAVING all rendered against empty arrays, four headings over
    nothing.

    Two wrong fixes before this one, and the gate caught both. First I put the whole screen
    behind the Club door, which told a learner who had finished the basics and saved a card
    "not yet" about their own saved words — Yours is a record you fill, not a room you are
    admitted to. Then I replaced the whole screen with an explainer, which took the NAME,
    the theme, the sound switch and the purpose choice with it: `tap-check` asks for the
    sound toggle on this screen and could not find it, correctly.

    So the empty state is this screen, whole — header, identity, settings — with one honest
    line where the sections would be. A setting is never empty; only the record is.
  */
  /*
    PROOF COUNTS, and leaving it out was the third mistake on this screen.

    A learner who has said three sentences cold has done the hardest thing the product
    asks and has a mintable card to show for it — showing-reach seeds exactly that and
    found no share control, because this test only counted cards saved and vibes finished.
    Proof is the record at its most literal: things this person has actually said.
  */
  const hasSomething =
    saved.length > 0 ||
    finished.length > 0 ||
    sections.length > 0 ||
    (learner.proof ?? []).length > 0 ||
    (learner.legend ?? []).length > 0

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
        <Wordmark mark="club" className="h-6" title="DUB Club" />
      </header>
      <BottomNav />

      <Identity />

      {!mounted ? null : !hasSomething ? (
        /*
          The line, and a way to start. Not a dead end: this is the one screen a person can
          reach with nothing on it, so it has to point somewhere.
        */
        <div className="flex flex-col gap-6">
          <p className="text-sm leading-relaxed text-muted" data-testid="yours-empty">
            Nothing here yet. The vibes you go through, the Portuguese you keep and your
            Legend all collect on this screen.
          </p>
          <Link
            href="/vibes"
            data-testid="yours-start"
            className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            START HERE
          </Link>
          <div className="border-t border-line pt-6">
            <ThemeChoice />
            <SoundChoice />
            <PurposeChoice />
          </div>
        </div>
      ) : (
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
            label={PROFILE_COPY.asked_label}
            note={PROFILE_COPY.asked_note}
            empty={PROFILE_COPY.asked_empty}
            tiles={sets.asked}
            onOpen={setOpen}
          />
          <Section
            label={PROFILE_COPY.words_label}
            note={PROFILE_COPY.words_note}
            empty=""
            tiles={sets.words}
            onOpen={setOpen}
          />
          <LegendRow />
          {/*
            Above More rather than below it, because a friend is a thing you have and More
            is the drawer for everything else.
          */}
          <Friends />
          <More />
          {/*
            The dark theme was complete, correct, and only reachable from the burger —
            which no longer exists. It is a thing about your copy of DUB rather than a
            destination, so it sits at the foot of the screen that holds your things,
            under the list, where a setting goes.
          */}
          <div className="border-t border-line pt-6">
            <ThemeChoice />
            <SoundChoice />
            <PurposeChoice />
          </div>
        </>
      )}
      <BottomNavSpace />
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
    /*
      Named so a check can ask whether any section is on screen at all. Yours is empty
      before the Club, and "empty" is the absence of these — which is invisible to a text
      search that matches the explainer's own prose.
    */
    <section
      data-testid={'section-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
      className="flex flex-col gap-3"
    >
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
      THE SAME PHOTOGRAPH THE SHELF USES, because it is the same object.

      This said "a vibe has no photograph and does not need one", and that was true when it
      was written: the shelf identified vibes by tone and a line drawing because there were
      no vibe pictures in the product. There are now — the shelf is a grid of them — so the
      only screen still drawing the pattern was this one, and a learner met Top Gun as a
      photograph in one place and as a line icon in another. Two pictures of one thing is
      worse than either.

      The drawing stays as the fallback rather than being deleted. A vibe authored before
      its picture exists should look deliberate, not broken, and that is exactly what the
      pattern and the icon are for.
    */
    const shot = vibeImage(tile.family)
    return (
      <Link
        href={'/vibes?open=' + tile.family}
        data-testid={'tile-' + tile.id}
        // data-tone, not a style variable: the tone is a NAME the stylesheet maps to a
        // colour, and setting --tone to "reflective" silently produced no pattern at all.
        data-tone={tile.tone}
        className={shell + (shot ? '' : ' azulejo-block')}
      >
        {shot ? (
          <Image
            src={shot.src}
            alt=""
            aria-hidden
            fill
            sizes="(max-width:448px) 50vw, 224px"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <CrateIcon crate={tile.family} className="h-10 w-10 text-[color:var(--tone)]" />
          </span>
        )}
        <span
          className={
            'absolute inset-x-0 bottom-0 px-3 pb-3 pt-6 ' +
            (shot
              ? 'bg-gradient-to-t from-black/90 via-black/45 to-transparent'
              : 'bg-gradient-to-t from-bg via-bg/85 to-transparent')
          }
        >
          <span className={'display block text-xs leading-tight ' + (shot ? 'text-white' : '')}>
            {tile.title}
          </span>
          {/* Said quietly, because the shelf is a record and not a to-do list. */}
          {!tile.through ? (
            <span
              className={
                'mt-1 block text-[0.55rem] uppercase tracking-wider ' +
                (shot ? 'text-white/75' : 'text-muted')
              }
            >
              still in there
            </span>
          ) : null}
        </span>
      </Link>
    )
  }

  const card = tile.card
  const face = cardFace(card)
  const image = face.image
  const title = face.title
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


/**
 * Who this is.
 *
 * A name and a face, because a profile with neither is a filing cabinet — and because
 * the next thing this screen has to be able to do is belong to somebody another person
 * could recognise.
 *
 * The photograph never leaves the phone. It lives in its own storage key rather than on
 * the learner, which is the thing that syncs; the name does sync, because a name is what
 * you would be called in a room and the whole point of having one is that somebody else
 * can read it.
 */
function Identity() {
  const learner = useLearner()
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    setPhoto(getAvatar())
  }, [])
  useEffect(() => {
    if (mounted) setName(learner.display_name ?? '')
  }, [mounted, learner.display_name])

  return (
    <section className="flex items-center gap-3">
      <button
        type="button"
        data-testid="avatar"
        onClick={() => file.current?.click()}
        aria-label={photo ? 'Change your photo' : 'Add a photo'}
        className="tap-target relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-line bg-bg-elev"
      >
        {photo ? (
          /* Not next/image: this is a data URI from the person's own camera roll, and the
             optimiser has nothing to do with it. */
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="eyebrow flex h-full w-full items-center justify-center text-[0.5rem] text-muted">
            {PROFILE_COPY.add_photo}
          </span>
        )}
      </button>
      <input
        ref={file}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          const next = await setAvatarFromFile(f)
          if (next) setPhoto(next)
        }}
      />

      <div className="min-w-0 flex-1">
        <p className="eyebrow text-muted">{PROFILE_COPY.eyebrow}</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setDisplayName(name.trim())}
          placeholder={PROFILE_COPY.name_hint}
          aria-label="Your name"
          data-testid="profile-name"
          className="display mt-1 w-full bg-transparent text-2xl text-fg outline-none placeholder:text-muted"
        />
      </div>
    </section>
  )
}


/**
 * The Legend, as one row rather than a tab.
 *
 * It is the biggest thing somebody makes here and it sat in a menu of eleven, level with
 * the feedback form. A row with its real state on it says more than a link did.
 */
function LegendRow() {
  const learner = useLearner()
  const answers = learner.legend ?? []
  const done = answers.filter((a) => Object.keys(a.values).length > 0).length
  const status = legendStatus({ sectionsCompleted: learner.sections_completed ?? [] })
  const line = !status.open
    ? PROFILE_COPY.legend_locked.replace('{n}', String(status.toGo))
    : done >= LEGEND_FRAMES.length
      ? PROFILE_COPY.legend_done
      : PROFILE_COPY.legend_building
          .replace('{done}', String(done))
          .replace('{all}', String(LEGEND_FRAMES.length))

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="eyebrow min-w-0 text-accent">{PROFILE_COPY.legend_label}</h2>
        <span className="h-px flex-1 bg-line" />
      </div>
      <Link
        href="/legend"
        data-testid="profile-legend"
        className="tap-target flex items-center gap-3 rounded border border-line bg-bg-elev px-4 py-3 transition hover:border-accent/50"
      >
        <span className="min-w-0 flex-1">
          <span className="display block text-base">The minute about yourself</span>
          <span className="mt-1 block text-xs text-muted">{line}</span>
        </span>
        <span aria-hidden className="shrink-0 text-muted">→</span>
      </Link>
    </section>
  )
}

/**
 * What the burger was holding.
 *
 * A flat list of eleven where Dub Club and the feedback form were peers. They are not
 * peers — most of these answer "what have I got", and that question has a screen now.
 */
const MORE = [
  { href: '/proof', label: 'Proof', hint: 'The sentences you can say cold' },
  { href: '/vocab', label: 'Vocab library', hint: 'Every piece you have kept' },
  { href: '/drops', label: 'Drops', hint: 'Pegged to something really happening' },
  { href: '/pro', label: 'Membership', hint: 'What it opens, and what the money is for' },
  { href: '/account', label: 'Account', hint: 'This device, codes, and your data' },
  { href: '/feedback', label: 'Feedback', hint: 'Tell us what did not land' },
]

function More() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="eyebrow min-w-0 text-accent">{PROFILE_COPY.more_label}</h2>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-col">
        {MORE.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="tap-target flex items-baseline justify-between gap-3 border-b border-line/60 py-3 transition hover:text-accent"
          >
            <span className="min-w-0">
              <span className="display block text-sm">{m.label}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">{m.hint}</span>
            </span>
            <span aria-hidden className="shrink-0 text-muted">→</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
