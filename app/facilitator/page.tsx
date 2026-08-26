'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { Diagnostic } from '@/components/Diagnostic'
import { MISSIONS, MISSION_ORDER } from '@/content/missions'
import { BLOCK_ORDER, REINFORCED_IN_BOND, TARGETS } from '@/content/targets'
import { downloadSession } from '@/engine/analytics'
import {
  encodeLearner,
  getLearner,
  hoursSinceLastMission,
  hydrateFromUrl,
  loadLearner,
  resetLearner,
} from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'

/**
 * Facilitator console. Not part of any tester's session — this is the page the
 * observer keeps open between runs: which arm this tester is in, what state their
 * phone is carrying, the resume link for the 24–72 hour recall, and a reset before
 * handing the phone on.
 *
 * The roast-test protocol (§11) says the facilitator explains nothing. Everything
 * they might need to say instead lives here.
 */
export default function FacilitatorPage() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    hydrateFromUrl()
    loadLearner()
    setReady(true)
  }, [])
  const learner = useLearner()

  if (!ready) return <PageShell eyebrow="FACILITATOR">{null}</PageShell>

  const owned = BLOCK_ORDER.filter((b) => learner.inventory[b])
  const strengthened = owned.filter(
    (b) => (learner.inventory[b]?.reinforced_sources.length ?? 0) > 0,
  )
  const origin = typeof window === 'undefined' ? '' : window.location.origin

  return (
    <PageShell eyebrow="FACILITATOR" stage="PRE-FLIGHT">
      {/*
        First, because it is the only part anybody currently opens this page for.

        Everything below it reports the mission-era model DUB left behind — blocks, arms,
        cohorts — and is stale in the way journey-smoke was stale: nothing points at it,
        so nothing noticed.
      */}
      <Diagnostic />
      <h1 className="display text-3xl">Session console</h1>
      <p className="mt-3 text-sm text-muted">
        Nothing here is shown to a tester. Say only: “Use this as you would if someone
        sent you the link. I will not help unless the product breaks.”
      </p>

      <Section title="This tester">
        <Row k="Tester" v={learner.tester_label || '(unlabelled)'} />
        <Row k="Learner" v={learner.learner_id.slice(0, 8)} />
        <Row k="Arm" v={learner.experiment.test_variant} />
        <Row k="Condition" v={learner.experiment.same_or_delayed} />
        <Row k="Cohort" v={learner.experiment.cohort_tag || '—'} />
        <Row
          k="Missions done"
          v={learner.missions_completed.join(', ') || 'none'}
        />
        <Row
          k="Since last"
          v={hoursSinceLastMission() === null ? '—' : hoursSinceLastMission() + ' h'}
        />
        <Row k="Blocks owned" v={owned.length + ' / ' + BLOCK_ORDER.length} />
        <Row
          k="Strengthened"
          v={strengthened.length + ' / ' + REINFORCED_IN_BOND.length}
        />
      </Section>

      <TesterLinks />

      <Section title="Start a run">
        <div className="flex items-center justify-between gap-3 py-1">
          <span className="text-sm font-semibold">DUB journey (v0.6)</span>
          <span className="flex gap-3">
            <Pill href="/">open</Pill>
            <Pill href="/?tester=demo">as “demo”</Pill>
          </span>
        </div>
        {MISSION_ORDER.map((id) => (
          <div key={id} className="flex items-center justify-between gap-3 py-1">
            <span className="text-sm">{MISSIONS[id].property_label}</span>
            <span className="flex gap-3">
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 py-1">
          <span className="text-sm">Deck / delayed recall</span>
          <span className="flex gap-3">
          </span>
        </div>
        <p className="mt-3 text-xs text-muted">
          The arm is set from the URL and then remembered. Add <code>?cohort=…</code> to
          tag a batch.
        </p>
      </Section>

      <Section title="Inventory">
        <div className="grid grid-cols-2 gap-1">
          {owned.length ? (
            owned.map((b) => (
              <div key={b} className="rounded border border-line bg-chip px-2 py-1">
                <span className="pt block text-xs">{TARGETS[b].label}</span>
                <span className="block text-[0.6rem] text-muted">
                  {learner.inventory[b]?.latest_state}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted">Nothing acquired yet.</p>
          )}
        </div>
      </Section>

      <Section title="Hand-off">
        <textarea
          readOnly
          rows={3}
          value={origin + '/recall?t=' + encodeLearner(learner)}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded border border-line bg-bg-elev p-2 font-mono text-[0.6rem] text-muted"
        />
        <button
          type="button"
          onClick={() => downloadSession({ learner: getLearner() })}
          className="tap-target eyebrow mt-3 w-full rounded border border-line px-3 py-3 text-fg"
        >
          SESSION JSON
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('Wipe this phone’s learner and start a fresh tester?')) {
              resetLearner()
            }
          }}
          className="tap-target eyebrow mt-3 w-full rounded border border-coach/50 px-3 py-3 text-coach"
        >
          RESET TESTER
        </button>
      </Section>

      <div className="mt-6 flex flex-col gap-3 text-center text-xs text-muted">
        <Link href="/admin" className="underline">
          Collated tester feedback
        </Link>
        <Link href="/feedback" className="underline">
          Feedback form (preview)
        </Link>
        <Link href="/qa" className="underline">
          European Portuguese QA sheet
        </Link>
      </div>
    </PageShell>
  )
}

/**
 * One link per tester. The label rides in the URL so a session and a feedback form can
 * be joined later without asking anyone to type an identifier — the tester just opens
 * the link they were sent and never sees the plumbing.
 */
function TesterLinks() {
  const [names, setNames] = useState('')
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const links = names
    .split(/[\n,]/)
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => ({ name: n, url: origin + '/?tester=' + encodeURIComponent(n) }))

  return (
    <Section title="Tester links">
      <p className="text-xs text-muted">
        One name per line. Send each person their own link — it tags their session and
        their feedback so the two can be read together.
      </p>
      <textarea
        rows={4}
        value={names}
        onChange={(e) => setNames(e.target.value)}
        placeholder={'Ana\nMiguel\nSofia'}
        className="mt-3 w-full rounded border border-line bg-bg-elev p-2 text-sm text-fg outline-none focus:border-accent"
      />
      {links.length ? (
        <ul className="mt-3 space-y-3">
          {links.map((l) => (
            <li key={l.name} className="rounded border border-line bg-bg-elev p-2">
              <p className="text-xs font-semibold">{l.name}</p>
              <p className="mt-1 break-all font-mono text-[0.6rem] text-muted">{l.url}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {links.length ? (
        <button
          type="button"
          onClick={() =>
            navigator.clipboard?.writeText(links.map((l) => l.name + ': ' + l.url).join('\n'))
          }
          className="tap-target eyebrow mt-3 w-full rounded border border-line px-3 py-3 text-muted"
        >
          COPY ALL
        </button>
      ) : null}
    </Section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded border border-line bg-surface p-4">
      <h2 className="eyebrow text-accent">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line/50 py-1 text-sm last:border-0">
      <span className="text-muted">{k}</span>
      <span className="font-mono text-xs">{v}</span>
    </div>
  )
}

function Pill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-line px-3 py-1 text-[0.65rem] uppercase tracking-wider text-fg"
    >
      {children}
    </Link>
  )
}
