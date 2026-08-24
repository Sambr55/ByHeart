'use client'

import Link from 'next/link'
import { BRAND } from '@/content/brand'
import { downloadSession } from '@/engine/analytics'
import { encodeLearner, getLearner } from '@/engine/learner'
import { useSession } from '@/engine/session'
import { useLearner } from '@/engine/useLearner'

/**
 * Observer hand-off. Not part of the learner's ten minutes — this is where the
 * facilitator takes the session file and the resume link before handing the phone
 * to the next tester.
 */
export function MissionComplete() {
  const { mission, scores, state, inventory } = useSession()
  const learner = useLearner()
  const isFirst = mission.mission_id === 'mission_01'
  const nextHref = isFirst ? '/m2' : '/deck'
  const nextLabel = isFirst ? 'CONTINUE TO MISSION 02' : 'BUILD MY DECK'

  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="eyebrow text-accent">{BRAND.name} · SESSION COMPLETE</p>
      <h1 className="display mt-4 text-balance text-3xl">Obrigado.</h1>
      <p className="mt-4 text-sm text-muted">
        Hand the phone back to the observer. Nothing here is shown to the next tester.
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
        {mission.cold_recall_items?.length ? (
          <Stat
            label="Survived from before"
            value={scores.coldRecallCorrect + '/' + scores.coldRecallTotal}
          />
        ) : null}
        <Stat label="Transferred" value={scores.transferred + '/' + scores.total} />
        {mission.crossover_items?.length ? (
          <Stat
            label="Cross-world"
            value={scores.crossoverCorrect + '/' + scores.crossoverTotal}
          />
        ) : null}
        {mission.crossover_items?.length ? (
          <Stat label="Unassisted" value={String(scores.crossoverUnassisted)} />
        ) : (
          <Stat label="First try" value={scores.firstTry + '/' + scores.total} />
        )}
        <Stat label="Blocks owned" value={String(inventory.length)} />
        <Stat
          label="Strengthened"
          value={String(
            inventory.filter(
              (b) => (learner.inventory[b]?.reinforced_sources.length ?? 0) > 0,
            ).length,
          )}
        />
      </dl>

      <Link
        href={nextHref}
        className="tap-target eyebrow mt-6 block w-full rounded bg-accent px-5 py-4 text-center text-accent-ink"
      >
        {nextLabel}
      </Link>

      {isFirst ? null : (
        <Link
          href="/feedback"
          className="tap-target eyebrow mt-3 block w-full rounded border border-accent px-5 py-4 text-center text-accent"
        >
          TELL US WHAT YOU REALLY THINK
        </Link>
      )}

      <button
        type="button"
        onClick={() =>
          downloadSession({
            mission: mission.mission_id,
            learner: getLearner(),
            items: state.items,
            answers: state.answers,
            scores,
          })
        }
        className="tap-target eyebrow mt-3 w-full rounded border border-line px-5 py-4 text-muted"
      >
        DOWNLOAD SESSION JSON
      </button>

      <ResumeLink />
    </div>
  )
}

/**
 * The whole learner encoded into a URL. A tester who clears their browser, or turns
 * up on a different phone for the 24–72h recall, is not a lost tester — and nothing
 * is stored on a server to make that true.
 */
function ResumeLink() {
  const learner = useLearner()
  const href =
    typeof window === 'undefined'
      ? ''
      : window.location.origin + '/recall?t=' + encodeLearner(learner)

  return (
    <details className="mt-6 rounded border border-line bg-surface p-4">
      <summary className="eyebrow cursor-pointer text-muted">
        FACILITATOR · RESUME LINK
      </summary>
      <p className="mt-3 text-xs text-muted">
        Send this for the 24–72 hour recall. It carries the whole session, so it works
        on any device without an account.
      </p>
      <textarea
        readOnly
        rows={3}
        value={href}
        onFocus={(e) => e.currentTarget.select()}
        className="mt-2 w-full rounded border border-line bg-bg-elev p-2 font-mono text-[0.6rem] text-muted"
      />
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(href)}
        className="tap-target eyebrow mt-2 w-full rounded border border-line px-3 py-2 text-muted"
      >
        COPY
      </button>
    </details>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-surface px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="display mt-1 text-2xl tabular-nums">{value}</dd>
    </div>
  )
}
