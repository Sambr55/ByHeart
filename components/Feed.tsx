'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DemoCard } from '@/components/DemoCard'
import { AudioButton } from '@/components/AudioButton'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { Wordmark } from '@/components/Wordmark'
import { slugFor } from '@/content/audio-manifest'
import { mintShowing } from '@/engine/showing'
import {
  FEED_COPY,
  cardFace,
  dropDaysLeft,
  chapterName,
  askedCards,
  derivedCards,
  explainerCards,
  setUpCard,
  vibeCard,
  feedFor,
  vocabWord,
  type FeedCard,
} from '@/content/feed'
import { derivedFor } from '@/engine/derive'
import { track } from '@/engine/analytics'
import { recordProof, rejectCard, rememberFinishedCard, rewindReject, toggleCard } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'
import { StatusBar } from '@/components/Native'
import { SetUp } from '@/components/SetUp'
import { EXPLAINER_CTA } from '@/content/explainers'
import { cardDone } from '@/content/legend'
import { loadLearner, tasteRoom } from '@/engine/learner'

/**
 * The Club as a feed.
 *
 * Vertical for the next card, horizontal for the language, and both are native CSS
 * scroll-snap rather than a gesture library. That is not laziness — a hand-rolled swipe
 * on iOS fights momentum scrolling, rubber-banding and the back-swipe, and loses to all
 * three. The browser already knows how to do this.
 *
 * IT LOOPS RATHER THAN SCROLLING FOREVER. The list is rendered with the last card
 * before the first and the first after the last, and when you land on one of those
 * copies the scroll position is moved silently to its twin. So it never ends, and it
 * never grows: there is no bottom because it comes back round, not because we keep
 * fetching more. A product that has spent every other screen refusing to reward turning
 * up cannot have an infinite scroll on this one.
 */
/**
 * Which of the three Clubs this is.
 *
 * One screen, three audiences: somebody who has never heard of DUB, somebody part way
 * through earning their way in, and a member. See docs/spec-club-first-run.md §03 — the
 * important one is `showcase`, which locks nothing at all, because a lock shown before a
 * demonstration is just a wall.
 */
export type ClubStage = 'showcase' | 'working' | 'member'

export function Feed({ stage = 'member' }: { stage?: ClubStage }) {
  const learner = useLearner()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  /*
    Authored rooms first, then a few assembled ones.

    The ranking is one of URGENCY, not of quality. A room is the best card in the product
    and there are five of them; a derived card is a reminder built out of something this
    person already owns, and there is an unbounded supply. Putting the unbounded thing
    second — and rationed, three a session — is what stops the Club becoming a treadmill
    with a friendly face, which is the exact failure the whole idea is meant to avoid.

    Derived cards are computed after mount for the usual reason: what somebody owns comes
    out of localStorage, and branching on it during render is the hydration mismatch again.
  */
  /*
    ?preview=drops shows a drop before its window opens.

    Read after mount like everything else that comes out of the browser, so the server and
    the first paint agree. It shows real content early and hides nothing, which is why it
    can be a URL rather than a build flag.
  */
  const preview =
    mounted && typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('preview') === 'drops'
      : false

  const cards = useMemo(() => {
    /*
      Tailored the moment there is an answer to tailor to.

      This passed `undefined` for the chapter and nothing at all for the purpose, so the
      Club built the same feed for everybody however much it knew about them. Both answers
      now come from set-up, before any content is shown.
    */
    const rooms = feedFor(learner.chapter ?? undefined, preview, learner.purpose ?? null)
    if (!mounted) return rooms
    /*
      Done leaves the feed.

      A card is spent by being PERFORMED — `finished_cards` is written by I SAID IT and by
      nothing else, so nobody loses a room by swiping past it. What has been done lives on
      the profile, and comes back through the Line rather than round the loop.
    */
    const done = new Set(learner.finished_cards ?? [])
    const saved = new Set(learner.saved ?? [])

    /*
      SAVE IS WHAT MAKES SWIPING PAST SAFE, and until now it did nothing at all to the feed.

      "Feels like TikTok" and "every swipe moves you on in the process" pull against each
      other: TikTok is lossless, because whatever you skip comes back, while a process is
      finite, so skipping loses something. A person who senses that stops swiping and starts
      reading everything — which is a corridor again, with extra steps.

      Save is the mechanism that reconciles them, and it only reconciles them if it MEANS
      something. It filled a bookmark and filed the card in YOURS: a filing action, not a
      deferring one. So two changes, and both are the same promise.

      A saved card leads the feed. Not now means bring it back, and bringing it back at
      position nineteen is not bringing it back.

      And a saved card survives being done. Everything else leaves the feed when it is
      performed — correctly, since the feed is finite and a room you have done is spent —
      but a person who said "keep this" has overruled that, and the product should let them.
    */
    /*
      One axis, three positions: pulled forward, ordinary, pushed back.

      Save and reject are opposites now rather than neighbours. Save pulls a card to the
      front; reject sinks it behind everything else in the order it was rejected, so the
      most recently dismissed is last — which is also what makes rewind a single step.

      NOTHING IS LOST IN EITHER DIRECTION. The feed is finite, thirty-five rooms, and a
      reject that removed a card would let a bored thumb on a bus permanently shrink
      somebody's Club. "Not this one now" is what the gesture means, so it is what it does.
    */
    const rejected = learner.rejected ?? []
    const back = new Set(rejected)
    const open = [
      ...rooms.filter((c) => saved.has(c.id) && !back.has(c.id)),
      ...rooms.filter((c) => !saved.has(c.id) && !done.has(c.id) && !back.has(c.id)),
      // In the order they were pushed away, so the last one rejected is the last one back.
      ...rejected.map((id) => rooms.find((c) => c.id === id)).filter(Boolean) as FeedCard[],
    ]

    /*
      What they asked for comes first among the assembled cards.

      A sentence somebody looked up this morning beats a form the paradigm table worked out
      overnight — it is the one piece of content in the feed with evidence attached that
      this particular learner wanted it.
    */
    const mine = [
      ...askedCards(learner.asked ?? [], learner.finished_cards ?? []),
      ...derivedCards(
        derivedFor({
          inventory: learner.inventory ?? {},
          finished: learner.finished_cards ?? [],
        }),
      ),
    ]

    /*
      Interleaved, because appending stopped working the moment there was content.

      These used to go on the end, which was invisible-but-fine while the Club held five
      rooms. The first block of ten took the library to fifteen, and a card sixteen swipes
      down is a card nobody has ever seen — so the reinforcement half of the product would
      have quietly switched itself off as a direct consequence of the Club getting better.
    */
    const AFTER = 3

    const explainers = explainerCards({
      playedAVibe: (learner.roots_played ?? []).length > 0,
      legendWritten: cardDone(
        (learner.legend ?? []).filter((a) => Object.keys(a.values).length > 0).map((a) => a.frame_id),
        learner.legend ?? [],
        learner.purpose ?? null,
      ),
      isMember: stage === 'member',
      usedTranslator: (learner.asked ?? []).length > 0,
    })

    /*
      A stranger is told what this is BEFORE being shown it, and shown it immediately after.

      The order was the other way round and it did not survive first contact: somebody
      landed on a photograph of a pharmacy whose only instruction read SWIPE LEFT, which
      takes you sideways into the room and therefore away from every explanation in the
      product. The answer to "what is this" was the third card, and nothing on the first
      said so. A vertical feed teaches its own gesture to people who already know what they
      are looking at; it teaches nothing to somebody who does not.

      So the explanations lead, and each is followed by the thing it just described:

        you already understand more than you can say  →  the pharmacy
        seven questions a stranger will ask you       →  Bridget Jones

      The two examples are the ones they were always meant to be — one obviously useful,
      one obviously fun — and they now arrive as evidence for a claim rather than as
      unlabelled content. Either alone still argues for a different product: a feed of
      Lisbon rooms is a phrasebook with photographs, a feed of film quotes is a party trick.

      Everything after that is the ordinary feed, with whatever explainers are left woven
      through it.
    */
    if (stage === 'showcase') {
      const pharmacy = open.find((c) => c.id === 'lisbon_farmacia')
      const vibe = vibeCard('bridget_jones')
      const rest = open.filter((c) => c.id !== 'lisbon_farmacia')
      const [firstSay, secondSay, ...laterSay] = explainers

      /*
        Set-up comes after the argument, not before it.

        Seventh: four reasons given and two of them shown working. That is the first moment
        asking somebody for a decision is fair, and it is the last thing between them and a
        vibe. It can be swiped past like anything else here — the gate is on the action,
        not on the thumb.
      */
      const setup = setUpCard(Boolean(learner.deal_accepted_at))
      const lead = [firstSay, pharmacy, secondSay, vibe, ...laterSay, setup].filter(
        Boolean,
      ) as FeedCard[]

      return [...lead, ...rest]
    }

    const withExplainers: FeedCard[] = []
    const rest = [...open.slice(0, AFTER), ...mine, ...open.slice(AFTER)]
    let e = 0
    rest.forEach((card, i) => {
      withExplainers.push(card)
      if (e < explainers.length && i % 2 === 0) withExplainers.push(explainers[e++])
    })
    return [...withExplainers, ...explainers.slice(e)]
  }, [
    mounted,
    preview,
    stage,
    learner.inventory,
    learner.finished_cards,
    learner.asked,
    learner.roots_played,
    learner.legend,
    // Saved now decides ORDER, not just a bookmark icon, so the feed has to rebuild on it.
    learner.saved,
    learner.deal_accepted_at,
    // Who, where and why: the feed is built from them now, so it rebuilds on them.
    learner.chapter,
    learner.purpose,
    // Reject reorders the feed, so the feed rebuilds on it.
    learner.rejected,
  ])
  /*
    A save that says so.

    The bookmark filled in and nothing else happened, so the only way to find out whether
    it had worked was to go and look — and the place to look is a screen most people have
    not found yet. It says where the thing went and offers the way there, then gets out
    of the way on its own.
  */
  const [toast, setToast] = useState<'saved' | 'unsaved' | 'done' | 'back' | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3600)
    return () => clearTimeout(t)
  }, [toast])
  const rail = useRef<HTMLDivElement>(null)
  /** [last, ...cards, first] — the two clones are what make the loop seamless. */
  const looped = useMemo(
    () => (cards.length > 1 ? [cards[cards.length - 1], ...cards, cards[0]] : cards),
    [cards],
  )

  // Start on the real first card, which is index 1 once the clone is in front of it.
  useEffect(() => {
    const el = rail.current
    if (!el || cards.length < 2) return
    el.scrollTop = el.clientHeight
  }, [cards.length])

  /*
    The jump, on settle rather than on every scroll event.

    Moving scrollTop mid-gesture fights the momentum the browser is still applying, so
    this waits for the scroll to stop and only then swaps a clone for its twin — which is
    invisible because the two are the same card.
  */
  useEffect(() => {
    const el = rail.current
    if (!el || cards.length < 2) return

    const wrap = () => {
      const h = el.clientHeight
      if (!h) return
      const i = Math.round(el.scrollTop / h)
      if (i === 0) el.scrollTop = cards.length * h
      else if (i === looped.length - 1) el.scrollTop = h
    }

    /*
      Wrapped on `scrollend`, and only on a settle the browser agrees is a settle.

      The debounce this replaces fired 90ms after the last scroll event — which, with
      `scroll-snap-type: mandatory`, is usually while the browser is still animating toward
      the snap point. Setting scrollTop mid-animation is a suggestion the snap then
      overrules, so the jump was silently cancelled and the feed stopped at the last card
      instead of coming round. It survived the check because a programmatic instant scroll
      has no animation to fight.

      The fallback does the same job where scrollend is missing: wait for the position to
      stop changing across two ticks, rather than for events to stop arriving.
    */
    // Feature-detected off the prototype rather than with `in`, which narrows el to never
    // in the branch below and makes the fallback uncompilable.
    const hasScrollEnd = typeof (el as { onscrollend?: unknown }).onscrollend !== 'undefined'
    if (hasScrollEnd) {
      el.addEventListener('scrollend', wrap)
      return () => el.removeEventListener('scrollend', wrap)
    }

    let timer: ReturnType<typeof setTimeout>
    let last = -1
    const settle = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (el.scrollTop === last) wrap()
        else {
          last = el.scrollTop
          settle()
        }
      }, 120)
    }
    el.addEventListener('scroll', settle, { passive: true })
    return () => {
      el.removeEventListener('scroll', settle)
      clearTimeout(timer)
    }
  }, [cards.length, looped.length])

  /*
    Nothing left, which is now a state that happens.

    Under the old model the five rooms sat there for ever — stale, but never empty. Now a
    card is spent by being performed, so an empty Club is reachable in week one and it is a
    real screen rather than an error: it says what has happened, offers the two places the
    work went, and does not apologise.
  */
  if (mounted && !cards.length) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 bg-bg px-5 py-10 text-fg">
        <div>
          <p className="eyebrow text-accent">{FEED_COPY.empty_eyebrow}</p>
          <h1 className="display mt-3 text-balance text-3xl">{FEED_COPY.empty_head}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{FEED_COPY.empty_body}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/vibes"
            className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            {FEED_COPY.empty_cta}
          </Link>
          <Link
            href="/profile"
            className="tap-target eyebrow w-full rounded border border-line px-5 py-3 text-center"
          >
            {FEED_COPY.empty_alt}
          </Link>
        </div>
        <BottomNavSpace />
        <BottomNav />
      </main>
    )
  }

  return (
    <main data-stage="REAL WORLD" className="relative h-svh w-full overflow-hidden bg-[#241f1a]">
      {/* Over the feed, not in it. The chrome does not scroll away. */}
      {/* safe-top: the feed card is full-bleed by design, so nothing else can clear the
          notch for the controls sitting on top of it. */}
      {/* The feed is full-bleed photography, so the status bar goes dark with it. */}
      <StatusBar color="#241f1a" />
      <header className="safe-top pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-3 px-5 pt-6">
        {/*
          The logo goes to the front door, and the door stays open when you arrive by it.

          It went to /vibes, which the bottom bar already offers — so the one control every
          screen carries was a duplicate of a tab. Home is the more useful destination and
          the more expected one: a wordmark that goes anywhere but the beginning is a
          wordmark doing somebody else's job.

          ?door=1 is what makes it work at all. The front door sends a returning learner
          straight on to the Club or the shelf, so a bare link to / would bounce you back to
          where you tapped it. The flag says "I asked for this", and only an explicit tap
          can set it — nothing else in the product links here with it.
        */}
        <Link
          href="/?door=1"
          aria-label={chapterName() + ' — back to the front door'}
          className="pointer-events-auto tap-target"
        >
          <Wordmark mark="club" className="h-6 text-white" title={chapterName()} />
        </Link>
        {/*
          One line saying what this is, for somebody who has never heard of it.

          A stranger landed on a photograph of a pharmacy with a button reading SWIPE LEFT
          and nothing else — no statement of what the app was, and the only instruction on
          screen pointing sideways, into the one free room, away from every explanation. A
          feed is a fine way to show a product to somebody who knows what they are looking
          at. TikTok gets that for free; this does not.

          Only in the showcase. A member knows where they are, and a permanent tagline is
          a billboard on your own front room.
        */}
        {stage === 'showcase' ? (
          <p className="text-[0.6rem] leading-tight text-white/85">
            Lisbon, and the Portuguese for it.
          </p>
        ) : null}
        <span className="flex-1" />

      </header>

      <div
        ref={rail}
        data-testid="feed"
        className="h-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
        style={{ scrollbarWidth: 'none' }}
      >
        {looped.map((card, i) => (
          <Card
            key={card.id + '_' + i}
            card={card}
            stage={stage}
            /*
              The cue rides on the first REAL card, which is index 1 — index 0 is the
              loop's clone of the last one, and putting it there would show the hint on
              the card somebody reaches by swiping backwards off the top.
            */
            hint={stage === 'showcase' && i === 1}
            saved={mounted && (learner.saved ?? []).includes(card.id)}
            liked={mounted && (learner.liked ?? []).includes(card.id)}
            onSaved={(on) => setToast(on ? 'saved' : 'unsaved')}
            onBack={() => setToast('back')}
            onDone={() => setToast('done')}
          />
        ))}
      </div>

      {toast ? <Toast kind={toast} /> : null}
      {/* Over the feed, like the header — the cards scroll under it. */}
      <BottomNav />
    </main>
  )
}

export /**
 * Said once, at the foot, and gone.
 *
 * Above the feed rather than inside a card, because the card it belongs to may well have
 * been swiped past by the time somebody reads it — and a message that scrolls away with
 * its subject is a message nobody reads.
 */
function Toast({ kind }: { kind: 'saved' | 'unsaved' | 'done' | 'back' }) {
  return (
    <div
      role="status"
      data-testid="feed-toast"
      className="animate-bank absolute inset-x-0 bottom-0 z-50 flex items-center gap-3 bg-black/85 px-5 py-3 text-white"
    >
      <p className="min-w-0 flex-1 text-sm">
        {kind === 'saved'
          ? FEED_COPY.saved
          : kind === 'done'
            ? FEED_COPY.done
            : kind === 'back'
              ? FEED_COPY.back
              : FEED_COPY.unsaved}
      </p>
      {kind === 'saved' || kind === 'done' ? (
        <Link
          href="/profile"
          className="tap-target eyebrow shrink-0 rounded bg-white px-4 py-3 text-[#241f1a]"
        >
          {FEED_COPY.saved_cta}
        </Link>
      ) : null}
    </div>
  )
}

export function Card({
  card,
  saved,
  liked,
  onSaved,
  onRejected,
  onBack,
  onDone,
  stage = 'member',
  hint = false,
}: {
  card: FeedCard
  saved: boolean
  liked: boolean
  onSaved?: (on: boolean) => void
  /** So the feed can say a card went away, and offer it back. */
  onRejected?: () => void
  /** A card came back, so the feed can say so. */
  onBack?: () => void
  /** Spent, and on its way to the profile. The feed rebuilds without it. */
  onDone?: () => void
  /** Which Club this is. A member's rooms are never teased. */
  stage?: ClubStage
  /** Show the "there is more below" cue. The first showcase card only. */
  hint?: boolean
}) {
  const pane = useRef<HTMLDivElement>(null)
  /*
    Tapping the call to action does the same thing as the swipe.

    Two ways to reach one place, and the button says which gesture it stands in for
    rather than naming a destination — "swipe left to continue" is a instruction somebody
    can follow the next time without looking for a button at all. It scrolls rather than
    navigates, so going back is the same gesture in reverse.
  */
  /**
   * Claim the one free room, if this is the moment it is claimed.
   *
   * On the way IN rather than on arrival, so the pane a person lands on is already the
   * open one — deciding after the scroll would show them the tease for a frame and then
   * swap it, which reads as the product changing its mind about them.
   */
  const claim = () => {
    // `free` already covers member and non-situation; repeating them here narrowed the
    // type to nothing and told the compiler this branch was unreachable.
    if (free || card.kind !== 'situation') return
    if (loadLearner().tasted) return
    tasteRoom(card.id)
    track('room_tasted', { card: card.id })
    setClaimed(true)
  }

  /*
    The demo card, named once rather than tested for in three places.

    Keyed on the explainer's id because it IS that card — the ordering, the retirement on
    first vibe played, and the check that counts four explainers all still apply. What is
    different is only that its front plays instead of pointing sideways.
  */
  const isDemo = card.kind === 'explainer' && card.explainer.id === 'how_it_works'

  const smooth = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? ('auto' as const)
      : ('smooth' as const)

  /*
    Enter: scroll to lane 0, which is the language. Reached by tapping or swiping right.

    It scrolled to clientWidth when the language lived on the right. Left now means reject,
    so entering scrolls the other way, and the same call serves the tap.
  */
  const reveal = () => (claim(), pane.current?.scrollTo({ left: 0, behavior: smooth() }))

  /*
    Settling on the away lane is the reject, and settling is the whole point.

    Fired on scroll rather than on a gesture handler so a half-swipe that springs back does
    nothing — the card has to actually come to rest out there. The guard stops the same
    reject firing on every scroll event of the animation.
  */
  /*
    Start on the middle lane.

    A three-lane scroller opens at lane 0, which is now the language — so without this every
    card would open already answered, with the Portuguese showing and the photograph
    somewhere off to the right. Set with 'auto' and no animation: this is where the card
    begins, not somewhere it travels to.
  */
  useEffect(() => {
    const el = pane.current
    if (el) el.scrollLeft = el.clientWidth
  }, [card.id])

  const wentAway = useRef(false)
  const onPaneScroll = () => {
    const el = pane.current
    if (!el) return
    const away = el.scrollLeft >= el.clientWidth * 1.5
    if (away && !wentAway.current) {
      wentAway.current = true
      rejectCard(card.id)
      track('card_rejected', { card: card.id })
      onRejected?.()
      // Back to the face, so the card that takes this one's place is not showing its lane.
      el.scrollTo({ left: el.clientWidth, behavior: 'auto' })
    }
    if (!away) wentAway.current = false
  }
  /*
    Whether this room is free to this person — derived, never latched at first render.

    The first version took this with useState's initializer, which runs exactly once, on
    the first render. On that render `stage` is still 'member': the Club cannot know who it
    is talking to until the browser has read localStorage, so it says member and corrects
    itself a frame later. The initializer captured the provisional answer and held it
    forever, which made every room free to everybody — and looked entirely correct, because
    the cards further down the rail mount after the correction and behaved properly. The
    one that was wrong was the first one somebody saw.

    Computed every render instead, with `claimed` carrying the only thing that genuinely
    must not flip: a room somebody has just been given stays given, without waiting for the
    write to come back round through the store.
  */
  const learner = useLearner()
  const [claimed, setClaimed] = useState(false)
  const free =
    stage === 'member' || card.kind !== 'situation' || claimed || learner.tasted === card.id
  const [isSaved, setSaved] = useState(saved)
  const [isLiked, setLiked] = useState(liked)
  useEffect(() => setSaved(saved), [saved])
  useEffect(() => setLiked(liked), [liked])

  const face = cardFace(card)
  const image = face.image
  const title = face.title
  const blurb = face.blurb

  return (
    <section className="relative h-full w-full snap-start snap-always">
      {/*
        Three lanes side by side, and the card starts in the middle one.

        THE ORDER IS THE GRAMMAR. The language sits to the LEFT of the face, so revealing it
        means swiping right; an empty lane sits to the RIGHT, so swiping left carries the
        card away. Both are the same native CSS snap the feed has always used, which is what
        keeps the gesture feeling like the phone rather than like JavaScript.

        It was two lanes with the language on the right, and swiping left was the reveal.
        That inverted: left is reject now and right is enter. The face's own instruction
        changed with it — a card that still read SWIPE LEFT would be telling somebody to
        throw it away.

        Away is a LANE rather than an event, deliberately. A half-swipe snaps back and
        nothing happens, so the gesture can be started and abandoned — which matters a great
        deal for a verb whose whole point is that it is cheap.
      */}
      <div
        ref={pane}
        data-testid="card-panes"
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        style={{ scrollbarWidth: 'none' }}
        onScroll={onPaneScroll}
      >
        {/*
          Laid out by `order` rather than by DOM position.

          The language pane is a long block of JSX and moving it to sit before the face
          would be a large diff for a purely visual reordering — and a large diff is where
          a pane quietly loses a wrapper. Flex order changes layout, scroll-snap works on
          layout, so the lanes land where the grammar needs them and the markup stays put.
        */}
        <div className="relative order-2 h-full w-full shrink-0 snap-start">
          {image ? (
            <Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-cover" />
          ) : (
            /*
              No photograph, so the pattern rather than a blank.

              A drop is authored the week it matters and its rooms will not always have a
              picture ready — an arena, a box office, a metro platform. An empty near-black
              rectangle reads as a broken image; the azulejo does not, it is already the
              product's own surface, and it is honest in a way a borrowed stock photograph
              of somewhere else would not be.
            */
            <span aria-hidden className="card-ground absolute inset-0" />
          )}
          {/*
            A taller, heavier scrim on the texture cards.

            The Club's photographs are dark rooms and the gradient was tuned for them.
            Azulejo is white tiles in daylight, and white text on it at 62% was unreadable
            above the fold of the gradient — a contrast failure the gate cannot see, because
            it measures tokens against grounds rather than text against a photograph.
          */}
          <div
            aria-hidden
            className={
              'absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent ' +
              (card.kind === 'derived'
                ? 'h-[85%] from-black/95 via-black/80'
                : 'h-[62%] from-black/92 via-black/60')
            }
          />
          {/* nav-clear keeps the rail and the title above the bar rather than under it. */}
          <div className="nav-clear absolute inset-x-0 bottom-0 flex items-end gap-3 px-5 text-white">
            <div className="min-w-0 flex-1">
              {card.kind === 'derived' && card.card.kind === 'collision' ? (
                /*
                  The Portuguese is NOT on this side.

                  A collision is the only derived card that asks for something rather than
                  telling you something, and the ask has to be cold or it is not an ask.
                  Say it, or swipe left and be shown — the same fork the Legend and the
                  release beat use, and the only one that keeps `proof` honest.
                */
                <>
                  <p className="eyebrow text-white/70">{face.eyebrow}</p>
                  <p className="pt mt-1 text-xs text-white/70">{card.card.because}</p>
                  <p className="display mt-3 text-balance text-2xl">{card.card.en}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">{card.card.note}</p>
                </>
              ) : card.kind === 'derived' ? (
                <>
                  <p className="eyebrow text-white/70">{face.eyebrow}</p>
                  {/* The evidence, before the new word. It is what makes this feel like the
                      app noticing something rather than serving a flashcard — and it sits
                      under the eyebrow rather than repeating it. */}
                  <p className="pt mt-1 text-sm text-white/80">{card.card.because}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <AudioButton slug={slugFor(card.card.target)} text={card.card.target} />
                    <p className="pt display text-balance text-4xl">{card.card.target}</p>
                  </div>
                  <p className="mt-1 text-sm text-white/80">{card.card.en}</p>
                </>
              ) : card.kind === 'vocab' ? (
                <>
                  <p className="eyebrow text-white/70">WORTH HAVING</p>
                  <div className="mt-3 flex items-center gap-3">
                    <AudioButton slug={slugFor(card.piece.target)} text={card.piece.target} />
                    <p className="pt display text-balance text-4xl">{title}</p>
                  </div>
                  <p className="mt-1 text-sm text-white/80">{card.piece.gloss}</p>
                </>
              ) : (
                <>
                  <p className="eyebrow text-white/70">{face.eyebrow}</p>
                  {/*
                    The event and the clock, on the card that expires.

                    A drop and a standing room look identical otherwise, and they are not
                    the same offer: the pharmacy will be there next month and the gig will
                    not. The countdown is the only number in the Club, and it counts down
                    to something real rather than up from nothing.
                  */}
                  {card.kind === 'situation' && card.drop ? (
                    <p className="mt-1 text-sm text-white/80">
                      {card.drop.event} · {card.drop.place.name} ·{' '}
                      <span className="tabular-nums">
                        {dropDaysLeft(card.drop) <= 1
                          ? 'gone tomorrow'
                          : dropDaysLeft(card.drop) + ' days left'}
                      </span>
                    </p>
                  ) : null}
                  <h2 className="display mt-3 text-balance text-3xl">{title}</h2>
                </>
              )}
              {/* The kind-specific blocks above already say their own piece — a collision
                  puts its provenance under the sentence, and a teaching card its note. The
                  shared blurb is for the rooms, which have nothing else. */}
              {card.kind === 'derived' || isDemo ? null : (
                <p className="mt-3 text-sm leading-relaxed text-white/80">{blurb}</p>
              )}
              {/*
                A collision asks; everything else tells.

                So the collision gets the cold fork — say it now, or be shown — and the two
                teaching cards get a way to be finished with, which is what they were
                missing. Without it a derived card could only be swiped past, so it came
                round the loop for ever and the profile never learned it had happened.
              */}
              {card.kind === 'derived' && card.card.kind === 'collision' ? (
                <div className="mb-3 mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    data-testid="card-cold"
                    onClick={() => {
                      recordProof({
                        pt: card.card.target,
                        en: card.card.en,
                        source: 'collision',
                        clean: true,
                      })
                      rememberFinishedCard(card.id)
                      track('derived_said', { card: card.id, kind: card.card.kind })
                      onDone?.()
                    }}
                    className="tap-target eyebrow w-full rounded bg-[#1f5d8c] px-5 py-3 text-center text-white"
                  >
                    I SAID IT
                  </button>
                  <button
                    type="button"
                    data-testid="card-continue"
                    onClick={reveal}
                    className="tap-target eyebrow w-full rounded border border-white/50 px-5 py-3 text-center text-white"
                  >
                    SHOW ME
                  </button>
                </div>
              ) : card.kind === 'derived' ? (
                <div className="mb-3 mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    data-testid="card-continue"
                    onClick={reveal}
                    className="tap-target eyebrow w-full rounded bg-[#1f5d8c] px-5 py-3 text-center text-white"
                  >
                    TAP TO OPEN
                  </button>
                  <button
                    type="button"
                    data-testid="card-got"
                    onClick={() => {
                      // No proof: the answer is on the screen. It marks the card spent, and
                      // spent is the only thing being claimed.
                      rememberFinishedCard(card.id)
                      track('derived_kept', { card: card.id, kind: card.card.kind })
                      onDone?.()
                    }}
                    className="tap-target eyebrow w-full rounded border border-white/50 px-5 py-3 text-center text-white"
                  >
                    GOT IT
                  </button>
                </div>
              ) : isDemo ? (
                /*
                  The one card that is done rather than read, so it has no SWIPE LEFT.

                  Everything else here tells you something and offers more sideways. The
                  demo has to PLAY — it is the strongest sixty seconds in the product and it
                  became unreachable when COME IN started going straight to the Club, which
                  skips the corridor the beats lived in. What stood here instead was an
                  advert for a demo, which is why it read as "only one Goose screen".

                  The pane behind it still exists and still says why it works; this is the
                  doing, and the doing comes first.
                */
                <div className="mb-3">
                  <DemoCard />
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="card-continue"
                  onClick={reveal}
                  /* mb-3 so the blue button does not sit flush on the blue bar. Two blues
                     touching read as one shape, and the shape was neither. */
                  className="tap-target eyebrow mb-3 mt-6 w-full rounded bg-[#1f5d8c] px-5 py-3 text-center text-white"
                >
                  {/*
                    TAP TO OPEN, because left no longer opens anything.

                    Every card face read SWIPE LEFT, which was true when left was the reveal.
                    Left is reject now, so the old instruction would have been telling people
                    to throw the card away — the worst possible way for copy to go stale.

                    Tap rather than "swipe right": tapping is the gesture nobody has to be
                    taught, the button is already under their thumb, and swiping right works
                    anyway for anybody who finds it.
                  */}
                  TAP TO OPEN
                </button>
              )}
              {/*
                And that the feed keeps going, which nothing on screen said.

                Every card's only instruction pointed sideways — into the room, which for a
                stranger is the one free one and therefore away from every explanation there
                is. A vertical feed teaches its own gesture when you already know what it
                is; on a product nobody has seen before it is a wall with a door in the
                wrong direction.

                Showcase only, and only until they have swiped once — after that the gesture
                is learned and a standing instruction is nagging.
              */}
              {hint ? (
                <p className="mb-3 flex items-center justify-center gap-1 text-[0.6rem] uppercase tracking-wider text-white/70">
                  <span aria-hidden>↑</span> keep swiping — there is more
                </p>
              ) : null}
            </div>
            <Rail
              card={card}
              isSaved={isSaved}
              isLiked={isLiked}
              onSave={() => {
                const on = toggleCard('saved', card.id)
                setSaved(on)
                onSaved?.(on)
              }}
              onLike={() => setLiked(toggleCard('liked', card.id))}
              onRewound={() => onBack?.()}
            />
          </div>
        </div>

        <div className="card-pane nav-clear order-1 h-full w-full shrink-0 snap-start overflow-y-auto bg-bg px-5 text-fg">
          {/* Clearance is card-pane in globals.css — the header's own measurement, notch
              included, so the two cannot drift apart. */}
          <div>
            {card.kind === 'situation' ? (
              /*
                One room is given away, and the rest are teased until the Legend exists.

                A showcase that only describes itself is a brochure, so the first room
                somebody opens is theirs outright — the Portuguese, the audio, all of it.
                After that the tease does the work, and it can because they have now held
                the real thing once and know what is being withheld.
              */
              free ? <Lines card={card} /> : <Teased card={card} />
            ) : card.kind === 'derived' ? (
              <Derived card={card} />
            ) : card.kind === 'asked' ? (
              <Asked card={card} />
            ) : card.kind === 'explainer' ? (
              <Explains card={card} />
            ) : card.kind === 'vibe' ? (
              <Taste card={card} />
            ) : card.kind === 'setup' ? (
              <SetUp />
            ) : (
              <Word card={card} />
            )}
          </div>
        </div>
        {/*
          The away lane: what swiping left carries the card into.

          Empty of controls on purpose. It is not a screen and nothing here is pressed — it
          exists so the gesture has somewhere to go and something to say while it is
          happening. Snapping onto it fires the reject; snapping back off it does nothing at
          all, which is what makes a half-swipe free.

          The words matter more than they look like they should. "Gone" would be a lie: the
          card sinks behind the others and comes back, and somebody who believes rejecting
          destroys things will stop doing it.
        */}
        <div
          aria-hidden
          data-testid="card-away"
          className="order-3 flex h-full w-full shrink-0 snap-start flex-col items-start justify-end gap-1 bg-bg px-5 pb-10 text-fg"
        >
          <p className="eyebrow text-muted">NOT NOW</p>
          <p className="display text-balance text-2xl">Back later, behind the rest.</p>
        </div>
      </div>
    </section>
  )
}

/**
 * A room somebody has not earned: the moment, and not what to say.
 *
 * The lock withholds CAPABILITY rather than information, which is the only version of this
 * that is honest. Reading that your landlord has just said the deposit is not coming back
 * costs nothing and is not what DUB sells; knowing what to say back is the entire product.
 *
 * Showing the Portuguese greyed out or blurred would be worse than either extreme — it
 * says "we have it and you cannot have it", which is a shop with a guard on the door
 * rather than a window.
 */
function Teased({ card }: { card: Extract<FeedCard, { kind: 'situation' }> }) {
  const s = card.situation
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-accent">THE MOMENT</p>
        <h2 className="display text-balance text-2xl">{s.title}</h2>
        <p className="text-sm leading-relaxed text-fg/85">{s.why}</p>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-6">
        <p className="eyebrow text-muted">WHAT HAPPENS</p>
        <ul className="flex flex-col gap-3">
          {s.lines.slice(0, 3).map((l) => (
            <li key={l.pt} className="text-sm leading-relaxed text-muted">
              “{l.en}”
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded border border-line-strong bg-bg-elev px-4 py-3">
        <p className="text-sm font-semibold">What to say arrives with your Legend.</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Seven questions a stranger will ask you, answered in Portuguese out of language
          you own. That is the whole of the way in.
        </p>
      </div>

      <Link
        href="/vibes"
        className="tap-target eyebrow mt-10 block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
      >
        {EXPLAINER_CTA}
      </Link>
    </div>
  )
}

/** The learning, one swipe left. */
function Lines({ card }: { card: Extract<FeedCard, { kind: 'situation' }> }) {
  const s = card.situation
  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow text-muted">WHAT TO SAY</p>
      <h2 className="display text-balance text-2xl">{s.title}</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {s.lines.map((l) => (
          <li key={l.pt} className="flex flex-col gap-1 rounded border border-line bg-bg-elev px-4 py-3">
            <div className="flex items-center gap-3">
              <AudioButton slug={slugFor(l.pt)} text={l.pt} size="sm" />
              <p className="pt min-w-0 text-lg text-accent">{l.pt}</p>
            </div>
            <p className="text-sm text-fg/80">{l.en}</p>
            <p className="text-xs leading-relaxed text-muted">{l.when}</p>
          </li>
        ))}
      </ul>
      <Link
        href={'/errand/' + s.id}
        className="tap-target eyebrow mt-3 block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
      >
        SAY IT COLD
      </Link>
    </div>
  )
}

/**
 * The other side of a derived card.
 *
 * The piece they already have, then the one they do not, then what changed — in that
 * order, because the whole point is that the new form arrives attached to something they
 * already own rather than out of nowhere.
 *
 * No "correct", no tick, no score. Family three does not write to `proof`: nothing here
 * was said cold, and the proof card has never counted anything else.
 */
function Derived({ card }: { card: Extract<FeedCard, { kind: 'derived' }> }) {
  const d = card.card
  if (d.kind === 'collision') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="eyebrow text-accent">OUT OF</p>
          {/*
            One row per piece, with the Portuguese and the vibe in different registers.

            Flattened into a single line in the Portuguese face, this read as though DUB had
            confused a song with a wizard — which is what it looked like, and the claim
            underneath it is the best one the product makes.
          */}
          <ul className="mt-3 flex flex-col gap-1">
            {(d.sources ?? [{ target: d.because, vibe: '' }]).map((s) => (
              <li key={s.target} className="flex items-baseline gap-3">
                <span className="pt shrink-0 text-lg text-accent">{s.target}</span>
                {s.vibe ? <span className="min-w-0 text-sm text-muted">{s.vibe}</span> : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-line pt-6">
          <div className="flex items-start gap-3">
            <AudioButton slug={slugFor(d.target)} text={d.target} />
            <span className="min-w-0">
              <span className="pt display block text-2xl text-accent">{d.target}</span>
              <span className="mt-1 block text-sm text-muted">{d.en}</span>
            </span>
          </div>
          {/* The provenance line, written by hand for all sixty-eight of these. It is the
              compounding claim made concrete, and it is the reason these are the best
              cards in the feed. */}
          <p className="mt-6 text-sm leading-relaxed text-fg/85">{d.note}</p>
        </div>
        <Done card={card} />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow text-muted">YOU HAVE</p>
        <div className="mt-3 flex items-center gap-3">
          <AudioButton slug={slugFor(d.from.target)} text={d.from.target} size="sm" />
          <span className="min-w-0">
            <span className="pt block text-xl">{d.from.target}</span>
            <span className="block text-xs text-muted">{d.from.gloss}</span>
          </span>
        </div>
      </div>

      <div className="border-t border-line pt-6">
        <p className="eyebrow text-accent">AND NOW</p>
        <div className="mt-3 flex items-center gap-3">
          <AudioButton slug={slugFor(d.target)} text={d.target} />
          <span className="min-w-0">
            <span className="pt display block text-3xl text-accent">{d.target}</span>
            <span className="mt-1 block text-sm text-muted">{d.en}</span>
          </span>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-fg/85">{d.note}</p>
      </div>
      <Done card={card} />
    </div>
  )
}

/**
 * The way off a card you have been shown.
 *
 * The reveal pane had no action on it at all: you swiped left to see the answer and then
 * the only move left was to swipe back, so a card could be read and never finished — it
 * stayed in the feed, and the feed stopped being a thing you could get to the end of.
 *
 * GOT IT rather than I SAID IT, and the difference is the whole of the honesty rule. The
 * front of the card offers I SAID IT and records proof, because there the answer is
 * hidden. Here it is on the screen. Marking the card spent is the only claim that can be
 * made about somebody who has just read something.
 */
function Done({ card }: { card: Extract<FeedCard, { kind: 'derived' }> }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      data-testid="derived-done"
      disabled={done}
      onClick={() => {
        setDone(true)
        rememberFinishedCard(card.id)
        track('derived_kept', { card: card.id, kind: card.card.kind })
      }}
      className="tap-target eyebrow mt-10 w-full rounded bg-accent px-5 py-3 text-center text-accent-ink disabled:border disabled:border-line-strong disabled:bg-transparent disabled:text-muted"
    >
      {done ? 'KEPT' : 'GOT IT'}
    </button>
  )
}

/**
 * A vibe, tasted: one real line, and the word it hands you.
 *
 * The whole argument in four words. Not "learn Portuguese through culture" — the actual
 * line, the Portuguese it becomes, and the piece that is now yours. Somebody who reads this
 * card has had the experience the product is selling rather than a description of it.
 */
function Taste({ card }: { card: Extract<FeedCard, { kind: 'vibe' }> }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-accent">YOU KNOW THIS</p>
        <p className="display text-balance text-2xl">{card.taste.en}</p>
      </div>

      <div className="border-t border-line pt-6">
        <div className="flex items-center gap-3">
          <AudioButton slug={slugFor(card.taste.pt)} text={card.taste.pt} />
          <span className="pt display min-w-0 text-2xl text-accent">{card.taste.pt}</span>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-fg/85">{card.taste.why}</p>
      </div>

      <Link
        href="/vibes"
        className="tap-target eyebrow mt-10 block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
      >
        {EXPLAINER_CTA}
      </Link>
    </div>
  )
}

/**
 * The far side of an explainer: the proof, not more of the pitch.
 *
 * The front of the card makes one claim. This is where it is made good on — and for the
 * demo that means a line you can actually hear, because "you already understand more than
 * you can say" is an argument until you press play and it becomes a fact.
 */
function Explains({ card }: { card: Extract<FeedCard, { kind: 'explainer' }> }) {
  const e = card.explainer
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-accent">{e.detail.heading.toUpperCase().slice(0, 14)}</p>
        <h2 className="display text-balance text-2xl">{e.detail.heading}</h2>
        <p className="text-sm leading-relaxed text-fg/85">{e.detail.body}</p>
      </div>

      {e.say ? (
        <div className="border-t border-line pt-6">
          <p className="text-sm text-muted">“{e.say.en}”</p>
          <div className="mt-3 flex items-center gap-3">
            <AudioButton slug={slugFor(e.say.pt)} text={e.say.pt} />
            <span className="pt display min-w-0 text-2xl text-accent">{e.say.pt}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{e.say.note}</p>
        </div>
      ) : null}

      {/*
        The same call to action on all four.

        Somebody sold by the Drop and somebody sold by the demo end up in the same place,
        which is what makes this a funnel rather than a menu.
      */}
      <Link
        href="/vibes"
        className="tap-target eyebrow mt-10 block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
      >
        {EXPLAINER_CTA}
      </Link>
    </div>
  )
}

/**
 * A sentence they went and asked for, handed back cold.
 *
 * The one card in the feed whose content came from the learner, so it is the one card that
 * can be honest about where it came from — the date is not decoration, it is the evidence
 * that this was wanted rather than chosen for them.
 *
 * No exercise on it. Everything else in the feed is DUB testing whether something landed;
 * this is DUB returning something that was already needed, and turning that into a quiz
 * would make looking a thing up feel like setting homework for yourself.
 */
function Asked({ card }: { card: Extract<FeedCard, { kind: 'asked' }> }) {
  const when = new Date(card.ask.at)
  const days = Math.max(0, Math.round((Date.now() - when.getTime()) / 86_400_000))
  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow text-muted">YOU ASKED FOR</p>
      <p className="text-sm text-muted">“{card.ask.en}”</p>
      <div className="flex items-center gap-3">
        <AudioButton slug={slugFor(card.ask.pt)} text={card.ask.pt} />
        <p className="pt display text-balance text-2xl text-accent">{card.ask.pt}</p>
      </div>
      {card.ask.note ? (
        <p className="text-sm leading-relaxed text-muted">{card.ask.note}</p>
      ) : null}
      <p className="mt-3 text-xs text-muted">
        {days === 0 ? 'You looked this up today.' : days === 1 ? 'You looked this up yesterday.' : 'You looked this up ' + days + ' days ago.'}
      </p>
    </div>
  )
}

function Word({ card }: { card: Extract<FeedCard, { kind: 'vocab' }> }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow text-muted">THE WORD</p>
      <div className="flex items-center gap-3">
        <AudioButton slug={slugFor(card.piece.target)} text={card.piece.target} />
        <p className="pt display text-balance text-3xl text-accent">{vocabWord(card.piece)}</p>
      </div>
      <p className="text-sm text-fg/85">{card.piece.gloss}</p>
      {card.piece.note ? (
        <p className="mt-3 text-sm leading-relaxed text-muted">{card.piece.note}</p>
      ) : null}
      <Link
        href="/vocab"
        className="tap-target eyebrow mt-6 block w-full rounded border border-line-strong px-5 py-3 text-center"
      >
        ALL YOUR WORDS
      </Link>
    </div>
  )
}

/**
 * Like, comment, save, share — down the right, where a thumb already is.
 *
 * Three of the four are real and do what they say. COMMENT is not: a comment implies
 * other people, and whether the Club has other people in it is a product decision nobody
 * has made yet — it is moderation, safety and a different company. So it goes where the
 * honest version of it already exists, which is telling us what did not land.
 *
 * No counts on any of them. The moment a number is attached to how much a card has been
 * liked, the feed starts asking to be fed, and this one is not allowed to want anything.
 */
function Rail({
  card,
  isSaved,
  isLiked,
  onSave,
  onLike,
  onRewound,
}: {
  card: FeedCard
  isSaved: boolean
  isLiked: boolean
  onSave: () => void
  onLike: () => void
  onRewound?: () => void
}) {
  /*
    The rail reads the learner because the share button now sends what they can SAY.

    Taken from the store rather than passed down: the rail is rendered per card and the
    proof it mints from is the same for all of them, so threading it through every call
    site would be five props saying one thing.
  */
  const learner = useLearner()
  const btn = 'tap-target flex h-11 w-11 items-center justify-center rounded-full transition'
  return (
    <div className="flex shrink-0 flex-col items-center gap-3">
      <button
        type="button"
        aria-label={isLiked ? 'Unlike' : 'Like'}
        aria-pressed={isLiked}
        data-testid="feed-like"
        onClick={() => {
          onLike()
          track('feed_like', { card: card.id })
        }}
        /*
          Red, and pinned to the hex rather than tokenised.

          It was --accent, which is azulejo blue on sand and a pale #7fb3da in dark mode
          — and this rail is always over a photograph, so the on state was a pale blue
          icon on a dark picture and effectively invisible. A liked heart is red
          everywhere a heart has ever been red, and that is worth more here than
          consistency with a palette that was designed for type on paper.
        */
        className={btn + (isLiked ? ' text-[#e4574f]' : ' text-white/85')}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7C19 15.6 12 20 12 20Z" />
        </svg>
      </button>

      <Link
        href={'/feedback?about=' + card.id}
        aria-label="Tell us about this card"
        data-testid="feed-comment"
        className={btn + ' text-white/85'}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M20 15a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" />
        </svg>
      </Link>

      {/*
        Rewind: back on the one that just went away, and only when there is one.

        Absent rather than disabled when nothing has been rejected — a permanently greyed
        control on a rail of four live ones reads as broken, and this is a verb somebody
        needs exactly once, immediately, in the second after a swipe they did not mean.
      */}
      {(learner.rejected ?? []).length ? (
        <button
          type="button"
          aria-label="Bring back the last card"
          data-testid="feed-rewind"
          onClick={() => {
            const back = rewindReject()
            if (back) track('card_rewound', { card: back })
            onRewound?.()
          }}
          className={btn + ' text-white/85'}
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
          </svg>
        </button>
      ) : null}

      <button
        type="button"
        aria-label={isSaved ? 'Remove from saved' : 'Save'}
        aria-pressed={isSaved}
        data-testid="feed-save"
        onClick={() => {
          onSave()
          track('feed_save', { card: card.id })
        }}
        /* Filled white rather than tinted: over a photograph, fill reads and hue does not. */
        className={btn + (isSaved ? ' text-white' : ' text-white/85')}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M6 4h12v16l-6-4-6 4Z" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Share"
        data-testid="feed-share"
        onClick={async () => {
          track('feed_share', { card: card.id })
          /*
            WHAT GETS SENT, and it used to be the homepage.

            This shared window.location.origin + '/club' — a link to the front of the app,
            with no card, no sentences and nothing of the sender in it. The most-tapped
            share control in the product was posting an advert, while the artefact actually
            built to be worth sending, the showing, was reachable only from /proof.

            "Are you on DUB?" lands very differently as three things your friend can say in
            Portuguese than as a URL.

            The fallback is still a link, and honestly so: somebody who has not said
            anything cold yet has nothing to show, and the invitation is the next best
            thing they can offer.
          */
          const { path } = await mintShowing(learner)
          const url = window.location.origin + (path ?? '/club')
          const title = cardFace(card).title
          // The platform sheet where there is one; the clipboard where there is not.
          if (navigator.share) await navigator.share({ title, url }).catch(() => {})
          else await navigator.clipboard?.writeText(url).catch(() => {})
          if (path) track('showing_sent', {})
        }}
        className={btn + ' text-white/85'}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M12 16V4m0 0L8 8m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
        </svg>
      </button>
    </div>
  )
}
