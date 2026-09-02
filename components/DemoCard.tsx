'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { EXPLAINER_CTA } from '@/content/explainers'
import { DEMO_BEATS } from '@/content/front-door'
import { track } from '@/engine/analytics'
import { slugFor } from '@/content/audio-manifest'

/**
 * The Goose demo, playable on the front of the first card in the Club.
 *
 * WHY IT MOVED HERE. It lived in the intro corridor — landing, welcome, how-in, two demo
 * beats, the way, set-up, picker — and then the front door's COME IN button started going
 * straight to /club, which bypasses every one of those. So the single strongest thing in
 * the product became unreachable for a new person, and what stood in its place was a card
 * DESCRIBING the demo with the Goose line hidden behind a swipe. That is why it looked like
 * "only one Goose screen": it was not the demo half-broken, it was an advert for it.
 *
 * WHY ON THE FACE RATHER THAN BEHIND THE SWIPE. Every other card in the feed tells you
 * something and offers to show you more sideways. This one has to be DONE, not read, and
 * asking somebody to discover a gesture before the product has earned anything is the
 * order the whole restructure exists to reverse. Straight in, and it plays.
 *
 * WHAT IT IS CAREFUL ABOUT. The claim is recognition — you already understand this — so the
 * English line comes first and the Portuguese is a reveal rather than a lesson. Nothing is
 * marked as learned and no proof is recorded: this is sixty seconds with no account, and
 * quietly writing to somebody's record before they have agreed to anything would be taking
 * something in exchange for a demonstration that is supposed to be free.
 */
export function DemoCard() {
  const [beat, setBeat] = useState(0)
  /*
    Found by key, not by position, and every optional field is guarded.

    DEMO_BEATS is content: a beat can be reordered or lose a field without this file being
    touched, and destructuring by position would then silently render the wrong one. The
    demo is the first thing a stranger sees, so it fails to nothing rather than to a
    half-drawn screen.
  */
  const recognise = DEMO_BEATS.find((b) => b.key === 'recognise')
  const build = DEMO_BEATS.find((b) => b.key === 'build')
  if (!recognise?.translation || !recognise.takeaway) return null

  return (
    <div className="mt-6 flex flex-col gap-3">
      {beat === 0 ? (
        <>
          <p className="text-sm leading-relaxed text-white/80">{recognise.lead}</p>
          <p className="display text-balance text-3xl">{recognise.display}</p>
          <p className="text-sm text-white/70">{recognise.gloss}</p>
          <button
            type="button"
            data-testid="demo-reveal"
            onClick={() => {
              track('demo_played', { beat: 'recognise' })
              setBeat(1)
            }}
            className="tap-target eyebrow mt-3 w-full rounded bg-[#1f5d8c] px-5 py-3 text-center text-white"
          >
            {recognise.cta}
          </button>
        </>
      ) : null}

      {beat === 1 ? (
        <>
          {/*
            The line, then what it gave you. In that order and not the other way round.

            Being told "comigo means with me" is a flashcard. Recognising a sentence you
            have known for forty years and THEN being shown you have kept a word out of it
            is the entire argument, and the order is what makes it one.
          */}
          <div className="flex items-center gap-3">
            <AudioButton slug={slugFor(recognise.translation.pt)} text={recognise.translation.pt} />
            <p className="pt display min-w-0 text-balance text-3xl">{recognise.translation.pt}</p>
          </div>
          <p className="text-sm text-white/80">{recognise.translation.en}</p>
          <div className="border-t border-white/25 pt-6">
            <p className="display text-2xl text-white">{recognise.takeaway.display}</p>
            <p className="mt-1 text-sm leading-relaxed text-white/80">{recognise.takeaway.gloss}</p>
          </div>
          <button
            type="button"
            data-testid="demo-build"
            onClick={() => {
              track('demo_played', { beat: 'build' })
              setBeat(2)
            }}
            className="tap-target eyebrow mt-3 w-full rounded bg-[#1f5d8c] px-5 py-3 text-center text-white"
          >
            {build?.cta ?? 'SHOW ME'}
          </button>
        </>
      ) : null}

      {beat === 2 && build?.branches ? (
        /*
          The second beat, which a new person has not seen since COME IN started skipping
          the corridor — and it is the half that turns a party trick into a product. One
          word out of one film line, in three sentences they can now say.
        */
        <>
          <p className="display text-balance text-2xl">{build.display}</p>
          <ul className="flex flex-col gap-3">
            {build.branches.map((b) => (
              <li key={b.pt} className="flex items-center gap-3">
                <AudioButton slug={slugFor(b.pt)} text={b.pt} />
                <span className="min-w-0">
                  <span className="pt display block text-xl">{b.pt}</span>
                  <span className="block text-sm text-white/75">{b.en}</span>
                </span>
              </li>
            ))}
          </ul>
          {/*
            The way on, which the last beat did not have.

            It ended on three sentences and nothing else — so the strongest moment in the
            product, the one where somebody has just watched a film line turn into three
            things they can say, offered them no way to act on it. Reported from a phone as
            "no way forward from this one", and it is the worst possible place for a dead
            end: the exact instant the argument lands.

            The shared call to action rather than a new one. Every explainer points here, so
            somebody sold by the demo and somebody sold by the Drop arrive at the same
            place, which is what makes this a funnel rather than a menu.
          */}
          <Link
            href="/vibes"
            data-testid="demo-go"
            className="tap-target eyebrow mt-3 block w-full rounded bg-[#1f5d8c] px-5 py-3 text-center text-white"
          >
            {EXPLAINER_CTA}
          </Link>
        </>
      ) : null}
    </div>
  )
}
