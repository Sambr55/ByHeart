'use client'

import { StatusBar } from '@/components/Native'
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
  const [still, setStill] = useState(false)
  const n = slides.length
  const i = n ? at % n : 0
  const slide = slides[i]
  const go = useCallback((d: number) => setAt((x) => (x + d + n) % n), [n])

  useEffect(() => {
    setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  /*
    Turning on its own, slowly enough to say the line twice. A timeout per slide rather than
    an interval, so a tap forward starts the next line's clock from zero instead of cutting
    it short — the progress bar at the top is drawn from the same number.
  */
  useEffect(() => {
    if (!playing || still || n < 2) return
    const t = window.setTimeout(() => setAt((x) => (x + 1) % n), ROTATE_MS)
    return () => window.clearTimeout(t)
  }, [playing, still, n, at])

  /*
    THE SCREEN STAYS ON while this is open — it is read at arm's length, and a phone that
    dims mid-sentence is a phone you have to unlock in front of the person you are talking
    to. The Wake Lock API, where the browser has it (iOS 16.4+); re-asked when the page
    comes back, because the lock is dropped whenever it is hidden.
  */
  useEffect(() => {
    type Lock = { release: () => Promise<void> }
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<Lock> } }).wakeLock
    if (!wl) return
    let lock: Lock | null = null
    const ask = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        lock = await wl.request('screen')
      } catch {
        /* Low battery mode, or a browser that says no. The card still works. */
      }
    }
    void ask()
    document.addEventListener('visibilitychange', ask)
    return () => {
      document.removeEventListener('visibilitychange', ask)
      void lock?.release().catch(() => {})
    }
  }, [])

  /* Swipe, as well as the taps. */
  const touch = useRef<{ x: number; y: number } | null>(null)

  const ask = () => {
    track('opener_ask')
    if (club.open) window.dispatchEvent(new CustomEvent('dub:ask'))
    else router.push('/ask')
  }

  /*
    THE SCREENSAVER (Sam, 2026-11-04): "I am talking your screensaver — there you see the
    language you need and the translator button."

    So the whole glass is the card. Dark to every edge, no bottom bar, no header: one line
    in Portuguese at display size, fading into the next, the English under it, and the
    translator at the foot for the sentence that isn't here. Story-style bars across the
    top say how many lines there are and how long until the next one.

    Tap the right of the screen for the next line, the left for the one before; tap the
    middle to hold it still. Swipe works too. Nothing on it needs reading twice.
  */
  return (
    <div
      data-stage="LISBON"
      data-testid="opener-saver"
      className="on-dark saver safe-top relative flex h-dvh flex-col overflow-hidden text-white"
    >
      <StatusBar color="#241f1a" />
      <div aria-hidden className={'saver-glow' + (still ? '' : ' is-moving')} />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
        {/* The bars: one per line, the current one filling. */}
        <div className="flex gap-1" aria-hidden data-testid="opener-bars">
          {slides.map((_, k) => (
            <span key={k} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
              {k < i ? <span className="block h-full w-full bg-white/90" /> : null}
              {k === i ? (
                <span
                  key={at}
                  className="saver-fill block h-full bg-white/90"
                  style={{
                    animationDuration: ROTATE_MS + 'ms',
                    animationPlayState: playing && !still ? 'running' : 'paused',
                    width: still ? '100%' : undefined,
                  }}
                />
              ) : null}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="eyebrow text-white/60">My opening line</p>
          <Link
            href="/club"
            data-testid="back"
            aria-label={'Close, back to ' + PATH_NAMES[pathPurpose(purpose)].short}
            className="tap-target -mr-2 flex h-11 w-11 items-center justify-center text-2xl leading-none text-white/80"
          >
            ×
          </Link>
        </div>

        {/*
          The line. `needs-learner` because it is read from the device: the server has no
          path, and a wrong room flashing in for a frame is worse than a blank one.
        */}
        <section
          aria-roledescription="carousel"
          aria-label="Lines to say"
          className="needs-learner relative flex flex-1 flex-col justify-center"
          data-testid="opener-line"
          onTouchStart={(e) => {
            const t = e.touches[0]
            touch.current = t ? { x: t.clientX, y: t.clientY } : null
          }}
          onTouchEnd={(e) => {
            const a = touch.current
            const b = e.changedTouches[0]
            touch.current = null
            if (!a || !b) return
            const dx = b.clientX - a.x
            if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(b.clientY - a.y)) {
              e.preventDefault()
              go(dx < 0 ? 1 : -1)
            }
          }}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a,button')) return
            const r = e.currentTarget.getBoundingClientRect()
            const x = (e.clientX - r.left) / r.width
            if (x < 0.3) go(-1)
            else if (x > 0.7) go(1)
            else setPlaying((p) => !p)
          }}
        >
          {slide ? (
            <div key={at} className="saver-in flex flex-col gap-5" aria-live={playing ? 'off' : 'polite'} data-testid="opener-slide">
              <p className="eyebrow text-white/55">{slide.label}</p>
              <p className="pt text-balance text-[clamp(2.4rem,11vw,3.6rem)] font-semibold leading-[1.05]" lang="pt-PT">
                {slide.pt}
              </p>
              <p className="text-xl leading-snug text-white/70">{slide.en}</p>
              <div className="saver-audio flex items-center gap-5">
                <AudioButton slug={slugFor(slide.pt)} text={slide.pt} size="md" />
                {slide.room ? (
                  <Link href={'/errand/' + slide.room} className="eyebrow text-white/60 underline-offset-4 hover:underline">
                    The whole room
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

          <p className="eyebrow mt-10 text-center text-[0.6rem] text-white/40" data-testid="opener-play" aria-live="polite">
            {still ? 'Swipe for the next line' : playing ? 'Tap the middle to hold this line' : 'Held · tap the middle to carry on'}
          </p>
        </section>

        {/* Sam: "can we add a translator button that links the user direct to translator?" */}
        <button
          type="button"
          data-testid="opener-ask"
          onClick={ask}
          className="tap-target flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-[#241f1a] shadow-lg"
        >
          <span aria-hidden className="text-xl leading-none">?</span>
          <span className="eyebrow">Need another line? Ask DUB</span>
        </button>

        <HomeScreenHint />
      </div>
    </div>
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
    <details className="mt-3 text-center text-sm" data-testid="opener-homescreen">
      <summary className="eyebrow cursor-pointer list-none text-[0.6rem] text-white/45">Keep this on your home screen</summary>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-left text-white/70">
        <li>In Safari, on this page, tap Share.</li>
        <li>Choose Add to Home Screen, then Add.</li>
        <li>A “My line” icon opens straight onto this screen.</li>
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
