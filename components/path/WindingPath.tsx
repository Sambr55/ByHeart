import Link from 'next/link'
import type { PathView } from './progress'
import { milestoneHref } from './progress'
import { UNLOCK_HREF } from './locks'
import { CheckIcon, KindIcon, LockIcon, StarIcon } from './icons'
import { Milestone, UnitBanner } from './Unit'

/**
 * The phone path: Duolingo's winding line of round nodes, a banner per unit, a big
 * practice circle between units.
 *
 * Drawn on a fixed 288px column so the line can be an SVG in real pixels — the nodes sit
 * on a gentle sine, and the line runs through their centres. A segment is blue once the
 * room it leaves is done, so the done part of the trip reads as one coloured stroke.
 */
const COL = 288
const ROW = 156
const NODE = 72
const SWING = [0, 0.75, 1, 0.75, 0, -0.75, -1, -0.75]
const AMP = 70

export function WindingPath({ view }: { view: PathView }) {
  return (
    <div className="flex flex-col gap-10">
      {view.units.map(({ unit, nodes, done, stars }) => {
        const xs = nodes.map((_, i) => COL / 2 + SWING[i % SWING.length] * AMP)
        const ys = nodes.map((_, i) => ROW * i + NODE / 2 + 30)
        const height = ROW * nodes.length
        return (
          <section key={unit.id} aria-labelledby={'unit-' + unit.id} className="flex flex-col gap-6">
            <UnitBanner unit={unit} done={done} total={nodes.length} />
            <div className="relative mx-auto" style={{ width: COL, height }}>
              <svg
                aria-hidden
                className="absolute inset-0"
                width={COL}
                height={height}
                viewBox={`0 0 ${COL} ${height}`}
                fill="none"
              >
                {nodes.slice(1).map((n, i) => {
                  const d = `M ${xs[i]} ${ys[i]} C ${xs[i]} ${ys[i] + ROW / 2}, ${xs[i + 1]} ${ys[i + 1] - ROW / 2}, ${xs[i + 1]} ${ys[i + 1]}`
                  const lit = nodes[i].state === 'done'
                  return (
                    <path
                      key={n.room.id}
                      d={d}
                      strokeWidth={lit ? 8 : 6}
                      strokeLinecap="round"
                      strokeDasharray={lit ? undefined : '2 12'}
                      style={{ stroke: lit ? 'var(--accent)' : 'var(--line-strong)' }}
                    />
                  )
                })}
              </svg>
              <ol className="absolute inset-0">
                {nodes.map((n, i) => (
                  <li
                    key={n.room.id}
                    className="absolute flex w-36 -translate-x-1/2 flex-col items-center gap-1"
                    style={{ left: xs[i], top: ys[i] - NODE / 2 - 30 }}
                  >
                    <Node n={n} />
                  </li>
                ))}
              </ol>
            </div>
            <Milestone unit={unit} stars={stars} href={milestoneHref(unit.milestone.cheat)} />
          </section>
        )
      })}
    </div>
  )
}

function Node({ n }: { n: PathView['units'][number]['nodes'][number] }) {
  const { room, state, cold } = n
  const paid = state === 'paid'
  const label =
    room.title +
    (state === 'done' ? (cold ? ' — done, said cold' : ' — done') : '') +
    (state === 'next' ? ' — start here' : '') +
    (paid ? ' — locked, unlock with membership' : '')
  const ring =
    state === 'done'
      ? 'bg-accent text-accent-ink border-accent'
      : state === 'next'
        ? 'bg-bg-elev text-accent border-accent shadow-[0_0_0_6px_color-mix(in_srgb,var(--accent)_22%,transparent),0_6px_0_0_color-mix(in_srgb,var(--accent)_70%,black)]'
        : paid
          ? 'bg-surface text-muted border-line-strong'
          : 'bg-bg-elev text-accent border-line-strong shadow-[0_5px_0_0_var(--line)]'
  return (
    <Link
      href={paid ? UNLOCK_HREF : '/errand/' + room.id}
      aria-label={label}
      className="tap-target group flex flex-col items-center gap-1"
    >
      {/* The callout: Duolingo's START, held still under reduced motion by .nudge-up. */}
      <span
        aria-hidden
        className={
          'eyebrow rounded-full px-3 py-1 ' +
          (state === 'next' ? 'nudge-up bg-telha text-white' : 'invisible')
        }
      >
        Start
      </span>
      <span
        className={'relative flex items-center justify-center rounded-full border-4 ' + ring}
        style={{ width: NODE, height: NODE }}
      >
        {state === 'done' ? (
          <CheckIcon className="h-8 w-8" />
        ) : paid ? (
          <LockIcon className="h-7 w-7" />
        ) : (
          <KindIcon kind={room.kind} />
        )}
        {cold ? (
          <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-bg-elev bg-telha text-white">
            <StarIcon filled className="h-4 w-4" />
          </span>
        ) : null}
      </span>
      <span
        className={
          'mt-1 text-balance text-center text-xs font-semibold leading-tight ' +
          (state === 'next' ? 'text-fg' : paid ? 'text-muted' : 'text-fg')
        }
      >
        {room.title}
      </span>
      {paid ? (
        <span aria-hidden className="eyebrow flex items-center gap-1 rounded-full border-2 border-line-strong px-3 py-1 text-fg">
          <LockIcon className="h-3 w-3" />
          Unlock
        </span>
      ) : null}
    </Link>
  )
}
