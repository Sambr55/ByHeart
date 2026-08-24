'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  CRATES,
  PIECES,
  RUNGS,
  SHELVES,
  displayForm,
  fold,
  formsOf,
  linesFor,
  sourceOf,
  type CultureFamily,
  type Piece,
  type Shelf,
} from '@/content/roots'
import { Menu } from '@/components/Menu'
import { AudioButton } from '@/components/AudioButton'
import { slugFor } from '@/content/audio-manifest'
import { useLearner } from '@/engine/useLearner'

/**
 * The vocab library.
 *
 * It used to be a receipt for a session: sorted by the stage a piece was taught at, and
 * showing only what the learner already owned. Those are the two decisions that made it
 * read as random and useless — the stage answers "when may this be taught", which is not
 * a question anybody looks a word up to settle, and nobody looks up a word they have.
 *
 * It is now the map of the language DUB teaches, with the learner's own position marked
 * on it. Three consequences, and every decision below follows from one of them:
 *
 *   - It shows everything. Owned pieces are solid; the rest are dimmed and name the
 *     crate that teaches them — the same rule the picker uses for a dimmed crate, where
 *     a locked thing reads as an appointment rather than a telling-off.
 *   - It is shelved by what you would reach for it for. The stage becomes a badge.
 *   - An entry is a word, not an encounter: every form of one word is one card.
 *
 * The ladder is untouched. The rung still governs what a crate serves and what opens; it
 * has simply stopped being the filing system for a lookup screen.
 */

/** One row: a lemma with its forms, or a single piece standing alone. */
interface Entry {
  key: string
  head: Piece
  headId: string
  shelf: Shelf
  forms: { id: string; piece: Piece }[]
  owned: boolean
  ownedForms: number
}

export function Vocab() {
  const learner = useLearner()
  const [openShelf, setOpenShelf] = useState<Shelf | null>(null)
  const [openEntry, setOpenEntry] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  // Everything by default. A reference that opens filtered to what you already know is
  // the old bug wearing a new hat.
  const [mineOnly, setMineOnly] = useState(false)

  const owned = useMemo(
    () => new Set(Object.keys(learner.inventory ?? {}).filter((id) => PIECES[id])),
    [learner.inventory],
  )
  const ownCrates = useMemo<CultureFamily[]>(
    () => [...new Set([...owned].map((id) => PIECES[id].family))],
    [owned],
  )

  /**
   * Forms of one word collapse into a single entry — the biggest single fix here, since
   * tenho and tens were unrelated rows two stages apart. The head is an owned form where
   * there is one, so a card leads with something the learner recognises.
   */
  const entries = useMemo<Entry[]>(() => {
    const out: Entry[] = []
    const claimed = new Set<string>()
    for (const [id, piece] of Object.entries(PIECES)) {
      if (claimed.has(id)) continue
      if (piece.lemma) {
        const all = formsOf(piece.lemma)
        all.forEach((f) => claimed.add(f.id))
        // Two roots can teach the same surface form. Show it once.
        const seen = new Set<string>()
        const forms = all.filter((f) => {
          const k = fold(f.piece.target)
          if (seen.has(k)) return false
          seen.add(k)
          return true
        })
        const lead = forms.find((f) => owned.has(f.id)) ?? forms[0]
        out.push({
          key: 'lemma:' + piece.lemma,
          head: lead.piece,
          headId: lead.id,
          shelf: piece.shelf,
          forms,
          owned: forms.some((f) => owned.has(f.id)),
          ownedForms: forms.filter((f) => owned.has(f.id)).length,
        })
      } else {
        claimed.add(id)
        out.push({
          key: id,
          head: piece,
          headId: id,
          shelf: piece.shelf,
          forms: [{ id, piece }],
          owned: owned.has(id),
          ownedForms: owned.has(id) ? 1 : 0,
        })
      }
    }
    return out
  }, [owned])

  /** Portuguese, English or the lemma. One box, accent-insensitive, no filter chips. */
  const matching = useMemo(() => {
    const q = fold(query.trim())
    let list = entries
    if (mineOnly) list = list.filter((e) => e.owned)
    if (!q) return list
    return list.filter((e) =>
      e.forms.some(
        (f) =>
          fold(f.piece.target).includes(q) ||
          fold(f.piece.gloss).includes(q) ||
          fold(f.piece.lemma ?? '').includes(q),
      ),
    )
  }, [entries, query, mineOnly])

  const byShelf = useMemo(() => {
    const m = new Map<Shelf, Entry[]>()
    for (const e of matching) m.set(e.shelf, [...(m.get(e.shelf) ?? []), e])
    // Findable beats meaningful once a shelf passes about fifteen entries, and they will.
    for (const [k, v] of m) {
      m.set(
        k,
        [...v].sort((a, b) =>
          fold(a.head.lemma ?? displayForm(a.head)).localeCompare(
            fold(b.head.lemma ?? displayForm(b.head)),
          ),
        ),
      )
    }
    return m
  }, [matching])

  const total = Object.keys(PIECES).length

  /** Capability first, count second and small. Never a count leading. */
  const capability = useMemo(() => {
    const on = (shelf: Shelf) => [...owned].filter((id) => PIECES[id].shelf === shelf).length
    const bits: string[] = []
    if (on('things')) bits.push('name ' + on('things') + (on('things') === 1 ? ' thing' : ' things'))
    if (on('asking')) bits.push('ask ' + on('asking') + (on('asking') === 1 ? ' way' : ' ways'))
    if (on('when')) bits.push('talk about when')
    if (on('describing')) bits.push('describe things')
    if (!bits.length) return 'The whole map, and nothing on it yours yet.'
    return 'You can ' + bits.slice(0, 3).join(', ') + '.'
  }, [owned])

  return (
    <main
      data-stage="CHOICE"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-bg text-fg"
    >
      <header className="sticky top-0 z-10 flex flex-col gap-2 border-b border-line bg-bg/90 px-5 py-2.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/crates" className="eyebrow text-muted transition hover:text-fg">
            ← DUB
          </Link>
          <span className="eyebrow flex-1 text-accent">Vocab library</span>
          <Menu />
        </div>
        <div className="flex items-center gap-2 pb-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Portuguese or English…"
            aria-label="Search the library"
            data-testid="vocab-search"
            className="tap-target min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            data-testid="vocab-scope"
            onClick={() => setMineOnly((v) => !v)}
            aria-pressed={mineOnly}
            className={
              'tap-target shrink-0 rounded-lg border px-3 py-2 text-[0.6rem] uppercase tracking-wider transition ' +
              (mineOnly ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted')
            }
          >
            {mineOnly ? 'Mine' : 'Everything'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 py-7">
        <div>
          <h1 className="display text-balance text-2xl">{capability}</h1>
          <p className="mt-2 text-xs text-muted">
            <span className="tabular-nums">
              {owned.size} of {total}
            </span>{' '}
            pieces · shelved by what you would reach for it for
          </p>
        </div>

        {SHELVES.map((shelf) => {
          const list = byShelf.get(shelf.id) ?? []
          const expanded = openShelf === shelf.id || Boolean(query.trim())
          // An empty shelf still appears and says what will land there. THINGS is nearly
          // empty, and that being legible is the point — it is the argument for the noun
          // pass, not something to conceal.
          return (
            <section key={shelf.id} className="flex flex-col gap-3">
              <button
                type="button"
                aria-expanded={expanded}
                data-testid={'shelf-' + shelf.id}
                onClick={() => setOpenShelf(expanded && !query ? null : shelf.id)}
                className="tap-target flex w-full items-center gap-3 text-left"
              >
                <span className="eyebrow shrink-0 text-accent">{shelf.label}</span>
                <span className="h-px flex-1 bg-line" />
                <span className="eyebrow shrink-0 tabular-nums text-muted">{list.length}</span>
              </button>

              {!expanded ? (
                <p className="-mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted">
                  {list.slice(0, 3).map((e) => (
                    <span key={e.key} className={'pt ' + (e.owned ? 'text-accent/70' : 'text-muted/50')}>
                      {e.head.lemma ?? displayForm(e.head)}
                    </span>
                  ))}
                  {list.length > 3 ? <span>+{list.length - 3} more</span> : null}
                  {!list.length ? <span className="text-muted/60">{shelf.holds}</span> : null}
                </p>
              ) : null}

              {expanded ? (
                <ul className="flex flex-col gap-2">
                  {list.map((e) => (
                    <EntryRow
                      key={e.key}
                      entry={e}
                      owned={owned}
                      ownCrates={ownCrates}
                      open={openEntry === e.key}
                      onToggle={() => setOpenEntry(openEntry === e.key ? null : e.key)}
                    />
                  ))}
                  {!list.length ? (
                    <li className="rounded-xl border border-dashed border-line px-4 py-4 text-xs leading-relaxed text-muted">
                      Nothing here yet. {shelf.holds}
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </section>
          )
        })}
      </div>
    </main>
  )
}

function EntryRow({
  entry,
  owned,
  ownCrates,
  open,
  onToggle,
}: {
  entry: Entry
  owned: Set<string>
  ownCrates: CultureFamily[]
  open: boolean
  onToggle: () => void
}) {
  const { head, headId, forms } = entry
  const isLemma = forms.length > 1
  const root = sourceOf(headId)
  const crate = CRATES.find((c) => c.id === head.family)
  const lines = open ? linesFor(headId, 6, ownCrates) : []
  const note = forms.find((f) => f.piece.note)?.piece.note

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={
          'tap-target flex w-full items-baseline justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ' +
          (open
            ? 'border-accent bg-accent/10'
            : entry.owned
              ? 'border-line bg-surface hover:border-accent/50'
              : 'border-line/50 bg-surface/30 hover:border-accent/40')
        }
      >
        <span className="min-w-0">
          <span className={'pt block text-base ' + (entry.owned ? 'text-accent' : 'text-muted')}>
            {isLemma ? head.lemma : displayForm(head)}
          </span>
          <span className="mt-0.5 block text-xs text-muted">{head.gloss}</span>
        </span>
        <span className="shrink-0 text-right">
          {isLemma ? (
            <span className="block text-[0.55rem] uppercase tracking-wider tabular-nums text-muted">
              {entry.ownedForms}/{forms.length} forms
            </span>
          ) : null}
          {!entry.owned ? (
            <span className="mt-0.5 block text-[0.55rem] uppercase tracking-wider text-muted/70">
              in {crate?.title ?? 'a crate'}
            </span>
          ) : null}
        </span>
      </button>

      {open ? (
        <div className="mt-1.5 flex flex-col gap-4 rounded-xl border border-line bg-bg-elev px-4 py-4">
          <div className="flex items-center gap-3">
            <AudioButton slug={slugFor(head.target)} text={head.target} size="sm" />
            <span className="min-w-0">
              <span className="pt block text-lg text-accent">{displayForm(head)}</span>
              <span className="block text-xs text-muted">
                {head.gloss}
                {head.gender ? ' · ' + head.gender : ''}
                {head.plural ? ' · pl. ' + head.plural : ''}
              </span>
            </span>
          </div>

          <p className="eyebrow text-muted">
            Stage {head.rung} · {RUNGS[head.rung - 1].name}
          </p>

          {note ? (
            <p className="rounded-lg border-l-2 border-accent/50 bg-surface px-3 py-2 text-xs leading-relaxed text-fg/85">
              {note}
            </p>
          ) : null}

          {isLemma ? (
            <div>
              <p className="eyebrow text-muted">The forms DUB has taught you</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {forms.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className={'pt ' + (owned.has(f.id) ? 'text-accent' : 'text-muted/60')}>
                      {f.piece.target}
                    </span>
                    <span className="text-xs text-muted">{f.piece.form ?? f.piece.gloss}</span>
                    {!owned.has(f.id) ? (
                      <span className="text-[0.55rem] uppercase tracking-wider text-muted/60">
                        in {CRATES.find((c) => c.id === f.piece.family)?.title}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {lines.length ? (
            <div>
              <p className="eyebrow text-muted">
                {lines.length} {lines.length === 1 ? 'thing' : 'things'} you can say with it
              </p>
              <ul className="mt-2 flex flex-col gap-2">
                {lines.map((l) => (
                  <li key={l.target} className="flex items-center gap-3">
                    <AudioButton slug={slugFor(l.target)} text={l.target} size="sm" />
                    <span className="min-w-0">
                      <span className="pt block text-sm">{l.target}</span>
                      <span className="block text-xs text-muted">{l.en}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {root ? (
            <div>
              <p className="eyebrow text-muted">Where you met it</p>
              <p className="mt-1 text-xs text-muted">{crate?.title}</p>
              <p className="pt mt-1 text-sm">{root.target}</p>
              <p className="mt-0.5 text-xs text-muted">{root.source}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
