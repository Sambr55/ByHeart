'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * The action bar, outside the thing that scrolls.
 *
 * The dock used to be the last element in the content column, sticky, so a screen taller
 * than the phone scrolled its own words up behind it. That is the ordinary web answer and
 * it is wrong in an app: on the session summary — the screen with the most to read on it —
 * three lines of what you just did slid under an opaque blue button and stayed there.
 * Sticky, fixed and a bigger bottom padding all fail the same way, because they are all
 * answers to "where does the button sit" when the question is "what is allowed to scroll".
 *
 * So the page becomes what it always claimed to be: a frame the height of the screen, with
 * exactly one region inside it that scrolls, and the dock BELOW that region rather than on
 * top of it. Nothing can pass behind a button that is not over anything.
 *
 * Portalled rather than moved by hand, so every call site stays where it reads best — the
 * button is written next to the words that earned it, in the component that owns both, and
 * lands outside the scroller at render time. A screen with no slot keeps the old sticky
 * behaviour rather than losing its button, which matters for the full-bleed cards that run
 * their own layout.
 */
const Slot = createContext<HTMLElement | null>(null)

/** The room the dock lands in. Rendered by a shell, after its scrolling region. */
export function DockSlot() {
  const el = useContext(SlotSetter)
  const [h, setH] = useState(0)
  const node = useRef<HTMLDivElement | null>(null)
  /*
    THE SLOT IS FIXED TO THE GLASS, SO THE FLOW GETS ITS HEIGHT BACK.

    The dock is positioned against the viewport rather than against .app-frame — the frame
    is 100dvh, which means different things in Safari and in the installed PWA, while the
    nav is fixed to the glass and means the same in both. That is what finally put the
    button --dock-gap above the bar in BOTH, after four reports.

    A fixed element is out of the flow, though, and this file exists because of what that
    costs: content scrolling behind the one thing you can press. Measured after the
    change, 42px of the last paragraph sat under the button.

    So the slot leaves a spacer of exactly its own measured height. Measured rather than
    guessed, because a dock is one button on most screens and two plus a line of copy on
    others, and a constant would be a copy of a height that goes stale — the fault this
    codebase keeps finding.
  */
  useEffect(() => {
    const el2 = node.current
    if (!el2) return
    const ro = new ResizeObserver(() => setH(el2.getBoundingClientRect().height))
    ro.observe(el2)
    setH(el2.getBoundingClientRect().height)
    return () => ro.disconnect()
  }, [])
  return (
    <>
      {/* The room the dock would have taken, so nothing scrolls behind it. */}
      <div aria-hidden className="shrink-0" style={{ height: h }} />
      <div
        ref={(n) => {
          node.current = n
          el?.(n)
        }}
        className="dock-slot"
      />
    </>
  )
}

const SlotSetter = createContext<((node: HTMLDivElement | null) => void) | null>(null)

/**
 * A page frame: the height of the screen, one scrolling region, and a dock under it.
 *
 * Children are the scrolling part. The dock arrives by portal from wherever inside them it
 * was written.
 */
export function Framed({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null)
  return (
    <SlotSetter.Provider value={setSlot}>
      <Slot.Provider value={slot}>
        {/*
          The scrolling region IS the page's main landmark.

          It was a plain div for one commit and that quietly removed <main> from every
          screen the shells own — the landmark screen readers use to skip the header, and
          the element half the checks in this repo locate a page by. A structural change
          that also deletes a landmark is two changes, and only one of them was intended.
        */}
        <main className={'app-scroll ' + className}>{children}</main>
        <DockSlot />
      </Slot.Provider>
    </SlotSetter.Provider>
  )
}

export function Dock({ children }: { children: ReactNode }) {
  const slot = useContext(Slot)
  const [ready, setReady] = useState(false)
  /*
    One frame late, on purpose.

    The slot is a sibling that mounts in the same commit, so on the very first render there
    is no node to portal into yet. Rendering inline for that frame and then moving would be
    a visible jump; rendering nothing until the slot exists costs one frame and nobody sees
    it. A screen with no slot at all never becomes ready and falls through to inline, which
    is the intended fallback rather than an accident.
  */
  useEffect(() => setReady(true), [])

  const bar = (
    <div data-testid="dock" className="dock flex flex-col gap-3">
      {children}
    </div>
  )

  if (slot) return createPortal(bar, slot)
  if (!ready) return null
  return bar
}
