'use client'

import { useEffect, useState } from 'react'
import { track } from '@/engine/analytics'
import { PushToggle } from '@/components/PushToggle'

/**
 * NOTIFICATIONS, in Settings (2026-11-04).
 *
 * Before this phone has said yes: the one switch (PushToggle), which on an iPhone in a
 * browser tab explains the Home Screen rule instead. After: three choices and no more —
 * how often the morning line comes, whether Monday's place in Lisbon comes, whether table
 * news comes. Nothing about streaks, nothing about "reminders": the line is worth reading
 * on the lock screen or it is not sent.
 *
 * Saved straight away, against this phone's own subscription (/api/push/subscribe PATCH),
 * because a phone has its own subscription and a second phone may want something else.
 */
type Cadence = 'daily' | 'three' | 'off'
type Topic = 'week' | 'table'

const READY = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)

const CADENCE: { id: Cadence; label: string }[] = [
  { id: 'daily', label: 'Every day' },
  { id: 'three', label: '3 a week' },
  { id: 'off', label: 'Off' },
]

const TOPIC: { id: Topic; label: string; note: string }[] = [
  {
    id: 'week',
    label: 'This week in Lisbon',
    note: 'Monday mid-morning: one place and the line for it.',
  },
  {
    id: 'table',
    label: 'Your tables',
    note: 'Who is coming, and a nudge a few hours before.',
  },
]

export function PushChoices() {
  const [on, setOn] = useState(false)
  const [endpoint, setEndpoint] = useState<string | null>(null)
  const [cadence, setCadence] = useState<Cadence>('daily')
  const [topics, setTopics] = useState<Topic[]>(['week', 'table'])
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const [blocked, setBlocked] = useState(false)
  useEffect(() => {
    setBlocked('Notification' in window && Notification.permission === 'denied')
  }, [])

  useEffect(() => {
    if (!on) return
    let gone = false
    navigator.serviceWorker
      ?.getRegistration()
      .then((reg) => reg?.pushManager.getSubscription() ?? null)
      .then(async (sub) => {
        if (!sub || gone) return
        setEndpoint(sub.endpoint)
        const res = await fetch('/api/push/subscribe?endpoint=' + encodeURIComponent(sub.endpoint))
        const got = (await res.json()) as {
          found: boolean
          cadence?: Cadence
          topics?: Topic[]
        }
        if (gone || !got.found) return
        if (got.cadence) setCadence(got.cadence)
        if (got.topics) setTopics(got.topics)
      })
      .catch(() => {})
    return () => {
      gone = true
    }
  }, [on])

  const save = async (next: { cadence?: Cadence; topics?: Topic[] }) => {
    if (!endpoint) return
    setSaved('saving')
    try {
      const res = await fetch('/api/push/subscribe', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint, ...next }),
      })
      setSaved(res.ok ? 'saved' : 'failed')
      if (res.ok) track('push_prefs', next)
    } catch {
      setSaved('failed')
    }
  }

  return (
    <section
      data-testid="settings-push"
      className="flex flex-col gap-5 rounded-2xl border border-line bg-bg-elev px-5 py-6"
    >
      <div className="flex flex-col gap-1">
        <p className="eyebrow text-muted">ON YOUR LOCK SCREEN</p>
        <p className="text-sm leading-relaxed text-muted">
          The next line on your path, at 8 in the morning. Tap it and you are in that room.
        </p>
      </div>

      {blocked ? (
        <p className="text-xs leading-relaxed text-muted" data-testid="push-blocked">
          Notifications for DUB are switched off on this phone. To have them, allow them for DUB in your phone’s
          Settings, under Notifications, then come back here.
        </p>
      ) : !on ? (
        <PushToggle ready={READY} from="settings" onChange={setOn} />
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <p className="eyebrow text-muted">YOUR NEXT LINE</p>
            <div role="group" aria-label="How often" className="flex gap-1">
              {CADENCE.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  data-testid={'push-cadence-' + c.id}
                  aria-pressed={cadence === c.id}
                  onClick={() => {
                    setCadence(c.id)
                    void save({ cadence: c.id })
                  }}
                  className={
                    'tap-target flex-1 rounded border px-2 py-1 text-[0.6rem] uppercase tracking-wider transition ' +
                    (cadence === c.id
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line text-muted hover:text-fg')
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {TOPIC.map((t) => {
            const yes = topics.includes(t.id)
            return (
              <label key={t.id} className="flex cursor-pointer items-start gap-3" data-testid={'push-topic-' + t.id}>
                <input
                  type="checkbox"
                  checked={yes}
                  onChange={() => {
                    const next = yes ? topics.filter((x) => x !== t.id) : [...topics, t.id]
                    setTopics(next)
                    void save({ topics: next })
                  }}
                  className="mt-1 h-4 w-4 accent-[var(--accent)]"
                />
                <span className="flex flex-col">
                  <span className="text-sm">{t.label}</span>
                  <span className="text-xs leading-snug text-muted">{t.note}</span>
                </span>
              </label>
            )
          })}

          <p className="text-xs text-muted" aria-live="polite" data-testid="push-saved">
            {saved === 'saving'
              ? 'Saving…'
              : saved === 'saved'
                ? 'Saved.'
                : saved === 'failed'
                  ? 'That did not save. Try again in a moment.'
                  : 'Three a week is Monday, Wednesday and Friday. Never the same line twice.'}
          </p>
        </>
      )}
    </section>
  )
}

/**
 * THE ASK, at the moment it is most likely to be wanted: you have just said a room out
 * loud, and the next one is waiting — and on the path home. Once dismissed it waits three
 * days, and after four dismissals it stops asking — Settings still has the switch.
 *
 * Hidden where it cannot work (no push on the server, or permission already refused) and
 * where it is already on. On an iPhone in a browser tab PushToggle explains the Home Screen
 * rule instead, which is the one thing worth knowing there.
 */
const ASK_KEY = 'dub.push.ask'

function askRecord(): { n: number; at: number } {
  try {
    const r = JSON.parse(localStorage.getItem(ASK_KEY) ?? '{}')
    return { n: Number(r.n) || 0, at: Number(r.at) || 0 }
  } catch {
    return { n: 0, at: 0 }
  }
}

function writeAsk(rec: { n: number; at: number }) {
  try {
    localStorage.setItem(ASK_KEY, JSON.stringify(rec))
  } catch {
    /* Private mode: it may ask again next time, which is the lesser evil. */
  }
}

export function PushAsk({ room }: { room: string }) {
  const [show, setShow] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!READY) return
    const rec = askRecord()
    if (rec.n >= 4 || Date.now() - rec.at < 3 * 86_400_000) return
    const reveal = () => {
      setShow(true)
      track('push_ask_shown', { room })
    }
    if (!('Notification' in window) || Notification.permission === 'default') return reveal()
    if (Notification.permission === 'denied') return
    // Allowed before, but is this phone actually subscribed?
    navigator.serviceWorker
      ?.getRegistration()
      .then((reg) => reg?.pushManager.getSubscription() ?? null)
      .then((sub) => {
        if (!sub) reveal()
      })
      .catch(() => {})
  }, [room])

  if (!show) return null

  return (
    <div data-testid="push-ask" className="flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent/5 px-5 py-5">
      <p className="eyebrow text-accent">Your next line, on your lock screen</p>
      <p className="text-sm leading-relaxed">
        A phrase sticks when you meet it again before you need it. One line at 8 each morning, from the room
        you’re on. Tap it and you’re in.
      </p>
      <PushToggle
        ready={READY}
        from={room === 'path' ? 'path' : 'room'}
        buttonClass="tap-target eyebrow w-full rounded-full bg-accent px-5 py-3 text-center text-accent-ink"
        on="Done. Your next line comes at 8. How often is up to you, in Settings."
        onChange={(yes) => {
          if (!yes) return
          writeAsk({ n: 4, at: Date.now() })
          setDone(true)
        }}
      />
      {done ? null : (
        <button
          type="button"
          data-testid="push-ask-later"
          onClick={() => {
            const rec = askRecord()
            writeAsk({ n: rec.n + 1, at: Date.now() })
            track('push_ask_dismissed', { room })
            setShow(false)
          }}
          className="tap-target eyebrow text-[0.6rem] text-muted"
        >
          Not now
        </button>
      )}
    </div>
  )
}

/**
 * Can this phone be offered the morning line at all? Push on the server, and either a
 * browser that can ask, or an iPhone in a Safari tab, which can be told how.
 */
export function canOfferPush(): boolean {
  if (!READY || typeof window === 'undefined') return false
  if ('Notification' in window) return Notification.permission !== 'denied'
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document)
}

/**
 * THE LAST STEP OF SET-UP (Sam, 2026-11-04): "We need to make this more prominent, it's
 * buried … it's important. Should be part of set-up and be shown as a valuable part of
 * learning."
 *
 * So it is on the boarding pass, after the name and before the city: the next line from
 * the path the booker just drew, on a drawing of a lock screen, and the reason it is worth
 * saying yes to — meeting a line again before you need it is how it sticks. One big yes,
 * and a quiet way past it. Settings keeps the switch for later.
 */
export function MorningLineStep({
  line,
  onDone,
}: {
  line: { title: string; body: string } | null
  onDone: () => void
}) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    track('push_ask_shown', { room: 'setup' })
  }, [])
  const shown = line ?? { title: 'Bom dia. Um café, por favor.', body: 'Good morning. A coffee, please.' }
  return (
    <div data-testid="setup-line" className="booker -mx-5 -mt-6 min-h-svh px-5 pb-10 pt-8 text-white">
      <p className="eyebrow text-white/60">DUB · Before you board</p>
      <h1 className="display mt-2 text-3xl leading-tight">Your line, every morning</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/75">
        A phrase sticks when you meet it again before you need it. So at 8 each morning DUB puts the next line from
        your path on your lock screen. Read it on the way out, and it’s yours by the time you get there.
      </p>

      {/* The lock screen, drawn: the time, and the real line this learner would get tomorrow. */}
      <div
        aria-hidden
        className="mx-auto mt-7 w-full max-w-[19rem] rounded-[2.2rem] border border-white/15 bg-gradient-to-b from-[#1f5d8c] to-[#0f1f33] px-4 pb-8 pt-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]"
      >
        <p className="text-center text-xs text-white/70">Tomorrow</p>
        <p className="text-center text-5xl font-semibold tracking-tight">8:00</p>
        <div className="mt-6 rounded-2xl bg-white/90 px-3 py-3 text-[#14243a] shadow-lg">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#1f5d8c] text-[0.5rem] font-bold text-white">
              DUB
            </span>
            <span className="eyebrow text-[0.55rem] text-[#14243a]/60">DUB · now</span>
          </div>
          <p className="pt mt-2 text-[0.95rem] font-semibold leading-snug" lang="pt-PT" data-testid="setup-line-pt">
            {shown.title}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-[#14243a]/70">{shown.body}</p>
        </div>
      </div>

      <ul className="mx-auto mt-6 flex max-w-[19rem] flex-col gap-2 text-sm text-white/80">
        <li>· One line, from the room you’re on. Tap it and you’re in that room.</li>
        <li>· Never the same line twice. No streaks, no nagging.</li>
        <li>· Every day, three a week, or off. Change it any time in Settings.</li>
      </ul>

      <div className="mt-8 flex flex-col gap-3">
        <PushToggle
          ready={READY}
          from="setup"
          cta="YES, SEND MY LINE AT 8AM"
          on="Done. Your first line comes tomorrow at 8."
          install="Your line on your lock screen, every morning."
          onChange={setOn}
          buttonClass="tap-target eyebrow flex w-full items-center justify-center rounded-2xl bg-[#e5b04a] px-5 py-4 text-base text-[#14243a] shadow-[0_6px_0_0_rgba(0,0,0,0.35)] transition active:translate-y-[4px] active:shadow-none"
          onClass="text-center text-sm font-semibold text-[#e5b04a]"
        />
        <button
          type="button"
          data-testid="setup-line-next"
          onClick={() => {
            if (!on) {
              track('push_ask_dismissed', { room: 'setup' })
              writeAsk({ n: askRecord().n + 1, at: Date.now() })
            }
            onDone()
          }}
          className={
            on
              ? 'tap-target eyebrow flex w-full items-center justify-center rounded-2xl bg-[#e5b04a] px-5 py-4 text-base text-[#14243a] shadow-[0_6px_0_0_rgba(0,0,0,0.35)]'
              : 'tap-target eyebrow py-2 text-center text-xs text-white/60'
          }
        >
          {on ? 'Board' : 'Not now, take me in'}
        </button>
      </div>
    </div>
  )
}
