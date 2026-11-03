'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { SayButton } from '@/components/SayButton'
import { slugFor } from '@/content/audio-manifest'
import { KIND_LABEL, START_HERE, startTileDone, type StartTile } from '@/content/start-here'
import { markStartDone } from '@/engine/learner'
import { track } from '@/engine/analytics'

/**
 * START HERE, ON THE HOME SCREEN — the website's step one as tiles (content/start-here.ts).
 *
 * Before Level 1 it is the whole of "what to do now": the next tile big, the rest in a grid.
 * Each opens in place — the line, somebody saying it, a microphone if you want to try it —
 * and "Got it" lays it. The save is a real room and opens as one. Once all are met the grid
 * stays at the bottom of home, small, to come back to.
 */

/* One colour per kind, as on the website's strip, so the row reads as a rhythm. */
const FACE: Record<StartTile['kind'], string> = {
  save: 'bg-telha text-white',
  basics: 'bg-accent text-accent-ink',
  cheat: 'bg-fg text-bg',
  hack: 'bg-[#2c6b4a] text-white',
  bluff: 'bg-[#c9973b] text-[#1a2430]',
  chat: 'bg-[#5b4a7a] text-white',
  song: 'bg-[#5b4a7a] text-white',
  idiom: 'bg-[#5b4a7a] text-white',
}

type Rec = { finished_cards?: string[]; start_done?: string[] }

export function StartHere({
  record,
  onOpen,
  compact = false,
}: {
  record: Rec
  onOpen: (t: StartTile) => void
  compact?: boolean
}) {
  return (
    <section aria-labelledby="start-here" className="flex flex-col gap-3" data-testid="start-here">
      <h2 id="start-here" className="eyebrow text-muted">
        {compact ? 'Start here · saves, basics and fun lines' : 'Start here'}
      </h2>
      <ul className={'grid gap-2 ' + (compact ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4')}>
        {START_HERE.map((t) => {
          const done = startTileDone(t, record)
          return (
            <li key={t.id}>
              <TileButton t={t} done={done} compact={compact} onOpen={onOpen} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function TileButton({ t, done, compact, onOpen }: { t: StartTile; done: boolean; compact: boolean; onOpen: (t: StartTile) => void }) {
  const inner = (
    <span
      className={
        'relative flex aspect-square w-full flex-col justify-end overflow-hidden rounded-2xl p-2.5 text-left ' +
        (t.image ? 'text-white' : FACE[t.kind]) +
        (done ? ' ring-2 ring-[#c9973b] ring-offset-2 ring-offset-bg' : '')
      }
    >
      {t.image ? (
        <>
          <Image src={t.image.src} alt="" fill sizes="160px" className="object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </>
      ) : null}
      {compact ? null : <span className="eyebrow relative text-[0.6rem] opacity-80">{KIND_LABEL[t.kind]}</span>}
      <span className={'display relative leading-none ' + (compact ? 'text-xs' : 'text-lg')}>{t.face}</span>
      {done ? (
        <span aria-hidden className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#c9973b] text-[0.65rem] font-bold text-[#1a2430]">
          ✓
        </span>
      ) : null}
    </span>
  )
  const label = KIND_LABEL[t.kind] + ': ' + t.face + (done ? ' — done' : '')
  if (t.room && !done) {
    return (
      <Link href={'/errand/' + t.room} aria-label={label} data-state="open" className="tap-target block">
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" aria-label={label} data-state={done ? 'done' : 'open'} onClick={() => onOpen(t)} className="tap-target block w-full">
      {inner}
    </button>
  )
}

/** The next Start-here tile, big — what "Up next" is before Level 1. */
export function StartNext({ t, onOpen }: { t: StartTile; onOpen: (t: StartTile) => void }) {
  const body = (
    <span className="flex flex-col gap-4 rounded-3xl border-2 border-accent bg-bg-elev p-5 text-left shadow-[0_10px_30px_-18px_rgba(26,36,48,0.5)]">
      <span className="flex items-start gap-4">
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="eyebrow self-start rounded-full bg-surface px-3 py-1 text-[0.65rem]">{KIND_LABEL[t.kind]}</span>
          <span className="display text-3xl leading-none">{t.face}</span>
          <span className="text-sm text-muted">{t.does}</span>
        </span>
        {t.image ? (
          <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
            <Image src={t.image.src} alt="" fill sizes="96px" className="object-cover" />
          </span>
        ) : null}
      </span>
      <span className="eyebrow flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-accent-ink">▶ Play</span>
    </span>
  )
  return t.room ? (
    <Link href={'/errand/' + t.room} data-testid="start-next" className="tap-target block">
      {body}
    </Link>
  ) : (
    <button type="button" data-testid="start-next" onClick={() => onOpen(t)} className="tap-target block w-full">
      {body}
    </button>
  )
}

/** One tile, opened: the line, a voice, a microphone, and Got it. */
export function StartSheet({ t, lang, onClose }: { t: StartTile; lang: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t.face}
        data-testid="start-sheet"
        onClick={(e) => e.stopPropagation()}
        className="animate-rise max-h-[90svh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-bg p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] outline-none sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="eyebrow text-telha">{KIND_LABEL[t.kind]}</p>
            <h2 className="display text-3xl leading-none">{t.face}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
            ✕
          </button>
        </div>
        <p className="mt-3 text-muted">{t.does}</p>
        {t.literal ? (
          <p className="mt-2 text-sm text-muted">
            Word for word: <span className="lang line-through decoration-telha/70" lang={lang}>{t.literal}</span>
          </p>
        ) : null}

        <ul className="mt-5 flex flex-col gap-3">
          {t.lines.map((l) => (
            <li key={l.pt} className="flex items-center gap-3 rounded-2xl border border-line bg-bg-elev px-4 py-3">
              <AudioButton slug={slugFor(l.pt)} text={l.pt} />
              <span className="min-w-0 flex-1">
                <span className="lang block text-lg leading-snug text-accent" lang={lang}>
                  {l.pt}
                </span>
                <span className="block text-sm text-muted">{l.en}</span>
              </span>
            </li>
          ))}
        </ul>

        {t.note ? <p className="mt-4 text-sm leading-relaxed text-muted">{t.note}</p> : null}

        <div className="mt-5 flex flex-col items-center gap-2">
          <p className="eyebrow text-muted">Try it out loud</p>
          <SayButton want={t.lines[0].pt} />
        </div>

        <button
          type="button"
          data-testid="start-got"
          onClick={() => {
            markStartDone(t.id)
            track('start_done', { id: t.id })
            onClose()
          }}
          className="tap-target eyebrow mt-6 w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
        >
          Got it
        </button>
        {t.more ? (
          <Link href={t.more.href} className="mt-3 block text-center text-sm text-muted underline underline-offset-4">
            {t.more.label}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
