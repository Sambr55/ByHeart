'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Back } from '@/components/Back'
import { Framed } from '@/components/Dock'
import { useScreenIn } from '@/components/Native'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'

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
  const arriving = useScreenIn(usePathname())

  return (
    <div data-stage={stage} className="app-frame bg-bg text-fg">
      <header className="bar sticky top-0 z-30 px-5 py-3">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          <Back href={back} label={backLabel} />
          <p className="eyebrow flex-1 truncate text-right">{eyebrow}</p>
        </div>
      </header>
      {/* One unit, no constants. See the same change in Journey's Shell. */}
      {/* One scrolling region, dock beneath it. See components/Dock.tsx. */}
      <Framed className="flex flex-col">
        {/* The same arrival the beats use, keyed on the route. */}
        <div ref={arriving} className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-6">
          {children}
        </div>
      </Framed>
      <BottomNav />
    </div>
  )
}
