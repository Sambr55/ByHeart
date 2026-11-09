'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { InboxDoor } from '@/components/InboxDoor'
import { PROFILE_COPY } from '@/content/profile-copy'
import { askToKeep, getAvatar, loadAvatar, setAvatarFromFile } from '@/engine/avatar'
import { setDisplayName } from '@/engine/learner'
import { useEntitlements } from '@/engine/useEntitlements'
import { useLearner } from '@/engine/useLearner'

/**
 * Who this is.
 *
 * A name and a face, because a profile with neither is a filing cabinet — and because
 * the next thing this screen has to be able to do is belong to somebody another person
 * could recognise.
 *
 * The photograph never leaves the phone. It lives in its own storage key rather than on
 * the learner, which is the thing that syncs; the name does sync, because a name is what
 * you would be called in a room and the whole point of having one is that somebody else
 * can read it.
 */
export function Identity({ controls = true }: { controls?: boolean } = {}) {
  const learner = useLearner()
  /* Whether this is saved anywhere but here — see PROFILE_COPY.account_out. */
  const access = useEntitlements()
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    /*
      The fast copy first, then whatever survived.

      getAvatar is synchronous so the photo is on screen in this render; loadAvatar then
      checks IndexedDB and puts it back if iOS evicted localStorage, which is what took
      Sam's picture away between one visit and the next. When nothing was evicted the
      second call resolves to the same string and setPhoto is a no-op.
    */
    setPhoto(getAvatar())
    void loadAvatar().then((p) => {
      if (p) setPhoto(p)
    })
    /* And ask to stop being evicted at all — this screen is the person's things. */
    void askToKeep()
  }, [])
  useEffect(() => {
    if (mounted) setName(learner.display_name ?? '')
  }, [mounted, learner.display_name])

  return (
    /*
      THE IDENTITY ROW, IN A CARD.

      This is the top of Yours and it is the one block on the screen that is about the
      person rather than about the Portuguese — a photograph, their name, whether any of
      it is saved anywhere, and the way to the settings. It was `flex items-center gap-3`
      on bare sand, which gave the avatar a border and the name an underline-less input
      and nothing at all to say the four things belonged together. Measured before this
      change: the only lifted element on /profile was the 64px avatar circle itself.

      The card is what makes the row a header. Everything below it on this screen is a
      grid of the learner's own cards, so the one thing above the boards wants an edge.
    */
    <section className="flex items-center gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
      {/*
        THE PHOTO WELL IS bg-surface, NOT bg-bg-elev, now that this row is a card.

        The well was lifted when its ground was sand, so an empty circle read as an object
        waiting for a picture. Inside the card that is the SAME colour as its parent, and
        an empty avatar became an invisible hole with a hairline round it. --surface is the
        inset token — L*87, below the ground on purpose — and is what the product uses for
        a field everywhere else. See the note on the three grounds in globals.css.
      */}
      <button
        type="button"
        data-testid="avatar"
        onClick={() => file.current?.click()}
        aria-label={photo ? 'Change your photo' : 'Add a photo'}
        className="tap-target relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-line bg-surface"
      >
        {photo ? (
          /* Not next/image: this is a data URI from the person's own camera roll, and the
             optimiser has nothing to do with it. */
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="eyebrow flex h-full w-full items-center justify-center text-[0.5rem] text-muted">
            {PROFILE_COPY.add_photo}
          </span>
        )}
      </button>
      <input
        ref={file}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          const next = await setAvatarFromFile(f)
          if (next) setPhoto(next)
        }}
      />

      <div className="min-w-0 flex-1">
        <p className="eyebrow text-muted">{PROFILE_COPY.eyebrow}</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setDisplayName(name.trim())}
          placeholder={PROFILE_COPY.name_hint}
          aria-label="Your name"
          data-testid="profile-name"
          className="display mt-1 w-full bg-transparent text-2xl text-fg outline-none placeholder:text-muted"
        />
        {/*
          WHETHER ANY OF THIS IS SAVED ANYWHERE BUT HERE.

          Sam: "How do I know if I am signed out when I am just looking at the home page?"
          He could not — signedIn was read in nine places and every one used it to hide a
          control, never to show the state. It decides whether a reset sticks and whether
          the work survives the phone, and it was invisible to the person it is about.

          Only once `access.known`, so it never says "not signed in" to somebody who is,
          in the moment before the server answers. Not a link: the cog two inches to the
          right already goes to Settings, and a second route to the same place on the same
          row is noise.
        */}
        {access.known ? (
          /*
            text-sm, not text-xs. The note above argues this state "was invisible to the
            person it is about" — and then set it at the smallest size on the screen. Not
            text-base: it is a fact ABOUT the name above it rather than content of its own,
            and matching the name's own body size would make the row read as two equal
            lines instead of a name with a note under it.
          */
          /*
            SIGNED OUT, IT IS A LINK. SIGNED IN, IT IS A FACT.

            Sam: "It says I am not logged in. How would I even have logged in? Where/when
            should that happen?"

            It was a <p> in accent blue — the colour every other surface here uses for
            something you can press — reporting a state with no way to change it. So the
            one screen a person opens to find out where they stand told them they were
            signed out and offered nothing.

            The five places that DO offer it are all moments inside a flow: the landing
            hero, the shelf, the sitting break, the save step, the session summary. That is
            the right design — nobody should meet a login wall to try a language app — and
            it leaves anybody who declined them, or never hit one, with nowhere to look.
            This is the place they look.

            `?next=` returns them here rather than to the vibes, because somebody who
            started from their own profile is not mid-sitting; sending them to a lesson
            would be the product deciding what they came for.

            Signed in it stays a <p>: the address is a fact about the account and there is
            nothing to do with it here — Settings owns signing out, which is a decision
            that deserves its own screen rather than a tap on a caption.
          */
          !access.signedIn ? (
            <Link
              href="/signin?next=%2Fprofile"
              data-testid="profile-account"
              className="mt-1 block text-sm leading-snug text-accent underline underline-offset-4"
            >
              {PROFILE_COPY.account_out}
            </Link>
          ) : (
            <p
              data-testid="profile-account"
              className="mt-1 truncate text-sm text-muted"
            >
              {access.email ? PROFILE_COPY.account_in(access.email) : 'Signed in'}
            </p>
          )
        ) : null}
      </div>

      {/*
        THE COG, top right, where every phone puts it.

        Yours had membership, the account, the feedback form and three app settings in the
        same column as the Portuguese somebody had earned — so the screen that says "here
        is what you built" was also the screen for cancelling a subscription. Sam: "Put
        everythiung that is not about Language... into a settings section accessible via a
        cog icon top right in YOURS."

        On the identity row rather than in a header bar of its own: this screen has no
        sticky bar, and a bar added to carry one control would push the Legend down the
        page — which is the one thing the ordering note above this component refuses.
      */}
      {/*
        AND THE INBOX BESIDE IT, on the one other screen somebody opens to find their things.

        Sam: "Add the same inbox to the top of the Yours page."

        The same component the Club's header uses — see components/InboxDoor.tsx, which it
        was extracted into for this. Copied, it would be two badges to keep in step about a
        count, a colour and a size, which is the shape of every drift this codebase has had
        to unpick; shared, a change to either surface lands on both.

        LEFT OF THE COG, because the cog is the last thing in a row by convention on every
        phone and the inbox is content rather than configuration. Both sit on the identity
        row rather than in a bar of their own, for the reason the cog's note already gives:
        this screen has no sticky bar, and adding one to carry two controls would push the
        Legend down the page.
      */}
      {controls ? (
        <>
          <InboxDoor />
      <Link
        href="/settings"
        data-testid="yours-settings"
        aria-label="Settings"
        className="tap-target -mr-2 flex shrink-0 items-center justify-center self-start p-2 text-muted transition hover:text-accent"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </Link>
        </>
      ) : null}
    </section>
  )
}


/**
 * THE LEGEND, AS THE HERO OF THIS SCREEN.
 *
 * Sam: "building your legend is the main purpose of all this… if a person practised their
 * Legend once a day they will be flying with Portuguese. Your UI has been quite basic and
 * recessive so far, it's time to punch it up a lot."
 *
 * It was a bordered row, fifth down the page, under saved cards and asked cards and words,
 * set at `text-base` — the same size as a saved card, which is to say the same size as
 * everything else on a screen of things. The spine of the product was a link.
 *
 * Three things make it the hero, in the order somebody uses them:
 *
 *   1. WHAT YOU HAVE, at pillar size. Not "5 of 7" — a possession, counted up, with no
 *      denominator anywhere. See profile-copy: a fraction caps at twelve and tells
 *      somebody they are finished, and Sam wants them to want thirty.
 *   2. PRACTICE, above the fold and above everything else, because that is the daily act
 *      the whole claim rests on. Both routes — out loud, and cold — were buried at the
 *      bottom of the Legend's own second screen and nothing on this page pointed at them.
 *   3. WHAT IS WAITING, from the same frameReady the unlock screen announces from, so a
 *      question announced at the end of a vibe is the question sitting here afterwards.
 *
 * It counts nothing that can go down and shows no percentage.
 */