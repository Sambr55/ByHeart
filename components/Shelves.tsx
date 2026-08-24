'use client'

import { useMemo, useState } from 'react'
import { PIECES, SHELVES, displayForm, fold, formsOf, type Piece, type Shelf } from '@/content/roots'

/**
 * Pieces, shelved.
 *
 * The vocab rebuild replaced the flat wall of chips on /vocab and never touched the two
 * places inside the journey that render the same thing — so the fix looked unimplemented
 * when it simply was not there. This is that list, extracted: one implementation, three
 * surfaces.
 *
 * A flat flex-wrap of every piece a learner owns grows every session and says nothing
 * about what just happened, which is what made the end of a crate feel like a mess.
 */

export interface ShelfEntry {
  key: string
  head: Piece
  headId: string
  shelf: Shelf
  forms: { id: string; piece: Piece }[]
  owned: boolean
  ownedForms: number
}

/** Collapse the forms of one word into a single entry. */
export function buildEntries(owned: Set<string>, pool?: Set<string>): ShelfEntry[] {
  const out: ShelfEntry[] = []
  const claimed = new Set<string>()
  for (const [id, piece] of Object.entries(PIECES)) {
    if (claimed.has(id)) continue
    if (pool && !pool.has(id) && !piece.lemma) continue
    if (piece.lemma) {
      const all = formsOf(piece.lemma)
      all.forEach((f) => claimed.add(f.id))
      if (pool && !all.some((f) => pool.has(f.id))) continue
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
}

/**
 * Shelved, collapsed, and marking what is new.
 *
 * `highlight` is what makes this usable at the end of a crate: the point of that screen
 * is what you gained just now, not an inventory that grows for ever.
 */
export function Shelves({
  owned,
  pool,
  highlight,
  startOpen,
}: {
  owned: Set<string>
  /** Restrict to these pieces. Omit to shelve the whole bank. */
  pool?: Set<string>
  /** Drawn in the accent and marked new. */
  highlight?: Set<string>
  startOpen?: Shelf
}) {
  const [open, setOpen] = useState<Shelf | null>(startOpen ?? null)
  const entries = useMemo(() => buildEntries(owned, pool), [owned, pool])

  const byShelf = useMemo(() => {
    const m = new Map<Shelf, ShelfEntry[]>()
    for (const e of entries) m.set(e.shelf, [...(m.get(e.shelf) ?? []), e])
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
  }, [entries])

  return (
    <div className="flex flex-col gap-3">
      {SHELVES.map((shelf) => {
        const list = byShelf.get(shelf.id) ?? []
        if (!list.length) return null
        const expanded = open === shelf.id
        const fresh = highlight ? list.filter((e) => e.forms.some((f) => highlight.has(f.id))) : []
        return (
          <section key={shelf.id} className="flex flex-col gap-3">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : shelf.id)}
              className="tap-target flex w-full items-center gap-3 text-left"
            >
              <span className="eyebrow min-w-0 text-accent">{shelf.label}</span>
              <span className="h-px flex-1 bg-line" />
              {fresh.length ? (
                <span className="eyebrow shrink-0 text-telha">+{fresh.length} new</span>
              ) : null}
              <span className="eyebrow shrink-0 tabular-nums text-muted">{list.length}</span>
            </button>
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {(expanded ? list : list.slice(0, 6)).map((e) => {
                const isNew = highlight
                  ? e.forms.some((f) => highlight.has(f.id))
                  : false
                return (
                  <span
                    key={e.key}
                    className={
                      'pt ' +
                      (isNew ? 'text-telha' : e.owned ? 'text-accent/80' : 'text-muted/50')
                    }
                  >
                    {e.head.lemma ?? displayForm(e.head)}
                  </span>
                )
              })}
              {!expanded && list.length > 6 ? (
                <span className="text-muted">+{list.length - 6} more</span>
              ) : null}
            </p>
          </section>
        )
      })}
    </div>
  )
}
