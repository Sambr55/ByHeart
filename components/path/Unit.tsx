import Link from 'next/link'
import type { ResolvedUnit } from '@/content/path'
import { MicIcon, StarIcon } from './icons'

/**
 * A unit's banner — Duolingo's header strip, in azulejo rather than green — with the three
 * things the unit is for. And the milestone that closes it: a big circle on the path for a
 * practice session, which is an existing cheat said cold through /revise.
 */
export function UnitBanner({
  unit,
  done,
  total,
  compact = false,
}: {
  unit: ResolvedUnit
  done: number
  total: number
  compact?: boolean
}) {
  return (
    <header className="flex flex-col gap-3 rounded-3xl bg-accent px-5 py-6 text-accent-ink">
      <div className="flex items-center gap-3">
        <p className="eyebrow flex-1 opacity-90">Unit {unit.n}</p>
        <p className="eyebrow rounded-full bg-[color-mix(in_srgb,var(--accent-ink)_16%,transparent)] px-3 py-1">
          {done} / {total}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <h2 id={'unit-' + unit.id} className="display text-2xl">
          {unit.title}
        </h2>
        <p lang="pt-PT" className="pt text-sm opacity-90">
          {unit.pt}
        </p>
      </div>
      {compact ? null : (
        <ul className="flex flex-col gap-1 text-sm leading-snug">
          {unit.learn.map((l) => (
            <li key={l} className="flex gap-3">
              <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              {l}
            </li>
          ))}
        </ul>
      )}
      {/* Progress through the unit, as a bar rather than a percentage. */}
      <div
        role="progressbar"
        aria-label={'Unit ' + unit.n + ' rooms done'}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--accent-ink)_22%,transparent)]"
      >
        <div
          className="h-full rounded-full bg-current transition-[width] duration-[420ms]"
          style={{ width: total ? (done / total) * 100 + '%' : '0%' }}
        />
      </div>
    </header>
  )
}

export function Milestone({
  unit,
  stars,
  href,
}: {
  unit: ResolvedUnit
  stars: number
  href: string
}) {
  return (
    <Link
      href={href}
      aria-label={
        'Practice session: ' + unit.milestone.title + '. ' + stars + ' of 3 stars. ' + unit.milestone.blurb
      }
      className="tap-target mx-auto flex flex-col items-center gap-3 text-center"
    >
      <span className="relative flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-full border-4 border-telha bg-bg-elev shadow-[0_6px_0_0_color-mix(in_srgb,var(--telha)_60%,black)]">
        <span aria-hidden className="azulejo-block absolute inset-1 rounded-full" />
        <MicIcon className="relative h-7 w-7 text-telha" />
        <span lang="pt-PT" className="pt relative px-3 text-sm leading-tight text-fg">
          {unit.milestone.title}
        </span>
      </span>
      <span aria-hidden className="flex gap-1 text-telha">
        {[0, 1, 2].map((i) => (
          <StarIcon key={i} filled={i < stars} className="h-6 w-6" />
        ))}
      </span>
      <span className="flex max-w-xs flex-col gap-1">
        <span className="eyebrow text-telha">Say it cold</span>
        <span className="text-sm leading-snug text-muted">
          Practice session — {unit.milestone.blurb.replace(/ — said cold\.$/, '.')} Say all three
          cold to earn the stars.
        </span>
      </span>
    </Link>
  )
}
