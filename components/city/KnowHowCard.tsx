'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { slugFor } from '@/content/audio-manifest'
import { TOPIC_LABEL, type KnowHow } from '@/content/knowhow'
import { situationById } from '@/content/situations'
import { said } from '@/content/speaker'
import { useLearner } from '@/engine/useLearner'

/**
 * ONE PIECE OF LOCAL KNOW-HOW (content/knowhow.ts): the title closed, the knowledge and the
 * line open, and the room that trains it. Compact for lists; `open` for a gem's card.
 */
export function KnowHowCard({ k, open: startOpen = false }: { k: KnowHow; open?: boolean }) {
  const [open, setOpen] = useState(startOpen)
  const room = k.room ? situationById(k.room) : undefined
  /* Obrigada, for a woman — the line in this learner's own ending (content/speaker.ts). */
  const line = said(k.line, useLearner().profile?.gender ?? null)
  return (
    <article data-testid="knowhow" className={'rounded-2xl border bg-bg-elev ' + (k.months ? 'border-[#c9973b]/60' : 'border-line')}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="tap-target flex w-full items-start gap-3 px-4 py-3 text-left">
        <span className="min-w-0 flex-1">
          <span className={'eyebrow block text-[0.6rem] ' + (k.months ? 'text-[#9a6b12]' : 'text-telha')}>{TOPIC_LABEL[k.topic]}</span>
          <span className="display block text-base leading-tight">{k.title}</span>
        </span>
        <span aria-hidden className="mt-1 text-muted">{open ? '−' : '+'}</span>
      </button>
      {open ? (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <p className="text-sm leading-relaxed">{k.body}</p>
          <div className="flex items-center gap-3 rounded-xl bg-accent/10 px-3 py-2">
            <AudioButton slug={slugFor(line.pt)} text={line.pt} size="sm" />
            <div className="min-w-0">
              <p className="lang text-base leading-snug text-accent" lang="pt-PT">
                {line.pt}
              </p>
              <p className="text-xs text-muted">{line.en}</p>
            </div>
          </div>
          {room ? (
            <Link href={'/errand/' + room.id} className="eyebrow self-start text-[0.65rem] text-accent underline underline-offset-4">
              Practise it: {room.title}
            </Link>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
