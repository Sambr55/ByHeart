'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { BottomNav } from '@/components/BottomNav'
import { Wordmark } from '@/components/Wordmark'
import { slugFor } from '@/content/audio-manifest'
import { FEED_COPY, chapterName, feedFor, vocabWord, type FeedCard } from '@/content/feed'
import { track } from '@/engine/analytics'
import { toggleCard } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'

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
export function Feed() {
  const cards = useMemo(() => feedFor(), [])
  /*
    A save that says so.

    The bookmark filled in and nothing else happened, so the only way to find out whether
    it had worked was to go and look — and the place to look is a screen most people have
    not found yet. It says where the thing went and offers the way there, then gets out
    of the way on its own.
  */
  const [toast, setToast] = useState<'saved' | 'unsaved' | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3600)
    return () => clearTimeout(t)
  }, [toast])
  const learner = useLearner()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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
    let timer: ReturnType<typeof setTimeout>
    const onScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const h = el.clientHeight
        const i = Math.round(el.scrollTop / h)
        if (i === 0) el.scrollTop = cards.length * h
        else if (i === looped.length - 1) el.scrollTop = h
      }, 90)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [cards.length, looped.length])

  return (
    <main data-stage="REAL WORLD" className="relative h-svh w-full overflow-hidden bg-[#241f1a]">
      {/* Over the feed, not in it. The chrome does not scroll away. */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-3 px-5 pt-6">
        <Link href="/vibes" className="pointer-events-auto tap-target">
          <Wordmark mark="club" className="h-6 text-white" title={chapterName()} />
        </Link>
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
            saved={mounted && (learner.saved ?? []).includes(card.id)}
            liked={mounted && (learner.liked ?? []).includes(card.id)}
            onSaved={(on) => setToast(on ? 'saved' : 'unsaved')}
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
function Toast({ kind }: { kind: 'saved' | 'unsaved' }) {
  return (
    <div
      role="status"
      data-testid="feed-toast"
      className="animate-bank absolute inset-x-0 bottom-0 z-50 flex items-center gap-3 bg-black/85 px-5 py-3 text-white"
    >
      <p className="min-w-0 flex-1 text-sm">
        {kind === 'saved' ? FEED_COPY.saved : FEED_COPY.unsaved}
      </p>
      {kind === 'saved' ? (
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
}: {
  card: FeedCard
  saved: boolean
  liked: boolean
  onSaved?: (on: boolean) => void
}) {
  const pane = useRef<HTMLDivElement>(null)
  /*
    Tapping the call to action does the same thing as the swipe.

    Two ways to reach one place, and the button says which gesture it stands in for
    rather than naming a destination — "swipe left to continue" is a instruction somebody
    can follow the next time without looking for a button at all. It scrolls rather than
    navigates, so going back is the same gesture in reverse.
  */
  const reveal = () =>
    pane.current?.scrollTo({
      left: pane.current.clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  const [isSaved, setSaved] = useState(saved)
  const [isLiked, setLiked] = useState(liked)
  useEffect(() => setSaved(saved), [saved])
  useEffect(() => setLiked(liked), [liked])

  const image = card.kind === 'situation' ? card.situation.image : card.image
  const title = card.kind === 'situation' ? card.situation.title : vocabWord(card.piece)
  const blurb = card.kind === 'situation' ? card.situation.why : card.because

  return (
    <section className="relative h-full w-full snap-start snap-always">
      {/*
        Two panes side by side, snapped horizontally: the room, then the language.

        Swiping left is a reveal rather than a navigation — the card does not go
        anywhere, and swiping back is the same gesture in reverse. That matters on a
        screen somebody opens while standing outside the place it is about.
      */}
      <div
        ref={pane}
        data-testid="card-panes"
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="relative h-full w-full shrink-0 snap-start">
          {image ? (
            <Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-cover" />
          ) : null}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/92 via-black/60 to-transparent"
          />
          {/* nav-clear keeps the rail and the title above the bar rather than under it. */}
          <div className="nav-clear absolute inset-x-0 bottom-0 flex items-end gap-3 px-5 text-white">
            <div className="min-w-0 flex-1">
              {card.kind === 'vocab' ? (
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
                  <p className="eyebrow text-white/70">IN LISBON</p>
                  <h2 className="display mt-3 text-balance text-3xl">{title}</h2>
                </>
              )}
              <p className="mt-3 text-sm leading-relaxed text-white/80">{blurb}</p>
              <button
                type="button"
                data-testid="card-continue"
                onClick={reveal}
                /* mb-3 so the blue button does not sit flush on the blue bar. Two blues
                   touching read as one shape, and the shape was neither. */
                className="tap-target eyebrow mb-3 mt-6 w-full rounded bg-[#1f5d8c] px-5 py-3 text-center text-white"
              >
                SWIPE LEFT
              </button>
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
            />
          </div>
        </div>

        <div className="nav-clear h-full w-full shrink-0 snap-start overflow-y-auto bg-bg px-5 pt-10 text-fg">
          {/*
            Clearance under the fixed header, composed from the scale rather than picked.

            The header floats over the feed and does not scroll, so this pane has to start
            below it — and 80px is not a step on the spacing scale. Ten plus six is, and it
            comes to the same place.
          */}
          <div className="mt-6">
            {card.kind === 'situation' ? <Lines card={card} /> : <Word card={card} />}
          </div>
        </div>
      </div>
    </section>
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
}: {
  card: FeedCard
  isSaved: boolean
  isLiked: boolean
  onSave: () => void
  onLike: () => void
}) {
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
          const url = window.location.origin + '/club'
          const title = card.kind === 'situation' ? card.situation.title : vocabWord(card.piece)
          // The platform sheet where there is one; the clipboard where there is not.
          if (navigator.share) await navigator.share({ title, url }).catch(() => {})
          else await navigator.clipboard?.writeText(url).catch(() => {})
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
