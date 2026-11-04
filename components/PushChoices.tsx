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
 * loud, and the next one is waiting. Once dismissed it waits a fortnight, and after three
 * dismissals it stops asking — Settings still has the switch.
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
    if (rec.n >= 3 || Date.now() - rec.at < 14 * 86_400_000) return
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
    <div data-testid="push-ask" className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-5">
      <p className="text-sm leading-relaxed">
        Want the next one on your lock screen? One line at 8 in the morning, from the room you are on.
      </p>
      <PushToggle
        ready={READY}
        from="room"
        on="Done. Your next line comes at 8. How often is up to you, in Settings."
        onChange={(yes) => {
          if (!yes) return
          writeAsk({ n: 3, at: Date.now() })
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
