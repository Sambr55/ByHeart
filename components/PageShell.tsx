'use client'

import type { ReactNode } from 'react'

/** Chrome for the objects that outlive a mission: the deck and the delayed recall. */
export function PageShell({
  eyebrow,
  stage = 'LISBON',
  children,
}: {
  eyebrow: string
  stage?: string
  children: ReactNode
}) {
  return (
    <div data-stage={stage} className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/90 px-5 py-3 backdrop-blur">
        <div className="mx-auto w-full max-w-md">
          <p className="eyebrow text-accent">{eyebrow}</p>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col px-5 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
