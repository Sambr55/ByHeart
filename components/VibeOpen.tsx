'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { PICKER } from '@/content/front-door'
import type { Crate, Rung } from '@/content/roots'
import { vibeImage } from '@/content/vibe-images'

/**
 * A vibe, full bleed, and one swipe from being inside it.
 *
 * The tile is a photograph now and a photograph two inches across is a thumbnail — it
 * identifies the vibe and it cannot do the other half of the job, which is make somebody
 * want it. So tapping does not enter: it opens the picture to the whole screen, and the
 * swipe left is what commits.
 *
 * That is the same gesture the Club runs on, and deliberately so. Two panes snapped
 * horizontally, the second one taking you in, and swiping back is the same movement in
 * reverse — a learner who has swiped through a Situation already knows how to do this
 * without being told twice.
 *
 * A locked vibe opens too. It used to be a dimmed square you could not press, which
 * answers "can I have this" with silence; the photograph is the argument for the thing
 * you cannot have yet, and it belongs on the screen at full size where it can make it.
 */
export function VibeOpen({
  crate,
  state,
  at,
  onEnter,
  onClose,
}: {
  crate: Crate
  /** open: swipe enters. stage: the ladder is not there yet. pro: the allowance is spent. */
  state: 'open' | 'stage' | 'pro'
  at: Rung
  onEnter: () => void
  onClose: () => void
}) {
  const pane = useRef<HTMLDivElement>(null)
  const [going, setGoing] = useState(false)
  const image = vibeImage(crate.id)

  /*
    Committed once, on arrival at the second pane.

    The scroll handler fires continuously through the swipe, so without the latch a
    half-hearted drag that bounces back would still have started the session. `going` also
    drives the second pane's own copy, so what somebody sees mid-swipe is the thing that
    is actually happening.
  */
  useEffect(() => {
    const el = pane.current
    if (!el || state !== 'open') return
    const onScroll = () => {
      if (going) return
      if (el.scrollLeft >= el.clientWidth * 0.6) {
        setGoing(true)
        onEnter()
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [going, onEnter, state])

  /** Tapping the words does what the words say. */
  const swipe = () =>
    pane.current?.scrollTo({
      left: pane.current.clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })

  return (
    <main
      data-testid="vibe-open"
      data-stage="REAL WORLD"
      className="fixed inset-0 z-50 h-svh w-full overflow-hidden bg-[#241f1a]"
    >
      {/* safe-top before the pt-6: a full-bleed takeover has nothing above it at all, so
          its own chrome is the only thing between BACK and the clock. */}
      <header className="safe-top pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-3 px-5 pt-6">
        <button
          type="button"
          data-testid="vibe-close"
          onClick={onClose}
          className="pointer-events-auto tap-target eyebrow text-white"
        >
          ← BACK
        </button>
      </header>

      <div
        ref={pane}
        data-testid="vibe-panes"
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="relative h-full w-full shrink-0 snap-start">
          {image ? (
            <Image src={image.src} alt={image.alt} fill sizes="100vw" priority className="object-cover" />
          ) : null}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/92 via-black/60 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 px-5 pb-10 text-white">
            <p className="eyebrow text-white/70">{PICKER.open_eyebrow}</p>
            <h1 className="display text-balance text-3xl">{crate.title}</h1>
            <p className="text-sm leading-relaxed text-white/80">{crate.blurb}</p>

            {state === 'open' ? (
              <button
                type="button"
                data-testid="vibe-begin"
                onClick={swipe}
                className="tap-target eyebrow mt-3 w-full rounded bg-[#1f5d8c] px-5 py-3 text-center text-white"
              >
                {PICKER.open_cta}
              </button>
            ) : state === 'pro' ? (
              <Link
                href="/pro"
                data-testid="vibe-pro"
                className="tap-target eyebrow mt-3 w-full rounded bg-[#1f5d8c] px-5 py-3 text-center text-white"
              >
                {PICKER.open_pro_cta}
              </Link>
            ) : (
              /* No button at all. Money cannot move the ladder, so there is nothing here
                 to press — and a disabled control is just a button that lies. */
              <p
                data-testid="vibe-stage"
                className="mt-3 rounded border border-white/40 px-4 py-3 text-center text-xs uppercase tracking-wider text-white/80"
              >
                {PICKER.open_stage.replace('{n}', String(at))}
              </p>
            )}
          </div>
        </div>

        {state === 'open' ? (
          <div className="flex h-full w-full shrink-0 snap-start flex-col justify-center gap-3 bg-bg px-5 text-fg">
            <p className="eyebrow text-accent">{PICKER.open_going}</p>
            <p className="display text-balance text-3xl">{crate.title}</p>
          </div>
        ) : null}
      </div>
    </main>
  )
}
