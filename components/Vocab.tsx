'use client'

import Link from 'next/link'
import { Wordmark } from '@/components/Wordmark'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  CRATES,
  PIECES,
  RUNGS,
  SETS,
  SHELVES,
  displayForm,
  entryRung,
  fold,
  formsOf,
  linesFor,
  rungReached,
  setPieces,
  sourceOf,
  type CultureFamily,
  type Piece,
  type Rung,
  type Shelf,
  type WordSet,
} from '@/content/roots'
import { Menu } from '@/components/Menu'
import { AudioButton } from '@/components/AudioButton'
import { slugFor } from '@/content/audio-manifest'
import { track } from '@/engine/analytics'
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
 * This pass makes it answer rather than merely list, using three things the product
 * already knew and threw away on this screen. Which of your words are shaky, and are
 * therefore the reason to come back. Which unowned words are one crate away from being
 * yours rather than five. And which words belong to a closed group — counting, the days
 * — where four scattered entries read as noise and "four of ten" reads as something to
 * finish.
 *
 * The rule none of it may break: no count that can go down, no percentage, no score.
 * "One more look" is a state, not a grade. The moment this screen shows a number that
 * falls, DUB has grown a streak.
 */

type Scope = 'all' | 'mine'

/** Remembered, because a learner who chose Mine should find Mine. */
const SCOPE_KEY = 'byheart.vocab.scope.v1'

/** One row: a lemma with its forms, or a single piece standing alone. */
interface Entry {
  key: string
  head: Piece
  headId: string
  shelf: Shelf
  forms: { id: string; piece: Piece }[]
  owned: boolean
  ownedForms: number
  /**
   * Owned, but the evidence says it is not holding. This is the state that makes the
   * library worth returning to rather than merely satisfying to read.
   */
  needsLook: boolean
  /** Not yours, but in a crate you are already inside — so it is a step, not a plan. */
  nearly: boolean
  /** Above this learner's stage: the picker's rule, reused. */
  opensAt: Rung | null
}

export function Vocab() {
  // ?q= makes an answer sendable: "how do you say water" has a URL.
  return (
    <Suspense fallback={null}>
      <Library />
    </Suspense>
  )
}

function Library() {
  const learner = useLearner()
  const params = useSearchParams()
  const [openShelf, setOpenShelf] = useState<Shelf | null>(null)
  const [openEntry, setOpenEntry] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  /**
   * All by default, and then whatever they last chose.
   *
   * Read after mount, never during render: the stored scope is not something the server
   * has, and branching on it while rendering is the /line hydration mismatch again.
   */
  const [scope, setScope] = useState<Scope>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = window.localStorage.getItem(SCOPE_KEY)
      if (saved === 'mine' || saved === 'all') setScope(saved)
    } catch {
      /* private mode. The default is a fine answer. */
    }
    const q = params.get('q')
    if (q) setQuery(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function chooseScope(next: Scope) {
    setScope(next)
    try {
      window.localStorage.setItem(SCOPE_KEY, next)
    } catch {
      /* not worth an error to a learner */
    }
  }

  const owned = useMemo(
    () => new Set(Object.keys(learner.inventory ?? {}).filter((id) => PIECES[id])),
    [learner.inventory],
  )
  const ownCrates = useMemo<CultureFamily[]>(
    () => [...new Set([...owned].map((id) => PIECES[id].family))],
    [owned],
  )
  // Before mount, assume the top: nothing may render as locked until the browser has
  // read what this learner has actually done.
  const rung: Rung = mounted ? rungReached(learner.proof ?? []) : 6

  /**
   * Forms of one word collapse into a single entry — the biggest single fix here, since
   * tenho and tens were unrelated rows two stages apart. The head is an owned form where
   * there is one, so a card leads with something the learner recognises.
   */
  const entries = useMemo<Entry[]>(() => {
    const started = new Set(ownCrates)
    const shaky = (id: string) =>
      owned.has(id) && learner.inventory?.[id]?.latest_state === 'NEEDS ANOTHER LOOK'

    const build = (key: string, head: Piece, headId: string, forms: Entry['forms']): Entry => {
      const isOwned = forms.some((f) => owned.has(f.id))
      const crate = CRATES.find((c) => c.id === head.family)
      const locked = crate ? entryRung(crate) : 1
      return {
        key,
        head,
        headId,
        shelf: head.shelf,
        forms,
        owned: isOwned,
        ownedForms: forms.filter((f) => owned.has(f.id)).length,
        needsLook: forms.some((f) => shaky(f.id)),
        nearly: !isOwned && started.has(head.family),
        opensAt: !isOwned && locked > rung ? locked : null,
      }
    }

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
        out.push(build('lemma:' + piece.lemma, lead.piece, lead.id, forms))
      } else {
        claimed.add(id)
        out.push(build(id, piece, id, [{ id, piece }]))
      }
    }
    return out
  }, [owned, ownCrates, learner.inventory, rung])

  const byKey = useMemo(() => new Map(entries.map((e) => [e.key, e])), [entries])

  /** Portuguese, English or the lemma. One box, accent-insensitive, no filter chips. */
  const q = fold(query.trim())
  const hits = useMemo(() => {
    if (!q) return entries
    return entries.filter((e) =>
      e.forms.some(
        (f) =>
          fold(f.piece.target).includes(q) ||
          fold(f.piece.gloss).includes(q) ||
          fold(f.piece.lemma ?? '').includes(q),
      ),
    )
  }, [entries, q])
  /**
   * Two numbers, because they mean different things.
   *
   * Nothing in Mine while the word exists in All is "you have not met it yet", and the
   * answer is where to get it. Nothing in either is "DUB does not teach this", and that
   * is the honest dead end — and the most valuable moment on the screen.
   */
  const matching = useMemo(() => (scope === 'mine' ? hits.filter((e) => e.owned) : hits), [hits, scope])
  const taughtElsewhere = scope === 'mine' && Boolean(q) && !matching.length && hits.length > 0
  const notTaught = Boolean(q) && !hits.length

  /**
   * The dead end, recorded.
   *
   * A learner typing a word DUB cannot answer is telling us, unprompted and for free,
   * exactly what to write next. It is a better content backlog than any survey and it
   * costs one event. Debounced so a word is logged once rather than once per keystroke,
   * and only when the whole library missed — a miss inside Mine is not a content brief.
   */
  const logged = useRef(new Set<string>())
  useEffect(() => {
    if (!notTaught || q.length < 2) return
    const term = query.trim().slice(0, 64)
    const timer = window.setTimeout(() => {
      if (logged.current.has(fold(term))) return
      logged.current.add(fold(term))
      track('vocab_search_miss', { query: term, scope })
      void fetch('/api/vocab-miss', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: term, scope }),
      }).catch(() => {
        /* telemetry must never surface to a learner */
      })
    }, 900)
    return () => window.clearTimeout(timer)
  }, [notTaught, q, query, scope])

  /**
   * Sets are a display grouping, not a filing change.
   *
   * They are suppressed while searching: somebody who typed "cinco" wants the row, not
   * the group it belongs to, and hiding a match inside a collapsed set would be a
   * search that lied.
   */
  const setsFor = (shelf: Shelf): WordSet[] => (q ? [] : SETS.filter((s) => s.shelf === shelf))
  const inASet = useMemo(() => {
    if (q) return new Set<string>()
    const ids = new Set<string>()
    for (const s of SETS) for (const id of setPieces(s).values()) ids.add(id)
    return ids
  }, [q])

  /**
   * The order of a shelf is an answer to "what should I look at".
   *
   * In Mine that is what is not holding, first. In All it is a gradient: what you have,
   * then what is one crate away, then what is further off — which is the honest shape of
   * the thing and reads as a slope rather than a wall.
   */
  const band = (e: Entry): number =>
    scope === 'mine' ? (e.needsLook ? 0 : 1) : e.owned ? (e.needsLook ? 0 : 1) : e.nearly ? 2 : 3

  const byShelf = useMemo(() => {
    const m = new Map<Shelf, Entry[]>()
    for (const e of matching) {
      if (inASet.has(e.headId) && e.forms.length === 1) continue
      m.set(e.shelf, [...(m.get(e.shelf) ?? []), e])
    }
    // Findable beats meaningful once a shelf passes about fifteen entries, and they will.
    const name = (e: Entry) => fold(e.head.lemma ?? displayForm(e.head))
    for (const [k, v] of m) {
      m.set(k, [...v].sort((a, b) => band(a) - band(b) || name(a).localeCompare(name(b))))
    }
    return m
  }, [matching, inASet, scope])

  const total = Object.keys(PIECES).length

  /**
   * Capability first, count second and small — and the capability survives the filter,
   * because it is a fact about the learner rather than about the view. Changing what is
   * on screen does not change what they can say. The subhead is what carries the scope,
   * and it is where the explanation belongs.
   */
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

  const shaky = useMemo(() => matching.filter((e) => e.needsLook).length, [matching])
  /** Piece-level, because a set groups pieces rather than entries. */
  const shakyPieces = useMemo(
    () =>
      new Set(
        Object.entries(learner.inventory ?? {})
          .filter(([, v]) => v?.latest_state === 'NEEDS ANOTHER LOOK')
          .map(([k]) => k),
      ),
    [learner.inventory],
  )
  const emptyMine = scope === 'mine' && !q && owned.size === 0

  return (
    <main
      data-stage="CHOICE"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-bg text-fg"
    >
      <header className="bar sticky top-0 z-30 flex flex-col gap-3 px-5 py-2.5">
        <div className="flex items-center gap-3">
          <Link href="/crates" className="flex shrink-0 items-center gap-1 eyebrow opacity-80 transition hover:opacity-100">
            <span aria-hidden>←</span>
            <Wordmark className="h-3" title="DUB — back to your crates" />
          </Link>
          <span className="eyebrow flex-1">Vocab library</span>
          <Menu />
        </div>
        <div className="flex items-center gap-3 pb-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Portuguese or English…"
            aria-label="Search the library"
            data-testid="vocab-search"
            className="tap-target min-w-0 flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
          />
          {/*
            A segmented control, not a toggle.

            It used to render the CURRENT state on a control that looked like an action,
            so "EVERYTHING" could not be read as either what you are looking at or what
            tapping would give you. Showing both options and filling one removes the
            question: there is no ambiguity in a control that also shows you the choice
            you did not make.

            All rather than Everything because two short words of similar length sit
            properly in a segmented control, and "All" cannot be misread as a verb.
          */}
          <div
            role="group"
            aria-label="What the library is showing"
            className="flex shrink-0 rounded border border-line p-0.5"
          >
            {(['all', 'mine'] as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                data-testid={'vocab-scope-' + s}
                aria-pressed={scope === s}
                onClick={() => chooseScope(s)}
                className={
                  'tap-target rounded px-3 py-1.5 text-[0.6rem] uppercase tracking-wider transition ' +
                  (scope === s ? 'bg-accent font-semibold text-accent-ink' : 'text-muted')
                }
              >
                {s === 'all' ? 'All' : 'Mine'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 pb-12 pt-7">
        <div>
          <h1 className="display text-balance text-2xl" data-testid="vocab-headline">
            {q
              ? matching.length
                ? matching.length + (matching.length === 1 ? ' match' : ' matches') + ' for “' + query.trim() + '”.'
                : 'Nothing for “' + query.trim() + '”.'
              : emptyMine
                ? 'Nothing yours yet.'
                : capability}
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-muted" data-testid="vocab-subhead">
            <Subhead
              q={query.trim()}
              scope={scope}
              matches={matching.length}
              notTaught={notTaught}
              taughtElsewhere={taughtElsewhere}
              owned={owned.size}
              total={total}
              shaky={shaky}
              onScope={chooseScope}
            />
          </p>
        </div>

        {notTaught ? <DeadEnd term={query.trim()} /> : null}
        {emptyMine ? <EmptyMine onScope={() => chooseScope('all')} /> : null}

        {SHELVES.map((shelf) => {
          const list = byShelf.get(shelf.id) ?? []
          const sets = setsFor(shelf.id)
          const expanded = openShelf === shelf.id || Boolean(q)
          const count = list.length + sets.reduce((n, s) => n + setPieces(s).size, 0)
          if (emptyMine) return null
          // An empty shelf still appears and says what will land there. THINGS is nearly
          // empty, and that being legible is the point — it is the argument for the noun
          // pass, not something to conceal.
          return (
            <section key={shelf.id} className="flex flex-col gap-3">
              <button
                type="button"
                aria-expanded={expanded}
                data-testid={'shelf-' + shelf.id}
                onClick={() => setOpenShelf(expanded && !q ? null : shelf.id)}
                className="tap-target flex w-full items-center gap-3 text-left"
              >
                {/* Shelf labels are content. shrink-0 belongs on icons and counters. */}
                <span className="eyebrow min-w-0 text-accent">{shelf.label}</span>
                <span className="h-px flex-1 bg-line" />
                <span className="eyebrow shrink-0 tabular-nums text-muted">{count}</span>
              </button>

              {!expanded ? (
                <p className="-mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  {sets.map((s) => (
                    <span key={s.id} className="text-muted">
                      {s.label.toLowerCase()}
                    </span>
                  ))}
                  {list.slice(0, 3).map((e) => (
                    <span key={e.key} className={'pt ' + (e.owned ? 'text-accent/70' : 'text-muted/50')}>
                      {e.head.lemma ?? displayForm(e.head)}
                    </span>
                  ))}
                  {list.length > 3 ? <span>+{list.length - 3} more</span> : null}
                  {!count ? <span className="text-muted/60">{shelf.holds}</span> : null}
                </p>
              ) : null}

              {expanded ? (
                <div className="flex flex-col gap-3">
                  {sets.map((s) => (
                    <SetRow
                      key={s.id}
                      set={s}
                      owned={owned}
                      scope={scope}
                      byKey={byKey}
                      openEntry={openEntry}
                      onToggleEntry={(k) => setOpenEntry(openEntry === k ? null : k)}
                      ownCrates={ownCrates}
                      query={query}
                      shakyPieces={shakyPieces}
                    />
                  ))}
                  <ul className="flex flex-col gap-3">
                    {list.map((e) => (
                      <EntryRow
                        key={e.key}
                        entry={e}
                        owned={owned}
                        ownCrates={ownCrates}
                        query={query}
                        open={openEntry === e.key}
                        onToggle={() => setOpenEntry(openEntry === e.key ? null : e.key)}
                      />
                    ))}
                    {!count ? (
                      <li className="rounded border border-dashed border-line px-4 py-4 text-xs leading-relaxed text-muted">
                        {scope === 'mine'
                          ? 'Nothing of yours here yet. ' + shelf.holds
                          : 'Nothing here yet. ' + shelf.holds}
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : null}
            </section>
          )
        })}
      </div>
    </main>
  )
}

/**
 * The line that carries the scope.
 *
 * The headline used to be computed from what the learner owned and nothing else, and the
 * count was fixed at "79 of 135" — so filtering changed the list and nothing above it,
 * which is exactly what made the toggle feel like it had done nothing.
 */
function Subhead({
  q,
  scope,
  matches,
  notTaught,
  taughtElsewhere,
  owned,
  total,
  shaky,
  onScope,
}: {
  q: string
  scope: Scope
  matches: number
  notTaught: boolean
  taughtElsewhere: boolean
  owned: number
  total: number
  shaky: number
  onScope: (s: Scope) => void
}) {
  const flip = (
    <button
      type="button"
      data-testid="vocab-scope-flip"
      onClick={() => onScope(scope === 'mine' ? 'all' : 'mine')}
      className="tap-target underline underline-offset-4"
    >
      {scope === 'mine' ? 'search everything' : 'show only mine'}
    </button>
  )

  if (q && notTaught) return <>Not in the library, in any crate.</>
  if (q && taughtElsewhere) return <>Not one of yours yet — {flip} to see where it is taught.</>
  if (q) {
    return (
      <>
        {scope === 'mine' ? 'Across your own pieces' : 'Across everything DUB teaches'} · {flip}
      </>
    )
  }
  if (scope === 'mine') {
    if (!owned) return <>Open a crate and the pieces start arriving · {flip}</>
    return (
      <>
        <span className="tabular-nums">Your {owned} pieces</span> ·{' '}
        <span className="tabular-nums">{total - owned} more waiting in the crates</span>
        {shaky ? <> · {shaky} could use another look</> : null} · {flip}
      </>
    )
  }
  return (
    <>
      Everything DUB teaches ·{' '}
      <span className="tabular-nums">
        {owned} of {total} already yours
      </span>{' '}
      · {flip}
    </>
  )
}

/** The honest dead end, which is also the best content signal the product collects. */
function DeadEnd({ term }: { term: string }) {
  return (
    <div
      data-testid="vocab-deadend"
      className="rounded border border-dashed border-line-strong bg-bg-elev px-4 py-4"
    >
      <p className="text-sm leading-relaxed">
        DUB does not teach <span className="pt text-accent">{term}</span> yet.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Noted, and that is not a polite noise — the words people look for and cannot find
        are what the next crate gets written from.
      </p>
    </div>
  )
}

function EmptyMine({ onScope }: { onScope: () => void }) {
  return (
    <div className="rounded border border-line bg-bg-elev px-4 py-5">
      <p className="text-sm leading-relaxed">
        Nothing has landed here yet. A piece becomes yours the first time you use it
        without the film on screen to copy from.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link
          href="/crates"
          className="tap-target eyebrow rounded bg-accent px-4 py-3 text-accent-ink"
        >
          OPEN A CRATE
        </Link>
        <button
          type="button"
          onClick={onScope}
          className="tap-target eyebrow rounded border border-line-strong px-4 py-3 text-muted"
        >
          SEE EVERYTHING DUB TEACHES
        </button>
      </div>
    </div>
  )
}

/**
 * A closed group, shown as one.
 *
 * "You never teach me to count" was true in a way the piece count hid: the numbers were
 * there, alphabetised among unrelated words, where four of them read as noise. The same
 * four pieces, shown as a set, read as four of ten with six to come — and the six become
 * a brief rather than an absence.
 *
 * Nothing about the teaching changes. Pieces still fall out of roots.
 */
/**
 * A crate title mid-sentence.
 *
 * Every title is a proper name except one — "The world of wizardry" — and dropping its
 * capital is the difference between a sentence and a stitched-together string.
 */
function lower(titles: string[]): string[] {
  return titles.map((t) => (t.startsWith('The ') ? 'the ' + t.slice(4) : t))
}

function SetRow({
  set,
  owned,
  scope,
  byKey,
  openEntry,
  onToggleEntry,
  ownCrates,
  query,
  shakyPieces,
}: {
  set: WordSet
  owned: Set<string>
  scope: Scope
  shakyPieces: Set<string>
  byKey: Map<string, Entry>
  openEntry: string | null
  onToggleEntry: (key: string) => void
  ownCrates: CultureFamily[]
  query: string
}) {
  const [open, setOpen] = useState(false)
  const taught = useMemo(() => setPieces(set), [set])
  const yours = [...taught.values()].filter((id) => owned.has(id)).length
  const missing = set.members.length - taught.size
  /*
    A set must not hide the one state worth returning for.

    Grouping the numbers took `sete` out of the shelf list and put it inside a collapsed
    row, which is right — but it also meant a piece that is not holding stopped showing
    that anywhere. The group carries the flag now, and the member itself is marked, so
    the shaky state survives being filed.
  */
  const shakyIds = new Set(
    [...taught.values()].filter((id) => shakyPieces.has(id)),
  )
  const crates = [
    ...new Set(
      [...taught.values()]
        .filter((id) => !owned.has(id))
        .map((id) => CRATES.find((c) => c.id === PIECES[id].family)?.title)
        .filter(Boolean) as string[],
    ),
  ]

  const rows = [...taught.values()]
    .filter((id) => (scope === 'mine' ? owned.has(id) : true))
    .map((id) => byKey.get(PIECES[id].lemma ? 'lemma:' + PIECES[id].lemma : id))
    .filter(Boolean) as Entry[]

  if (scope === 'mine' && !yours) return null

  return (
    <div className="rounded border border-line bg-bg-elev">
      <button
        type="button"
        aria-expanded={open}
        data-testid={'set-' + set.id}
        onClick={() => setOpen((v) => !v)}
        className="tap-target flex w-full flex-col gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold">{set.label}</span>
          <span className="shrink-0 text-right">
            <span className="block text-[0.55rem] uppercase tracking-wider tabular-nums text-muted">
              {yours} of {set.members.length}
            </span>
            {shakyIds.size ? (
              <span className="mt-1 block text-[0.55rem] uppercase tracking-wider text-coach">
                one more look
              </span>
            ) : null}
          </span>
        </span>
        {/* The whole group, in its own order. The dim ones are the shape of what is
            missing, which is the entire reason to show a set rather than a list. */}
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          {set.members.map((m) => {
            const id = taught.get(m)
            const mine = id ? owned.has(id) : false
            const wobbly = id ? shakyIds.has(id) : false
            return (
              <span
                key={m}
                className={
                  'pt text-sm ' +
                  (wobbly
                    ? 'text-coach underline decoration-dotted underline-offset-4'
                    : mine
                      ? 'text-accent'
                      : id
                        ? 'text-muted'
                        : 'text-muted/40 line-through decoration-line')
                }
              >
                {m}
              </span>
            )
          })}
        </span>
        <span className="text-[0.65rem] leading-relaxed text-muted">
          {crates.length
            ? 'More of it in ' + lower(crates.slice(0, 2)).join(' and ') + '. '
            : ''}
          {missing
            ? missing + (missing === 1 ? ' is' : ' are') + ' not written yet — struck through, and honest about it.'
            : 'The whole set is in DUB.'}
        </span>
      </button>

      {open ? (
        <ul className="flex flex-col gap-3 border-t border-line px-3 py-3">
          {rows.map((e) => (
            <EntryRow
              key={e.key}
              entry={e}
              owned={owned}
              ownCrates={ownCrates}
              query={query}
              open={openEntry === e.key}
              onToggle={() => onToggleEntry(e.key)}
            />
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function EntryRow({
  entry,
  owned,
  ownCrates,
  query,
  open,
  onToggle,
}: {
  entry: Entry
  owned: Set<string>
  ownCrates: CultureFamily[]
  query: string
  open: boolean
  onToggle: () => void
}) {
  const { head, headId, forms } = entry
  const isLemma = forms.length > 1
  const root = sourceOf(headId)
  const crate = CRATES.find((c) => c.id === head.family)
  const lines = open ? linesFor(headId, 6, ownCrates) : []
  // Every note the forms carry, not just the first: a lemma card is where ser and estar
  // finally have one place to be explained, and that explanation is written on the form
  // that shows it, not on whichever one happens to sort first.
  const notes = [...new Set(forms.map((f) => f.piece.note).filter(Boolean))] as string[]

  /**
   * A search that teaches something.
   *
   * Typing "tens" finds ter, which looks like the wrong answer until the row says why.
   * Naming the form the query actually hit turns a confusing match into a small lesson.
   */
  const q = fold(query.trim())
  const hit =
    q && isLemma
      ? forms.find(
          (f) => fold(f.piece.target).includes(q) || fold(f.piece.gloss).includes(q),
        )
      : undefined
  const viaForm = hit && hit.id !== headId ? hit : undefined

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        data-testid={'entry-' + entry.key}
        onClick={onToggle}
        className={
          'tap-target flex w-full items-baseline justify-between gap-3 rounded border px-4 py-3 text-left transition ' +
          (open
            ? 'border-accent bg-accent/10'
            : entry.needsLook
              ? // Owned, and not holding. An amber edge, because in DUB amber coaches and
                // red punishes — and this is the one row on the screen worth returning for.
                'border-coach/70 bg-bg-elev hover:border-coach'
              : entry.owned
                ? 'border-line bg-bg-elev hover:border-accent/50'
                : entry.nearly
                  ? 'border-dashed border-accent/40 bg-surface/30 hover:border-accent/60'
                  : 'border-dashed border-line/60 bg-surface/30 hover:border-accent/40')
        }
      >
        <span className="min-w-0">
          <span className={'pt block text-base ' + (entry.owned ? 'text-accent' : 'text-muted')}>
            {isLemma ? head.lemma : displayForm(head)}
          </span>
          <span className="mt-1 block text-xs text-muted">{head.gloss}</span>
          {viaForm ? (
            <span className="mt-1 block text-[0.65rem] text-muted">
              <span className="pt">{viaForm.piece.target}</span> — a form of{' '}
              <span className="pt">{head.lemma}</span>
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-right">
          {isLemma ? (
            <span className="block text-[0.55rem] uppercase tracking-wider tabular-nums text-muted">
              {entry.ownedForms}/{forms.length} forms
            </span>
          ) : null}
          {/*
            Three states, not two — and the third is the one that makes a reference worth
            reopening. No count, no percentage, no score: "one more look" is a state, and
            the moment this screen shows a number that can fall it has become a streak.

            Every row names its crate now, owned included. "Where did I get this?" is the
            second most common question a reference is asked, and answering it only on the
            rows you do NOT have read as an inconsistency.
          */}
          {entry.needsLook ? (
            <span className="mt-1 block text-[0.55rem] uppercase tracking-wider text-coach">
              one more look
            </span>
          ) : entry.owned ? (
            <span className="mt-1 block text-[0.55rem] uppercase tracking-wider text-muted/70">
              from {crate?.title ?? 'a crate'}
            </span>
          ) : entry.opensAt ? (
            <span className="mt-1 block text-[0.55rem] uppercase tracking-wider text-muted/70">
              opens at stage {entry.opensAt}
            </span>
          ) : entry.nearly ? (
            <span className="mt-1 block text-[0.55rem] uppercase tracking-wider text-accent/80">
              nearly yours
            </span>
          ) : (
            <span className="mt-1 block text-[0.55rem] uppercase tracking-wider text-muted/70">
              in {crate?.title ?? 'a crate'}
            </span>
          )}
        </span>
      </button>

      {open ? (
        <div className="mt-1 flex flex-col gap-3 rounded border border-line bg-bg-elev px-4 py-4">
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

          {entry.needsLook ? (
            <p className="rounded border-l-2 border-coach bg-surface px-3 py-2 text-xs leading-relaxed text-fg/85">
              This one did not come back cleanly last time. It is not a mark against you —
              it is the reason the library is worth reopening.
            </p>
          ) : null}

          {notes.map((n) => (
            <p
              key={n}
              className="rounded border-l-2 border-accent/50 bg-surface px-3 py-2 text-xs leading-relaxed text-fg/85"
            >
              {n}
            </p>
          ))}

          {isLemma ? (
            <div>
              <p className="eyebrow text-muted">The forms DUB has taught you</p>
              <ul className="mt-3 flex flex-col gap-1">
                {forms.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-baseline gap-x-3 text-sm">
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
              <ul className="mt-3 flex flex-col gap-3">
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
              <p className="eyebrow text-muted">{entry.owned ? 'Where you met it' : 'Where it is taught'}</p>
              <p className="mt-1 text-xs text-muted">{crate?.title}</p>
              <p className="pt mt-1 text-sm">{root.target}</p>
              <p className="mt-1 text-xs text-muted">{root.source}</p>
            </div>
          ) : null}

          {/*
            A dimmed row that names a crate and cannot be acted on is a dead end. The
            picker's own guard runs on arrival, so a link at a crate above this learner's
            stage lands on the picker with that crate saying why — which is honest, and
            needs no extra copy here.
          */}
          {!entry.owned && crate ? (
            <Link
              href={'/crates?open=' + crate.id}
              className="tap-target eyebrow rounded bg-accent px-4 py-3 text-center text-accent-ink"
            >
              {entry.nearly ? 'BACK INTO ' + crate.title.toUpperCase() : 'OPEN ' + crate.title.toUpperCase()}
            </Link>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
