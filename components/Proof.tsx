'use client'

import Link from 'next/link'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { Wordmark } from '@/components/Wordmark'
import { useMemo, useState } from 'react'
import { GOAL_LABEL, GOAL_NEEDS, type Goal } from '@/content/profile'
import { PIECES } from '@/content/roots'
import { showableLines } from '@/engine/showable'
import { useLearner } from '@/engine/useLearner'
import { Back } from '@/components/Back'
import { ShowThis } from '@/components/ShowThis'

/**
 * The proof card — what replaces the streak.
 *
 * The whole design rests on one decision: the number counts sentences produced with
 * nothing on screen to copy from, and nothing else. Not days, not taps, not lessons
 * finished. That makes it slow, occasionally flat, and impossible to inflate by
 * opening the app — which are the properties that make it worth showing to somebody.
 *
 * It is built to be screenshotted. That is the share mechanism that actually happens,
 * so the layout is a card rather than a page, and the honest detail — the lines
 * themselves, in Portuguese — is the part that photographs.
 */
export function Proof({ standalone = false }: { standalone?: boolean }) {
  const learner = useLearner()
  const [copied, setCopied] = useState(false)

  const proof = learner.proof ?? []
  const clean = proof.filter((p) => p.clean).length
  const recent = [...proof].reverse().slice(0, 3)
  /*
    The Legend never leaves the device by default.

    Legend answers are proof lines and count on exactly the same terms as everything
    else — but they are the only proof lines that contain a person's children by name,
    their age and their marital status. The share card renders recent lines into a public
    image, so a card made the morning after somebody filled in "Chamam-se Oscar, Tilly e
    Ted" would have published it.

    Shared lines are the ones from vibes. The learner can still share a Legend line
    deliberately; they cannot do it by accident. The filter itself lives in
    engine/showable now, because Showing publishes through the same rule and a rule
    written twice is a rule that will be right in one place and wrong in the other.
  */
  const shareable = useMemo(() => showableLines(proof), [proof])

  const worlds = useMemo(() => {
    const set = new Set<string>()
    for (const id of Object.keys(learner.inventory)) {
      const fam = PIECES[id]?.family
      if (fam) set.add(fam)
    }
    return set.size
  }, [learner.inventory])

  /** What is still between them and the thing they said they wanted. */
  const distance = useMemo(() => {
    const goal = learner.profile?.goal as Goal | null | undefined
    if (!goal) return null
    const owned = new Set(Object.keys(learner.inventory))
    const missing = (GOAL_NEEDS[goal] ?? []).filter((n) => !n.pieces.every((x) => owned.has(x)))
    if (!missing.length) return { done: true, count: 0, goal }
    return { done: false, count: missing.length, goal, next: missing[0].label }
  }, [learner.profile, learner.inventory])

  /**
   * How well am I doing — answered from evidence, not from counting screens.
   *
   * Only the beats with no culture on screen count, because that is the one measure
   * that cannot be inflated by opening the app. And it reports what they DID: nine of
   * twelve, first time. It never characterises them — no "fast learner", no percentile,
   * no comparison to anybody else. A number you can game by turning up is a streak
   * wearing a different hat.
   */
  const firstTry = useMemo(() => {
    const cold = (learner.evidence ?? [])
      .filter((e) => e.culture_context === null && e.event_type !== 'acquire')
      .slice(-12)
    if (cold.length < 4) return null
    const hit = cold.filter((e) => e.correct_first_try && !e.revealed).length
    return { hit, of: cold.length }
  }, [learner.evidence])

  const shareText = useMemo(() => {
    const latest = recent[0]
    return (
      proof.length +
      (proof.length === 1 ? ' thing' : ' things') +
      ' I can say in Portuguese without looking.' +
      (latest ? '\n\n“' + latest.pt + '” — ' + latest.en : '') +
      '\n\nLearned off ' +
      (worlds === 1 ? 'one thing I already knew' : worlds + ' completely unrelated things') +
      '. No streak involved.'
    )
  }, [proof.length, recent, worlds])

  /**
   * Mint a link, then share that.
   *
   * Sharing a text blob asks the reader to go and look DUB up; a link does the work for
   * them and carries the Portuguese in its image. Falls back to the old text-and-origin
   * share when links are not configured, so an unprovisioned deployment still shares.
   */
  const [link, setLink] = useState<string | null>(null)

  /** Mint the artefact. Showing needs the id; the public share needs the path. */
  const mintCard = async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          count: proof.length,
          worlds,
          lines: shareable.map((r) => ({ pt: r.pt, en: r.en })),
        }),
      })
      const body = (await res.json()) as { ok: boolean; id?: string }
      return body.ok && body.id ? body.id : null
    } catch {
      return null
    }
  }

  const mint = async (): Promise<string | null> => {
    if (link) return link
    const id = await mintCard()
    if (!id) return null
    const full = window.location.origin + '/p/' + id
    setLink(full)
    return full
  }

  const share = async () => {
    const minted = await mint()
    const url = minted ?? (typeof window !== 'undefined' ? window.location.origin : '')
    const data = { title: 'DUB', text: shareText, url }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(data)
        return
      } catch {
        // Dismissed the sheet, or the browser refused. Fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(shareText + '\n' + url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch {
      setCopied(false)
    }
  }

  const empty = proof.length === 0

  return (
    <main
      data-stage="REAL WORLD"
      className={
        'mx-auto flex w-full max-w-md flex-col gap-6 bg-bg px-5 text-fg ' +
        // Standalone it is the page; inside the journey the step below owns the
        // remaining height, and forcing full height here strands the CTA off-screen.
        (standalone ? 'min-h-svh py-6' : 'pt-6 pb-3')
      }
    >
      {standalone ? (
        <div className="flex items-center justify-between gap-3">
          <Back />
        </div>
      ) : null}

      {/* ---------------------------------------------------------- the card */}
      <section className="rounded border border-line bg-bg-elev p-6">
        <p className="eyebrow text-accent">WHAT I CAN SAY</p>

        {empty ? (
          <>
            <p className="display mt-3 text-balance text-3xl">Nothing yet.</p>
            <p className="mt-3 text-sm text-muted">
              This fills up when you say something with nothing on screen to copy from. Not when you
              finish a lesson — when you produce it cold.
            </p>
          </>
        ) : (
          <>
            {/*
              Inverted, and it is the whole argument of the card.

              The number was 60px and the sentence was 18px, so the biggest thing on the
              screen was a count — which is the shape of every app this product exists to
              be the opposite of. The thing you can SAY is the hero now, at the one size
              reserved for produced language, and the count is a footnote underneath it.

              Nothing animates. The number does not count up: its only possible referent
              is a score, and a number that moves is a number asking to be watched.
            */}
            <p className="pt t-said mt-3">{recent[0].pt}</p>
            <p className="mt-3 text-sm text-muted">{recent[0].en}</p>

            <p className="mt-6 border-t border-line pt-6 text-base text-fg/80">
              <span className="tabular-nums font-semibold">{proof.length}</span>{' '}
              {proof.length === 1 ? 'sentence' : 'sentences'} said with nothing on screen to
              copy from
              {clean ? ', ' + clean + ' of them right first time' : ''}.
            </p>

            {recent.length > 1 ? (
              <ul className="mt-6 space-y-3">
                {recent.slice(1).map((p) => (
                  <li key={p.pt}>
                    <p className="pt text-lg font-semibold text-accent">{p.pt}</p>
                    <p className="mt-1 text-xs text-muted">{p.en}</p>
                  </li>
                ))}
              </ul>
            ) : null}

            {worlds > 1 ? (
              <p className="mt-6 text-xs text-muted">
                Gathered from {worlds} unrelated worlds. None of it needs them any more.
              </p>
            ) : null}
          </>
        )}
        {/* Small, quiet, in the corner. This card is the thing people show somebody, so
            it should say whose it is — without competing with the sentences. */}
        <Wordmark className="mt-6 h-3 text-muted" />
      </section>

      {/* --------------------------------------------------- how am I doing */}
      {firstTry ? (
        <section className="rounded border border-line p-4">
          <p className="eyebrow text-muted">HOW IT GOES</p>
          <p className="mt-3 text-sm">
            You said{' '}
            <span className="font-semibold">
              {firstTry.hit} of your last {firstTry.of}
            </span>{' '}
            right first time, with nothing on screen.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Only the beats with nothing on screen to copy from are counted. It is the one
            number here that cannot be moved by opening the app.
          </p>
        </section>
      ) : null}

      {/* ------------------------------------------------------- the distance */}
      {distance ? (
        <section className="rounded border border-line p-4">
          <p className="eyebrow text-muted">YOUR GOAL</p>
          {distance.done ? (
            <p className="mt-3 text-sm">
              You have everything the graph can give you for {GOAL_LABEL[distance.goal]}. Pick
              another crate and it starts compounding.
            </p>
          ) : (
            <p className="mt-3 text-sm">
              <span className="font-semibold">
                {distance.count} {distance.count === 1 ? 'thing' : 'things'} to go
              </span>{' '}
              before {GOAL_LABEL[distance.goal]}. Next one up: {distance.next}.
            </p>
          )}
        </section>
      ) : null}

      {/* ---------------------------------------------------------- controls */}
      {/* Everything they can say is a Legend answer, so there is nothing that can go in a
          public image without publishing their family. Said plainly rather than silently
          refused by the route. */}
      {!empty && !shareable.length ? (
        <p className="text-center text-xs leading-relaxed text-muted">
          Everything here is from your Legend, and that stays on this phone — it has your
          family in it. Say something cold from a vibe and there will be a card to share.
        </p>
      ) : null}

      {!empty && shareable.length ? (
        <button
          type="button"
          onClick={share}
          className="tap-target w-full rounded-full bg-accent px-5 py-3 text-xs tracking-widest text-accent-ink"
        >
          {copied ? 'COPIED' : 'SHARE THIS'}
        </button>
      ) : null}

      {/*
        Two different acts, so two different controls.

        SHARE THIS puts a card somewhere anybody can see it. This one makes a link
        addressed to a single person — which is the only kind that can be shown back, and
        the only kind that makes the mutual step mean anything.
      */}
      {standalone && !empty && shareable.length ? <ShowThis mint={mintCard} /> : null}

      <p className="text-center text-xs leading-relaxed text-muted">
        No streak, no points, no level. This number only moves when you can actually say
        something new.
      </p>

      {/* mt-10, not mt-auto: a button sits under the words that earned it rather than at
          the foot of the screen. See the Cta in Journey.tsx for why. */}
      {standalone ? (
        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/line"
            className="tap-target block w-full rounded-full border border-line px-5 py-3 text-center text-xs tracking-widest"
          >
            TODAY’S LINE
          </Link>
          <Link
            href="/"
            className="tap-target block w-full rounded-full border border-line px-5 py-3 text-center text-xs tracking-widest"
          >
            KEEP GOING
          </Link>
        </div>
      ) : null}

      {/* Only when this IS the page. Inside the journey the step below owns the screen,
          and a bar offering three ways out mid-session is an invitation to leave. */}
      {standalone ? (
        <>
          <BottomNavSpace />
          <BottomNav />
        </>
      ) : null}
    </main>
  )
}
