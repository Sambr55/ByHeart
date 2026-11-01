import Image from 'next/image'
import Link from 'next/link'
import type { Situation } from '@/content/situations'
import type { NodeState } from './progress'
import { UNLOCK_HREF } from './locks'
import { CheckIcon, KindIcon, LockIcon, PlayIcon } from './icons'

/**
 * The Simply Guitar card: a tag on top, a bold title, three things you will say, a picture
 * on the right and ONE big pill. The current one glows.
 *
 * The three bullets are the room's own first three lines, in Portuguese, because that is
 * what the room is for — and Portuguese is the hero wherever it appears in DUB.
 */
export function RoomCard({
  room,
  tag,
  state,
  cold = false,
  big = false,
}: {
  room: Situation
  tag: string
  state: NodeState
  cold?: boolean
  /** The up-next card: larger type and the glow. */
  big?: boolean
}) {
  const paid = state === 'paid'
  const href = paid ? UNLOCK_HREF : '/errand/' + room.id
  const glow = big || state === 'next'
  return (
    <article
      className={
        'relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl border bg-bg-elev p-5 text-fg ' +
        (glow
          ? 'border-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_22%,transparent),0_12px_32px_-12px_color-mix(in_srgb,var(--accent)_55%,transparent)]'
          : 'border-line')
      }
    >
      <div className="flex gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* The ribbon. Content-length text, so it is not the uppercase eyebrow. */}
          <p className="self-start rounded-full bg-chip px-3 py-1 text-xs font-semibold text-muted">
            {tag}
          </p>
          <h3 className={'display text-balance ' + (big ? 'text-2xl' : 'text-xl')}>{room.title}</h3>
          <ul className="flex flex-col gap-1">
            {room.lines.slice(0, 3).map((l) => (
              <li key={l.pt} className="flex gap-3 text-sm leading-snug">
                <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span lang="pt-PT" className="pt text-accent">
                  {l.pt}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Picture room={room} big={big} />
      </div>
      <div className="mt-auto flex items-center gap-3">
        <Link
          href={href}
          aria-label={
            paid
              ? 'Unlock ' + room.title + ' with membership'
              : (state === 'done' ? 'Play again: ' : 'Play: ') + room.title
          }
          className={
            'tap-target eyebrow inline-flex items-center justify-center gap-3 rounded-full px-6 py-3 ' +
            (paid
              ? 'border-2 border-line-strong text-fg'
              : state === 'done'
                ? 'border-2 border-accent text-accent'
                : 'bg-accent text-accent-ink') +
            (big ? ' w-full text-sm' : '')
          }
        >
          {paid ? <LockIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          {paid ? 'Unlock' : state === 'done' ? 'Again' : big ? 'Play' : 'Start'}
        </Link>
        {state === 'done' ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-correct">
            <CheckIcon className="h-4 w-4" />
            {cold ? 'Said cold' : 'Done'}
          </span>
        ) : null}
      </div>
    </article>
  )
}

function Picture({ room, big }: { room: Situation; big: boolean }) {
  const size = big ? 'w-28' : 'w-24'
  if (room.image) {
    return (
      <div className={'relative shrink-0 self-stretch overflow-hidden rounded-2xl bg-surface ' + size}>
        <Image src={room.image.src} alt={room.image.alt} fill sizes="112px" className="object-cover" />
      </div>
    )
  }
  /* No photograph yet for most of the visiting block: a tile, in the city's blue. */
  return (
    <div
      aria-hidden
      className={
        'azulejo-block flex shrink-0 items-center justify-center self-stretch rounded-2xl text-accent ' + size
      }
    >
      <KindIcon kind={room.kind} className="h-9 w-9" />
    </div>
  )
}
