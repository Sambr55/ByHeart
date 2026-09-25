'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Back } from '@/components/Back'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { PurposeChoice, SoundChoice, ThemeChoice } from '@/components/Theme'

/**
 * Everything that is not the language.
 *
 * Yours had eleven things on one screen and no line between them. Membership, the account,
 * the feedback form, the theme and the sound all sat in the same column as the Portuguese
 * somebody had earned — so the screen that is supposed to say "here is what you have
 * built" was also the screen for cancelling your subscription.
 *
 * Sam: "Put everythiung that is not about Language (membership, account, feedback, etc
 * into a settings section accessible via a cog icon top right in YOURS", and then:
 * "ionclude appearance in that".
 *
 * THE LINE IS WHETHER IT IS PORTUGUESE. Proof, the vocab library and the drops stay on
 * Yours because each is a pile of language the learner made; membership, the account and
 * feedback are facts about a customer rather than a speaker, and the three choices are
 * facts about a copy of the app. Neither belongs beside a Legend.
 *
 * A COG RATHER THAN A SEVENTH ROW IN THE LIST, because a drawer with a settings row in it
 * is the burger this codebase already deleted once. The cog is where every phone puts it,
 * and it means Yours can be read top to bottom as one argument with nothing administrative
 * interrupting it.
 */

/**
 * The rows, in the order somebody needs them.
 *
 * Membership first because it is the one with money attached and the one people arrive
 * here to find; feedback last because it is the only row that is not about them.
 */
const ROWS = [
  { href: '/pro', label: 'Membership', hint: 'What it opens, and what the money is for' },
  { href: '/account', label: 'Account', hint: 'This device, codes, and your data' },
  { href: '/feedback', label: 'Feedback', hint: 'Tell us what did not land' },
]

export function Settings() {
  return (
    /*
      A PLAIN PAGE, like the three it links to.

      A first version used PageShell, which paints a blue bar across the top — and the
      back link inside it is `text-accent`, which is the same blue. So the one way off the
      screen was nearly invisible, and Settings was the only page in its own section
      wearing chrome: /account, /pro and /feedback are all a bare <main> on sand.

      safe-top for the same reason Account gives: no .bar here, so nothing else clears the
      notch.
    */
    <main className="safe-top mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 py-10 text-fg">
      <header className="flex items-center gap-3">
        <Back />
        <p className="eyebrow flex-1 truncate text-right text-muted">SETTINGS</p>
      </header>
      <BottomNav />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="display text-balance text-2xl">Settings</h1>
          {/*
            Says what is NOT here, because the useful fact about this screen is the
            boundary. Somebody looking for their words should not have to open three rows
            to find out they are on the previous screen.
          */}
          <p className="text-sm leading-relaxed text-muted">
            Your account and how the app behaves. The Portuguese you have earned is on
            Yours.
          </p>
        </div>

        <section className="flex flex-col">
          {ROWS.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              data-testid={'settings-' + r.label.toLowerCase()}
              className="tap-target flex items-baseline justify-between gap-3 border-b border-line/60 py-3 transition hover:text-accent"
            >
              <span className="min-w-0">
                <span className="display block text-sm">{r.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">{r.hint}</span>
              </span>
              <span aria-hidden className="shrink-0 text-muted">
                →
              </span>
            </Link>
          ))}
        </section>

        {/*
          APPEARANCE AND THE REST, under the rows rather than above them.

          These are the only controls on the screen that change something on the spot — the
          rows all navigate — so they read as the end of the list rather than as a header
          competing with it. Same order they had at the foot of Yours, so anybody who knew
          where they were still does.
        */}
        <section data-testid="settings-choices" className="flex flex-col border-t border-line pt-6">
          <ThemeChoice />
          <SoundChoice />
          <PurposeChoice />
        </section>

        <Crashes />
      </div>
      <BottomNavSpace />
    </main>
  )
}

/**
 * What broke, if anything did — the only place a crash on this device is readable.
 *
 * Sam hit the error screen mid-run and it showed nothing identifiable: `digest` is a
 * SERVER fact, and a client render throw has none, so the screenshot carried no evidence
 * at all. Four attempts to reproduce it from the outside found nothing, which is the cost
 * of an error screen that records nothing.
 *
 * app/error.tsx writes the last five here. This reads them back, and only appears when
 * there is something to show — an empty "no crashes" panel on a settings screen is an
 * invitation to worry about a thing that has not happened.
 *
 * Not sent anywhere. It is on the device, exactly like everything else about this
 * learner, and a photograph of it is enough to find the fault.
 */
function Crashes() {
  const [rows, setRows] = useState<
    {
      at: string
      where: string
      message: string
      digest: string | null
      stack?: string
      onScreen?: string
      pressed?: string
    }[]
  >([])

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('byheart.crashes') ?? '[]')
      setRows(Array.isArray(raw) ? raw : [])
    } catch {
      /* Storage unavailable, which is not itself worth reporting. */
    }
  }, [])

  if (!rows.length) return null

  return (
    <section
      data-testid="settings-crashes"
      className="flex flex-col gap-3 border-t border-line pt-6"
    >
      <div className="flex items-baseline gap-3">
        <h2 className="eyebrow min-w-0 flex-1 text-accent">WHAT BROKE</h2>
        <button
          type="button"
          data-testid="crashes-clear"
          onClick={() => {
            try {
              localStorage.removeItem('byheart.crashes')
            } catch {
              /* As above. */
            }
            setRows([])
          }}
          className="tap-target shrink-0 text-xs text-muted underline"
        >
          clear
        </button>
      </div>
      <p className="text-xs leading-relaxed text-muted">
        The last few times a screen failed to draw. Nothing here was sent anywhere — show
        this to whoever is fixing it.
      </p>
      <ul className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={i} className="flex flex-col gap-1 rounded border border-line p-3">
            <span className="eyebrow text-[0.6rem] text-muted">
              {r.at.slice(0, 16).replace('T', ' ')} · {r.where}
            </span>
            <span className="pt text-xs leading-relaxed">{r.message}</span>
            {r.digest ? (
              <span className="text-[0.6rem] text-muted">{r.digest}</span>
            ) : null}
            {/*
              THE STACK, WHICH IS THE ONLY PART THAT NAMES A FILE.

              "undefined is not an object (evaluating 'e.target')" is true of every
              minified handler in the bundle and identifies none of them — Sam's
              screenshot carried exactly that and it took four failed searches to admit
              the message alone is not a diagnosis.

              With productionBrowserSourceMaps on, this resolves to real file names, so a
              photograph of this block is an address rather than a symptom. Small, wrapped
              and scrollable, because it is for whoever is fixing it and nobody else.
            */}
            {/*
              WHAT WAS ON SCREEN. The stack is minified and Vercel will not serve the
              sourcemaps, so this is often the line that actually identifies the card.
            */}
            {r.pressed ? (
              <span className="text-[0.6rem] text-muted">last press: {r.pressed}</span>
            ) : null}
            {r.onScreen ? (
              <span className="text-[0.55rem] leading-relaxed text-muted">{r.onScreen}</span>
            ) : null}
            {r.stack ? (
              <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-all text-[0.55rem] leading-relaxed text-muted">
                {r.stack}
              </pre>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
