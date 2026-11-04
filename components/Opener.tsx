'use client'

import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClub } from '@/engine/useClub'
import { track } from '@/engine/analytics'
import { REPAIR_KIT } from '@/content/legend'
import { AudioButton } from '@/components/AudioButton'
import { slugFor } from '@/content/audio-manifest'
import { PATH_NAMES, pathPurpose, pathUnits } from '@/content/path'
import { saveSentence } from '@/content/blocks/lisbon-save'
import { useLearner } from '@/engine/useLearner'
import { useEntitlements } from '@/engine/useEntitlements'
import { hasFullAccess } from '@/lib/entitlements'
import { pathView } from '@/components/path/progress'
import { roomLock } from '@/components/path/locks'
import { said } from '@/content/speaker'

/**
 * MY OPENING LINE — the rescue card (Sam, 2026-11-02).
 *
 * "I love the idea of an app rescue/reminder button. Perhaps so you can remind yourself of
 * your planned opening sentence as you walk into a situation, on your home screen."
 *
 * So this is what you look at on the pavement outside the shop, phone at arm's length,
 * thirty seconds before you go in. Two things and nothing else:
 *
 *   the opening line of the next room on your path — its FIRST line, because the lines
 *   are ordered by the encounter and the first one is the one you walk in with; and
 *
 *   the save, underneath — "Desculpe, não percebi. Sou inglês." (Sam chose percebi, 2026-11-02) — for when the reply
 *   comes back faster than you expected. See content/blocks/lisbon-save.ts.
 *
 * BIG TYPE, NO CHROME. No bottom bar, no header, no tally: those are for sitting down.
 * The Portuguese is set at display size because it has to be read while walking, and the
 * English sits under it smaller, because by now you mostly know what it means.
 *
 * THE NEXT ROOM IS NEVER THE SAVE ITSELF. For a brand-new learner the save is literally
 * the next room on every path, which would print the same sentence twice. So the opener
 * skips it and takes the next room after — the save is already on the card.
 *
 * Its own route, /opener, with its own manifest, so on an iPhone it can be its own
 * home-screen icon (HomeScreenHint below). Android and desktop Chrome also get the
 * long-press shortcut in app/manifest.ts; iOS ignores that field.
 */
export function Opener() {
  const learner = useLearner()
  const access = useEntitlements()
  const club = useClub()
  const router = useRouter()
  const member = hasFullAccess(access) || access.comped
  const purpose = learner.purpose ?? null
  const gender = learner.profile?.gender ?? null
  const units = useMemo(() => pathUnits(undefined, undefined, purpose), [purpose])

  /*
    The same reading of the path PathHome makes — derived from the record, the same lock —
    so the room here is the room glowing on the home screen, except for the save (above).
  */
  /*
    Not the save (it is on the card already) and not Who you are, whose lines are a sample
    person's — "Chamo-me Ana" on the pavement is somebody else's name. That room is the
    Legend, which asks for yours. Nor a fun tile: a hack or a bluff is not a place you walk into.
  */
  const room = useMemo(() => {
    const skip = (id: string) => id === 'lisbon_save' || id === 'lisbon_legend' || id.startsWith('fun_')
    const view = pathView(learner, units, (id) => roomLock(id, member, purpose))
    if (view.next && !skip(view.next.room.id)) return view.next.room
    const nodes = view.units.flatMap((u) => u.nodes)
    return nodes.find((n) => !skip(n.room.id) && (n.state === 'next' || n.state === 'open'))?.room ?? null
  }, [learner, units, member, purpose])

  /*
    THE LINES IT TURNS THROUGH (2026-11-04). Sam: "can we have more than one line that
    rotates on a screen saver". In the order you would need them on a pavement: the line
    you walk in with and the one after it, the save, then the repair kit — every one in
    this learner's own ending (content/speaker.ts).
  */
  const slides = useMemo(() => {
    const out: { label: string; pt: string; en: string; room?: string }[] = []
    if (room) {
      room.lines.slice(0, 2).forEach((l, i) => {
        const x = said(l, gender)
        out.push({ label: (i === 0 ? 'Walking into · ' : 'Then · ') + room.title, pt: x.pt, en: x.en, room: room.id })
      })
    }
    const save = saveSentence(gender)
    out.push({ label: 'If it goes past you', pt: save.pt, en: save.en })
    for (const k of REPAIR_KIT) {
      if (k.pt === 'Não percebi.') continue // already inside the save
      out.push({ label: 'To keep it going', pt: k.pt, en: k.en })
    }
    return out
  }, [room, gender])

  const [at, setAt] = useState(0)
  const [playing, setPlaying] = useState(true)
  const n = slides.length
  const slide = slides[at % Math.max(1, n)]
  const go = useCallback((d: number) => setAt((x) => (x + d + n) % n), [n])

  /* Turning on its own, slowly enough to say the line twice; a hand on it stops it. */
  useEffect(() => {
    if (!playing || n < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => setAt((x) => (x + 1) % n), ROTATE_MS)
    return () => window.clearInterval(t)
  }, [playing, n])

  /*
    THE SCREEN STAYS ON while this is open — it is read at arm's length, and a phone that
    dims mid-sentence is a phone you have to unlock in front of the person you are talking
    to. The Wake Lock API, where the browser has it (iOS 16.4+); re-asked when the page
    comes back, because the lock is dropped whenever it is hidden.
  */
  const [awake, setAwake] = useState(false)
  useEffect(() => {
    type Lock = { release: () => Promise<void>; addEventListener: (t: 'release', f: () => void) => void }
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<Lock> } }).wakeLock
    if (!wl) return
    let lock: Lock | null = null
    const ask = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        lock = await wl.request('screen')
        setAwake(true)
        lock.addEventListener('release', () => setAwake(false))
      } catch {
        setAwake(false)
      }
    }
    void ask()
    document.addEventListener('visibilitychange', ask)
    return () => {
      document.removeEventListener('visibilitychange', ask)
      void lock?.release().catch(() => {})
    }
  }, [])

  /* Swipe, as well as the arrows. */
  const touch = useRef<number | null>(null)

  const ask = () => {
    track('opener_ask')
    if (club.open) window.dispatchEvent(new CustomEvent('dub:ask'))
    else router.push('/ask')
  }

  return (
    <>
    <div data-stage="LISBON" className="safe-top flex min-h-svh flex-col bg-bg text-fg">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 pb-8 pt-4">
        <div className="flex items-center justify-between">
          <Link
            href="/club"
            data-testid="back"
            className="tap-target eyebrow -ml-1 flex shrink-0 items-center gap-1 px-1 text-accent"
          >
            <span aria-hidden>←</span>
            {PATH_NAMES[pathPurpose(purpose)].short.toUpperCase()}
          </Link>
          <p className="eyebrow text-muted">My opening line</p>
        </div>

        {/*
          The card. `needs-learner` because it is read from the device: the server has no
          path, and a wrong room flashing in for a frame is worse than a blank one.
        */}
        <section
          aria-roledescription="carousel"
          aria-label="Lines to say"
          className="needs-learner flex flex-1 flex-col justify-center gap-5"
          data-testid="opener-line"
          onTouchStart={(e) => {
            touch.current = e.touches[0]?.clientX ?? null
          }}
          onTouchEnd={(e) => {
            const x0 = touch.current
            const x1 = e.changedTouches[0]?.clientX
            touch.current = null
            if (x0 == null || x1 == null || Math.abs(x1 - x0) < 40) return
            setPlaying(false)
            go(x1 < x0 ? 1 : -1)
          }}
        >
          {slide ? (
            <div key={at} className="animate-rise flex flex-col gap-4" aria-live={playing ? 'off' : 'polite'} data-testid="opener-slide">
              <p className="eyebrow text-muted">{slide.label}</p>
              <SpokenLine pt={slide.pt} en={slide.en} size="xl">
                {slide.room ? (
                  <Link href={'/errand/' + slide.room} className="eyebrow text-accent underline-offset-4 hover:underline">
                    The whole room
                  </Link>
                ) : null}
              </SpokenLine>
            </div>
          ) : null}

          {n > 1 ? (
            <div className="mt-4 flex items-center gap-3">
              <button type="button" aria-label="Previous line" onClick={() => { setPlaying(false); go(-1) }} className="tap-target h-11 w-11 rounded-full border border-line text-lg">
                ←
              </button>
              <div className="flex flex-1 justify-center gap-1.5" aria-hidden>
                {slides.map((_, i) => (
                  <span key={i} className={'h-1.5 rounded-full transition-all ' + (i === at % n ? 'w-6 bg-accent' : 'w-1.5 bg-line-strong')} />
                ))}
              </div>
              <button
                type="button"
                data-testid="opener-play"
                aria-label={playing ? 'Pause' : 'Play'}
                onClick={() => setPlaying((p) => !p)}
                className="tap-target eyebrow h-11 rounded-full border border-line px-4 text-[0.65rem]"
              >
                {playing ? 'Pause' : 'Play'}
              </button>
              <button type="button" aria-label="Next line" onClick={() => { setPlaying(false); go(1) }} className="tap-target h-11 w-11 rounded-full border border-line text-lg">
                →
              </button>
            </div>
          ) : null}
          <p className="text-xs text-muted" data-testid="opener-awake">
            {awake ? 'The screen stays on while this is open.' : 'Swipe for the next line.'}
          </p>
        </section>

        {/* Sam: "can we add a translator button that links the user direct to translator?" */}
        <button
          type="button"
          data-testid="opener-ask"
          onClick={ask}
          className="tap-target flex items-center justify-center gap-3 rounded-2xl bg-accent px-5 py-4 text-accent-ink"
        >
          <span aria-hidden className="text-xl leading-none">?</span>
          <span className="eyebrow">Something else? Ask DUB</span>
        </button>

        <HomeScreenHint />
      </div>
      <BottomNavSpace />
    </div>
    <BottomNav />
    </>
  )
}

const ROTATE_MS = 7000

/**
 * ITS OWN ICON ON AN IPHONE (2026-11-04). iOS ignores manifest shortcuts — Sam long-pressed
 * the DUB icon and got Share / Delete Bookmark — so the card earns a home-screen icon of its
 * own: /opener carries its own manifest (app/opener/manifest.webmanifest), whose start_url is
 * this page. Added from Safari, it opens here. Not shown inside the installed app, where
 * there is no Share button to follow.
 */
function HomeScreenHint() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
    setShow(!standalone)
  }, [])
  if (!show) return null
  return (
    <details className="rounded-2xl border border-line bg-bg-elev px-4 py-3 text-sm" data-testid="opener-homescreen">
      <summary className="eyebrow cursor-pointer text-muted">Put this on your home screen</summary>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
        <li>In Safari, on this page, tap Share.</li>
        <li>Choose Add to Home Screen, then Add.</li>
        <li>A “My line” icon opens straight onto this card.</li>
      </ol>
    </details>
  )
}

/**
 * ONE LINE TO SAY: the Portuguese, the English under it, and the listen button.
 *
 * Lifted out of the rescue card on 2026-11-02 so the Wall's tile sheet
 * (components/path/TileSheet.tsx) can "Remind" you of a room in exactly the same shape —
 * the line you walk in with, the release, the save — rather than growing a second way of
 * drawing a sentence. `size` is the only difference: the rescue card is read at arm's
 * length on a pavement (xl, lg); the sheet is read sitting down, three lines deep (md).
 * `children` sit beside the listen button: "The whole room", "Then: Pode falar …".
 */
export function SpokenLine({
  pt,
  en,
  size = 'lg',
  children,
}: {
  pt: string
  en: string
  size?: 'xl' | 'lg' | 'md'
  children?: React.ReactNode
}) {
  const ptSize =
    size === 'xl' ? 'text-[2.6rem] leading-[1.1]' : size === 'lg' ? 'text-[2rem] leading-[1.15]' : 'text-2xl leading-tight'
  const enSize = size === 'xl' ? 'text-xl' : size === 'lg' ? 'text-lg' : 'text-base'
  return (
    <>
      <p className={'pt text-balance font-semibold text-accent ' + ptSize} lang="pt-PT">
        {pt}
      </p>
      <p className={enSize + ' leading-snug text-fg'}>{en}</p>
      <div className="flex items-center gap-4">
        <AudioButton slug={slugFor(pt)} text={pt} size={size === 'md' ? 'sm' : 'md'} />
        {children}
      </div>
    </>
  )
}
