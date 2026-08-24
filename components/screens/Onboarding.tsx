'use client'

import { useState } from 'react'
import type {
  BriefingScreen,
  CultureSelectScreen,
  FamiliarityScreen,
  PromiseScreen,
} from '@/content/types'
import { track } from '@/engine/analytics'
import { primeAudio } from '@/engine/audio'
import { useSession } from '@/engine/session'
import { setFamiliarity } from '@/engine/learner'
import { Continue, FeedbackNote } from '../MissionShell'
import { Prompt } from '../Prompt'

export function PromiseView({ screen }: { screen: PromiseScreen }) {
  const { next } = useSession()
  return (
    <div className="flex min-h-[60dvh] flex-col justify-center">
      <p className="eyebrow text-accent">{screen.wordmark}</p>
      <h1 className="display mt-6 text-balance text-4xl sm:text-5xl">
        {screen.headline}
      </h1>
      <p className="mt-4 text-sm text-muted">{screen.sub}</p>
      <Continue
        label={screen.cta}
        onClick={() => {
          primeAudio()
          track('landing_cta_tap', { screen: screen.id })
          next()
        }}
      />
    </div>
  )
}

export function CultureSelectView({ screen }: { screen: CultureSelectScreen }) {
  const { next } = useSession()
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <>
      <Prompt screen={screen} />
      <div className="mt-6 space-y-3">
        {screen.cards.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={!c.active}
            aria-pressed={picked === c.id}
            onClick={() => setPicked(c.id)}
            className={
              'tap-target flex w-full items-center justify-between rounded border px-4 py-5 text-left transition ' +
              (c.active
                ? picked === c.id
                  ? 'border-accent bg-accent/10'
                  : 'border-line bg-surface hover:border-accent/50'
                : 'border-line/60 bg-bg-elev opacity-45')
            }
          >
            <span>
              <span className="display block text-xl">{c.title}</span>
              <span className="mt-1 block text-xs text-muted">{c.meta}</span>
            </span>
            {c.active && picked === c.id ? (
              <span aria-hidden="true" className="text-accent">
                ✓
              </span>
            ) : null}
          </button>
        ))}
      </div>
      {screen.unbuiltNote ? (
        <p className="mt-3 text-xs text-muted">{screen.unbuiltNote}</p>
      ) : null}
      <Continue
        label={screen.cta}
        disabled={!picked}
        onClick={() => {
          track('culture_selected', { culture: picked })
          next()
        }}
      />
    </>
  )
}

const FAMILIARITY_SCALE: Record<string, number> = { high: 5, medium: 3, low: 1 }

export function FamiliarityView({ screen }: { screen: FamiliarityScreen }) {
  const { next, answer, mission } = useSession()
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <>
      <Prompt screen={screen} />
      <div className="mt-6 space-y-3">
        {screen.options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              setPicked(o.id)
              answer('familiarity', o.id)
              // Store on a 1–5 scale so Mission 01's three bands and Mission 02's
              // five-point scale live in one comparable covariate.
              setFamiliarity(mission.property_id, FAMILIARITY_SCALE[o.id])
              track('top_gun_familiarity', { familiarity: o.id })
            }}
            className={
              'tap-target eyebrow w-full rounded border px-4 py-5 text-left transition ' +
              (picked === o.id
                ? 'border-accent bg-accent/10 text-fg'
                : 'border-line bg-surface text-fg hover:border-accent/50')
            }
          >
            {o.label}
          </button>
        ))}
      </div>
      {picked ? <FeedbackNote tone="correct">{screen.reveal}</FeedbackNote> : null}
      {picked ? <Continue onClick={next} /> : null}
    </>
  )
}

export function BriefingView({ screen }: { screen: BriefingScreen }) {
  const { next } = useSession()
  return (
    <div className="flex min-h-[55dvh] flex-col justify-center">
      <Prompt screen={screen} />
      <Continue
        label={screen.cta}
        onClick={() => {
          track('briefing_continue', {})
          next()
        }}
      />
    </div>
  )
}
