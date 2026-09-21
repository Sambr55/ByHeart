'use client'

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
      </div>
      <BottomNavSpace />
    </main>
  )
}
