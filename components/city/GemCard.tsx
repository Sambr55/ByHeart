'use client'

import Link from 'next/link'
import { AudioButton } from '@/components/AudioButton'
import { slugFor } from '@/content/audio-manifest'
import { KIND_LABEL, bairroById, walkMinutes, type Gem } from '@/content/gems'
import { GemPicture, PhotoCredit, useGemPhoto } from '@/components/city/GemPhoto'
import { situationById } from '@/content/situations'
import { knowHowForRoom } from '@/content/knowhow'
import { KnowHowCard } from './KnowHowCard'
import { GemDirections } from './GemDirections'
import { said } from '@/content/speaker'
import { useLearner } from '@/engine/useLearner'

/**
 * ONE GEM, OPENED. The shape is the rule (content/gems.ts): what happens here, who you will
 * talk to, the line for walking in — with a voice — a local tip, and the room on the path
 * that trains you for it. Directions open a walking map in the card (GemDirections).
 */
export function GemCard({ gem, metres, onClose }: { gem: Gem; metres?: number; onClose?: () => void }) {
  const room = situationById(gem.room)
  /* The walking-in line in this learner's own ending (content/speaker.ts). */
  const line = said(gem.line, useLearner().profile?.gender ?? null)
  const bairro = bairroById(gem.bairro)
  /* The piece of know-how this kind of place brings to mind — the couvert at a tasca, the counter at a café. */
  const tip = knowHowForRoom(gem.room)
  const pic = useGemPhoto(gem.id, 800)
  return (
    <article
      ref={pic.ref}
      data-testid="gem-card"
      className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-line bg-bg-elev p-5 shadow-[0_14px_30px_-18px_rgba(26,36,48,0.45)]"
    >
      {/* The venue, before its name: a wide picture across the top of the card. */}
      <div className="-mx-5 -mt-5">
        <GemPicture kind={gem.kind} photo={pic.photo} big className="h-40 w-full" />
        <PhotoCredit photo={pic.photo} className="px-5 pt-1" />
      </div>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-telha">
            {KIND_LABEL[gem.kind]} · {bairro.name}
            {metres !== undefined ? ' · ' + walkMinutes(metres) + ' min walk' : ''}
          </p>
          <h3 className="display mt-1 text-2xl leading-tight">{gem.name}</h3>
          <p className="text-xs text-muted">{gem.address}</p>
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
            ✕
          </button>
        ) : null}
      </header>

      {!gem.verified ? (
        <p data-testid="gem-draft" className="rounded-xl border border-dashed border-[#c9973b] bg-[#c9973b]/10 px-3 py-2 text-xs text-fg">
          <span className="eyebrow mr-1 text-[#9a6b12]">Draft</span>
          Not yet checked by a local — preview builds only.{gem.unsure ? ' Unsure: ' + gem.unsure : ''}
        </p>
      ) : null}

      <p className="text-base leading-relaxed">{gem.why}</p>

      <div className="flex items-center gap-3 rounded-2xl bg-accent/10 px-4 py-3">
        <AudioButton slug={slugFor(line.pt)} text={line.pt} size="sm" />
        <div className="min-w-0">
          <p className="eyebrow text-[0.6rem] text-accent">Say this when you walk in</p>
          <p className="lang text-lg leading-snug text-accent" lang="pt-PT">
            {line.pt}
          </p>
          <p className="text-sm text-muted">{line.en}</p>
        </div>
      </div>

      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="eyebrow text-[0.6rem] text-muted">Who you’ll meet</dt>
          <dd>{gem.meet}</dd>
        </div>
        <div>
          <dt className="eyebrow text-[0.6rem] text-muted">Local tip</dt>
          <dd>{gem.tip}</dd>
        </div>
      </dl>

      {tip ? <KnowHowCard k={tip} /> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {room ? (
          <Link href={'/errand/' + room.id} data-testid="gem-room" className="tap-target eyebrow flex-1 rounded-2xl bg-accent px-4 py-3 text-center text-accent-ink">
            Practise first: {room.title}
          </Link>
        ) : null}
        <GemDirections gem={gem} />
      </div>
    </article>
  )
}
