'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { slugFor } from '@/content/audio-manifest'
import { rowsFor } from '@/content/calendar'
import { gemsHomeFirst } from '@/content/gems'
import { WALKS } from '@/content/walks'
import { CRATES, entryRung, rungReached } from '@/content/roots'
import { levelComplete, levelRecap, levelRevision, unitById } from '@/content/level'
import { LEGEND_FRAMES, fillEnglish, fillFrame } from '@/content/legend'
import { pathUnits } from '@/content/path'
import { markBoardMet, markRecapSeen } from '@/engine/learner'
import { track } from '@/engine/analytics'
import { useEntitlements } from '@/engine/useEntitlements'
import { useLearner } from '@/engine/useLearner'
import { useNowAfterMount } from '@/engine/useNow'
import { hasFullAccess } from '@/lib/entitlements'
import { lapOf } from '@/components/path/lap'
import { roomLock } from '@/components/path/locks'
import { pathView } from '@/components/path/progress'

/**
 * THE LEVEL RECAP (Sam, 2026-11-05) — what a finished level gave you, and the test of it.
 *
 * Opens by itself when the last room of a level is laid (Errand), and is a link after that
 * from the level's own row in Yours. Three jobs, in this order:
 *
 *   1. what you can now say — every line of the level's rooms, with its sound and the gold
 *      mark when said cold; the words they banked; the practice shape; and what the board
 *      turned over on the way round (postcards, places, what's on)
 *   2. TEST YOURSELF ON THIS LEVEL — all of it, asked back (/revise?kind=level)
 *   3. and the habit: "All of this is kept in Yours", a door straight to this level there.
 *
 * Nothing on this screen is new content; it is the level, gathered. See content/level.ts.
 */
export function LevelRecap({ id }: { id: string }) {
  const learner = useLearner()
  const now = useNowAfterMount()
  const access = useEntitlements()
  const member = hasFullAccess(access) || access.comped
  const purpose = learner.purpose ?? null
  const rung = useMemo(() => rungReached(learner.proof ?? []), [learner.proof])
  const chapter = learner.chapter ?? 'lisbon'

  const recap = useMemo(() => (now ? levelRecap(id, learner, now) : null), [id, learner, now])
  const asks = useMemo(
    () => (now ? levelRevision(id, { finished_cards: learner.finished_cards, purpose, gender: learner.profile?.gender ?? null }, now).length : 0),
    [id, learner.finished_cards, purpose, learner.profile?.gender, now],
  )

  /*
    SEEN, AND WHAT THE BOARD SHOWED. Marked once the record is real (it has rooms in it), so
    the hydration render cannot spend the recap. The board records stops as they turn over;
    a level finished in the Panel or the Road never drew one, so its stops are worked out
    here from the same lap — only when none are stored, so a board somebody did look at is
    never overwritten by a later rotation of the city.
  */
  const key = recap?.key
  const hasRooms = Boolean(recap?.rooms.length)
  /*
    Seen only once the level is laid (review, 2026-11-10): opening it from Yours halfway round
    must not spend the board's "So far", which waits for the finished level.
  */
  /* …and every square on its board opened (Sam, 2026-11-10: "Every square"): the board's own rule, from lap.ts. */
  const whole = useMemo(() => {
    if (!now) return false
    const at = unitById(id, purpose, now)
    if (!at || !levelComplete(at.unit, learner.finished_cards ?? [], (rid) => roomLock(rid, member, purpose))) return false
    const units = pathUnits(undefined, now, purpose)
    const index = units.findIndex((u) => u.id === id)
    if (index === -1) return false
    const view = pathView(learner, units, (rid) => roomLock(rid, member, purpose), now)
    return lapOf(view, index, purpose ?? 'visiting', { gems: gemsHomeFirst(chapter), rows: rowsFor(chapter, now), walks: WALKS, chapter, opened: learner.board_opened ?? [] }).complete
  }, [now, id, purpose, learner, member, chapter])
  const metCount = recap?.met.length ?? 0
  useEffect(() => {
    if (!now || !key || !hasRooms || !whole) return
    markRecapSeen(key)
    track('level_recap', { level: id })
    if (metCount) return
    const units = pathUnits(undefined, now, purpose)
    const index = units.findIndex((u) => u.id === id)
    if (index === -1) return
    const view = pathView(learner, units, (rid) => roomLock(rid, member, purpose), now)
    const lap = lapOf(view, index, purpose ?? 'visiting', { gems: gemsHomeFirst(chapter), rows: rowsFor(chapter, now), walks: WALKS, chapter })
    const keys = lap.squares.filter((s) => s.reached && (s.kind === 'postcard' || s.kind === 'venue' || s.kind === 'neighbour')).map((s) => s.key)
    if (keys.length) markBoardMet(keys)
  }, [now, key, hasRooms, whole])

  if (!now) return <Frame>{null}</Frame>
  const at = unitById(id, purpose, now)
  if (!recap || !at || !recap.rooms.length) {
    return (
      <Frame>
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-bg-elev px-5 py-6">
          <p className="text-base leading-relaxed">
            {at ? 'Lay a room of ' + at.unit.title + ' and its recap starts here.' : 'This level is not on your path.'}
          </p>
          <Link href="/club" className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink">
            ‹ BACK TO THE BOARD
          </Link>
        </div>
      </Frame>
    )
  }

  const next = unitById(pathUnits(undefined, now, purpose)[recap.level]?.id ?? '', purpose, now)
  const testHref = '/revise?kind=level&id=' + encodeURIComponent(id)
  const mine =
    at.unit.rooms.some((r) => r.id === 'lisbon_legend')
      ? ['name', 'origin'].flatMap((fid) => {
          const frame = LEGEND_FRAMES.find((f) => f.id === fid)
          const values = (learner.legend ?? []).find((a) => a.frame_id === fid)?.values
          if (!frame || !values || !Object.keys(values).length) return []
          return [{ pt: fillFrame(frame, values, learner.profile?.gender ?? null), en: fillEnglish(frame, values) }]
        })
      : []
  const yoursHref = '/profile?level=' + encodeURIComponent(id)

  return (
    <Frame>
      {/* 1. THE LEVEL, LAID */}
      <section className="flex flex-col gap-4 rounded-2xl border-2 border-[#e2b450] bg-bg-elev px-5 py-6" data-testid="level-recap">
        <div className="flex flex-col gap-1">
          <p className="eyebrow text-accent">Your trip so far · Level {recap.level} laid</p>
          <h1 className="display text-balance text-3xl leading-tight">{recap.title}</h1>
          <p lang="pt-PT" className="pt text-lg text-accent">
            {recap.pt}
          </p>
        </div>
        {/* No zeros on the celebration (review, 2026-11-10): a stat shows once it has something in it. */}
        <div className="flex gap-2 text-center [&>*]:flex-1">
          <Stat n={recap.lines} label={recap.lines === 1 ? 'line' : 'lines'} />
          {recap.words.length ? <Stat n={recap.words.length} label={recap.words.length === 1 ? 'word' : 'words'} /> : null}
          {recap.cold ? <Stat n={recap.cold} label="said cold" gold /> : null}
        </div>
        {/* 2. THE TEST, without going anywhere else first. */}
        <Link href={testHref} data-testid="level-test" className="tap-target eyebrow block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink">
          TEST YOURSELF ON THIS LEVEL · {asks}
        </Link>
        <p className="text-sm text-muted">
          Every line, word and the practice shape, asked back. Nothing can be lost by getting it wrong.
        </p>
      </section>

      {/* What you can say */}
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-bg-elev px-5 py-6">
        <p className="eyebrow text-accent">What you can say now</p>
        {/*
          WHO YOU ARE, IN YOUR OWN WORDS (review, 2026-11-10). The room speaks as a sample person,
          so the recap leaves its script out — and showed nothing of the most personal line on
          the board. Your own name and where you are from, from your Legend, lead instead.
        */}
        {mine.length ? (
          <div className="flex flex-col gap-2" data-testid="recap-who">
            <p className="eyebrow text-[0.6rem] text-muted">Who you are</p>
            <ul className="flex flex-col gap-2">
              {mine.map((l) => (
                <li key={l.pt} className="flex items-start gap-3">
                  <AudioButton slug={slugFor(l.pt)} text={l.pt} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span lang="pt-PT" className="pt block text-base leading-snug text-accent">
                      {l.pt}
                    </span>
                    <span className="block text-sm leading-snug text-muted">{l.en}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {recap.rooms.map((room) => (
          <div key={room.id} className="flex flex-col gap-2">
            <Link href={'/errand/' + room.id} className="eyebrow text-[0.6rem] text-muted hover:text-accent">
              {room.title} →
            </Link>
            <ul className="flex flex-col gap-2">
              {room.lines.map((l) => (
                <li key={l.pt} className="flex items-start gap-3">
                  <AudioButton slug={slugFor(l.pt)} text={l.pt} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span lang="pt-PT" className="pt block text-base leading-snug text-accent">
                      {l.pt} {l.cold ? <Gold /> : null}
                    </span>
                    <span className="block text-sm leading-snug text-muted">{l.en}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {recap.words.length ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
          <p className="eyebrow text-accent">Words banked</p>
          <ul className="flex flex-wrap gap-2">
            {recap.words.map((w) => (
              <li key={w.id} className="rounded-full border border-line bg-surface px-3 py-1 text-sm">
                <span lang="pt-PT" className="pt text-accent">
                  {w.pt}
                </span>{' '}
                <span className="text-muted">· {w.en}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recap.shape ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
          <p className="eyebrow text-accent">The practice shape · {recap.shape.shape}</p>
          <ul className="flex flex-col gap-2">
            {recap.shape.says.map((l) => (
              <li key={l.pt} className="flex items-start gap-3">
                <AudioButton slug={slugFor(l.pt)} text={l.pt} size="sm" />
                <span className="min-w-0 flex-1">
                  <span lang="pt-PT" className="pt block text-base leading-snug text-accent">
                    {l.pt}
                  </span>
                  <span className="block text-sm leading-snug text-muted">{l.en}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recap.met.length ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6" data-testid="level-met">
          <p className="eyebrow text-accent">Met on this board</p>
          <ul className="flex flex-col divide-y divide-line">
            {recap.met.map((m) =>
              /* A vibe still above the ladder is named, not linked: its door is the retired shelf (review, 2026-11-10). */
              m.kind === 'vibe' && CRATES.some((c) => c.id === m.id && entryRung(c) > rung) ? (
                <li key={m.kind + m.id} className="flex items-center justify-between gap-3 py-2 text-muted">
                  <span className="min-w-0">
                    <span className="eyebrow block text-[0.6rem] text-telha">{m.what}</span>
                    <span className="block truncate text-base">{m.title}</span>
                  </span>
                  <span aria-label="opens a little further up the path">🔒</span>
                </li>
              ) : (
              <li key={m.kind + m.id}>
                <Link href={m.href} className="tap-target flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="eyebrow block text-[0.6rem] text-telha">{m.what}</span>
                    <span className="block truncate text-base">{m.title}</span>
                  </span>
                  <span aria-hidden className="text-muted">
                    →
                  </span>
                </Link>
              </li>
              ),
            )}
          </ul>
        </section>
      ) : null}

      {/* 3. AND WHERE IT LIVES. */}
      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-5 py-5" data-testid="level-yours">
        <p className="text-base leading-relaxed">
          <span className="font-semibold">All of this is kept in Yours</span>, under Level {recap.level}. Come back to it, hear it
          again and test yourself any time.
        </p>
        <Link href={yoursHref} className="tap-target eyebrow block w-full rounded border border-accent px-5 py-3 text-center text-accent">
          OPEN LEVEL {recap.level} IN YOURS
        </Link>
      </section>
      {/* THEN THE NEXT BOARD — the recap is the last square of this one (lap.ts, Até agora). */}
      <Link href="/club" data-testid="level-next-board" className="tap-target eyebrow block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink">
        {/* Not "Board N+1" by number: a paid board may be stepped over, or an earlier one still waiting. */}
        {whole && next ? 'ON TO THE NEXT BOARD →' : '‹ BACK TO THE BOARD'}
      </Link>
    </Frame>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-5 bg-bg px-5 pb-10 text-fg" style={{ paddingTop: 'calc(1.5rem + var(--safe-top, env(safe-area-inset-top, 0px)))' }}>
        <header className="flex items-center gap-3">
          {/* "Close buttons should read back to Board" (Sam, 2026-11-09). */}
          <Link href="/club" className="tap-target eyebrow shrink-0 text-accent" aria-label="Back to the board">
            ‹ Board
          </Link>
          {/* Reached from the board's last square, Até agora (Sam, 2026-11-10: "a summary of your trip so far"). */}
          <p className="eyebrow min-w-0 flex-1 truncate text-right text-muted">So far · até agora</p>
        </header>
        {children}
        <BottomNavSpace />
      </main>
      <BottomNav />
    </>
  )
}

function Stat({ n, label, gold }: { n: number; label: string; gold?: boolean }) {
  return (
    <span className="rounded-xl bg-surface py-2">
      <span className={'display block text-2xl leading-none' + (gold ? ' text-[#c8952e]' : '')}>{n}</span>
      <span className="eyebrow block text-[0.55rem] text-muted">{label}</span>
    </span>
  )
}

function Gold() {
  return (
    <span
      aria-label="said out loud"
      title="Said out loud"
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[#e5b04a] align-middle shadow-[0_0_0_2px_rgba(229,176,74,0.25)]"
    />
  )
}
