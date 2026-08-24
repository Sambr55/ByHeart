'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BRAND } from '@/content/brand'
import { slugFor } from '@/content/audio-manifest'
import { AudioButton } from '@/components/AudioButton'
import { PageShell } from '@/components/PageShell'
import { initAnalytics, track } from '@/engine/analytics'
import { buildDeck, type DeckCard } from '@/engine/deck'
import { hydrateFromUrl, loadLearner, recordEvidence } from '@/engine/learner'

export default function DeckPage() {
  const [ready, setReady] = useState(false)
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    hydrateFromUrl()
    loadLearner()
    initAnalytics()
    setReady(true)
  }, [])

  const deck = useMemo(() => (ready ? buildDeck() : []), [ready])

  useEffect(() => {
    if (!deck.length) return
    track('deck_generated', {
      card_ids: deck.map((c) => c.card_id),
      selection_reasons: deck.map((c) => c.selection_reason),
    })
  }, [deck])

  if (!ready) return <PageShell eyebrow={BRAND.deckName}>{null}</PageShell>

  if (!deck.length) {
    return (
      <PageShell eyebrow={BRAND.deckName}>
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="display text-3xl">Nothing to keep yet.</h1>
          <p className="mt-3 text-sm text-muted">
            The deck is built from language you actually acquired. Run a mission first.
          </p>
          <Link
            href="/"
            className="tap-target eyebrow mt-6 rounded bg-accent px-5 py-4 text-center text-accent-ink"
          >
            START MISSION 01
          </Link>
        </div>
      </PageShell>
    )
  }

  if (reviewing) return <Review deck={deck} onDone={() => setReviewing(false)} />

  return (
    <PageShell eyebrow={BRAND.deckName}>
      <h1 className="display text-balance text-3xl">Keep what you learned.</h1>
      <p className="mt-3 text-sm text-muted">
        Your deck is built from the things you actually acquired — and the things that
        need one more encounter.
      </p>

      <ul className="mt-6 space-y-2">
        {deck.map((c) => (
          <li
            key={c.card_id}
            className="flex items-center justify-between gap-3 rounded border border-line bg-surface px-4 py-3"
          >
            <span className="eyebrow">{c.title}</span>
            <span className="text-[0.6rem] uppercase tracking-wider text-muted">
              {c.selection_reason}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setReviewing(true)}
        className="tap-target eyebrow mt-auto w-full rounded bg-accent px-5 py-4 text-accent-ink"
      >
        REVIEW NOW
      </button>
      <button
        type="button"
        onClick={() => {
          track('deck_download_click', { format: 'print_sheet', cards: deck.length })
          window.print()
        }}
        className="tap-target eyebrow mt-3 w-full rounded border border-line px-5 py-4 text-fg"
      >
        DOWNLOAD MY DECK
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        No account. No email. The sheet prints or saves as a PDF.
      </p>

      <PrintSheet deck={deck} />
    </PageShell>
  )
}

/**
 * AGAIN requeues the card two positions later rather than sending it to the back —
 * close enough to feel like a second chance, far enough to be a retrieval.
 */
function Review({ deck, onDone }: { deck: DeckCard[]; onDone: () => void }) {
  const [queue, setQueue] = useState(deck)
  const [revealed, setRevealed] = useState(false)
  const [seen, setSeen] = useState(0)
  const card = queue[0]

  if (!card) {
    return (
      <PageShell eyebrow={BRAND.deckName}>
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="display text-3xl">Deck done.</h1>
          <p className="mt-3 text-sm text-muted">{seen} cards reviewed.</p>
          <button
            type="button"
            onClick={onDone}
            className="tap-target eyebrow mt-6 w-full rounded bg-accent px-5 py-4 text-accent-ink"
          >
            BACK TO MY DECK
          </button>
          <Link
            href="/feedback"
            className="tap-target eyebrow mt-3 block w-full rounded border border-accent px-5 py-4 text-center text-accent"
          >
            TELL US WHAT YOU REALLY THINK
          </Link>
        </div>
      </PageShell>
    )
  }

  function act(action: 'got_it' | 'again') {
    track('deck_card_review', { card_id: card.card_id, action })
    for (const block of card.block_ids) {
      recordEvidence({
        target_id: block,
        event_type: 'checkpoint_recall',
        correct_first_try: action === 'got_it',
        hint_count: action === 'got_it' ? 0 : 1,
        revealed: false,
        latency_ms: 0,
        culture_context: null,
        mission_id: null,
      })
    }
    setSeen((n) => n + 1)
    setRevealed(false)
    setQueue((q) => {
      const [head, ...rest] = q
      if (action === 'got_it') return rest
      const next = [...rest]
      next.splice(Math.min(2, next.length), 0, head)
      return next
    })
  }

  return (
    <PageShell eyebrow={BRAND.deckName + " · REVIEW"}>
      <p className="text-xs tabular-nums text-muted">{queue.length} left</p>

      <div className="mt-4 rounded border border-line bg-surface p-5">
        <p className="eyebrow text-accent">{card.title}</p>
        <p className="mt-3 text-balance text-lg">{card.front}</p>

        {revealed ? (
          <div className="mt-5 space-y-3 border-t border-line pt-5">
            {card.reveal.map((r) => (
              <div key={r.pt} className="flex items-center gap-3">
                <AudioButton slug={slugFor(r.pt)} text={r.pt} size="sm" />
                <span>
                  <span className="pt block text-xl text-accent">{r.pt}</span>
                  <span className="mt-0.5 block text-xs text-muted">{r.en}</span>
                </span>
              </div>
            ))}
            <p className="pt-2 text-[0.65rem] uppercase tracking-wider text-muted">
              Learned: {card.evidence.learned ?? '—'}
              {card.evidence.reinforced.length
                ? ' · Reinforced: ' + card.evidence.reinforced.join(', ')
                : ''}{' '}
              · State: {card.evidence.state}
            </p>
          </div>
        ) : null}
      </div>

      {revealed ? (
        <div className="mt-auto grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => act('again')}
            className="tap-target eyebrow rounded border border-line px-4 py-4 text-fg"
          >
            AGAIN
          </button>
          <button
            type="button"
            onClick={() => act('got_it')}
            className="tap-target eyebrow rounded bg-accent px-4 py-4 text-accent-ink"
          >
            GOT IT
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="tap-target eyebrow mt-auto w-full rounded border border-accent bg-accent/10 px-5 py-4 text-accent"
        >
          SHOW ME
        </button>
      )}
    </PageShell>
  )
}

/** Screen-hidden, print-visible. A card sheet the learner can fold and carry. */
function PrintSheet({ deck }: { deck: DeckCard[] }) {
  return (
    <div className="hidden print:block print:text-black">
      <h1 style={{ fontSize: '18pt', fontWeight: 700 }}>{BRAND.name} · your deck</h1>
      <p style={{ fontSize: '9pt', marginBottom: '12pt' }}>
        Cover the right-hand column. Say it before you look.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
        <tbody>
          {deck.flatMap((c) =>
            c.reveal.map((r, i) => (
              <tr key={c.card_id + i} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '8pt 6pt', width: '50%' }}>
                  {i === 0 ? c.front : r.en}
                </td>
                <td style={{ padding: '8pt 6pt', fontWeight: 700 }}>{r.pt}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  )
}
