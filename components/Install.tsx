'use client'

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

/**
 * Which install this device can do, and whether it has already been done.
 *
 * Sam: "it needs to be the very first thing someone sees so they dont go down the safari
 * route." He is right about the failure — somebody who starts in a Safari tab stays in a
 * Safari tab, and everything they do that afternoon is in a window they will close.
 *
 * Exported so the landing hero can offer the install in its own voice without a second copy
 * of this detection. The panel below and the line on the front door are two surfaces for one
 * fact, and a device that is already installed must disappear from both — which is exactly
 * the kind of agreement that breaks when two components each decide for themselves.
 *
 * 'none' means installed, dismissed, or a desktop browser with nothing to offer.
 */
export function useInstallable(): 'none' | 'ios' | 'android' {
  const [how, setHow] = useState<'none' | 'ios' | 'android'>('none')
  useEffect(() => {
    if (typeof window === 'undefined') return
    const installed =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true
    if (installed) return
    const ua = navigator.userAgent
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document)
    if (isIOS) {
      setHow('ios')
      return
    }
    const onPrompt = () => setHow('android')
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])
  return how
}

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
  /*
    WHAT IS ACTUALLY AT RISK, which is less than this used to claim.

    Sam: "fix the install-then-empty thing so I can tell people to install it."

    The fear was right and the diagnosis was half wrong. An installed app does get its own
    localStorage — that part is true of every phone. But the DEVICE COOKIE is shared between
    Safari and the installed app on iOS, it is httpOnly and lasts two years, and the server
    keeps a learner row keyed to it. restoreLearner() merges that row back down, and it fires
    on `/` (start_url, via JourneyProvider) and on `/vibes`. So the installed app is not
    empty: it is a cold cache that refills on first load.

    Traced rather than assumed — engine/journey.tsx fires restoreLearner in the provider both
    pages mount, and lib/auth.ts mints the cookie in /api/session.

    WHAT WAS GENUINELY BROKEN was upstream of all of it: components/SetUp.tsx never called
    syncSession, so somebody who finished set-up and installed immediately had nothing ON the
    server to restore. Fixed separately; that is the commit that makes this safe to recommend.

    SO THE WARNING NARROWS. It is no longer "it will open empty" — that is now false and
    scares people off a thing they should do. It fires only where recovery genuinely cannot
    happen: a browser blocking cookies, which is the one case the server cannot identify
    somebody across.

    `signInReady` is gone from the condition. It gated the warning on an email provider being
    configured, which it is not in production — so the warning never rendered at all, and the
    SAVE IT FIRST button it offered pointed at a sign-in that cannot send anything.
  */
  const noCookies = typeof navigator !== 'undefined' && navigator.cookieEnabled === false
  const atRisk =
    access.known &&
    noCookies &&
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
      <p className="text-base leading-relaxed text-fg">
        It gets its own icon, loses the browser bar so nothing shifts under your thumb, and
        it is the only way to switch on the morning line.
      </p>
      {/*
        AND IT SAYS THE WORK COMES WITH IT, because the first thing anybody fears about
        installing a web app is losing what they have done — and until tonight they were
        right to. See the note on `atRisk` above for why they no longer are.
      */}
      <p className="text-sm leading-relaxed text-muted">
        Everything you have done comes with it.
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
            This browser has cookies switched off, so the app would not recognise you and
            would open empty. Turn them on for this site first, or keep using it here.
          </p>
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
