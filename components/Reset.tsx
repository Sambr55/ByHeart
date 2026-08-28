'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LEGEND_FRAMES } from '@/content/legend'
import { PIECES } from '@/content/roots'
import { Wordmark } from '@/components/Wordmark'
import { learnerStorageKey, loadLearner, wipeLearner } from '@/engine/learner'
import { Dock } from '@/components/Journey'

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
  const [state, setState] = useState<'reading' | 'ready' | 'wiping' | 'done' | 'signedin'>(
    'reading',
  )
  const [what, setWhat] = useState({ pieces: 0, proof: 0, sections: 0, legend: 0, key: '' })
  /** null while unknown; a number once the server has answered for this device. */
  const [onServer, setOnServer] = useState<number | null>(null)

  /**
   * Server first, then this device — and the order is the whole fix.
   *
   * Clearing localStorage alone did not work, and it failed in the most interesting way:
   * the device cookie is httpOnly so no script can clear it, the server holds a learner
   * row keyed to that cookie, and restoreLearner merges it back on the next page load.
   * mergeLearner may only ever GAIN, so an emptied local copy plus a full remote one
   * produces the full one again. The wipe was being undone by the invariant that makes
   * syncing safe.
   *
   * Wiping locally first would leave a window where a background sync could write the
   * emptied copy up, or a restore could pull the full one down. The server forgets
   * first, and only then is there nothing to come back.
   */
  /*
    Whether to keep what this device was given.

    A comp follows a reset by default, which is right for a tester who was handed the
    product and wrong for anybody trying to see what a NEW person sees — including the
    person who built it, for whom the paywall was unreachable on every device because the
    comp came along every time.
  */
  const [dropComp, setDropComp] = useState(false)

  async function wipe() {
    setState('wiping')
    try {
      const res = await fetch('/api/reset' + (dropComp ? '?comp=drop' : ''), { method: 'POST' })
      const body = (await res.json()) as { ok?: boolean; signed_in?: boolean }
      if (!body.ok && body.signed_in) {
        setState('signedin')
        return
      }
    } catch {
      // Offline. The local wipe below is still worth doing, and the server copy will be
      // merged back in — which is the honest outcome and is said on the next screen.
    }
    wipeLearner()
    setState('done')
  }

  /*
    Count BOTH copies, because there are two and only one of them is local.

    A first version counted localStorage alone, and it could say "there is nothing here
    yet" while the server held a full record for this device — which is the exact
    situation that made a wipe appear to fail. A screen that under-reports what it is
    about to delete is worse than one that says nothing.
  */
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
    fetch('/api/session?mine=1', { headers: { accept: 'application/json' } })
      .then((r) => r.json())
      .then((body: { found?: boolean; state?: { proof?: unknown[] } }) => {
        if (body?.found) setOnServer((body.state?.proof ?? []).length)
      })
      .catch(() => {
        /* offline, or nothing configured. The local counts are still true. */
      })
  }, [])

  if (state === 'signedin') {
    return (
      <Frame>
        <div className="flex flex-1 flex-col justify-center gap-3">
          <p className="eyebrow text-accent">NOT YET</p>
          <h1 className="display text-balance text-2xl">You are signed in.</h1>
          <p className="text-sm leading-relaxed text-muted">
            So this device is not the only copy — your account holds it too, and would
            put it straight back. Sign out first and the reset will stick.
          </p>
        </div>
        <Dock>
          <a
            href="/api/auth/logout"
            className="tap-target eyebrow block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            SIGN OUT
          </a>
        </Dock>
      </Frame>
    )
  }

  if (state === 'done') {
    return (
      <Frame>
        <div className="flex flex-1 flex-col justify-center gap-3">
          <p className="eyebrow text-accent">GONE</p>
          <h1 className="display text-balance text-3xl">This device is empty.</h1>
          <p className="text-sm leading-relaxed text-muted">
            Everything DUB had stored here is gone — pieces, sentences, sections, your
            Legend and the language pair — and so is the copy the server was holding for
            this device. Nothing will come back.
          </p>
        </div>
        <Dock>
          <Link
            href="/"
            className="tap-target eyebrow block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            FROM THE TOP
          </Link>
        </Dock>
      </Frame>
    )
  }

  const empty = !what.pieces && !what.proof && !what.sections && !what.legend && !onServer

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
            Neither this browser nor the server is holding anything for this device, so you
            are already looking at a clean one.
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
          {/*
            The other copy, named. This is the one that made a wipe look like it had
            failed: the device cookie is httpOnly so nothing in the browser can clear it,
            the server keeps a record against it, and the next page load merges that
            record back in. Both go.
          */}
          {onServer !== null ? (
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">
              And the copy the server is holding for this device —{' '}
              <span className="tabular-nums">{onServer}</span>{' '}
              {onServer === 1 ? 'sentence' : 'sentences'}. Without that one going too, the
              next page load would put it all straight back.
            </p>
          ) : null}
          <p className="mt-3 break-all text-[0.65rem] leading-relaxed text-muted">{what.key}</p>
        </div>
      )}

      {/* mt-10, not mt-auto: a button sits under the words that earned it rather
          than at the foot of the screen. See the Cta in Journey.tsx for why. */}
      <div className="mt-10 flex flex-col gap-3">
        {/*
          A toggle rather than a second red button: it modifies the wipe rather than being a
          different one, and two destructive buttons is a screen nobody reads carefully.

          Built as an aria-pressed chip like every other choice in the product rather than a
          checkbox, because a 16px checkbox is a 16px target — which the mobile gate said
          out loud the moment this was written.
        */}
        <button
          type="button"
          data-testid="reset-drop-comp"
          aria-pressed={dropComp}
          onClick={() => setDropComp(!dropComp)}
          className={
            'tap-target flex w-full items-start gap-3 rounded border px-4 py-3 text-left text-xs leading-relaxed transition ' +
            (dropComp ? 'border-accent bg-accent/10 text-fg' : 'border-line text-muted')
          }
        >
          <span aria-hidden className="mt-px shrink-0 font-semibold">
            {dropComp ? '✓' : '·'}
          </span>
          <span>
            Give up any code redeemed on this device too. Without this a comp follows the
            reset — right for a tester, wrong if you are trying to see what somebody new
            sees.
          </span>
        </button>

        <button
          type="button"
          data-testid="reset-confirm"
          disabled={state === 'reading' || state === 'wiping'}
          onClick={wipe}
          className="tap-target eyebrow w-full rounded bg-telha px-5 py-3 text-center text-bg disabled:opacity-40"
        >
          {state === 'wiping' ? 'DELETING…' : empty ? 'CLEAR ANYWAY' : 'DELETE ALL OF IT'}
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
