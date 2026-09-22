'use client'

import Image from 'next/image'
import { vibeImage } from '@/content/vibe-images'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/Feed'
import { CrateIcon } from '@/components/CrateIcon'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { Friends } from '@/components/Friends'
import { Wordmark } from '@/components/Wordmark'
import { askedCards, cardById, cardFace, derivedCards, dropsFor, roomsFor, type FeedCard } from '@/content/feed'
import { derivedById } from '@/engine/derive'
import { CRATES, PIECES, ROOTS, type CultureFamily } from '@/content/roots'
import { LEGEND_FRAMES, askFor, cardFor, cardToGo, nextStage, stageFor, frameApplies, frameForPurpose, frameReady, legendStatus } from '@/content/legend'
import { PROFILE_COPY } from '@/content/profile-copy'
import { askToKeep, getAvatar, loadAvatar, setAvatarFromFile } from '@/engine/avatar'
import { setDisplayName } from '@/engine/learner'
import { useEntitlements } from '@/engine/useEntitlements'
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
/**
 * The five piles, declared once.
 *
 * A table rather than five hand-written call sites, because the whole point of the
 * concertina is that every section is the same device — and five blocks of JSX that
 * differ only in their strings is how they stop being.
 *
 * WHAT EARNS A ROW: it has to be a pile of Portuguese this person made. That is the line
 * the cog drew for settings and it is the same line here. BEEN THROUGH is where they have
 * been, PUT ASIDE is what they set by, SAID COLD is what they produced, YOUR WORDS is
 * what they own, and DROPS is where they took it.
 *
 * That last one was WHAT IS ON and listed the entire calendar, which made it the only row
 * here that was not theirs — twelve evenings identical for every learner, under four piles
 * of things they had made. It is filtered to finished drops now, and the listings page it
 * used to be is the button at the foot of the section.
 *
 * WORTH HAVING is not here. It rendered four cards from a hardcoded editorial list, the
 * same four for every learner, while the actual inventory was a link in a drawer. One of
 * those is a shop window and the other is the cupboard; the cupboard has the row now.
 */
const SECTIONS: {
  id: 'done' | 'aside' | 'cold' | 'words' | 'sheets' | 'drops'
  label: string
  note: string
  empty: string
  count: (tiles: Tile[], learner: ReturnType<typeof useLearner>) => string
  /*
    WHAT THE NUMBER IS OF, said under it at pillar scale.

    Sam: "I like the large 8 things you can say about yourself (the large letter 8) and
    would like to mirror this approach to all sections in YOURS."

    The Legend hero has done this since it was written — the count at clamp(2.5rem, 13vw,
    4rem) with one line of prose under it — and every section below it had the same fact
    as small grey type at the end of a row. The numbers were already there and already
    correct; what they lacked was the weight.

    A function of the count so the noun can agree with it. "1 pieces you have banked" is
    the kind of thing that reads as a machine wrote the screen.
  */
  unit: (n: number) => string
  more?: { href: string; label: string }
}[] = [
  {
    id: 'done',
    label: PROFILE_COPY.done_label,
    note: PROFILE_COPY.done_note,
    empty: PROFILE_COPY.done_empty,
    unit: (n) => (n === 1 ? 'vibe or room you have been through' : 'vibes and rooms you have been through'),
    count: (t) => String(t.length),
  },
  {
    id: 'aside',
    label: PROFILE_COPY.aside_label,
    note: PROFILE_COPY.aside_note,
    empty: PROFILE_COPY.aside_empty,
    unit: (n) => (n === 1 ? 'thing you put by for later' : 'things you put by for later'),
    count: (t) => String(t.length),
  },
  {
    id: 'cold',
    label: PROFILE_COPY.cold_label,
    note: PROFILE_COPY.cold_note,
    empty: PROFILE_COPY.cold_empty,
    /*
      The whole pile, not the six shown. A section that says 6 while the proof card says
      41 is two screens disagreeing about the same fact, which is the failure this repo
      keeps having to undo.
    */
    unit: (n) => (n === 1 ? 'sentence said with nothing on screen' : 'sentences said with nothing on screen'),
    count: (_t, l) => String((l.proof ?? []).length),
    more: { href: '/proof', label: 'THE PROOF CARD' },
  },
  {
    id: 'words',
    label: PROFILE_COPY.words_label,
    note: PROFILE_COPY.words_note,
    empty: PROFILE_COPY.words_empty,
    unit: (n) => (n === 1 ? 'piece of Portuguese, banked' : 'pieces of Portuguese, banked'),
    count: (_t, l) => String(Object.keys(l.inventory ?? {}).filter((id) => PIECES[id]).length),
    more: { href: '/vocab', label: 'THE WHOLE LIBRARY' },
  },
  {
    id: 'sheets',
    label: PROFILE_COPY.sheets_label,
    note: PROFILE_COPY.sheets_note,
    empty: PROFILE_COPY.sheets_empty,
    unit: (n) => (n === 1 ? 'group you kept to check' : 'groups you kept to check'),
    count: (t) => String(t.length),
  },
  {
    id: 'drops',
    label: PROFILE_COPY.drops_label,
    note: PROFILE_COPY.drops_note,
    empty: PROFILE_COPY.drops_empty,
    unit: (n) => (n === 1 ? 'night you took it to' : 'nights you took it to'),
    count: (t) => String(t.length),
    /* And the calendar itself, which is a listings page and belongs behind a button. */
    more: { href: '/drops', label: 'WHAT IS ON NOW' },
  },
]

type Tile =
  | { kind: 'card'; id: string; card: FeedCard }
  /*
    A LINE OF PORTUGUESE, which is not a picture and should not be squeezed into one.

    SAID COLD and YOUR WORDS are the two piles this screen was missing, and both are
    language rather than cards — a sentence somebody produced, a word they own. Rendering
    them as 3/4 photo tiles would mean cropping a sentence to fit a shape chosen for
    vibes, so they get rows instead and the concertina stays the same device either way.
  */
  | { kind: 'line'; id: string; pt: string; en: string; note?: string }
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
  const access = useEntitlements()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState<FeedCard | null>(null)
  /*
    WHICH SECTION IS OPEN, and null on arrival.

    Not remembered between visits, deliberately. The reason this screen is a concertina is
    that the breadth is the first thing it should say — restoring whatever was open last
    time would mean landing back in one pile's depth, which is the state the redesign was
    built to stop being the default.
  */
  const [openSection, setOpenSection] = useState<string | null>(null)
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
          /*
            ALL THE WAY THROUGH MEANS EVERY ROOT IN IT, and only that.

            This also accepted `sections_completed`, which does not mean what the name
            suggests: engine/learner.ts writes it at the end of EVERY sitting and dedupes
            by vibe, so it records "has been inside this" rather than "has finished it" —
            its own note says so. The basics hold 16 roots and a sitting serves about
            four, so one sitting marked the biggest thing in the product complete and the
            tile dropped its "still in there" marker with three quarters left to do.

            The root test was already here and is the honest one. A learner who genuinely
            finished every root satisfies it; nobody else does.
          */
          through: rootsHere.length > 0 && rootsHere.every((r) => played.has(r.root_id)),
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
      /*
        AND NOT THE SHEETS, which are not something you get through.

        `finished_cards` is written by NOT FOR ME as well as by finishing — it means
        "spent", not "achieved" — and cardById now resolves sheet ids, so dismissing a
        cheat sheet filed it under "vibes and rooms you have been through". Rejecting
        something is the one thing that should never appear on the shelf of what you did.

        Excluded by kind rather than by which button was pressed, because a sheet does not
        belong here either way: it is a reference you check, it has its own row below, and
        "been through counting to ten" is not a claim this screen should make.
      */
      done: [
        ...vibes,
        ...derivedTiles,
        ...finished.filter((id) => !id.startsWith('sheet_')).flatMap((id) => asTile(id) ?? []),
      ],
      /*
        SAVED AND KEPT ARE ONE PILE, because the difference was about which button you
        pressed rather than about the thing.

        Two sections sat next to each other — "the ones you put by for the night before
        you need them" and "sentences you asked for" — and both answer "I wanted this
        later". A learner looking for something they put aside had to remember whether
        they had bookmarked it or asked for it, which is a fact about the product rather
        than about them.

        Bookmarks first: they are cards with pictures and they make the grid read.
      */
      /*
        Everything set aside EXCEPT the cheat sheets, which have their own row now.

        A sheet is not a card you bookmarked for one evening — it is a reference you go
        back to, which is a different relationship to a thing. Sam: "add Chest sheets as
        anopther section in YOURS - put there by saving them in Club feed."
      */
      aside: [
        ...saved.filter((id) => !id.startsWith('sheet_')).flatMap((id) => asTile(id) ?? []),
        ...askedTiles,
      ],
      /*
        THE SHEETS SOMEBODY KEPT, saved from the Club feed.

        The bookmark already wrote them; nothing displayed them, because cardById could
        not resolve a sheet id (fixed in content/feed.ts) and PUT ASIDE would have mixed a
        reference table in with a night at a concert.

        Its own row because of what a sheet is for: counting to ten is not something you
        finish, it is something you check. Everything else on this screen is a record of
        what happened — this is the one pile you open again on purpose.
      */
      sheets: saved.filter((id) => id.startsWith('sheet_')).flatMap((id) => asTile(id) ?? []),
      /*
        WHAT THEY HAVE SAID WITH NOTHING ON SCREEN — the product's own measure of itself.

        This was a row in a drawer at the foot of the page pointing at /proof, which is
        the one number DUB claims is real. Newest first and six of them: the section is a
        window onto the proof card rather than a copy of it, and the button at the bottom
        goes to the whole thing.
      */
      cold: [...(learner.proof ?? [])]
        .reverse()
        .slice(0, 6)
        .map(
          (l, i): Tile => ({
            kind: 'line',
            id: 'proof_' + i,
            pt: l.pt,
            en: l.en,
            note: l.clean ? 'first go' : undefined,
          }),
        ),
      /*
        AND THE WORDS THEY ACTUALLY OWN, which is what WORTH HAVING was pretending to be.

        WORTH HAVING rendered four editorial cards from a hardcoded list — the same four
        for every learner, on the screen that is supposed to be theirs. The real inventory
        was a drawer row pointing at the library. So the teaser is gone and the inventory
        takes its place: these are pieces this person banked, newest first.
      */
      words: Object.entries(learner.inventory ?? {})
        .filter(([id]) => PIECES[id])
        /*
          Newest first where there is a date to sort on.

          InventoryItem carries latest_recall_at and no acquisition date — a gap worth
          naming rather than papering over, since "newest first" is the obvious ordering
          for a pile somebody is adding to. Items never recalled sort last, which puts the
          ones they have actually used in front, and that is a defensible second-best.
        */
        .sort((a, b) =>
          String(b[1]?.latest_recall_at ?? '').localeCompare(String(a[1]?.latest_recall_at ?? '')),
        )
        .slice(0, 6)
        .map(
          ([id]): Tile => ({
            kind: 'line',
            id: 'piece_' + id,
            pt: PIECES[id].target,
            en: PIECES[id].gloss ?? '',
          }),
        ),
      /*
        THE NIGHTS THIS PERSON ACTUALLY WENT INTO — not the calendar.

        This listed every live drop, which made it the only row on the screen that was not
        theirs: twelve evenings in Lisbon, the same twelve for everybody, sitting under
        four piles of things they had made. Sam: "this looks lioke ALL drops - shoudl be
        just ones teh user has completed."

        Filtered on finished_cards, which is what Errand writes when somebody finishes a
        room — the same record BEEN THROUGH is built from, so the two rows cannot disagree
        about what has been done.

        A drop's card id IS its first situation's id (see dropsFor), so this matches on
        exactly the room the tile represents. Somebody who went into a drop and finished
        its arrival has been to that night as far as DUB can tell; the whole calendar
        stays one tap away behind EVERYTHING ON.
      */
      /*
        ANY ROOM OF THE NIGHT, not only its arrival.

        This matched on the drop's card id, which IS its first situation — the arrival —
        so a night counted as visited only if you had finished "Finding the venue", and
        the three rooms after it counted for nothing. Sam's record shows the shape of that
        exactly: nine finished drop rooms, every one of them a `_where`.

        A drop is an evening with four rooms in it. Doing the ticket or the invitation is
        being at that night as much as finding the door is, and a screen that says
        otherwise is telling somebody their work did not happen.
      */
      drops: dropsFor(learner.chapter ?? undefined)
        .filter(
          (c) =>
            c.kind === 'situation' &&
            (c.drop?.situations ?? []).some((s2) => finished.includes(s2.id)),
        )
        .map((c): Tile => ({ kind: 'card', id: c.id, card: c })),
    }
  }, [
    saved.join('|'),
    finished.join('|'),
    sections.join('|'),
    (learner.roots_played ?? []).join('|'),
    learner.inventory,
    /* SAID COLD reads the proof, so it has to recompute when a sentence lands. */
    (learner.proof ?? []).length,
    learner.asked,
  ])

  if (open) {
    /* dvh, not svh: this is the full-bleed card view, and svh stops it short of the
       bottom bar on a phone. Same bug as the Club feed. */
    return (
      <main data-stage="REAL WORLD" className="relative h-dvh w-full overflow-hidden bg-[#241f1a]">
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
          {/*
            A REJECT HERE HAS TO BE VISIBLE, because it un-saves the card.

            Card's pane scroller calls rejectCard on a left swipe, and rejectCard removes
            the id from `saved` as well as pushing it to the back of the Club. In the feed
            that is announced — onRejected raises a toast carrying BRING IT BACK. Yours
            passed nothing, so a learner opening a card they had deliberately bookmarked
            and swiping it the way the Club taught them lost it with no message and no
            undo: the pile they were looking at was one shorter when they closed the view.

            Closing the overlay is the honest minimum. The card has left the pile it was
            opened from, so staying on it would show a card that is no longer there — and
            the grid behind is the place that says what is left.
          */}
          <Card
            card={open}
            saved={saved.includes(open.id)}
            liked={(learner.liked ?? []).includes(open.id)}
            onRejected={() => setOpen(null)}
            /*
              AND THE SAME FOR FINISHING IT, which was the other end of the same wire.

              A derived card's GOT IT and a cheat sheet's NOT FOR ME both bank
              finished_cards and then call onDone. The feed passes one and raises a
              toast; Yours passed nothing, so the two buttons a learner is most likely
              to press sat there doing nothing visible at all — the card stayed open,
              unchanged, exactly as if the tap had missed.

              Closing is the honest answer here for the same reason a reject closes: the
              card has been spent, so the pile behind is where the result is legible.
            */
            onDone={() => setOpen(null)}
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
  /*
    An empty record inside an INSTALLED app, with no account to pull one from.

    That combination has one likely cause — the learner started in the browser, and the
    app's separate storage means this screen knows nothing about it. Read after mount like
    everything else that depends on the device.
  */
  const standaloneEmpty =
    mounted &&
    access.known &&
    access.signInReady &&
    !access.signedIn &&
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true)

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
          {/*
            AND THE WAY BACK, for the one person this screen is a disaster for.

            An installed app has its OWN storage. So somebody who did the basics in Safari,
            added DUB to their home screen and opened it lands HERE — on a screen that says
            "nothing here yet" about work they did an hour ago. Nothing is lost, but nothing
            on the screen says so, and the reasonable conclusion is that the product threw
            it away.

            Shown only when standalone and not signed in, which is exactly that case: in a
            browser tab an empty screen really is empty, and somebody signed in has their
            record on the way already.
          */}
          {standaloneEmpty ? (
            <div className="flex flex-col gap-3 rounded border border-line bg-bg-elev px-4 py-3">
              <p className="text-sm leading-relaxed text-fg">
                Did you start in the browser? The app keeps its own copy, so anything you
                did there is still there — sign in on both and they join up.
              </p>
              <Link
                href="/signin?next=%2Fprofile"
                data-testid="yours-recover"
                className="tap-target eyebrow w-full rounded border border-accent px-5 py-3 text-center text-accent"
              >
                BRING IT OVER
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          {/*
            THE LEGEND GOES FIRST, and everything else on this screen is what built it.

            It was fifth, under three grids of cards. The order of this page is an argument
            about what DUB is for: a screen that opens on saved cards says the product is a
            collection, and one that opens on the Legend says it is a thing you are making.
            The vibes, the words and the cards below are the raw material — they read as
            provenance under it rather than as rivals to it.
          */}
          <LegendHero />
          {/*
            FIVE ROWS, ONE DEVICE, CLOSED ON ARRIVAL.

            Seven things ran down this page in one column — four grids and a drawer of
            three links — so what somebody owned was a scroll rather than a shape. Closed,
            these fit under the Legend on one screen, and the page's first statement is
            how much there is of each.

            Only one open at a time. Two open sections is two depths on screen and the
            breadth is gone again, which is the thing the concertina exists to protect.
          */}
          <div className="flex flex-col">
            {SECTIONS.map((sec) => (
              <Section
                key={sec.id}
                label={sec.label}
                note={sec.note}
                empty={sec.empty}
                tiles={sets[sec.id]}
                onOpen={setOpen}
                finished={finished}
                open={openSection === sec.id}
                onToggle={() => setOpenSection(openSection === sec.id ? null : sec.id)}
                count={sec.count(sets[sec.id], learner)}
                unit={sec.unit}
                showBar={sec.id === 'words'}
                more={sec.more}
              />
            ))}
          </div>
          {/*
            Above More rather than below it, because a friend is a thing you have and More
            is the drawer for everything else.
          */}
          <Friends />
          {/*
            The theme, the sound and the purpose used to sit here, at the foot of the list.

            That was right while there was nowhere else to put them — the note this comment
            replaces argued they were "a thing about your copy of DUB rather than a
            destination", and it was correct. They are now three controls on a screen that
            is entirely things about your copy of DUB, which is a better version of the
            same argument: the cog holds appearance, sound and why you are here, and this
            screen ends on the Portuguese rather than on a preference.
          */}
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
  finished,
  open,
  onToggle,
  count,
  unit,
  showBar,
  more,
}: {
  label: string
  note: string
  empty: string
  tiles: Tile[]
  onOpen: (c: FeedCard) => void
  /* Passed through to the tiles: a night opens where the learner left off. */
  finished: string[]
  open: boolean
  onToggle: () => void
  /*
    What the closed row says on its right.

    A number for most of them, because "how much have I got" is the question. Passed in
    rather than read off `tiles.length`, since two of these summarise a room holding more
    than the six tiles shown — the count has to be the truth about the pile, not about
    the preview of it.
  */
  count: string
  /** The noun under the big number, agreeing with it. */
  unit: (n: number) => string
  /** Only the words have a sourced target to measure against. */
  showBar?: boolean
  /** The room this section is the front of, where one exists. */
  more?: { href: string; label: string }
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return (
    /*
      Named so a check can ask whether any section is on screen at all. Yours is empty
      before the Club, and "empty" is the absence of these — which is invisible to a text
      search that matches the explainer's own prose.
    */
    <section data-testid={'section-' + id} className="flex flex-col">
      {/*
        THE ROW IS THE WHOLE DEVICE, and every section on this screen uses it.

        Sam: "lets have a big clean up of the YOURS section... one device mechanice for
        all sectios that survice, probably using concertina to open close so we can see
        breath first off without seeing depth."

        Four grids and three links used to run down this page in one column — so the shape
        of what somebody owned was something you scrolled past rather than saw. Closed,
        the five rows fit one screen, and the first thing the page says is how much there
        is of each rather than the first six things in the first pile.

        THE COUNT IS THE POINT OF THE CLOSED STATE. A row that said only BEEN THROUGH
        would be a worse link; a row that says 12 is an answer to the question somebody
        opened this screen with.
      */}
      <button
        type="button"
        data-testid={'open-' + id}
        aria-expanded={open}
        onClick={onToggle}
        className="tap-target flex w-full items-center gap-3 border-b border-line py-3 text-left transition"
      >
        <span
          aria-hidden
          className={
            'shrink-0 text-muted transition-transform duration-[260ms] ' +
            (open ? 'rotate-90' : '')
          }
        >
          ▸
        </span>
        <span className="eyebrow min-w-0 flex-1 text-accent">{label}</span>
        {/*
          The count on the row, and only while the row is shut.

          Open, the same number sits immediately below at pillar scale — so leaving it here
          printed it twice, one line apart, in two sizes. The closed row is where it earns
          its place: it is the whole reason the concertina can be read as a shape.
        */}
        {open ? null : (
          <span className="shrink-0 tabular-nums text-sm text-muted">{count}</span>
        )}
      </button>

      {open ? (
        <div className="flex flex-col gap-3 py-6">
          {/*
            THE NUMBER AT THE SIZE THE LEGEND USES, because it is the same kind of fact.

            The count was already on the closed row as small grey type at the end of a
            line, which is where a number goes when nobody is sure it matters. It does:
            it is the whole answer to "how am I doing", and this screen is the only place
            in the product that answers it.

            `.pillar` is the Legend hero's own class rather than a copy of its numbers —
            same clamp, same 620ms landing — so the six sections and the hero cannot drift
            into six sizes of one idea.
          */}
          <p className="pillar tabular-nums text-accent">{count}</p>
          <p className="pillar-body text-sm leading-relaxed">{unit(Number(count) || 0)}</p>
          {/*
            AND ON THE WORDS, HOW FAR THAT IS, because it is the one count with a real bar.

            Sam: "I want to show actual progress" — and not a streak, which counts days and
            measures attendance. This measures what somebody owns. It only ever rises, it
            rises only when a word is banked, and nothing about time or turning up touches
            it: a fortnight away leaves it exactly where it was.

            WORDS_FOR_MOST_OF_A_DAY is sourced rather than chosen — see its note — which is
            why this is the only section that gets a bar. Inventing a target for sentences
            said cold or nights out would be the same gauge with nothing behind it, and a
            progress bar measuring against a number somebody made up is worse than no bar.
          */}
          {showBar ? (
            (() => {
              /*
                THE STAGE, AND THE DISTANCE TO THE NEXT ONE.

                This was a bar against 800 — see STAGES in content/legend.ts for why that
                measured the wrong thing. The bar is still here, but it fills between the
                stage somebody is in and the one ahead, so it is always a distance they can
                actually close rather than a fraction of a number the library has not
                reached. At the far end there is nothing left to fill and the bar goes.
              */
              const words = Number(count) || 0
              const here = stageFor(words)
              const next = nextStage(words)
              const span = next ? next.at - here.at : 0
              const done = next ? Math.max(0, Math.min(1, (words - here.at) / span)) : 1
              return (
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-fg">{PROFILE_COPY.words_stage(here.name)}</p>
                  {next ? (
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-line"
                      role="img"
                      aria-label={here.name + ', ' + (next.at - words) + ' words from ' + next.name}
                    >
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-[620ms]"
                        style={{ width: (done * 100).toFixed(1) + '%' }}
                      />
                    </div>
                  ) : null}
                  <p className="text-xs leading-relaxed text-muted">
                    {PROFILE_COPY.words_can(here.can)}
                  </p>
                  {next ? (
                    <p className="text-xs leading-relaxed text-muted">
                      {PROFILE_COPY.words_next(words, next.at, next.name)}
                    </p>
                  ) : null}
                </div>
              )
            })()
          ) : null}
          <p className="text-xs leading-relaxed text-muted">{note}</p>
          {!tiles.length ? (
            <p className="rounded border border-line bg-bg-elev px-4 py-3 text-sm text-muted">
              {empty}
            </p>
          ) : (
            /* Two across, three-by-four — the shape of something you scan rather than read. */
            <div className="grid grid-cols-2 gap-3">
              {tiles.map((t) => (
                <TileView key={t.kind + t.id} tile={t} onOpen={onOpen} finished={finished} />
              ))}
            </div>
          )}
          {/*
            And the way into the room this section summarises, where there is one.

            SAID COLD and YOUR WORDS have whole screens of their own — the proof card and
            the library — which used to be rows in a drawer at the foot of the page, miles
            from the thing they belong to. A section that shows six of sixty needs a door
            at the bottom of it rather than a link somewhere else.
          */}
          {more ? (
            <Link
              href={more.href}
              data-testid={'more-' + id}
              className="tap-target eyebrow w-full rounded border border-line px-5 py-3 text-center text-fg transition hover:border-accent hover:text-accent"
            >
              {more.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function TileView({
  tile,
  onOpen,
  finished = [],
}: {
  tile: Tile
  onOpen: (c: FeedCard) => void
  /* What this learner has already been through, so a night can open where they left off. */
  finished?: string[]
}) {
  const shell =
    'tap-target relative block aspect-[3/4] w-full overflow-hidden rounded border border-line text-left'

  /*
    The Portuguese at the size reserved for it, and the English under it small.

    Same hierarchy the whole product uses for produced language: what the learner can say
    is the thing on the card, and the gloss is the footnote. Not a link — these are a
    record rather than a route, and the room each section belongs to is one button below.
  */
  if (tile.kind === 'line') {
    return (
      <div className="col-span-2 rounded border border-line bg-bg-elev px-4 py-3">
        <p className="pt text-base text-accent">{tile.pt}</p>
        <p className="mt-1 text-xs text-muted">{tile.en}</p>
        {tile.note ? <p className="mt-1 text-[0.65rem] uppercase tracking-wider text-muted">{tile.note}</p> : null}
      </div>
    )
  }

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
  /*
    A DROP TILE SAYS WHICH NIGHT IT IS, not which room comes first.

    dropsFor returns the FIRST SITUATION of each drop as the card, and every drop's first
    situation is called "Finding the venue" — so twelve different evenings rendered as
    twelve identical tiles. Sam: "finding the venue just repeats itelf like this, not
    showinh teh actual events."

    It reads correctly in the Club feed, where the drop's own banner is above the card and
    the room title is the next thing you need. On a tile there is no banner, so the room
    title is the whole label and the one fact that distinguishes the twelve — the event —
    is not on screen at all.

    The event and the date, because a drop is a thing with a night attached: `on` is what
    makes this section WHAT IS ON rather than another pile of rooms.
  */
  const drop = card.kind === 'situation' ? card.drop : undefined
  const title = drop ? drop.event : face.title
  /*
    A NIGHT OPENS ITS ROOM, not a card about its room.

    Every tile here opened the Club card in an overlay — the same card the feed shows,
    with THE ROOM as a link inside it. For a saved card that is right: the card IS the
    thing. For a night somebody has already been to it is a detour through an
    advertisement for a room they have finished, and it was why the invite could not be
    found: Sam went looking on Yours and got a card, not the room that mints it.

    `?from=yours` so the room knows where to send them back. Every exit in Errand went to
    /club, which was true while the feed was the only way in.
  */
  if (drop) {
    /*
      WHERE THEY LEFT OFF, not back to the beginning.

      The tile linked to the drop's card id, which is its arrival room — so tapping a
      night you had already been to reopened the room you had already done. Nine times, in
      Sam's case: "both the close back to a find teh venue card", "all teh text is all teh
      same in all venue cards". It was the same room, every time, and the other three
      never came up.

      So it opens the first room of the evening still outstanding, and falls back to the
      arrival when the whole night is done — at which point reopening the first room is
      the right answer rather than an accident.
    */
    const next = drop.situations.find((s2) => !finished.includes(s2.id)) ?? drop.situations[0]
    /*
      And how much of the night is left, on the tile.

      Four rooms an evening, and nothing said which of them somebody had done — so a night
      three quarters finished looked exactly like one they had opened once. The count is
      the same device the concertina rows use, for the same reason: it answers the question
      somebody is actually asking before they tap.
    */
    const doneHere = drop.situations.filter((s2) => finished.includes(s2.id)).length
    return (
      <Link
        href={'/errand/' + next.id + '?from=yours'}
        data-testid={'tile-' + tile.id}
        className={shell}
      >
        {image ? (
          <Image src={image.src} alt="" aria-hidden fill sizes="(max-width:448px) 50vw, 224px" className="object-cover" />
        ) : null}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 px-3 pb-3">
          <span className="eyebrow mb-1 flex items-baseline justify-between gap-3 text-[0.5rem] text-white/80">
            <span className="min-w-0 truncate">{onNight(drop.on)}</span>
            <span className="shrink-0 tabular-nums">
              {doneHere} / {drop.situations.length}
            </span>
          </span>
          <span className="display block text-xs leading-tight text-white">{title}</span>
          <span className="mt-1 block text-[0.6rem] leading-tight text-white/70">{drop.place.name}</span>
        </span>
      </Link>
    )
  }
  return (
    <button type="button" data-testid={'tile-' + tile.id} onClick={() => onOpen(card)} className={shell}>
      {image ? (
        <Image src={image.src} alt="" aria-hidden fill sizes="(max-width:448px) 50vw, 224px" className="object-cover" />
      ) : null}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      {/* No drop branch here: a night returns above, as a link to its own room. */}
      <span className="absolute inset-x-0 bottom-0 px-3 pb-3">
        <span className={'display block text-xs leading-tight text-white ' + (card.kind === 'vocab' ? 'pt' : '')}>
          {title}
        </span>
      </span>
    </button>
  )
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/**
 * The night itself, in UTC.
 *
 * Journey's goneOn says when a drop EXPIRES, which is the right fact on a shelf somebody
 * is deciding what to open. Here the question is which evening this is, so it is the date
 * of the thing rather than the day after it.
 *
 * Formatted from the ISO string in UTC for the reason goneOn gives: a date formatted from
 * local time renders differently on the server and in the browser, which is a hydration
 * mismatch waiting to happen.
 */
function onNight(on: string): string {
  const d = new Date(on + 'T00:00:00Z')
  return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]
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
    /*
      The fast copy first, then whatever survived.

      getAvatar is synchronous so the photo is on screen in this render; loadAvatar then
      checks IndexedDB and puts it back if iOS evicted localStorage, which is what took
      Sam's picture away between one visit and the next. When nothing was evicted the
      second call resolves to the same string and setPhoto is a no-op.
    */
    setPhoto(getAvatar())
    void loadAvatar().then((p) => {
      if (p) setPhoto(p)
    })
    /* And ask to stop being evicted at all — this screen is the person's things. */
    void askToKeep()
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

      {/*
        THE COG, top right, where every phone puts it.

        Yours had membership, the account, the feedback form and three app settings in the
        same column as the Portuguese somebody had earned — so the screen that says "here
        is what you built" was also the screen for cancelling a subscription. Sam: "Put
        everythiung that is not about Language... into a settings section accessible via a
        cog icon top right in YOURS."

        On the identity row rather than in a header bar of its own: this screen has no
        sticky bar, and a bar added to carry one control would push the Legend down the
        page — which is the one thing the ordering note above this component refuses.
      */}
      <Link
        href="/settings"
        data-testid="yours-settings"
        aria-label="Settings"
        className="tap-target -mr-2 flex shrink-0 items-center justify-center self-start p-2 text-muted transition hover:text-accent"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </Link>
    </section>
  )
}


/**
 * THE LEGEND, AS THE HERO OF THIS SCREEN.
 *
 * Sam: "building your legend is the main purpose of all this… if a person practised their
 * Legend once a day they will be flying with Portuguese. Your UI has been quite basic and
 * recessive so far, it's time to punch it up a lot."
 *
 * It was a bordered row, fifth down the page, under saved cards and asked cards and words,
 * set at `text-base` — the same size as a saved card, which is to say the same size as
 * everything else on a screen of things. The spine of the product was a link.
 *
 * Three things make it the hero, in the order somebody uses them:
 *
 *   1. WHAT YOU HAVE, at pillar size. Not "5 of 7" — a possession, counted up, with no
 *      denominator anywhere. See profile-copy: a fraction caps at twelve and tells
 *      somebody they are finished, and Sam wants them to want thirty.
 *   2. PRACTICE, above the fold and above everything else, because that is the daily act
 *      the whole claim rests on. Both routes — out loud, and cold — were buried at the
 *      bottom of the Legend's own second screen and nothing on this page pointed at them.
 *   3. WHAT IS WAITING, from the same frameReady the unlock screen announces from, so a
 *      question announced at the end of a vibe is the question sitting here afterwards.
 *
 * It counts nothing that can go down and shows no percentage.
 */
function LegendHero() {
  const learner = useLearner()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const answers = learner.legend ?? []
  const answered = answers.filter((a) => Object.keys(a.values).length > 0)
  const done = answered.length
  const status = legendStatus({
    rootsPlayed: learner.roots_played ?? [],
    sectionsCompleted: learner.sections_completed ?? [],
    sittings: learner.sittings ?? 0,
  })

  /*
    WHAT IS WAITING — the same question the unlock screen asks, asked the same way.

    frameReady is the one answer to "do they have the words for this", so the question
    announced at the end of a vibe is the question sitting here when they arrive. Asking
    it differently on two screens is precisely how the card-by-card unlock got itself
    deleted the first time.
  */
  const owned = useMemo(
    () => new Set(Object.keys(learner.inventory ?? {}).filter((id) => PIECES[id])),
    [learner.inventory],
  )
  /*
    HOW MUCH OF THE CARD IS LEFT, for the case where nothing is ready.

    The seven, filtered by purpose and by the conditions that make a frame apply, minus
    what has been answered — the same function the Club and the Legend use, so the three
    screens cannot disagree about how far along somebody is.
  */
  const cardLeft = cardToGo(
    answered.map((a) => a.frame_id),
    answers,
    learner.purpose ?? null,
  )
  const ready = useMemo(
    () =>
      LEGEND_FRAMES.filter(
        (f) =>
          !answered.some((a) => a.frame_id === f.id) &&
          frameForPurpose(f, learner.purpose ?? null) &&
          frameApplies(f, answers) &&
          frameReady(f, owned),
      ),
    [owned, learner.purpose, answers, answered],
  )

  /* Server and first paint agree: nothing personal is counted until mounted. */
  const n = mounted ? done : 0

  return (
    <section data-testid="legend-hero" className="flex flex-col gap-6">
      <div className="flex items-baseline gap-3">
        <h2 className="eyebrow min-w-0 text-accent">{PROFILE_COPY.legend_label}</h2>
        <span className="h-px flex-1 bg-line" />
      </div>

      {/*
        The number, at the size the product reserves for the things it is actually about.
        `pillar` lands over 620ms and `pillar-body` follows at 260ms — the same arrival the
        end of a vibe uses, because this is the same claim being restated on the screen
        that holds it.
      */}
      {/*
        THE ACCENT SLAB, and the colour is an argument rather than decoration.

        --accent is the azulejo blue the product reserves for "the Portuguese" — the
        header, the CTA, and every Portuguese word on every screen. A white card with a
        blue number on it is a statistic; the Legend rendered IN that blue is the same
        claim the rest of the product makes about what matters, said on the screen that
        holds it. It is the one thing on Yours that is not a tile, which is the whole
        point: everything below is material, this is the thing made out of it.
      */}
      <div className="flex flex-col gap-3 rounded bg-accent px-5 py-6 text-accent-ink">
        {mounted && n > 0 ? (
          <>
            {/* 620ms, the same arrival the end of a vibe uses for the same claim. */}
            <p className="pillar tabular-nums">{n}</p>
            <p className="pillar-body text-sm leading-relaxed opacity-90">
              {n === 1
                ? PROFILE_COPY.legend_have_one
                : PROFILE_COPY.legend_have.replace('{done}', String(n))}
            </p>
          </>
        ) : (
          <p className="display text-balance text-xl">{PROFILE_COPY.legend_have_none}</p>
        )}

        {/*
          PRACTICE FIRST, and only once there is something to practise. Two answers is
          what the Legend's own screen requires before it offers a run-through, asked the
          same way here so this cannot offer a button that screen then refuses.
        */}
        {/*
          ONE BUTTON, because the two were describing the same thing.

          SAY IT ALL, OUT LOUD sat above COLD, WITH NOTHING ON SCREEN. Sam: "they are
          almost identical". They were: both are you, out loud, from memory. The real
          difference was never in the words — one ran every card and recorded nothing, the
          other ran ONE card and recorded a count the product never displays. Neither was
          the thing the words promised.

          The run behind it does both jobs now, so the choice is gone and what is left is
          the sentence that was always true of it.
        */}
        {mounted && done >= 2 ? (
          <div className="mt-3 flex flex-col gap-3">
            <Link
              href="/legend?run=1"
              data-testid="hero-practise"
              /* Inverted: on the slab the accent IS the ground, so the button is the ink. */
              className="tap-target eyebrow w-full rounded bg-accent-ink px-5 py-3 text-center text-accent"
            >
              {PROFILE_COPY.legend_practise.toUpperCase()}
            </Link>
          </div>
        ) : (
          <Link
            href="/legend"
            data-testid="profile-legend"
            className="tap-target eyebrow mt-3 w-full rounded bg-accent-ink px-5 py-3 text-center text-accent"
          >
            {status.open ? 'BUILD YOUR LEGEND' : 'SEE WHAT IT IS'}
          </Link>
        )}
      </div>

      {/*
        What is waiting, under the practice rather than over it: somebody arriving to say
        their Legend out loud should not have to walk past a to-do list to do it.
      */}
      {mounted && !status.open ? (
        <p className="text-xs text-muted">
          {/*
            Which half of the door they are on, said in the unit of that half. Sessions
            while the basics are open, vibes after — the split legendStatus already makes
            for the shelf and the section-complete screen.
          */}
          {status.toGo > 0
            ? (() => {
                const left = Math.max(0, status.sessionsNeeded - status.sessionsDone)
                return left === 1
                  ? PROFILE_COPY.legend_locked_one
                  : PROFILE_COPY.legend_locked.replace('{n}', String(left))
              })()
            : (() => {
                const left = Math.max(0, status.vibesNeeded - status.vibesDone)
                return left === 1
                  ? PROFILE_COPY.legend_locked_vibes_one
                  : PROFILE_COPY.legend_locked_vibes.replace('{n}', String(left))
              })()}
        </p>
      ) : mounted && ready.length ? (
        <Link
          href="/legend"
          data-testid="legend-waiting"
          className="tap-target flex items-center gap-3 rounded border border-line px-4 py-3 transition hover:border-accent/50"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm">
              {ready.length === 1
                ? PROFILE_COPY.legend_ready_one
                : PROFILE_COPY.legend_ready.replace('{n}', String(ready.length))}
            </span>
            {/* The question itself, so the row is an invitation rather than a count. */}
            <span className="pt mt-1 block text-xs text-accent">
              {askFor(ready[0], learner.profile?.gender ?? null)}
            </span>
          </span>
          <span aria-hidden className="shrink-0 text-muted">→</span>
        </Link>
      ) : mounted && cardLeft > 0 ? (
        /*
          THE THIRD THING THAT CAN BE TRUE, which this screen used to answer with silence.

          Door open, nothing ready, card unfinished — every remaining question held by a
          word the learner has not met. That is the ordinary state after a few vibes and
          it rendered nothing at all, so YOURS showed a count and then stopped, with no
          hint that more questions existed or what would open them.

          It goes to the Legend rather than answering here, because the Legend already
          knows: each blocked card names the word it wants and links to the vibe that
          teaches it. Saying it twice is how the two would drift.
        */
        <Link
          href="/legend"
          data-testid="legend-held"
          className="tap-target flex items-center gap-3 rounded border border-line px-4 py-3 transition hover:border-accent/50"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm">
              {cardLeft === 1
                ? PROFILE_COPY.legend_held_one
                : PROFILE_COPY.legend_held.replace('{n}', String(cardLeft))}
            </span>
            <span className="eyebrow mt-1 block text-accent">{PROFILE_COPY.legend_held_cta}</span>
          </span>
          <span aria-hidden className="shrink-0 text-muted">→</span>
        </Link>
      ) : null}
    </section>
  )
}

/*
  THE DRAWER IS GONE, because all three of its rows are sections now.

  It held Proof, the vocab library and the drops — three piles of Portuguese reached
  through a list at the foot of the page, under the grids of the things they belonged
  with. Membership, the account and feedback left for the cog; these three came up into
  the concertina, where a learner can see how much is in each before deciding to look.

  Nothing is less reachable: each section carries a button to the room it summarises.
*/
