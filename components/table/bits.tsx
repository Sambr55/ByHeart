'use client'

import { AudioButton } from '@/components/AudioButton'
import { slugFor } from '@/content/audio-manifest'
import type { Line } from '@/content/table-night'

/** Shared by the table screens: the shape a table travels in over the wire. */
export interface TableView {
  code: string
  host: string
  gem: string | null
  place: string
  sitsAt: string
  rule: string
  round: number
  on: boolean
  hosting: boolean
  in: boolean
  people: string[]
}

export function whenText(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) +
    ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

export function shortWhen(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

/** One line to say: a voice, the Portuguese, the English. `dark` for the live table. */
export function SayLine({ line, dark = false }: { line: Line; dark?: boolean }) {
  const speakable = line.pt.replace(/…/g, '').replace(/\s+([.?!])/g, '$1').trim()
  return (
    <li className={'flex items-center gap-3 rounded-2xl px-3 py-2.5 ' + (dark ? 'bg-white/[0.07]' : 'bg-accent/10')}>
      <AudioButton slug={slugFor(speakable)} text={speakable} size="sm" />
      <div className="min-w-0">
        <p className={'lang text-base leading-snug ' + (dark ? 'text-[#f4ead6]' : 'text-accent')} lang="pt-PT">
          {line.pt}
        </p>
        <p className={'text-xs ' + (dark ? 'text-white/60' : 'text-muted')}>{line.en}</p>
      </div>
    </li>
  )
}

export function Avatars({ names, dark = false }: { names: string[]; dark?: boolean }) {
  return (
    <div className="flex items-center">
      {names.slice(0, 8).map((n, i) => (
        <span
          key={i + n}
          title={n}
          className={
            'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold ' +
            (i ? '-ml-2 ' : '') +
            (dark ? 'border-[#0f1f33] bg-[#e5b04a] text-[#0f1f33]' : 'border-bg-elev bg-telha text-white')
          }
        >
          {n.trim().charAt(0).toUpperCase() || '·'}
        </span>
      ))}
      {names.length > 8 ? <span className={'ml-2 text-xs ' + (dark ? 'text-white/70' : 'text-muted')}>+{names.length - 8}</span> : null}
    </div>
  )
}
