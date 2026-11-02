'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, type CSSProperties } from 'react'
import type { PathNode, PathView } from './progress'
import { keystoneGlaze, milestoneHref } from './progress'
import { UNLOCK_HREF } from './locks'
import { KindIcon, LockIcon } from './icons'
import { Foundation, PutBack, driftOf, keystoneLabel } from './Panel'

/**
 * THE ROAD — the winding path, back as the second view beside the Panel (Sam, 2026-11-02).
 *
 * Sam: "I'm still seeing the Duo Lingo roadmap view in the app and it is kinda cool. So now
 * I'm wondering if we could have a 'winding road' map view and a tile view and a toggle.
 * And we gamify the winding road view the same — when something drifts etc?"
 *
 * So this is WindingPath from main (removed when the Wall came in), with its charm kept and
 * its tells taken out. KEPT: the line that winds on a gentle sine through round stops, a
 * stretch of it coloured once the room it leaves is done, so the trip so far reads as one
 * stroke. GONE, for the same reasons the Wall gave: the bouncing START bubble, the stars,
 * the flame, and the chunky hard bottom shadows under every node.
 *
 * THE SAME GAME AS THE PANEL, FROM THE SAME DATA. Every state here is a PathNode from
 * pathView (progress.ts) — nothing is forked:
 *
 *   open      the room's photo, faded — a place on the map you have not been yet.
 *   next      the photo with a breathing ring (the Panel's breath, not a bounce).
 *   paid      faded, with a small lock; tap → /pro.
 *   done      the photo in full colour with an azulejo ring — LAID. Tap → the TileSheet.
 *   + cold    a gold ring instead — said cold.
 *   + slipping
 *             KNOCKED OFF THE ROAD: the stop sits tilted (the Panel's own 8–13°, driftOf),
 *             lifted off its place with a shadow under it, and a faint dashed ring on the
 *             line where it belongs. "Put these back" above, and "Put it back" on its
 *             sheet, exactly as on the Panel.
 *   keystone  each unit ends in its practice session, a marker on the line glazed by the
 *             same 0–3 (outline → part → glazed → gold).
 *
 * Drawn on a fixed 288px column so the line can be an SVG in real pixels.
 */
const COL = 288
const ROW = 118
const NODE = 68
const SWING = [0, 0.75, 1, 0.75, 0, -0.75, -1, -0.75]
const AMP = 74

export function Road({
  view,
  inventory,
  onLaid,
  openId = null,
  homing,
}: {
  view: PathView
  inventory: Record<string, unknown>
  onLaid: (n: PathNode) => void
  openId?: string | null
  /* Rooms just put back, which come home with a flourish once (see Panel). */
  homing?: Set<string>
}) {
  const drifted = useMemo(() => view.units.flatMap((u) => u.nodes).filter((n) => n.slipping).slice(0, 3), [view])
  /* The swing runs on across units, so the road is one road and not five. */
  let k = 0
  return (
    <section aria-labelledby="road-caption" data-testid="road" className="flex flex-col gap-6">
      <p id="road-caption" className="text-sm leading-snug text-muted" data-testid="road-caption">
        <span className="font-semibold text-fg">Your road through Lisboa</span>
        <br />
        {view.done} of {view.total} stops reached
      </p>

      <PutBack
        drifted={drifted}
        chip={(x) => (
          <span aria-hidden className="road-chip" style={{ transform: `rotate(${driftOf(x.room.id).rot}deg)` }}>
            <StopFace node={x} size={20} />
          </span>
        )}
      />

      <ol className="flex flex-col gap-6" aria-label="The road, unit by unit">
        {view.units.map(({ unit, nodes, done, stars }) => {
          const start = k
          k += nodes.length
          const xs = nodes.map((_, i) => COL / 2 + SWING[(start + i) % SWING.length] * AMP)
          const ys = nodes.map((_, i) => ROW * i + NODE / 2 + 6)
          const height = ROW * nodes.length - 20
          const glaze = keystoneGlaze(stars)
          return (
            <li key={unit.id} data-unit={unit.id} className="flex flex-col gap-3">
              <p className="flex items-baseline gap-3 px-1 text-xs text-muted">
                <span className="eyebrow">Unit {unit.n}</span>
                <span className="min-w-0 flex-1 truncate text-fg">{unit.title}</span>
                <span className="tabular-nums">
                  {done}/{nodes.length}
                </span>
              </p>
              <div className="relative mx-auto" style={{ width: COL, height }}>
                <svg aria-hidden className="absolute inset-0" width={COL} height={height} viewBox={`0 0 ${COL} ${height}`} fill="none">
                  {nodes.slice(1).map((n, i) => {
                    const d = `M ${xs[i]} ${ys[i]} C ${xs[i]} ${ys[i] + ROW / 2}, ${xs[i + 1]} ${ys[i + 1] - ROW / 2}, ${xs[i + 1]} ${ys[i + 1]}`
                    const lit = nodes[i].state === 'done'
                    return (
                      <path
                        key={n.room.id}
                        d={d}
                        strokeWidth={lit ? 7 : 5}
                        strokeLinecap="round"
                        strokeDasharray={lit ? undefined : '2 11'}
                        style={{ stroke: lit ? 'var(--azulejo)' : 'var(--line-strong)' }}
                      />
                    )
                  })}
                </svg>
                <ol className="absolute inset-0">
                  {nodes.map((n, i) => (
                    <li
                      key={n.room.id}
                      className="absolute flex w-32 -translate-x-1/2 flex-col items-center"
                      style={{ left: xs[i], top: ys[i] - NODE / 2 }}
                    >
                      <Stop n={n} open={n.room.id === openId} home={homing?.has(n.room.id) ?? false} onLaid={onLaid} />
                    </li>
                  ))}
                </ol>
              </div>
              {/* The keystone: the unit's practice session, on the road where the unit ends. */}
              <Link
                href={milestoneHref(unit.milestone.cheat)}
                data-testid="keystone"
                data-glaze={glaze}
                aria-label={'Keystone, practice session: ' + unit.milestone.title + ', ' + stars + ' of 3 said cold. ' + unit.milestone.blurb}
                className={'panel-keystone tap-target mx-auto is-' + glaze}
              >
                <span lang="pt-PT" className="pt">
                  {keystoneLabel(unit)}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>

      <Foundation inventory={inventory} />
    </section>
  )
}

/** The round face of a stop: the room's photo, or its kind in the city's blue. */
function StopFace({ node, size }: { node: PathNode; size: number }) {
  const { room } = node
  if (room.image) {
    return (
      <span className="relative block overflow-hidden rounded-full" style={{ width: size, height: size }}>
        <Image src={room.image.src} alt="" fill sizes={size + 'px'} className="object-cover" />
      </span>
    )
  }
  return (
    <span className="azulejo-block flex items-center justify-center rounded-full text-accent" style={{ width: size, height: size }}>
      <KindIcon kind={room.kind} className={size > 40 ? 'h-7 w-7' : 'h-3 w-3'} />
    </span>
  )
}

function Stop({ n, open, home, onLaid }: { n: PathNode; open: boolean; home: boolean; onLaid: (n: PathNode) => void }) {
  const { room, state, cold, slipping } = n
  const laid = state === 'done'
  const label =
    room.title +
    (laid ? (cold ? ' — reached, and said cold' : ' — reached') : '') +
    (slipping ? ', knocked off the road: put it back' : '') +
    (state === 'next' ? ' — up next' : '') +
    (state === 'paid' ? ' — locked, unlock with membership' : '')
  const d = slipping ? driftOf(room.id) : null
  const style = d ? ({ '--rot': d.rot + 'deg' } as CSSProperties) : undefined
  const cls =
    'road-stop is-' + state + (cold ? ' is-cold' : '') + (d ? ' is-drifted' : '') + (open ? ' is-sheet' : '') + (home ? ' is-home' : '')
  const face = (
    <>
      {d ? <span aria-hidden data-testid="road-gap" className="road-gap" /> : null}
      <span className="road-disc" style={style} data-drift={d ? 'true' : undefined}>
        <StopFace node={n} size={NODE} />
        {state === 'paid' ? (
          <span aria-hidden className="absolute right-0 top-0 rounded-full bg-bg-elev p-1 text-fg">
            <LockIcon className="h-3 w-3" />
          </span>
        ) : null}
      </span>
      <span className="road-name">{room.title}</span>
    </>
  )
  if (laid) {
    return (
      <button
        type="button"
        onClick={() => onLaid(n)}
        aria-label={label}
        data-testid="stop"
        data-state={cold ? 'glazed' : 'laid'}
        data-slipping={slipping ? 'true' : undefined}
        data-room={room.id}
        className={cls}
      >
        {face}
      </button>
    )
  }
  return (
    <Link
      href={state === 'paid' ? UNLOCK_HREF : '/errand/' + room.id}
      aria-label={label}
      data-testid="stop"
      data-state={state}
      data-room={room.id}
      className={cls}
    >
      {face}
    </Link>
  )
}
