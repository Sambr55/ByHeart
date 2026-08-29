'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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
  return <div ref={el} className="dock-slot" />
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
