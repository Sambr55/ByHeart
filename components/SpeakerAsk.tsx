'use client'

import { AudioButton } from '@/components/AudioButton'
import { slugFor } from '@/content/audio-manifest'
import { GENDER_QUESTION } from '@/content/profile'
import { otherEnding, type Speaker } from '@/content/speaker'
import { setProfile, setSpeaker } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'
import { track } from '@/engine/analytics'

/**
 * WHICH ENDING IS YOURS — asked in the room, on the first line that needs it (2026-11-03).
 *
 * The profile's gender question used to come between Legend sections; the Path never asks
 * it (nextProfileQuestion returns null), so almost nobody had answered and every woman on
 * the Path was taught obrigado. The honest moment to ask is the one Portuguese itself
 * picks: the first time a line will not let you say it until it knows. So it is asked
 * HERE, under that line, with that line's two endings as the answers — "Obrigado" or
 * "Obrigada" — and the room switches the moment you choose.
 *
 * The copy is GENDER_QUESTION's (content/profile.ts), which already said it right: about
 * which ending comes out of your mouth, not about who you are. SHOW ME BOTH is a real
 * answer and is remembered (profile.skipped): the room then shows the other ending under
 * every line that has one, with a voice, and never asks again.
 */
export function SpeakerAsk({ line, gender }: { line: { pt: string; f?: string }; gender: Speaker }) {
  const learner = useLearner()
  const other = otherEnding(line, gender)
  if (!other) return null
  const skipped = (learner.profile?.skipped ?? []).includes('gender')
  const q = GENDER_QUESTION

  if (skipped) {
    /* SHOW ME BOTH: the other ending, quietly, with its own voice. */
    return (
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3" data-testid="speaker-both">
        <AudioButton slug={slugFor(other)} text={other} size="sm" />
        <span className="flex min-w-0 flex-col">
          <span className="text-xs text-muted">Said by a woman</span>
          <span lang="pt-PT" className="pt text-lg text-accent">
            {other}
          </span>
        </span>
      </div>
    )
  }

  const choose = (g: 'm' | 'f' | null) => {
    setProfile('gender', g)
    if (g) track('profile_answer', { question: 'gender', answer: g, where: 'room' })
    else track('profile_skip', { question: 'gender', where: 'room' })
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-2xl border-2 border-accent/30 bg-surface px-4 py-4" data-testid="speaker-ask" role="group" aria-label={q.headline}>
      <div>
        <p className="font-semibold">{q.headline}</p>
        <p className="text-sm text-muted">{q.why}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { g: 'm' as const, pt: line.pt, label: q.options[0].label },
          { g: 'f' as const, pt: other, label: q.options[1].label },
        ].map((o) => (
          <button
            key={o.g}
            type="button"
            data-testid={'speaker-' + o.g}
            onClick={() => choose(o.g)}
            className="tap-target flex flex-col items-start gap-0.5 rounded-xl border-2 border-line bg-bg-elev px-3 py-2.5 text-left hover:border-accent"
          >
            <span className="eyebrow text-[0.6rem] text-muted">{o.label}</span>
            <span lang="pt-PT" className="pt text-base leading-snug text-accent">
              {o.pt}
            </span>
          </button>
        ))}
      </div>
      <button type="button" data-testid="speaker-skip" onClick={() => choose(null)} className="self-start text-sm font-semibold text-muted underline-offset-4 hover:underline">
        {q.skip.charAt(0) + q.skip.slice(1).toLowerCase()}
      </button>
    </div>
  )
}

/**
 * The same choice, changeable, in Settings — next to why you are in the city. Asked once in
 * a room; a person must be able to find it again without waiting for the next obrigado.
 */
export function EndingChoice() {
  const learner = useLearner()
  const g = learner.profile?.gender ?? null
  const both = g === null && (learner.profile?.skipped ?? []).includes('gender')
  const now: 'm' | 'f' | 'both' | null = g ?? (both ? 'both' : null)
  const opts = [
    { id: 'm' as const, label: 'obrigado', sub: 'as a man' },
    { id: 'f' as const, label: 'obrigada', sub: 'as a woman' },
    { id: 'both' as const, label: 'o · a', sub: 'show both' },
  ]
  return (
    <div className="flex flex-col gap-1" data-testid="ending-choice">
      <p className="eyebrow text-muted">YOUR ENDINGS</p>
      <p className="text-sm text-muted">Which ending comes out of your mouth. Every line follows it.</p>
      <div role="group" aria-label="Your endings" className="mt-1 flex gap-1">
        {opts.map((o) => (
          <button
            key={o.id}
            type="button"
            data-testid={'ending-' + o.id}
            aria-pressed={now === o.id}
            onClick={() => {
              setSpeaker(o.id)
              track('profile_answer', { question: 'gender', answer: o.id, where: 'settings' })
            }}
            className={
              'tap-target flex flex-1 flex-col items-center rounded border px-2 py-1.5 transition ' +
              (now === o.id ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted hover:text-fg')
            }
          >
            <span lang="pt-PT" className="pt text-sm">{o.label}</span>
            <span className="text-[0.6rem] uppercase tracking-wider">{o.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
