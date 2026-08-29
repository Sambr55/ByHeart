'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * The handful of things a browser does not do for you and an app is expected to.
 *
 * All root-mounted, all listeners, none of them rendering anything. They are together in
 * one file because they are one idea — the difference between a page and an app is mostly
 * a dozen small accommodations to the fact that this is a phone — and separately commented
 * because they share nothing else.
 */
/** The header blue, and the colour the phone's own bar sits at unless a screen says otherwise. */
export const BAR = '#1f5d8c'

export function Native() {
  useKeyboard()
  useReady()
  useScrollMemory()
  useStatusBarDefault()
  return null
}

/**
 * One theme-color tag, always present, with a value we control.
 *
 * The manifest declares two media-scoped ones and nothing else, so before a screen
 * overrides it there is no un-media'd tag at all — which means "what colour is the status
 * bar right now" has no answer that can be read, only inferred. An explicit default makes
 * the current colour a fact rather than a deduction, and gives StatusBar something
 * definite to restore rather than an absence to recreate.
 */
function useStatusBarDefault() {
  useEffect(() => {
    if (document.querySelector('meta[name="theme-color"]:not([media])')) return
    const tag = document.createElement('meta')
    tag.setAttribute('name', 'theme-color')
    tag.setAttribute('content', BAR)
    document.head.appendChild(tag)
  }, [])
}

/**
 * How much of the screen the keyboard is eating, written where CSS can read it.
 *
 * A fixed element is positioned against the LAYOUT viewport, and the layout viewport does
 * not shrink when the keyboard opens — so a docked button stays exactly where it was and
 * the keyboard is drawn on top of it. The translator is the sharpest case: you type the
 * sentence you need and the button that translates it is under the keys you typed with.
 *
 * visualViewport is the only API that knows. The number it yields is the difference
 * between the two viewports minus however far the page has been scrolled within the visual
 * one, which is zero on a desktop and zero on any screen with no field.
 */
function useKeyboard() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const root = document.documentElement
    const measure = () => {
      const eaten = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      /*
        A floor of 120px before this counts as a keyboard.

        Safari's URL bar collapsing also shrinks the visual viewport, by 60-90px, and
        treating that as a keyboard would lift the dock every time somebody scrolled. No
        keyboard on any phone is under 200px tall.
      */
      const keyboard = eaten > 120 ? eaten : 0
      root.style.setProperty('--keyboard', keyboard + 'px')
      if (keyboard) root.setAttribute('data-keyboard', 'on')
      else root.removeAttribute('data-keyboard')
    }

    measure()
    vv.addEventListener('resize', measure)
    vv.addEventListener('scroll', measure)
    return () => {
      vv.removeEventListener('resize', measure)
      vv.removeEventListener('scroll', measure)
      document.documentElement.removeAttribute('data-keyboard')
      document.documentElement.style.removeProperty('--keyboard')
    }
  }, [])
}

/**
 * "The browser has read what this learner has done."
 *
 * Everything that depends on the learner was guessing until this point, and the guesses
 * were visible: the shelf drew eleven open vibes and locked eight of them a frame later,
 * the header drew "0 kept" and then the real number. A guess that corrects itself in front
 * of somebody reads as the product changing its mind about them.
 *
 * Set once, on the flag rather than in it, so a single attribute on the root element
 * governs every dependent thing on every screen — see .needs-learner in globals.css.
 * Deliberately NOT gated on the learner having anything: an empty device is an answer too,
 * and waiting for content that will never arrive would leave those parts invisible.
 */
function useReady() {
  useEffect(() => {
    document.documentElement.setAttribute('data-ready', 'on')
  }, [])
}

/**
 * Where you were on a tab when you left it.
 *
 * Leave YOURS half way down, go to LISBON, come back, and the router hands you the top of
 * the page — because moving between tabs is a fresh navigation and the browser only
 * restores position on back and forward. Apps do not lose your place when you look at
 * something else.
 *
 * sessionStorage rather than local: a position is about this visit, and coming back
 * tomorrow to a screen scrolled half way down with no memory of why is worse than the top.
 */
function useScrollMemory() {
  const path = usePathname()

  useEffect(() => {
    const key = 'byheart.scroll:' + path
    let saved = 0
    try {
      saved = Number(sessionStorage.getItem(key) ?? 0)
    } catch {
      /* Private mode. The top of the page is a fine place to be. */
    }

    /*
      Restored after paint, not on mount.

      Most of these screens draw their content from localStorage in an effect, so at mount
      the page is short and the scroll is clamped to whatever fits. Two frames is enough
      for the real height to exist; anything longer and somebody sees the top first.
    */
    if (saved > 0) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (document.body.scrollHeight > window.innerHeight + saved / 2) {
            window.scrollTo(0, saved)
          }
        }),
      )
    }

    /*
      A jump to the top is not somebody scrolling to the top.

      The router resets the scroll when a route changes, and that reset fires a scroll
      event on the page being LEFT — so the position was faithfully recorded as 0 a moment
      before the effect that was watching it was torn down. The feature recorded a perfect
      memory of the wrong number, every time, and looked correct in the source.

      The two are distinguishable by what came before. A person scrolling to the top passes
      through everything on the way — 400, 340, 210, 80, 0 — so the sample before the zero
      is small. A programmatic reset goes from 403 to 0 with nothing in between. So a zero
      that arrives from more than a couple of hundred pixels away is the router, and is not
      what this learner did.
    */
    let prev = saved
    const remember = () => {
      const y = window.scrollY
      const jumped = y === 0 && prev > 200
      prev = y
      if (jumped) return
      try {
        sessionStorage.setItem(key, String(y))
      } catch {
        /* Nothing to do, and nothing worth saying. */
      }
    }
    window.addEventListener('scroll', remember, { passive: true })
    return () => {
      // The listener goes FIRST. Calling remember() here would read the position after the
      // router has already moved it, which is the bug this whole comment is about.
      window.removeEventListener('scroll', remember)
    }
  }, [path])
}

/**
 * One screen arriving after another, rather than replacing it.
 *
 * Returns a ref. Put it on the thing that changes, pass a token that changes with it, and
 * the element plays a 120ms rise every time the token does.
 *
 * By restarting an animation rather than remounting, which is the only reason this is a
 * hook and not a key prop: remounting a beat would throw away the tiles somebody has
 * already placed on it and the answer they have half built. The element stays; only its
 * animation restarts, and the reflow between removing and re-adding the class is what
 * forces the browser to treat it as a new one rather than a no-op.
 */
export function useScreenIn(token: string | number) {
  const ref = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    /*
      Not on the first paint.

      The screen somebody navigates to has already arrived by the time React runs an
      effect, so animating it there plays the transition after the fact — a flicker on
      arrival rather than a movement into place.
    */
    if (first.current) {
      first.current = false
      return
    }
    el.classList.remove('screen-in')
    void el.offsetWidth
    el.classList.add('screen-in')
  }, [token])
  return ref
}

/**
 * The colour of the phone's own status bar, for the screen underneath it.
 *
 * theme_color is one value in the manifest, and DUB has two grounds: the blue bar on most
 * screens, and the near-black of the full-bleed takeovers — the vibe pictures and the feed
 * cards. On those the phone drew a blue strip above a black photograph, which is the one
 * place the seam between app and operating system shows.
 *
 * Restores on unmount rather than setting the default, so two of these overlapping cannot
 * leave the wrong colour behind.
 */
export function StatusBar({ color }: { color: string }) {
  useEffect(() => {
    const tag =
      document.querySelector('meta[name="theme-color"]:not([media])') ??
      (() => {
        const made = document.createElement('meta')
        made.setAttribute('name', 'theme-color')
        document.head.appendChild(made)
        return made
      })()
    const before = tag.getAttribute('content') ?? BAR
    tag.setAttribute('content', color)
    // Restored to a colour rather than to an absence, so leaving a dark screen puts the
    // blue back rather than falling through to whatever the manifest happens to say.
    return () => tag.setAttribute('content', before)
  }, [color])
  return null
}
