'use client'

import { useState } from 'react'
import type {
  CompoundInventoryScreen,
  CrossoverResultScreen,
  CultureCategoriesScreen,
  ForcedChoiceScreen,
  FreeTextScreen,
  MeaningCheckScreen,
  PostIntentScreen,
  RetentionResultScreen,
  ScaleScreen,
} from '@/content/types'
import { BLOCK_AUDIO, REINFORCED_IN_BOND, TARGETS } from '@/content/targets'
import { track } from '@/engine/analytics'
import { setAffinity, setFamiliarity } from '@/engine/learner'
import { useSession } from '@/engine/session'
import { useExercise } from '@/engine/useExercise'
import { useLearner } from '@/engine/useLearner'
import { AudioButton } from '../AudioButton'
import { SourceChip } from '../Inventory'
import { Continue, FeedbackNote } from '../MissionShell'
import { Prompt } from '../Prompt'

/**
 * The silver thread. One convention, everywhere a world is offered: what exists today
 * reads as lit, what does not reads as greyed with the reason stated. On the demand
 * probes the greyed options stay tappable on purpose — the question is hypothetical
 * ("if these were all live tomorrow"), and disabling them would destroy the very
 * signal the screen exists to collect.
 */
export function BuiltTag({ built }: { built?: boolean }) {
  return (
    <span
      className={
        'shrink-0 rounded-full border px-2 py-0.5 text-[0.55rem] uppercase tracking-wider ' +
        (built ? 'border-correct/50 text-correct' : 'border-line text-muted')
      }
    >
      {built ? 'built' : 'not built yet'}
    </span>
  )
}

/** Stable per mount so a re-render never reshuffles under the learner's finger. */
function useShuffled<T>(items: T[]): T[] {
  const [shuffled] = useState(() => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  })
  return shuffled
}

/**
 * Cold retrieval: the Portuguese is shown and the learner supplies the meaning,
 * before any cue from the world it was learned in. Two rungs only — this measures
 * what survived, so a long coaching ladder would contaminate the reading.
 */
export function MeaningCheckView({ screen }: { screen: MeaningCheckScreen }) {
  const { next } = useSession()
  const { feedback, solved, revealed, submit, hintLevel } = useExercise(screen, {
    maxErrors: 3,
  })

  return (
    <>
      <Prompt screen={screen} />

      <div className="mt-8">
        <p className="pt text-4xl text-accent sm:text-5xl">{screen.block}</p>
        <p className="mt-2 text-lg text-muted">{screen.lead}</p>
      </div>

      {hintLevel >= 1 && !solved ? (
        <p className="mt-4 text-sm text-coach">{screen.hint}</p>
      ) : null}

      <div className="mt-6 space-y-3">
        {screen.options.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={solved}
            onClick={() =>
              submit(
                { correct: Boolean(o.correct), message: o.correct ? undefined : screen.wrong },
                { option: o.id },
              )
            }
            className={
              'tap-target eyebrow flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left transition active:scale-[0.99] ' +
              (solved && o.correct
                ? 'border-correct bg-correct/10'
                : 'border-line bg-surface hover:border-accent/50') +
              (solved && !o.correct ? ' opacity-45' : '')
            }
          >
            {o.label}
            {solved && o.correct ? (
              <span aria-hidden="true" className="text-correct">
                ✓
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {feedback ? (
        <FeedbackNote tone={revealed ? 'coach' : feedback.tone}>
          {revealed ? screen.reveal : feedback.text || screen.reveal}
        </FeedbackNote>
      ) : null}

      {solved ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
          <AudioButton
            slug={BLOCK_AUDIO[screen.target]}
            text={TARGETS[screen.target].block}
            screenId={screen.id}
          />
          <span className="pt text-lg">{TARGETS[screen.target].block}</span>
        </div>
      ) : null}

      {solved ? <Continue onClick={next} /> : null}
    </>
  )
}

export function RetentionResultView({ screen }: { screen: RetentionResultScreen }) {
  const { next, scores } = useSession()
  const weak = scores.coldRecallCorrect <= Math.floor(scores.coldRecallTotal / 2)
  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="eyebrow text-accent">{screen.eyebrow}</p>
      <p className="display mt-4 text-4xl">
        {scores.coldRecallCorrect}/{scores.coldRecallTotal}
      </p>
      <p className="mt-2 text-lg">came back without the film.</p>
      <p className="mt-4 text-sm text-muted">{screen.sub}</p>
      {weak ? <FeedbackNote tone="correct">{screen.lowScoreCopy}</FeedbackNote> : null}
      <Continue
        label={screen.cta}
        onClick={() => {
          track('cold_recall_score', {
            correct: scores.coldRecallCorrect,
            total: scores.coldRecallTotal,
          })
          next()
        }}
      />
    </div>
  )
}

export function CultureCategoriesView({ screen }: { screen: CultureCategoriesScreen }) {
  const { next } = useSession()
  const cards = useShuffled(screen.cards)
  const [picked, setPicked] = useState<string[]>([])

  return (
    <>
      <Prompt screen={screen} />
      <div className="mt-6 grid grid-cols-2 gap-2">
        {cards.map((c) => {
          const on = picked.includes(c.id)
          const full = picked.length >= screen.max && !on
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              disabled={full}
              onClick={() =>
                setPicked((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))
              }
              className={
                'tap-target rounded-xl border px-3 py-3 text-left transition ' +
                (on
                  ? 'border-accent bg-accent/10'
                  : full
                    ? 'border-line/50 bg-surface/40 opacity-40'
                    : 'border-line bg-surface hover:border-accent/50')
              }
            >
              <span className="display block text-sm">{c.title}</span>
              <span className="mt-0.5 block text-[0.65rem] leading-snug text-muted">
                {c.examples}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-muted">
        {picked.length} of {screen.max} chosen
      </p>
      <Continue
        label={screen.cta}
        disabled={!picked.length}
        onClick={() => {
          setAffinity({ categories_ranked: picked })
          track('culture_categories', {
            selected: picked,
            order: picked,
            displayed_order: cards.map((c) => c.id),
            rank: picked.length,
          })
          next()
        }}
      />
    </>
  )
}

export function FreeTextView({ screen }: { screen: FreeTextScreen }) {
  const { next } = useSession()
  const [text, setText] = useState('')
  return (
    <div className="flex flex-1 flex-col">
      <Prompt screen={screen} />
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={screen.placeholder}
        className="pt mt-6 w-full rounded-xl border border-line bg-surface p-4 text-xl text-fg outline-none focus:border-accent"
      />
      <p className="mt-3 text-xs text-muted">This is the important answer.</p>
      <Continue
        label={screen.cta}
        disabled={!text.trim()}
        onClick={() => {
          setAffinity({ free_text_favourite: text.trim() })
          track('culture_free_text', { text: text.trim() })
          next()
        }}
      />
    </div>
  )
}

export function ForcedChoiceView({ screen }: { screen: ForcedChoiceScreen }) {
  const { next } = useSession()
  const shuffled = useShuffled(screen.cards)
  // The escape hatch is appended after the shuffle so it never lands in a random
  // slot and read as one of the real options.
  const cards = screen.escapeHatch ? [...shuffled, screen.escapeHatch] : shuffled
  const [picked, setPicked] = useState<string | null>(null)

  return (
    <>
      <Prompt screen={screen} />
      <div className="mt-6 space-y-2">
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={picked === c.id}
            onClick={() => setPicked(c.id)}
            className={
              'tap-target eyebrow flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-4 text-left transition ' +
              (picked === c.id
                ? 'border-accent bg-accent/10 text-fg'
                : c.built
                  ? 'border-line bg-surface text-fg hover:border-accent/50'
                  : 'border-line/60 bg-surface/40 text-muted hover:border-accent/40')
            }
          >
            {c.title}
            <BuiltTag built={c.built} />
          </button>
        ))}
      </div>
      <Continue
        label={screen.cta}
        disabled={!picked}
        onClick={() => {
          setAffinity({ [screen.field]: picked } as never)
          track('next_world_choice', {
            field: screen.field,
            choice: picked,
            displayed_order: cards.map((c) => c.id),
          })
          next()
        }}
      />
    </>
  )
}

export function ScaleView({ screen }: { screen: ScaleScreen }) {
  const { next, answer } = useSession()
  const [value, setValue] = useState<number | null>(null)
  return (
    <div className="flex flex-1 flex-col justify-center">
      <Prompt screen={screen} />
      <div className="mt-6 space-y-2">
        {screen.points.map((p) => (
          <button
            key={p.value}
            type="button"
            aria-pressed={value === p.value}
            onClick={() => setValue(p.value)}
            className={
              'tap-target flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ' +
              (value === p.value
                ? 'border-accent bg-accent/10'
                : 'border-line bg-surface hover:border-accent/50')
            }
          >
            <span className="display w-5 shrink-0 text-center text-sm text-accent">
              {p.value}
            </span>
            <span className="text-sm">{p.label}</span>
          </button>
        ))}
      </div>
      <Continue
        label={screen.cta}
        disabled={value === null}
        onClick={() => {
          answer(screen.field, value)
          if (screen.field === 'bond_familiarity') {
            setFamiliarity('james_bond', value!)
            track('bond_familiarity', { value })
          } else {
            track('mental_model_transfer', { value })
          }
          next()
        }}
      />
    </div>
  )
}

export function CompoundInventoryView({ screen }: { screen: CompoundInventoryScreen }) {
  const { next, inventory } = useSession()
  const learner = useLearner()
  const reinforced = inventory.filter(
    (b) => (learner.inventory[b]?.reinforced_sources.length ?? 0) > 0,
  )

  return (
    <>
      <p className="eyebrow text-accent">{screen.eyebrow}</p>
      <p className="display mt-3 text-balance text-2xl">
        {inventory.length} pieces acquired across two worlds.
      </p>
      <p className="mt-1 text-sm text-muted">
        {reinforced.length} have now survived both.
      </p>

      {reinforced.length ? (
        <p className="pt mt-4 text-lg text-accent">
          {reinforced.map((b) => TARGETS[b].label).join('  ·  ')}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-2">
        {inventory.map((b) => (
          <SourceChip key={b} block={b} />
        ))}
      </div>

      <p className="mt-6 text-sm font-semibold">{screen.closing}</p>
      <p className="mt-2 text-xs text-muted">{screen.sub}</p>

      <Continue
        label={screen.cta}
        onClick={() => {
          track('compound_inventory_view', {
            unique_count: inventory.length,
            reinforced_count: reinforced.length,
            reinforced: reinforced,
            expected_reinforced: REINFORCED_IN_BOND,
          })
          next()
        }}
      />
    </>
  )
}

export function CrossoverResultView({ screen }: { screen: CrossoverResultScreen }) {
  const { next, scores, inventory } = useSession()
  const learner = useLearner()
  const reinforced = inventory.filter(
    (b) => (learner.inventory[b]?.reinforced_sources.length ?? 0) > 0,
  ).length
  const weak = scores.crossoverUnassisted < Math.ceil(scores.crossoverTotal / 2)

  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="eyebrow text-accent">{screen.eyebrow}</p>
      <p className="display mt-4 text-balance text-2xl">
        {scores.crossoverCorrect}/{scores.crossoverTotal} cross-world tasks completed.
      </p>
      <p className="mt-2 text-sm text-muted">
        {scores.crossoverUnassisted} without a hint. {inventory.length} building blocks
        available. {reinforced} strengthened across two worlds.
      </p>
      {weak ? <FeedbackNote tone="correct">{screen.lowScoreCopy}</FeedbackNote> : null}
      <Continue
        label={screen.cta}
        onClick={() => {
          track('crossover_score', {
            correct_total: scores.crossoverCorrect,
            unassisted_total: scores.crossoverUnassisted,
            items: scores.crossoverTotal,
            unique_blocks: inventory.length,
            reinforced_blocks: reinforced,
          })
          next()
        }}
      />
    </div>
  )
}

export function PostIntentView({ screen }: { screen: PostIntentScreen }) {
  const { finish, answer } = useSession()
  const learner = useLearner()
  const [picked, setPicked] = useState<string | null>(null)
  const [world, setWorld] = useState(learner.affinity.next_world_pre ?? '')

  return (
    <div className="flex flex-1 flex-col justify-center">
      <Prompt screen={screen} />
      <div className="mt-6 space-y-2">
        {screen.options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={picked === o.id}
            onClick={() => setPicked(o.id)}
            className={
              'tap-target eyebrow w-full rounded-xl border px-4 py-4 text-left transition ' +
              (picked === o.id
                ? 'border-accent bg-accent/10'
                : 'border-line bg-surface hover:border-accent/50')
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      {picked ? (
        <label className="mt-5 block">
          <span className="text-sm text-muted">{screen.followUp}</span>
          <input
            value={world}
            onChange={(e) => setWorld(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-surface p-3 text-sm text-fg outline-none focus:border-accent"
            placeholder="Your earlier answer is filled in — change it if you have."
          />
        </label>
      ) : null}

      {picked ? (
        <Continue
          label={screen.cta}
          onClick={() => {
            answer('post_experience_intent', picked)
            setAffinity({ next_world_post: world.trim() || null })
            track('post_experience_intent', {
              choice: picked,
              next_world_post: world.trim(),
              next_world_pre: learner.affinity.next_world_pre,
              changed_mind: (learner.affinity.next_world_pre ?? '') !== world.trim(),
            })
            finish()
          }}
        />
      ) : null}
    </div>
  )
}
