'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { CopyButton } from '@/components/CopyButton'
import { SayButton, useCanListen } from '@/components/SayButton'
import { KindIcon } from '@/components/path/icons'
import { slugFor } from '@/content/audio-manifest'
import { saveSentence } from '@/content/blocks/lisbon-save'
import { SpeakerAsk } from '@/components/SpeakerAsk'
import type { Situation } from '@/content/situations'

/**
 * A ROOM, AS AN APP AND NOT A WEB PAGE (Sam, 2026-11-02).
 *
 * Sam: "we've sexed up the top layer of cards etc, but click through to the content and
 * it's still pretty 'posh HTML'. I think we can do better how we present the actual
 * learning content in a more app style." The room's read stage was a document: a 16:9
 * photo, a paragraph, then every line as a card in one long scroll, and the button that
 * moves you on at the very bottom of it. It read like an article about a café.
 *
 * So the same content, presented the way the rest of the product moves:
 *
 *   THE PLACE FIRST     the photo full-bleed at the top, the title on it, and the room's
 *                       `why` as a one-line situation under the title. It collapses to a
 *                       strip once you start (or scroll), because after the first look the
 *                       place has done its job and the sentence is what you came for.
 *   ONE SENTENCE A CARD a stepped stack — swipe, or the arrow — never a list. The
 *                       Portuguese big; WHEN TO SAY IT above it, small, as the moment; the
 *                       English hidden until you tap the card, because reading the
 *                       translation first is how a phrasebook is used and not how a line is
 *                       learned.
 *   PROGRESS DOTS       one per line, then one for your turn.
 *   THE THUMB ZONE      hear it, say it (where the browser can listen), and on — pinned at
 *                       the bottom where a thumb is, not at the end of a scroll.
 *   THE SAVE            "Didn't catch it?" one tap away on every card: the save sentence,
 *                       the same one My opening line keeps — because the moment you need it
 *                       is not the moment to go looking for it.
 *
 * PRESENTATION ONLY. Nothing here banks anything: hearing is AudioButton, saying is
 * SayButton (which feeds the understood tally exactly as it does in the said stage), and
 * the step to YOUR TURN is the same `onGo` the old bottom button called. The proof, the
 * pieces and the release all stay in Errand.
 */
export function RoomSteps({
  situation,
  gender,
  top,
  onGo,
  extra,
}: {
  situation: Situation
  gender: 'm' | 'f' | null
  /* What sits above the title in the header — the night's progress, or the city. */
  top: ReactNode
  /* YOUR TURN: what the old bottom button did. */
  onGo: () => void
  /* Anything the room adds after its last line (the box office link on a ticket room). */
  extra?: ReactNode
}) {
  const lines = situation.lines
  const [at, setAt] = useState(0)
  const [shown, setShown] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const canListen = useCanListen()
  const save = saveSentence(gender)
  const line = lines[at]
  const last = at === lines.length - 1

  /*
    ONCE SHRUNK, THE PHOTO STAYS SHRUNK (2026-11-04). Sam: "when you try and scroll up to
    see the rest of the card everything expands and then flops back to start position."

    This was `scrolled = scrollY > 24` both ways. Shrinking the photo takes ~280px off the
    page, which on a short room drags the scroll back under 24, which grows the photo, which
    makes the page scrollable again — a loop the eye sees as a bounce. A layout that changes
    the scroll it is driven by has to latch: past 24 it shrinks and stays shrunk for this
    room, and the page simply scrolls.
  */
  useEffect(() => {
    const on = () => {
      if (window.scrollY > 24) setScrolled(true)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const go = (n: number) => {
    if (n < 0 || n >= lines.length) return
    setAt(n)
    setShown(false)
    setSaveOpen(false)
  }

  /* Swipe: a horizontal flick of 48px moves a card; anything more vertical is a scroll. */
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current
    touch.current = null
    if (!s) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    go(dx < 0 ? at + 1 : at - 1)
  }

  const compact = scrolled || at > 0

  return (
    <>
      {/* THE PLACE. Full-bleed, collapsing to a strip once you are under way. */}
      <div
        data-testid="room-hero"
        data-compact={compact ? 'true' : undefined}
        className={'room-hero on-dark relative -mx-5 -mt-6 overflow-hidden ' + (compact ? 'is-compact' : '')}
      >
        {situation.image ? (
          <Image src={situation.image.src} alt={situation.image.alt} fill sizes="(max-width: 448px) 100vw, 448px" className="object-cover" priority />
        ) : (
          <div aria-hidden className="azulejo-block absolute inset-0 flex items-center justify-center text-accent">
            <KindIcon kind={situation.kind} className="h-16 w-16 opacity-60" />
          </div>
        )}
        <div aria-hidden className="room-hero-scrim absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 px-5 pb-3">
          <div className="text-white/85">{top}</div>
          <h1 className="display text-balance text-3xl text-white" style={{ textShadow: '0 1px 12px rgb(0 0 0 / 0.55)' }}>
            {situation.title}
          </h1>
          <p className="room-why line-clamp-2 text-sm leading-snug text-white/90">{situation.why}</p>
        </div>
      </div>

      {/* WHERE YOU ARE: a dot per line, and one for your turn. */}
      <div className="flex items-center justify-center gap-1" data-testid="room-dots" aria-label={'Line ' + (at + 1) + ' of ' + lines.length}>
        {lines.map((l, i) => (
          <button
            key={l.pt}
            type="button"
            aria-label={'Line ' + (i + 1)}
            onClick={() => go(i)}
            className={'room-dot ' + (i === at ? 'is-at' : i < at ? 'is-past' : '')}
          />
        ))}
        <span aria-hidden className="room-dot is-turn" />
      </div>

      {/* ONE SENTENCE. Tap the card for the English; swipe for the next. */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="flex flex-1 flex-col">
        <button
          key={line.pt}
          type="button"
          data-testid="room-card"
          data-shown={shown ? 'true' : undefined}
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? 'Hide the English' : 'Show the English'}
          className="room-card flex flex-col gap-3 rounded-3xl border border-line bg-bg-elev px-6 py-6 text-left"
        >
          <span className="text-sm leading-snug text-muted">{line.when}</span>
          <span lang="pt-PT" className="pt display text-balance text-4xl leading-tight text-accent">
            {line.pt}
          </span>
          <span className={'room-en text-lg leading-snug text-fg ' + (shown ? 'is-shown' : '')} aria-hidden={!shown}>
            {line.en}
          </span>
          {/* Animated so it reads as something to do, not a caption (Sam, 2026-11-10: "animate Tap for the English so it is more obvious"). */}
          {shown ? null : (
            <span className="room-hint" data-testid="room-hint">
              <span aria-hidden className="room-hint-finger">👆</span>
              Tap for the English
            </span>
          )}
        </button>
        {/* Obrigado or obrigada: asked here, the first time a line will not let you say it until it knows. */}
        <SpeakerAsk line={line} gender={gender} />

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            data-testid="room-save"
            aria-expanded={saveOpen}
            onClick={() => setSaveOpen((v) => !v)}
            className="tap-target text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            Didn’t catch their answer?
          </button>
          <span className="flex-1" />
          <CopyButton text={line.pt} size="sm" />
        </div>
        {saveOpen ? (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3" data-testid="room-save-line">
            <AudioButton slug={slugFor(save.pt)} text={save.pt} size="sm" />
            <span className="flex min-w-0 flex-col">
              <span lang="pt-PT" className="pt text-lg text-accent">
                {save.pt}
              </span>
              <span className="text-sm text-muted">{save.en}</span>
            </span>
          </div>
        ) : null}
        {last ? extra : null}
      </div>

      {/*
        THE THUMB ZONE: hear, say, on. Pinned, so the next move is always under the thumb
        and never at the bottom of a page somebody has to scroll to find.
      */}
      {/*
        SLIM (2026-11-04, Sam: "The panel above the bottom nav is too tall"). It sits on the
        bottom bar, which already clears the home indicator, so it carries no safe-area
        padding of its own — it had both, and the gap under the buttons was the second one.
      */}
      <div className="room-dock sticky bottom-[calc(var(--bar-room)+var(--keyboard))] -mx-5 mt-4 flex items-center gap-3 border-t border-line bg-bg px-5 py-2.5">
        <AudioButton slug={slugFor(line.pt)} text={line.pt} />
        {canListen ? <SayButton key={line.pt} want={line.pt} /> : null}
        {last ? null : <span className="flex-1" />}
        {at > 0 ? (
          <button type="button" aria-label="Previous line" onClick={() => go(at - 1)} className="tap-target rounded-full border border-line px-3 py-3 text-muted">
            ←
          </button>
        ) : null}
        {last ? (
          <button
            type="button"
            data-testid="room-go"
            onClick={onGo}
            className="tap-target eyebrow min-w-0 flex-1 rounded-full bg-accent px-3 py-3 text-center leading-tight text-accent-ink"
          >
            {/* The same words the old bottom button carried: the job this room is for. */}
            {situation.release.ask.replace(/\.$/, '').toUpperCase()}
          </button>
        ) : (
          <button
            type="button"
            data-testid="room-next"
            onClick={() => go(at + 1)}
            className="tap-target eyebrow rounded-full bg-accent px-6 py-3 text-accent-ink"
          >
            Next →
          </button>
        )}
      </div>
    </>
  )
}
