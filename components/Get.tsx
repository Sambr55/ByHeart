'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BRAND } from '@/content/brand'
import { LANDING } from '@/content/front-door'
import { Wordmark } from '@/components/Wordmark'
import { useInstallable } from '@/components/Install'

/**
 * The page a QR code points at, whose only job is to get DUB onto a home screen.
 *
 * Sam: "I was hoping to put it even pre-home page so then it's just a straight click."
 *
 * THE STRAIGHT CLICK IS NOT AVAILABLE ON IOS, and that is a platform fact rather than a gap
 * here. Apple exposes no way to open the Share sheet or trigger an install from a page —
 * `beforeinstallprompt` is Chrome and Android only, and Next's own PWA guide says so in as
 * many words: "does not work on Safari iOS". A tappable control that did nothing would be a
 * lie in the first second of somebody's first visit, which is worse than an instruction.
 *
 * WHAT IS BUILDABLE IS THE REST OF THE IDEA, and it is the better half. A screen BEFORE the
 * front door, with one instruction on it and no way to wander off, is the difference between
 * somebody reading "add this to your home screen" on the way past and somebody doing it. The
 * front door still carries its own line for anybody who arrives at / directly; this is the
 * page a printed QR code points at, where installing is the only thing on offer.
 *
 * IT CANNOT TRAP ANYBODY. `start_url` is '/', so an installed DUB opens on the real front
 * door and never comes back here — and the link at the bottom is a genuine way past for
 * somebody on a desktop, somebody who has already installed it, or somebody who simply does
 * not want to. A screen whose only exit is an instruction you cannot follow is a wall.
 */
export function Get() {
  const how = useInstallable()
  /*
    Decided after mount, like every platform read in this product: the server has no user
    agent worth trusting and branching on one during render is the hydration mismatch this
    codebase has paid for more than once.
  */
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  return (
    <main
      data-stage="LANDING"
      className="relative flex min-h-svh w-full flex-col justify-end overflow-hidden on-dark"
    >
      <Image
        src="/hero/lisbon.jpg"
        alt={LANDING.hero_alt}
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      {/*
        The same scrim the front door uses, and for the same reason: white type on a
        photograph needs a ground under it that the photograph cannot take away.
      */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[78%] bg-gradient-to-t from-black/92 via-black/72 to-transparent"
      />

      <div className="relative flex flex-col items-center gap-6 px-5 pb-10 text-center">
        <Wordmark className="h-10 text-white" />
        {/*
          WHITE, SAID OUT LOUD, because `on-dark` did not reach it.

          The front door's strapline inherits white from its own wrapper; here the class was
          on <main> and the text took the page's dark ink against a sunlit photograph —
          photographed at 390x844 and barely legible, which is the same class of fault as the
          credit line on the vibe pane and the headline on /signin.

          Named on the element rather than trusted to a cascade, which is the lesson those
          two taught: a colour that depends on where a thing happens to sit is a colour that
          breaks the first time it moves.
        */}
        <p className="display text-balance text-3xl leading-tight text-white">
          {BRAND.strapline}
        </p>

        {/*
          THE INSTRUCTION, AT THE SIZE OF THE THING IT IS ASKING FOR.

          On the front door this is a quiet line under the CTA, because there the CTA is the
          point. Here it IS the point, so it takes the weight — the panel, the drawn glyph
          and the two bolded words that name what to look for.

          Only once it is known which phone this is. Rendering the iOS instruction to an
          Android visitor would be worse than rendering nothing, and the gap is one frame.
        */}
        {!ready ? null : how === 'ios' ? (
          <div
            data-testid="get-ios"
            className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-white/30 bg-black/55 px-5 py-6 backdrop-blur-sm"
          >
            <p className="eyebrow text-white/80">TWO TAPS</p>
            <p className="flex items-center justify-center gap-3 text-base leading-relaxed text-white">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 15V4" />
                <path d="m8 8 4-4 4 4" />
                <path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
              </svg>
              <span>
                Tap <span className="font-semibold">Share</span> at the bottom, then{' '}
                <span className="font-semibold">Add to Home Screen</span>.
              </span>
            </p>
            {/*
              WHY, IN ONE LINE. Somebody being asked for two taps before they have seen
              anything deserves a reason, and the reason is true: a tab is a thing you close.
            */}
            <p className="text-sm leading-relaxed text-white/80">
              It gets its own icon, opens without the browser round it, and is still there
              tomorrow.
            </p>
          </div>
        ) : (
          /*
            ANDROID AND DESKTOP GET THE DOOR, because there is nothing to instruct.

            Chrome offers its own install when the criteria are met and Install redeems it
            one screen in; a desktop visitor has nothing to add to a home screen at all. For
            both, this page has no job, so it does not pretend to have one.
          */
          <Link
            href="/"
            data-testid="get-in"
            className="tap-target eyebrow w-full max-w-sm rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            {LANDING.cta}
          </Link>
        )}

        {/*
          AND A WAY PAST, which is what stops this being a wall.

          Somebody who has already installed DUB, or who does not want to, or who is on a
          laptop, must be able to get in. Quiet rather than absent: the instruction above is
          the thing to do and this is the thing to do instead.
        */}
        {ready && how === 'ios' ? (
          <Link
            href="/"
            data-testid="get-skip"
            className="text-sm text-white/80 underline underline-offset-4"
          >
            Or carry on in the browser
          </Link>
        ) : null}
      </div>
    </main>
  )
}
