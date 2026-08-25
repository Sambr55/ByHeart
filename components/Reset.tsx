'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LEGEND_FRAMES } from '@/content/legend'
import { PIECES } from '@/content/roots'
import { Wordmark } from '@/components/Wordmark'
import { learnerStorageKey, loadLearner, wipeLearner } from '@/engine/learner'

/**
 * Start again on this device.
 *
 * There was no way to do this on a phone. Progress lives in localStorage until somebody
 * signs in, signing in needs an email domain that is not verified yet, and clearing site
 * data on iOS is buried in Settings and takes everything else on the origin with it. So
 * anybody testing DUB — including the person who built it — had exactly one clean run
 * and no second one.
 *
 * Deliberately not in the menu. Progress on this device is the only copy there is until
 * an account exists, so a one-tap wipe sitting next to "Vocab library" is a trapdoor. It
 * is a URL you have to know: /reset. That is the right amount of friction for something
 * that cannot be undone.
 *
 * It says what it is about to destroy, in counts, before it destroys it — partly so
 * nobody wipes the wrong phone, and partly because a screen that says "are you sure?"
 * without saying "sure about what?" is not a confirmation.
 */
export function Reset() {
  const [state, setState] = useState<'reading' | 'ready' | 'done'>('reading')
  const [what, setWhat] = useState({ pieces: 0, proof: 0, sections: 0, legend: 0, key: '' })

  useEffect(() => {
    const s = loadLearner()
    setWhat({
      pieces: Object.keys(s.inventory ?? {}).filter((id) => PIECES[id]).length,
      proof: (s.proof ?? []).length,
      sections: (s.sections_completed ?? []).length,
      legend: (s.legend ?? []).filter((a) => Object.keys(a.values).length).length,
      key: learnerStorageKey(),
    })
    setState('ready')
  }, [])

  if (state === 'done') {
    return (
      <Frame>
        <div className="flex flex-1 flex-col justify-center gap-3">
          <p className="eyebrow text-accent">GONE</p>
          <h1 className="display text-balance text-3xl">This device is empty.</h1>
          <p className="text-sm leading-relaxed text-muted">
            Everything DUB had stored here has been deleted — pieces, sentences, sections,
            your Legend and the language pair. Nothing was sent anywhere and nothing was
            kept.
          </p>
        </div>
        <Link
          href="/"
          className="tap-target eyebrow block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
        >
          FROM THE TOP
        </Link>
      </Frame>
    )
  }

  const empty = !what.pieces && !what.proof && !what.sections && !what.legend

  return (
    <Frame>
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-accent">START AGAIN</p>
        <h1 className="display text-balance text-2xl">Wipe DUB from this device.</h1>
        <p className="text-sm leading-relaxed text-muted">
          For testing a clean first run. It deletes what is stored in this browser and
          nothing else — no account is touched, and if you have signed in on another
          device that copy is untouched too.
        </p>
      </div>

      {state === 'reading' ? null : empty ? (
        <div className="rounded border border-line bg-bg-elev px-4 py-3">
          <p className="text-sm font-semibold">There is nothing here yet.</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            This browser has no DUB progress stored, so you are already looking at a clean
            device.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 rounded border border-line-strong bg-bg-elev px-4 py-3">
          <p className="eyebrow text-muted">GOING FOR GOOD</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            <Row n={what.proof} one="sentence said cold" many="sentences said cold" />
            <Row n={what.pieces} one="piece kept" many="pieces kept" />
            <Row n={what.sections} one="section finished" many="sections finished" />
            <Row n={what.legend} one="Legend card" many="Legend cards" />
          </ul>
          <p className="mt-3 break-all text-[0.65rem] leading-relaxed text-muted">{what.key}</p>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3">
        <button
          type="button"
          data-testid="reset-confirm"
          disabled={state === 'reading'}
          onClick={() => {
            wipeLearner()
            setState('done')
          }}
          className="tap-target eyebrow w-full rounded bg-telha px-5 py-3 text-center text-bg disabled:opacity-40"
        >
          {empty ? 'CLEAR ANYWAY' : 'DELETE ALL OF IT'}
        </button>
        <Link
          href="/club"
          className="tap-target block text-center text-xs text-muted underline underline-offset-4"
        >
          No — take me back
        </Link>
      </div>
    </Frame>
  )
}

function Row({ n, one, many }: { n: number; one: string; many: string }) {
  return (
    <li className="flex items-baseline gap-3">
      <span className="w-6 shrink-0 tabular-nums font-semibold">{n}</span>
      <span className="text-muted">{n === 1 ? one : many}</span>
    </li>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main
      data-stage="REAL WORLD"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 pb-10 pt-6 text-fg"
    >
      <Wordmark className="h-3 text-muted" />
      {children}
    </main>
  )
}
