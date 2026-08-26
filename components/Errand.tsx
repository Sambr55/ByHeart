'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { Menu } from '@/components/Menu'
import { Wordmark } from '@/components/Wordmark'
import { slugFor } from '@/content/audio-manifest'
import { chapterById } from '@/content/chapters'
import type { Situation } from '@/content/situations'
import { recordProof } from '@/engine/learner'
import { track } from '@/engine/analytics'

/**
 * One Situation, end to end.
 *
 * This is the Club's answer to "I have to do a thing tomorrow" — a nervous person at
 * 11pm the night before, who would rather not do the whole exchange in English. Push
 * brings people back; this is the pull, and pull is why they stay.
 *
 * It runs on the shape the rest of the product already uses: read it, then have it taken
 * away and say it cold. Nothing here counts, and nothing congratulates — the only thing
 * it does is make being bad at this cost less.
 */
export function Errand({ situation }: { situation: Situation }) {
  const chapter = chapterById(situation.chapter)
  const [stage, setStage] = useState<'read' | 'cold' | 'done'>('read')

  return (
    <main
      data-stage="REAL WORLD"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 pb-10 pt-6 text-fg"
    >
      <header className="flex items-center gap-3">
        <Link href="/club" className="tap-target eyebrow flex shrink-0 items-center gap-1 text-accent">
          <span aria-hidden>←</span>
          <Wordmark mark="club" className="h-5" title="Back to the Club" />
        </Link>
        <span className="flex-1" />
        <Menu />
      </header>

      {stage === 'read' ? (
        <>
          {/*
            The room, before the language for it.

            This is the evidence register rather than the front door's: an ordinary
            pharmacy on an ordinary afternoon, not a sunset. It is doing a different job
            too — the door makes you want to go, and this makes the place recognisable
            before you are standing in it, which is most of what being nervous is about.

            16:9 and short on purpose. It sets the scene and then gets out of the way,
            because the lines underneath are what somebody actually came for.
          */}
          {situation.image ? (
            <div className="relative -mx-5 aspect-[16/9] overflow-hidden">
              <Image
                src={situation.image.src}
                alt={situation.image.alt}
                fill
                sizes="(max-width: 448px) 100vw, 448px"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <p className="eyebrow text-muted">{chapter.city.toUpperCase()}</p>
            <h1 className="display text-balance text-3xl">{situation.title}</h1>
            <p className="text-sm leading-relaxed text-muted">{situation.why}</p>
          </div>

          {/*
            Ordered by the encounter, not by difficulty. The sequence IS the teaching:
            somebody rehearsing this is walking through the door in their head.
          */}
          <ol className="flex flex-col gap-3">
            {situation.lines.map((l) => (
              <li key={l.pt} className="flex flex-col gap-1 rounded border border-line bg-bg-elev px-4 py-3">
                <div className="flex items-center gap-3">
                  <AudioButton slug={slugFor(l.pt)} text={l.pt} size="sm" />
                  <p className="pt min-w-0 text-lg text-accent">{l.pt}</p>
                </div>
                <p className="text-sm text-fg/80">{l.en}</p>
                <p className="text-xs leading-relaxed text-muted">{l.when}</p>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => {
              setStage('cold')
              track('errand_cold', { id: situation.id })
            }}
            className="tap-target eyebrow mt-auto w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            TAKE IT AWAY
          </button>
        </>
      ) : null}

      {stage === 'cold' ? (
        <div className="flex flex-1 flex-col justify-center gap-6">
          {/* Nothing on screen to copy from. That is the entire mechanism. */}
          <p className="eyebrow text-muted">SAY IT</p>
          <p className="t-ask display text-balance text-2xl">{situation.release.ask}</p>
          <button
            type="button"
            onClick={() => setStage('done')}
            className="tap-target eyebrow w-full rounded border border-line-strong px-5 py-3 text-center"
          >
            SHOW ME
          </button>
        </div>
      ) : null}

      {stage === 'done' ? (
        <div className="flex flex-1 flex-col justify-center gap-6">
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-muted">SAY IT</p>
            <p className="text-sm text-muted">{situation.release.ask}</p>
            <div className="flex items-center gap-3">
              <AudioButton slug={slugFor(situation.release.answer)} text={situation.release.answer} />
              <p className="pt text-balance text-2xl text-accent">{situation.release.answer}</p>
            </div>
          </div>
          {/*
            Two buttons and neither of them is a score. "Got it" records proof, which is
            the only thing DUB has ever counted; "not yet" costs nothing and says so,
            because a tool you can fail in front of is the whole point of the Club.
          */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                recordProof({
                  pt: situation.release.answer,
                  en: situation.release.ask,
                  source: 'release',
                  clean: true,
                })
                track('errand_done', { id: situation.id, clean: true })
                window.location.assign('/club')
              }}
              className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
            >
              I SAID IT
            </button>
            <button
              type="button"
              onClick={() => {
                track('errand_done', { id: situation.id, clean: false })
                setStage('read')
              }}
              className="tap-target eyebrow w-full rounded border border-line px-5 py-3 text-center text-muted"
            >
              SHOW ME AGAIN
            </button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
