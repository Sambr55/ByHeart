'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Back } from '@/components/Back'
import { loadLearner } from '@/engine/learner'

/**
 * What this device is holding, said plainly.
 *
 * Three reports in a row described behaviour I could not reproduce on the deployed site,
 * and the missing fact every time was which build the phone was running and what was in
 * its record. Symptoms cannot tell those apart: "showing all events again" looks identical
 * whether the filter is broken or the device has finished all of them.
 *
 * So this prints the two things a screenshot cannot: the commit that served the page, and
 * the fields those screens actually read.
 */
export function WhatAmI({ sha, built }: { sha: string; built: string }) {
  const [rows, setRows] = useState<{ k: string; v: string }[] | null>(null)

  useEffect(() => {
    const me = loadLearner()
    const finished = me.finished_cards ?? []
    setRows([
      { k: 'build', v: sha.slice(0, 7) + (built ? ' — ' + built.split('\n')[0].slice(0, 60) : '') },
      { k: 'name', v: me.display_name ?? '(none)' },
      { k: 'chapter', v: String(me.chapter ?? '(none)') },
      { k: 'sittings', v: String(me.sittings ?? 0) },
      { k: 'sections done', v: (me.sections_completed ?? []).join(', ') || '(none)' },
      { k: 'roots played', v: String((me.roots_played ?? []).length) },
      { k: 'proof lines', v: String((me.proof ?? []).length) },
      { k: 'words banked', v: String(Object.keys(me.inventory ?? {}).length) },
      { k: 'legend answers', v: String((me.legend ?? []).length) },
      /*
        The one that answers "why am I seeing all the events".

        NIGHTS OUT is finished_cards filtered to drop rooms, so a long list here is the
        honest reason a screen looks full — and the only way to tell that apart from a
        broken filter is to read it.
      */
      { k: 'finished cards', v: String(finished.length) },
      { k: '  of which drops', v: String(finished.filter((id) => /^lisbon_/.test(id)).length) },
      { k: '  the drop ones', v: finished.filter((id) => /^lisbon_/.test(id)).join(', ') || '(none)' },
      { k: 'saved', v: String((me.saved ?? []).length) },
      { k: 'photo', v: localStorage.getItem('byheart.avatar.v1') ? 'yes' : 'no' },
    ])
  }, [sha, built])

  return (
    <main className="safe-top mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 py-10 text-fg">
      <header className="flex items-center gap-3">
        <Back />
        <p className="eyebrow flex-1 truncate text-right text-muted">WHAT AM I RUNNING</p>
      </header>

      <h1 className="display text-balance text-2xl">What am I running.</h1>
      <p className="text-sm leading-relaxed text-muted">
        The build that served this page, and what this phone is holding. Send a screenshot
        of this when something looks wrong.
      </p>

      {rows ? (
        <dl className="flex flex-col" data-testid="whatami">
          {rows.map((r) => (
            <div key={r.k} className="flex flex-col gap-1 border-b border-line/60 py-3">
              <dt className="eyebrow text-muted">{r.k}</dt>
              <dd className="break-all text-sm">{r.v}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/*
        A way to get a clean slate without clearing site data by hand, which on iOS also
        takes the photo and every other origin's storage with it.
      */}
      <Link
        href="/reset"
        className="tap-target eyebrow w-full rounded border border-line px-5 py-3 text-center text-muted"
      >
        START AGAIN
      </Link>
    </main>
  )
}
