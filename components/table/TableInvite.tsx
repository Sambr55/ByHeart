'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { gemById } from '@/content/gems'
import { LEGEND_FRAMES, fillEnglish, fillFrame } from '@/content/legend'
import { ROUNDS, arriveLine, houseRule, inviteText, type Line } from '@/content/table-night'
import { setDisplayName } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'
import { track } from '@/engine/analytics'
import { Avatars, SayLine, whenText, type TableView } from './bits'

/** The learner's own Legend lines for the intro round — name, origin, why here — or the frames. */
export function myIntroLines(learner: ReturnType<typeof useLearner>): Line[] {
  const want = ['name', 'origin', 'why_here']
  const own: Line[] = []
  for (const id of want) {
    const frame = LEGEND_FRAMES.find((f) => f.id === id)
    const answer = learner.legend.find((a) => a.frame_id === id)
    if (frame && answer) own.push({ pt: fillFrame(frame, answer.values, learner.profile.gender), en: fillEnglish(frame, answer.values) })
  }
  if (!own.some((l) => /Chamo-me/.test(l.pt)) && learner.display_name) {
    own.unshift({ pt: 'Chamo-me ' + learner.display_name + '.', en: 'My name is ' + learner.display_name + '.' })
  }
  return own
}

/**
 * /t/[code] — THE INVITE, and the table's own page before the night (2026-11-03).
 *
 * A friend opens the host's link: who, where, when, the house rule, who else is coming, and
 * one button. Once in, the same page is their prep — the line for walking in, their own
 * introduction, a taste of each round — and the door to the live table. The host sees the
 * same, plus the invite to send again and a way to call it off.
 */
export function TableInvite({ code }: { code: string }) {
  const learner = useLearner()
  const [t, setT] = useState<TableView | null | 'missing'>(null)
  const [name, setName] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [sure, setSure] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(
    () =>
      fetch('/api/hosted/' + code, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : 'missing'))
        .then((d) => setT(d))
        .catch(() => setT('missing')),
    [code],
  )
  useEffect(() => {
    load()
  }, [load])

  const gem = t && t !== 'missing' && t.gem ? gemById(t.gem) : undefined
  const intro = useMemo(() => myIntroLines(learner), [learner])
  const who = name ?? learner.display_name ?? ''

  async function act(action: 'join' | 'leave' | 'off') {
    setBusy(true)
    setNote(null)
    try {
      const r = await fetch('/api/hosted/' + code, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, name: who.trim() }),
      })
      const d = (await r.json().catch(() => ({}))) as { out?: string }
      if (action === 'join') {
        if (d.out === 'full') setNote('This table is full — ask the host.')
        else if (d.out !== 'in') setNote('Could not join — try again.')
        else {
          if (!learner.display_name && who.trim()) setDisplayName(who.trim())
          track('table_joined', {})
        }
      }
      await load()
    } catch {
      setNote('No connection — try again.')
    } finally {
      setBusy(false)
    }
  }

  if (t === null) return <div className="booker min-h-svh" />
  if (t === 'missing' || !t.on) {
    return (
      <main className="booker flex min-h-svh flex-col items-start justify-center gap-4 px-6 text-[#f4ead6]">
        <p className="display text-3xl">{t === 'missing' ? 'This table isn’t here.' : 'This table has been called off.'}</p>
        <p className="text-white/70">Check the link with whoever sent it — or put one together yourself.</p>
        <Link href="/table" className="eyebrow rounded-2xl bg-[#e5b04a] px-5 py-3 text-[#0f1f33]">
          Host a table
        </Link>
      </main>
    )
  }

  const rule = houseRule(t.rule)
  const inside = t.in || t.hosting
  const url = (typeof window === 'undefined' ? '' : window.location.origin) + '/t/' + t.code

  return (
    <div data-stage="TABLE" className="min-h-svh bg-bg text-fg">
      <header className="booker safe-top px-5 pb-7 pt-6 text-[#f4ead6]">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <Link href="/table" className="eyebrow w-fit text-white/70">
            ← Your table
          </Link>
          <p className="eyebrow text-[#e5b04a]">{t.hosting ? 'You’re hosting' : t.host + ' is putting a table together'}</p>
          <h1 className="display text-4xl leading-[1.05]" data-testid="invite-place">
            {t.place}
          </h1>
          <p className="text-base text-white/85">{whenText(t.sitsAt)}</p>
          <div className="flex items-center gap-3">
            <Avatars names={t.people} dark />
            <p className="text-sm text-white/75" data-testid="invite-count">
              {t.people.length === 1 ? 'Just ' + t.host + ' so far' : t.people.slice(0, 3).join(', ') + (t.people.length > 3 ? ' and ' + (t.people.length - 3) + ' more' : '')}
            </p>
          </div>
          <div className="mt-1 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3">
            <p className="eyebrow text-[0.6rem] text-[#e5b04a]">House rule · {rule.name}</p>
            <p className="text-sm">{rule.rule}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-6 pb-16">
        {!inside ? (
          <section className="flex flex-col gap-3 rounded-3xl border-2 border-accent bg-bg-elev p-5" data-testid="invite-join">
            <p className="lang display text-2xl text-accent" lang="pt-PT">
              Vens?
            </p>
            <p className="text-sm text-muted">Are you coming? Tell {t.host} your name — that’s all it takes.</p>
            <input
              value={who}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Your first name"
              data-testid="invite-name"
              className="rounded-2xl border border-line bg-bg px-4 py-3 outline-none focus:border-accent"
            />
            {note ? <p className="text-sm text-telha">{note}</p> : null}
            <button
              type="button"
              disabled={!who.trim() || busy}
              onClick={() => act('join')}
              data-testid="invite-in"
              className="tap-target eyebrow rounded-2xl bg-accent px-5 py-4 text-accent-ink disabled:opacity-40"
            >
              <span lang="pt-PT">Conta comigo</span> · I’m in
            </button>
          </section>
        ) : null}
        {!inside ? (
          <section className="flex flex-col gap-2">
            <h2 className="eyebrow text-telha">The night, in five rounds</h2>
            <p className="text-sm text-muted">Everyone follows along on their own phone, every line with a voice. Nobody needs to be good at Portuguese — that’s the point.</p>
            <ol className="flex flex-wrap gap-2">
              {ROUNDS.map((r, i) => (
                <li key={r.id} className="rounded-full border border-line bg-bg-elev px-3 py-1.5 text-sm">
                  <span className="text-muted">{i + 1}</span> <span lang="pt-PT">{r.pt}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <>
            <Link
              href={'/t/' + t.code + '/live'}
              data-testid="invite-live"
              className="tap-target flex items-center justify-between rounded-3xl bg-accent px-5 py-5 text-accent-ink"
            >
              <span>
                <span className="eyebrow block text-[0.65rem] opacity-80">On the night</span>
                <span className="display block text-2xl">Open the table</span>
              </span>
              <span aria-hidden className="text-2xl">→</span>
            </Link>

            {t.hosting ? (
              <button
                type="button"
                onClick={async () => {
                  const text = inviteText({ host: t.host, place: t.place, when: whenText(t.sitsAt), rule: rule.id, url })
                  if (navigator.share) {
                    try {
                      await navigator.share({ text })
                      return
                    } catch {
                      /* fall through */
                    }
                  }
                  await navigator.clipboard?.writeText(text)
                  setCopied(true)
                }}
                className="tap-target eyebrow rounded-2xl border border-accent px-5 py-3 text-accent"
              >
                {copied ? 'Invite copied' : 'Invite more friends'}
              </button>
            ) : null}

            <section className="flex flex-col gap-3" data-testid="invite-prep">
              <div>
                <h2 className="eyebrow text-telha">Before the night</h2>
                <p className="text-sm text-muted">Your lines, with a voice. Hold the speaker for slow.</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="eyebrow text-[0.6rem] text-muted">Walking in to {t.place}</p>
                <ul>
                  <SayLine line={arriveLine(t.host, t.sitsAt)} />
                </ul>
                {gem ? (
                  <Link href={'/city?gem=' + gem.id} className="eyebrow text-[0.65rem] text-accent underline underline-offset-4">
                    See it on the map
                  </Link>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <p className="eyebrow text-[0.6rem] text-muted">Introducing yourself</p>
                <ul className="flex flex-col gap-2">
                  {(intro.length ? intro : ROUNDS[1].lines).map((l) => (
                    <SayLine key={l.pt} line={l} />
                  ))}
                </ul>
                {!intro.some((l) => /^Sou /.test(l.pt)) ? (
                  <Link href="/legend" className="eyebrow text-[0.65rem] text-accent underline underline-offset-4">
                    Make these yours in your Legend
                  </Link>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <p className="eyebrow text-[0.6rem] text-muted">Ordering, and the toast</p>
                <ul className="flex flex-col gap-2">
                  {[...ROUNDS[0].lines.slice(0, 1), ...ROUNDS[0].lines.slice(-1), ...ROUNDS[4].lines.slice(0, 1), ...ROUNDS[4].lines.slice(2, 3)].map((l) => (
                    <SayLine key={l.pt} line={l} />
                  ))}
                </ul>
              </div>
            </section>

            {!learner.set_up_at ? (
              <Link href="/start" className="rounded-2xl bg-surface px-4 py-4 text-sm">
                <span className="font-semibold">New to DUB?</span> Ten minutes of Basics — hello, numbers, thank you — and you’ll walk in sounding like you live here. <span className="text-accent">Start →</span>
              </Link>
            ) : null}

            {t.hosting ? (
              <button
                type="button"
                onClick={() => (sure ? act('off') : setSure(true))}
                className="eyebrow self-center text-[0.65rem] text-muted underline underline-offset-4"
              >
                {sure ? 'Tap again to call it off for everyone' : 'Call the table off'}
              </button>
            ) : (
              <button type="button" onClick={() => act('leave')} className="eyebrow self-center text-[0.65rem] text-muted underline underline-offset-4">
                I can’t make it after all
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}
