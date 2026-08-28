'use client'

import { useEffect, useState } from 'react'
import { track } from '@/engine/analytics'

/**
 * Asking to be installed, because there is no way to install yourself.
 *
 * Worth saying plainly, since it is the thing people expect to be able to do in code and
 * cannot: a web page cannot put itself on a home screen. On Android the browser fires
 * `beforeinstallprompt`, which is a real one-tap install — the only thing a page may do
 * is choose the moment to spend it. On iOS there is no equivalent API at all. Safari's
 * Share sheet is the only route, so the honest move is to tell somebody where it is.
 *
 * It matters more here than on most products. Installed, DUB loses the URL bar, which is
 * what makes the button sit still; it gets its own splash and icon; and on iOS the
 * Notification API does not exist AT ALL until a site is on the home screen, so The Line
 * — the entire habit half of DUB — cannot be switched on from a browser tab.
 *
 * Once dismissed, never again. A strip that comes back is an advert.
 */
const DISMISSED = 'byheart.install.dismissed'

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export function Install() {
  const [how, setHow] = useState<'none' | 'ios' | 'android'>('none')
  const [deferred, setDeferred] = useState<Prompt | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (localStorage.getItem(DISMISSED)) return
    } catch {
      /* A browser with storage off is not a browser to nag. */
    }

    const installed =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true
    if (installed) return

    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document)
    if (isIOS) {
      setHow('ios')
      return
    }

    /*
      Android's real install, held rather than spent.

      The browser offers this once and expects a user gesture to redeem it, so the event is
      caught and kept; without preventDefault Chrome shows its own bar and the offer is
      gone before there is anywhere sensible to put it.
    */
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as Prompt)
      setHow('android')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (how === 'none') return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED, '1')
    } catch {
      /* Then it comes back next time, which is the lesser of the two failures. */
    }
    track('install_dismissed', { how })
    setHow('none')
  }

  return (
    <section
      data-testid="install"
      className="flex flex-col gap-3 rounded border border-line-strong bg-bg-elev px-4 py-3"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow text-accent">ON YOUR PHONE</p>
        <button
          type="button"
          data-testid="install-dismiss"
          onClick={dismiss}
          className="tap-target shrink-0 text-[0.55rem] uppercase tracking-wider text-muted"
        >
          not now
        </button>
      </div>
      <p className="text-sm leading-relaxed text-fg/85">
        It gets its own icon, loses the browser bar so nothing shifts under your thumb, and
        it is the only way to switch on the morning line.
      </p>
      {how === 'ios' ? (
        <p className="text-xs leading-relaxed text-muted">
          Tap <span className="font-semibold text-fg">Share</span> at the bottom of Safari,
          then <span className="font-semibold text-fg">Add to Home Screen</span>.
        </p>
      ) : (
        <button
          type="button"
          data-testid="install-go"
          onClick={async () => {
            if (!deferred) return
            track('install_accepted', { how })
            await deferred.prompt()
            await deferred.userChoice
            setHow('none')
          }}
          className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink"
        >
          ADD DUB
        </button>
      )}
    </section>
  )
}
