'use client'

import type { ReactNode } from 'react'
import { Back } from '@/components/Back'

/** Chrome for the objects that outlive a mission: the deck and the delayed recall. */
export function PageShell({
  eyebrow,
  stage = 'LISBON',
  back = '/profile',
  backLabel = 'YOURS',
  children,
}: {
  eyebrow: string
  stage?: string
  /** Where the arrow goes. These pages are all rooms inside something. */
  back?: string
  backLabel?: string
  children: ReactNode
}) {
  return (
    <div data-stage={stage} className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="bar sticky top-0 z-30 px-5 py-3">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          <Back href={back} label={backLabel} />
          <p className="eyebrow flex-1 truncate text-right">{eyebrow}</p>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto flex min-h-[calc(100svh-6rem)] w-full max-w-md flex-col px-5 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
