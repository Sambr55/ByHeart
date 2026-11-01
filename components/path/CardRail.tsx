import type { PathView } from './progress'
import { milestoneHref } from './progress'
import { RoomCard } from './RoomCard'
import { Milestone, UnitBanner } from './Unit'

/**
 * Wide and landscape screens: the Simply Guitar rail. Each unit is a row of big cards,
 * joined by a line, ending in its practice circle. The row scrolls sideways and snaps.
 *
 * The same nodes and states as the phone path — only the drawing differs.
 */
export function CardRail({ view }: { view: PathView }) {
  return (
    <div className="flex flex-col gap-10">
      {view.units.map(({ unit, nodes, done, stars }) => (
        <section key={unit.id} aria-labelledby={'unit-' + unit.id} className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="max-w-xl lg:w-72 lg:shrink-0">
            <UnitBanner unit={unit} done={done} total={nodes.length} />
          </div>
          <div className="relative -mx-6 min-w-0 flex-1 overflow-x-auto px-6 pb-3 [scrollbar-width:thin] lg:mx-0 lg:px-0">
            <ol className="relative flex snap-x snap-mandatory items-center gap-10">
              {/* The line through the middle of the row, behind the cards. */}
              <span aria-hidden className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
              {nodes.map((n) => (
                <li key={n.room.id} className="relative w-80 shrink-0 snap-start self-stretch">
                  <RoomCard
                    room={n.room}
                    tag={n.room.where?.name ?? unit.pt}
                    state={n.state}
                    cold={n.cold}
                  />
                </li>
              ))}
              <li className="relative w-64 shrink-0 snap-start">
                <Milestone unit={unit} stars={stars} href={milestoneHref(unit.milestone.cheat)} />
              </li>
            </ol>
          </div>
        </section>
      ))}
    </div>
  )
}
