'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { track } from '@/engine/analytics'
import { useEntitlements } from '@/engine/useEntitlements'
import { useLearner } from '@/engine/useLearner'

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
  const access = useEntitlements()
  const learner = useLearner()

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

  /*
    Work on this device, and nowhere else yet. `signInReady` because where accounts are
    not configured there is no link to send, so the offer could not be honoured.
  */
  const atRisk =
    access.known &&
    access.signInReady &&
    !access.signedIn &&
    ((learner.roots_played ?? []).length > 0 ||
      (learner.legend ?? []).length > 0 ||
      (learner.proof ?? []).length > 0)

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
      {/*
        AND THE ONE THING THAT GOES WRONG IF THEY DO IT NOW.

        An installed app gets its OWN storage, separate from the browser's — that is how
        every phone works, and it means the app somebody adds to their home screen opens
        EMPTY. Not "missing a setting": no vibes played, no Legend, no words. The learner
        has to do it all again, or keep two half-products and never know why.

        Sam, having hit it himself: "is it correct or a problem that a downloaded version
        of the site becomes completely different instances?" Correct, and a problem — the
        design assumes a device is a person, and one person is now two devices.

        The link is what joins them. It is the same email sign-in the end-of-sitting offer
        uses, and this is the better moment to make it: here the work is still there, and
        one tap from now it is not.

        Only when there IS something to lose and it is not already saved. Somebody signed
        in has nothing to warn about, and a fresh device with nothing on it is not being
        asked to protect an empty record.
      */}
      {atRisk ? (
        <div className="flex flex-col gap-3 rounded border border-accent bg-accent/5 px-4 py-3">
          <p className="text-sm leading-relaxed text-fg">
            The app gets its own storage, so it will open empty — everything you have done
            so far stays in this browser.
          </p>
          <Link
            href="/signin?next=%2Fvibes"
            data-testid="install-save-first"
            onClick={() => track('install_save_first', { how })}
            className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            SAVE IT FIRST
          </Link>
        </div>
      ) : null}
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
