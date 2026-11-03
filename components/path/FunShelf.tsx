'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef } from 'react'
import { CRATES, entryRung, isLive, rungReached } from '@/content/roots'
import { vibeImage } from '@/content/vibe-images'
import type { ResolvedUnit } from '@/content/path'

/**
 * JUST FOR FUN — the vibes, back on the path (2026-11-03).
 *
 * Sam: "We've also lost learn how to swear I think?" He was right: folding the Vibes shelf
 * into the Path redirected /vibes home, and with it every vibe the path does not already
 * carry as a fun tile — swearing, flirting, Bowie, Pulp Fiction, the lot. They come back as
 * one row under the Shortcuts, each opening straight into a sitting (/vibes?open=…), so
 * there is still one place you go and the fun hangs off it.
 *
 * GATED AS THEY ALWAYS WERE. A vibe declares the stage it opens at (`opens_at`; swearing is
 * deliberately late — you should not be learning to swear before you can order). A locked
 * tile says which level of the path opens it, worked out from the rooms on this learner's
 * own path, rather than a stage number nobody can see.
 *
 * ORDER is the house's, not the catalogue's: the Basics are already the first level of the
 * path, so they are not offered twice, and Bond goes last (the content rule).
 */
const ORDER = [
  'portuguese_swearing',
  'flirting_f2m',
  'flirting_m2f',
  'bowie_golden_years',
  'duran_duran_lisboa',
  'bridget_jones',
  'pulp_fiction',
  'bobs_your_uncle',
  'audrey_hepburn',
  'marcus_aurelius',
  'world_of_wizardry',
  'top_gun',
  'james_bond',
]

export function FunShelf({ proof, units }: { proof: { pt: string; source: string; clean: boolean; rung?: number }[]; units: ResolvedUnit[] }) {
  const rung = rungReached(proof)
  const vibes = useMemo(() => {
    const now = new Date()
    const live = CRATES.filter((c) => !c.drop && c.built && c.id !== 'the_basics' && isLive(c, now))
    return live
      .sort((a, b) => (ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99))
      .map((c) => {
        const at = entryRung(c)
        /* The first level of this learner's path holding a room that lifts them to `at`. */
        const unit = units.find((u) => u.rooms.some((r) => (r.rung ?? 1) >= at - 1))
        return { c, open: at <= rung, level: unit?.n ?? null }
      })
  }, [rung, units])

  /* /club#fun (MORE VIBES in Yours): the page is drawn after mount, so scroll once it is. */
  const box = useRef<HTMLElement>(null)
  useEffect(() => {
    if (window.location.hash !== '#fun') return
    const t = window.setTimeout(() => box.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <section ref={box} className="flex scroll-mt-24 flex-col gap-3" data-testid="fun-shelf" id="fun">
      <div>
        <p className="eyebrow text-telha">Just for fun</p>
        <p className="text-sm text-muted">Songs, films, flirting and swearing — real Portuguese hiding inside things you already know.</p>
      </div>
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-1">
        {vibes.map(({ c, open, level }) => {
          const img = vibeImage(c.id as Parameters<typeof vibeImage>[0])
          const body = (
            <>
              <span className="relative block h-28 w-full overflow-hidden rounded-xl bg-surface">
                {img ? <Image src={img.src} alt={img.alt} fill sizes="180px" className={'object-cover ' + (open ? '' : 'opacity-50 grayscale')} /> : null}
                {!open ? (
                  <span className="eyebrow absolute left-2 top-2 rounded-full bg-[#0f1f33]/80 px-2 py-0.5 text-[0.55rem] text-white">
                    {level ? 'Opens at level ' + level : 'Opens later'}
                  </span>
                ) : null}
              </span>
              <span className="mt-2 block font-semibold leading-tight">{c.title}</span>
              <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{c.blurb}</span>
            </>
          )
          return open ? (
            <Link key={c.id} href={'/vibes?open=' + c.id} data-testid="fun-vibe" className="tap-target w-44 shrink-0 snap-start">
              {body}
            </Link>
          ) : (
            <div key={c.id} data-testid="fun-vibe-locked" className="w-44 shrink-0 snap-start" aria-disabled>
              {body}
            </div>
          )
        })}
      </div>
    </section>
  )
}
