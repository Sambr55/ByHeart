'use client'

import { useState } from 'react'
import type { BlockIntroScreen, InventoryScreen, MatchScreen } from '@/content/types'
import { BLOCK_AUDIO } from '@/content/targets'
import { slugFor } from '@/content/audio-manifest'
import { track } from '@/engine/analytics'
import { useSession } from '@/engine/session'
import { useExercise } from '@/engine/useExercise'
import { AudioButton } from '../AudioButton'
import { InventoryDrawer } from '../Inventory'
import { Continue, FeedbackNote } from '../MissionShell'
import { Prompt } from '../Prompt'

/**
 * The DISCOVER beat: the film phrase recedes and the reusable block is lifted out of
 * it. Tapping the block hears it and, where the screen banks it, adds the chip.
 */
export function BlockIntroView({ screen }: { screen: BlockIntroScreen }) {
  const { next, acquire } = useSession()
  const [tapped, setTapped] = useState<string[]>([])
  const allTapped = screen.blocks.every((b) => tapped.includes(b.id))
  const ready = screen.requireAllTaps ? allTapped : true

  return (
    <>
      <Prompt screen={screen} />

      {screen.phrase ? (
        <div className="mt-6 flex items-center gap-3">
          <AudioButton
            slug={slugFor(screen.phrase.pt)}
            text={screen.phrase.pt}
            screenId={screen.id}
          />
          <p className="pt text-3xl text-accent">{screen.phrase.pt}</p>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {screen.blocks.map((b) => {
          const isTapped = tapped.includes(b.id)
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                if (!isTapped) {
                  setTapped((t) => [...t, b.id])
                  track('block_intro', { block: b.id, screen: screen.id })
                }
              }}
              className={
                'tap-target flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition active:scale-[0.99] ' +
                (isTapped
                  ? 'border-accent bg-accent/10'
                  : 'border-line bg-surface hover:border-accent/50')
              }
            >
              <AudioButton
                slug={BLOCK_AUDIO[b.id]}
                text={b.pt}
                screenId={screen.id}
                size="sm"
              />
              <span>
                <span className="pt block text-2xl text-accent">{b.pt}</span>
                <span className="mt-1 block text-sm text-muted">{b.gloss}</span>
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-muted">{screen.tapPrompt}</p>

      {ready && (tapped.length > 0 || !screen.requireAllTaps) && screen.reveal ? (
        <FeedbackNote tone="correct">{screen.reveal}</FeedbackNote>
      ) : null}

      <Continue
        label={screen.cta}
        disabled={!ready}
        onClick={() => {
          if (screen.acquires) acquire(screen.acquires)
          next()
        }}
      />
    </>
  )
}

/** Two boosters, two moods. Match each phrase to the intention it serves. */
export function MatchView({ screen }: { screen: MatchScreen }) {
  const { next } = useSession()
  const { feedback, solved, submit } = useExercise(screen)
  const [pick, setPick] = useState<string | null>(null)

  const englishes = screen.pairs.map((p) => p.en)

  return (
    <>
      <Prompt screen={screen} />

      <div className="mt-6 space-y-4">
        {screen.pairs.map((p) => (
          <div key={p.blockId} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              <AudioButton
                slug={slugFor(p.pt)}
                text={p.pt}
                screenId={screen.id}
                size="sm"
              />
              <span className="pt text-2xl text-accent">{p.pt}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {englishes.map((en) => {
                const chosen = pick === p.blockId + en
                const right = solved && en === p.en
                return (
                  <button
                    key={en}
                    type="button"
                    disabled={solved}
                    onClick={() => {
                      setPick(p.blockId + en)
                      const correct = en === p.en
                      submit(
                        { correct, message: correct ? undefined : screen.swapFeedback },
                        { pair: p.blockId, chose: en },
                      )
                    }}
                    className={
                      'tap-target rounded-lg border px-3 py-3 text-sm transition ' +
                      (right
                        ? 'border-correct bg-correct/10'
                        : chosen
                          ? 'border-accent bg-accent/10'
                          : 'border-line bg-bg-elev hover:border-accent/50')
                    }
                  >
                    {en}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {feedback ? (
        <FeedbackNote tone={feedback.tone}>
          {feedback.text || screen.reveal}
        </FeedbackNote>
      ) : null}

      {solved ? <Continue onClick={next} /> : null}
    </>
  )
}

/** Your Portuguese. Accumulation made visible before it is tested. */
export function InventoryView({ screen }: { screen: InventoryScreen }) {
  const { next, state } = useSession()
  return (
    <div className="flex min-h-[55dvh] flex-col justify-center">
      <Prompt screen={screen} />
      <div className="mt-6">
        <InventoryDrawer blocks={state.inventory} />
      </div>
      {screen.caption ? (
        <p className="mt-5 text-sm text-muted">{screen.caption}</p>
      ) : null}
      {screen.reveal ? <FeedbackNote tone="correct">{screen.reveal}</FeedbackNote> : null}
      <Continue
        label={screen.cta}
        onClick={() => {
          track('inventory_view', { view: screen.view, blocks: state.inventory })
          next()
        }}
      />
    </div>
  )
}
