/**
 * The path's glyphs. Stroked at 24 like the bar's, so they sit with the rest of DUB.
 * All decorative: every control that carries one also carries words or an aria-label.
 */
type P = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function PlayIcon({ className = 'h-5 w-5' }: P) {
  return (
    <svg {...base} className={className} fill="currentColor" stroke="none">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
    </svg>
  )
}

export function LockIcon({ className = 'h-5 w-5' }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function CheckIcon({ className = 'h-5 w-5' }: P) {
  return (
    <svg {...base} className={className} strokeWidth={3}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function StarIcon({ className = 'h-4 w-4', filled = false }: P & { filled?: boolean }) {
  return (
    <svg {...base} className={className} fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </svg>
  )
}

export function FlameIcon({ className = 'h-5 w-5', filled = false }: P & { filled?: boolean }) {
  return (
    <svg {...base} className={className} fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8}>
      <path d="M12 21c-3.9 0-7-2.8-7-6.6 0-3.1 2-5.2 3.6-6.9.3 1.7 1.2 2.9 2.4 3.4C11 7.6 12.3 5 14.6 3c.3 2.6 1.6 4.2 2.9 5.8C18.8 10.4 19 12 19 14.4 19 18.2 15.9 21 12 21z" />
    </svg>
  )
}

export function MicIcon({ className = 'h-5 w-5' }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  )
}

/** One glyph per kind of room, for a node with no photograph. */
export function KindIcon({ kind, className = 'h-7 w-7' }: P & { kind: string }) {
  const d: Record<string, string> = {
    place: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    errand: 'M6 7h12l-1 13H7zM9 7V5.5a3 3 0 0 1 6 0V7',
    person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
    moment: 'M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 10h16M8 4v4M16 4v4',
  }
  return (
    <svg {...base} className={className} strokeWidth={1.8}>
      <path d={d[kind] ?? d.place} />
    </svg>
  )
}

/**
 * A speech bubble — the understood tally. Said out loud, and heard. Filled once there is
 * at least one, the way the flame fills on a day that counts.
 */
export function SpeechIcon({ className = 'h-5 w-5', filled = false }: P & { filled?: boolean }) {
  return (
    <svg {...base} className={className} fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8}>
      <path d="M4 12.5C4 8.4 7.6 5 12 5s8 3.4 8 7.5S16.4 20 12 20c-1.2 0-2.4-.2-3.4-.7L4.5 20.5l1.2-3.4C4.6 15.8 4 14.2 4 12.5z" />
    </svg>
  )
}

/** A door ajar — "My opening line", the line for walking in. */
export function DoorIcon({ className = 'h-5 w-5' }: P) {
  return (
    <svg {...base} className={className} strokeWidth={1.8}>
      <path d="M4 21h16M6 21V4h9v17" />
      <path d="M15 4l4 2v15" />
      <path d="M12 12.5v.5" />
    </svg>
  )
}
