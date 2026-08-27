'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CRATES, PIECES } from '@/content/roots'
import {
  CRATES_TO_UNLOCK_LEGEND,
  LEGEND_COPY,
  LEGEND_FRAMES,
  REPAIR_KIT,
  cratesToGo,
  cardDone,
  fillFrame,
  frameApplies,
  frameFor,
  isAnswered,
  legendStatus,
  provenanceOf,
  type LegendFrame,
} from '@/content/legend'
import { AudioButton } from '@/components/AudioButton'
import { NumberPicker } from '@/components/NumberPicker'
import { Menu } from '@/components/Menu'
import { MiniBuild } from '@/components/Journey'
import { Wordmark } from '@/components/Wordmark'
import { slugFor } from '@/content/audio-manifest'
import { track } from '@/engine/analytics'
import { answerLegend, recordProof, rehearsedLegend } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'

/**
 * Your Legend.
 *
 * A deck of answers to the questions you will actually be asked, not a monologue —
 * because nobody delivers a paragraph at a bar, and a memorised speech collapses the
 * moment somebody asks you something slightly different. Answers survive contact.
 *
 * It is never a blank form. It starts at whatever the learner's language already reaches,
 * which after one crate is one or two cards, and grows as the crates feed it. And no card
 * is required: some people have no children and some will not say why they left, so an
 * empty card simply is not in the run-through — never a gap, never a prompt to complete
 * it.
 */
type Mode = 'deck' | { build: string } | 'rehearse' | 'cold'

export function Legend() {
  const learner = useLearner()
  const [mode, setMode] = useState<Mode>('deck')
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    // ?cold=1 lands straight in a cold open — from the Club, from the daily line, from a
    // notification. Read from the URL after mount rather than useSearchParams, so this
    // page needs no Suspense boundary.
    if (new URLSearchParams(window.location.search).get('cold') === '1') setMode('cold')
  }, [])

  const owned = useMemo(
    () => Object.keys(learner.inventory ?? {}).filter((id) => PIECES[id]),
    [learner.inventory],
  )
  const answers = learner.legend ?? []
  const valuesFor = (id: string) => answers.find((a) => a.frame_id === id)?.values
  /*
    The Legend opens on crates done, not on owning specific words.

    Every one of the eighteen words it used to depend on was taught in exactly one crate,
    so "unlock your Legend" quietly meant "play these eight particular vibes" — and two
    cards hung on a word that only exists inside a drop, and is therefore unobtainable
    for most of the year. Counting crates deletes that whole class of problem instead of
    patching it, and five is more than the free tier allows, so arriving here means
    somebody decided DUB was worth paying for.

    Every card is then open at once. The words are not a precondition any more; building
    a card teaches them.
  */
  const done = learner.sections_completed ?? []
  /*
    The same function every other screen uses.

    This called legendUnlocked directly while the session screen called legendStatus, and
    that screen counted the vibe in progress — so at four recorded plus the one being
    finished, one said "your Legend is open, fill them in" and this one, a tap later,
    showed ten dashed cards. Both correct, different questions.
  */
  const unlocked = mounted && legendStatus({ sectionsCompleted: done }).open
  const toGo = cratesToGo(done)
  const reachable = useMemo(() => (mounted && unlocked ? LEGEND_FRAMES : []), [mounted, unlocked])
  const answered = useMemo(
    () => LEGEND_FRAMES.filter((f) => isAnswered(f, valuesFor(f.id))),
    [answers],
  )

  if (typeof mode === 'object') {
    const frame = LEGEND_FRAMES.find((f) => f.id === mode.build)!
    return (
      <Shell>
        <BuildCard
          frame={frame}
          values={valuesFor(frame.id) ?? {}}
          gender={learner.profile?.gender ?? null}
          owned={owned}
          onDone={() => setMode('deck')}
        />
      </Shell>
    )
  }

  if (mode === 'rehearse' || mode === 'cold') {
    return (
      <Shell>
        <RunThrough
          cards={answered}
          gender={learner.profile?.gender ?? null}
          cold={mode === 'cold'}
          valuesFor={valuesFor}
          onDone={() => setMode('deck')}
        />
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-accent">YOUR LEGEND</p>
        <h1 className="display text-balance text-2xl">{LEGEND_COPY.what}</h1>
        {/* One line of spy framing, then it gets out of the way. Dry, not jokey — the
            learner is doing something genuinely difficult — and it says plainly that
            theirs is true, or the metaphor curdles. */}
        <p className="text-sm leading-relaxed text-muted">{LEGEND_COPY.spy}</p>
        {mounted && answered.length ? (
          <p className="text-xs tabular-nums text-muted">
            {answered.length} of {LEGEND_FRAMES.length} answered ·{' '}
            {reachable.length - answered.length} more your Portuguese already reaches
          </p>
        ) : null}
      </div>

      {mounted && answered.length >= 2 ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            data-testid="legend-rehearse"
            onClick={() => {
              track('legend_rehearse', { cards: answered.length })
              setMode('rehearse')
            }}
            className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink"
          >
            RUN IT THROUGH
          </button>
          <button
            type="button"
            data-testid="legend-cold"
            onClick={() => {
              track('legend_cold_open', { cards: answered.length })
              setMode('cold')
            }}
            className="tap-target eyebrow w-full rounded border border-line-strong px-5 py-3 text-muted"
          >
            COLD OPEN
          </button>
        </div>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="eyebrow min-w-0 text-accent">THE CARDS</h2>
          <span className="h-px flex-1 bg-line" />
        </div>
        {!mounted ? null : !unlocked ? (
          /*
            Locked, and showing exactly what is behind it.

            The questions are real and a stranger will ask them. Seeing "Tens filhos?"
            and knowing you cannot yet answer it is the hook — a count of banked blocks
            would be an abstraction of the same thing and a weaker one.
          */
          <div className="flex flex-col gap-3">
            <div className="rounded border border-line-strong bg-bg-elev px-4 py-3">
              <p className="text-sm font-semibold">{LEGEND_COPY.locked_head}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {toGo === 1
                  ? 'One more vibe and these open.'
                  : toGo + ' more vibes and these open.'}{' '}
                {LEGEND_COPY.locked_body}
              </p>
              {/*
                Which ones it has actually counted.
                
                "One more vibe and these open" is unarguable and useless when a learner
                believes they have done five. There was no way to see what the product
                thought — so a mismatch between what somebody did and what was recorded
                looked exactly like the feature being broken, and could not be told apart
                from it by anyone, including me. A vibe counts when you reach the end of
                it; leaving halfway does not, and now that is visible rather than
                mysterious.
              */}
              <p className="mt-3 text-xs leading-relaxed text-muted">
                {done.length === 0
                  ? 'None finished yet.'
                  : 'Finished so far: ' +
                    done
                      .map((id) => CRATES.find((c) => c.id === id)?.title ?? id)
                      .join(', ') +
                    '.'}
              </p>
              <Link
                href="/vibes"
                className="tap-target eyebrow mt-3 inline-flex items-center text-accent underline underline-offset-4"
              >
                PICK A VIBE
              </Link>
            </div>
            <ul className="flex flex-col gap-1">
              {LEGEND_FRAMES.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-col gap-1 rounded border border-dashed border-line px-4 py-3"
                >
                  <span className="pt text-sm text-muted">{f.ask}</span>
                  <span className="text-xs text-muted">{f.ask_en}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : cardDone(answered.map((f) => f.id), answers) && !learner.club_welcomed_at ? (
          /*
            The card is finished and the Club is the point of finishing it.

            There was no route: somebody completed the seven questions and the Legend
            said nothing, while the Club sat behind a door it would now open. The goal of
            the product had no last step.
          */
          <div className="flex flex-col gap-3 rounded border border-accent bg-accent/10 px-4 py-6">
            <p className="eyebrow text-accent">{LEGEND_COPY.card_done_eyebrow}</p>
            <p className="display text-balance text-xl">{LEGEND_COPY.card_done_head}</p>
            <p className="text-sm leading-relaxed text-muted">{LEGEND_COPY.card_done_body}</p>
            <Link
              href="/club"
              className="tap-target eyebrow mt-3 block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
            >
              {LEGEND_COPY.card_done_cta}
            </Link>
          </div>
        ) : null}
        {!mounted || !unlocked ? null : !reachable.length && !answered.length ? (
          <div className="rounded border border-line bg-bg-elev px-4 py-3">
            <p className="text-sm font-semibold">{LEGEND_COPY.empty_head}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{LEGEND_COPY.empty_body}</p>
            <Link href="/vibes" className="tap-target eyebrow mt-3 inline-flex items-center text-accent underline underline-offset-4">
              OPEN A VIBE
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {/*
              A card that does not apply is not a card.

              "And what do they do?" is a question about children and it was dealt to
              everybody, so somebody childless was handed a sentence about theirs and
              then counted as having one question outstanding for ever.
            */}
            {LEGEND_FRAMES.filter((f) => frameApplies(f, answers)).map((f) => {
              const values = valuesFor(f.id)
              const done = isAnswered(f, values)
              const open = reachable.some((r) => r.id === f.id)
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    data-testid={'legend-card-' + f.id}
                    disabled={!open}
                    onClick={() => setMode({ build: f.id })}
                    className={
                      'tap-target flex w-full flex-col gap-1 rounded border px-4 py-3 text-left transition ' +
                      (done
                        ? 'border-line bg-bg-elev hover:border-accent/50'
                        : open
                          ? 'border-dashed border-accent/40 bg-surface/30 hover:border-accent'
                          : 'border-dashed border-line/60 bg-surface/30 opacity-50')
                    }
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="pt min-w-0 text-sm text-accent">{f.ask}</span>
                      <span className="shrink-0 text-[0.55rem] uppercase tracking-wider text-muted">
                        {done ? 'yours' : open ? 'ready' : 'not yet'}
                      </span>
                    </span>
                    <span className="text-xs text-muted">{f.ask_en}</span>
                    {done ? (
                      <span className="pt mt-1 block text-sm">
                        {fillFrame(f, values ?? {}, learner.profile?.gender ?? null)}
                      </span>
                    ) : !open ? (
                      <span className="mt-1 block text-xs text-muted">
                        Needs {missingFrom(f, owned)}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/*
        The repair kit, and it is not optional.

        What ends a conversation is never running out of things to say — it is the moment
        they answer, you catch nothing, and you switch to English. These four are worth
        more than the ten cards above, so every learner has them whether or not they have
        built anything at all.
      */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="eyebrow min-w-0 text-accent">THE REPAIR KIT</h2>
          <span className="h-px flex-1 bg-line" />
        </div>
        <p className="text-xs leading-relaxed text-muted">{LEGEND_COPY.repair_body}</p>
        <ul className="flex flex-col gap-3">
          {REPAIR_KIT.map((r) => (
            <li key={r.pt} className="flex items-start gap-3 rounded border border-line bg-bg-elev px-4 py-3">
              <AudioButton slug={slugFor(r.pt)} text={r.pt} size="sm" />
              <span className="min-w-0">
                <span className="pt block text-sm text-accent">{r.pt}</span>
                <span className="mt-1 block text-xs text-muted">{r.en}</span>
                <span className="mt-1 block text-xs text-muted">{r.why}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  )
}

/** Which crate a learner still needs, said as a destination rather than a lack. */
function missingFrom(frame: LegendFrame, owned: string[]): string {
  const have = new Set(owned)
  const short = frame.built_from.filter((p) => !have.has(p))
  const crates = [
    ...new Set(
      short
        .map((p) => CRATES.find((c) => c.id === PIECES[p]?.family)?.title)
        .filter(Boolean) as string[],
    ),
  ]
  if (!crates.length) return 'a word you have not met yet'
  return crates.slice(0, 2).join(' and ')
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      data-stage="REAL WORLD"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 pb-10 pt-6 text-fg"
    >
      <div className="flex items-center gap-3">
        <Link href="/club" className="tap-target flex shrink-0 items-center gap-1 eyebrow text-muted">
          <span aria-hidden>←</span>
          <Wordmark className="h-3" title="DUB — back to Dub Club" />
        </Link>
        <span className="flex-1" />
        <Menu />
      </div>
      {children}
    </main>
  )
}

/**
 * One card, five beats — the same rhythm as a root, which is what stops it feeling like
 * a form.
 *
 *   1  the question, heard first, in Portuguese
 *   2  the frame, with the gaps visible
 *   3  where its words came from
 *   4  make it yours
 *   5  say it cold
 *
 * Beat 3 is the one that makes this DUB. Every card names the crates its own words came
 * from — the collision mechanic, on the learner's own family — and it writes itself from
 * built_from.
 */
function BuildCard({
  frame,
  values,
  gender,
  owned,
  onDone,
}: {
  frame: LegendFrame
  values: Record<string, string>
  gender: 'm' | 'f' | null
  owned: string[]
  onDone: () => void
}) {
  const [draft, setDraft] = useState<Record<string, string>>(values)
  const [beat, setBeat] = useState<'ask' | 'build' | 'cold'>('ask')
  /*
    The shape follows the answer.

    A variant is a different sentence, not the same one with a word swapped — "I have one
    son. He is called…" has a different verb ending from "I have three." So the slots on
    screen change the moment the count is picked, and `filled` judges the sentence they
    are actually building rather than the one this card started as.
  */
  const shape = frameFor(frame, draft)
  const filled = shape.slots.every((s) => draft[s.key]?.trim())
  const sentence = fillFrame(frame, draft, gender)
  const provenance = provenanceOf(frame)
  /*
    Did they already have these words, or is this card handing them over?

    Both are fine and the line says which. Requiring the first was the old gate, and it
    is what made two cards permanently unreachable.
  */
  const allOwned = frame.built_from.every((p) => owned.includes(p))

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="eyebrow text-muted">THEY ASK</p>
        <div className="flex items-center gap-3">
          <AudioButton slug={slugFor(frame.ask)} text={frame.ask} size="sm" />
          <span className="min-w-0">
            <span className="pt block text-xl text-accent">{frame.ask}</span>
            <span className="block text-xs text-muted">{frame.ask_en}</span>
          </span>
        </div>
      </div>

      {beat === 'ask' ? (
        <>
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-muted">THE PATTERN</p>
            <p className="pt text-balance text-lg">
              {frame.frame.replace(/\{(\w+)\}/g, '___')}
            </p>
            <p className="text-xs text-muted">{frame.en.replace(/\{(\w+)\}/g, '___')}</p>
          </div>

          {/*
            THE LESSON, and it is why this is not a form.

            The card used to require you to own the words before it would open, which
            made it two text inputs and a set of chips. Now it teaches — and the moment
            you need to say how old you are is exactly the right moment to learn that
            Portuguese HAS an age rather than being one. Written like a semantic bridge,
            because that is what it is.
          */}
          <div className="flex flex-col gap-1 rounded border border-line bg-bg-elev px-4 py-3">
            <p className="eyebrow text-accent">WHY IT LANDS</p>
            <p className="text-sm leading-relaxed">{frame.teaches}</p>
          </div>

          {/* The delightful beat, and it costs nothing to generate. */}
          {provenance.length ? (
            <div className="flex flex-col gap-1 rounded border-l-2 border-accent/50 bg-surface px-3 py-3">
              <p className="eyebrow text-muted">YOU KNOW THESE</p>
              {provenance.map((p) => (
                <p key={p.piece} className="text-xs leading-relaxed text-fg/85">
                  <span className="pt text-accent">{p.piece}</span> came out of{' '}
                  {CRATES.find((c) => c.id === p.family)?.title ?? 'another vibe'}.
                </p>
              ))}
              <p className="mt-1 text-xs text-muted">
                {allOwned
                  ? 'None of it was ever about you.'
                  : 'Some of that is new — it is yours now either way.'}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            data-testid="legend-make-mine"
            onClick={() => setBeat('build')}
            className="tap-target eyebrow mt-auto w-full rounded bg-accent px-5 py-3 text-accent-ink"
          >
            MAKE IT MINE
          </button>
        </>
      ) : null}

      {beat === 'build' ? (
        <>
          <div className="flex flex-col gap-3">
            {shape.slots.map((slot) => (
              <div key={slot.key} className="flex flex-col gap-1">
                <label htmlFor={slot.key} className="text-xs text-muted">
                  {slot.hint}
                </label>
                {slot.kind === 'number' ? (
                  /*
                    A number you can say. It was a text box with inputMode="numeric", so
                    the card came out "Tenho 56 anos" — readable, unpronounceable, and
                    useless on the one question it exists to answer.
                  */
                  <NumberPicker
                    value={draft[slot.key] ?? ''}
                    max={frame.id === 'how_long' ? 60 : 100}
                    onChange={(n) => setDraft((d) => ({ ...d, [slot.key]: n }))}
                  />
                ) : slot.kind === 'pick' ? (
                  <div className="flex flex-wrap gap-1">
                    {/*
                      Both endings when the profile question was skipped.

                      A gendered adjective has to agree with the speaker, and DUB asks for
                      gender but lets people decline — so guessing masculine would put the
                      wrong word in somebody's mouth every time they said it. Where it is
                      known, one chip per option in the right ending; where it is not,
                      both, and the learner picks the word they would actually say.
                    */}
                    {slot.options?.flatMap((o) => {
                      const forms =
                        !slot.gendered || !o.f
                          ? [o.value]
                          : gender === 'f'
                            ? [o.f]
                            : gender === 'm'
                              ? [o.value]
                              : [o.value, o.f]
                      return forms.map((form) => {
                        const on = draft[slot.key] === form
                        return (
                          <button
                            key={form}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setDraft({ ...draft, [slot.key]: on ? '' : form })}
                            className={
                              'tap-target rounded border px-3 py-1 text-sm transition ' +
                              (on ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted')
                            }
                          >
                            <span className="pt">{form}</span>
                            <span className="ml-1 text-xs text-muted">{o.en}</span>
                          </button>
                        )
                      })
                    })}
                  </div>
                ) : (
                  <input
                    id={slot.key}
                    value={draft[slot.key] ?? ''}

                    onChange={(e) => setDraft({ ...draft, [slot.key]: e.target.value })}
                    className="tap-target rounded border border-line bg-surface px-4 py-3 text-base text-fg"
                  />
                )}
              </div>
            ))}
          </div>

          {filled ? (
            <div className="flex flex-col gap-1 rounded border border-accent bg-accent/10 px-4 py-3">
              <p className="eyebrow text-muted">YOURS</p>
              <p className="pt text-base text-accent">{sentence}</p>
            </div>
          ) : null}

          {frame.helpers ? (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
              {Object.entries(frame.helpers).map(([k, v]) => (
                <li key={k}>
                  <span className="pt">{k}</span> — {v}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Skippable, always. Some people have no children and some will not say why
              they left, so leaving it empty is a real answer rather than an omission. */}
          <div className="mt-auto flex flex-col gap-3">
            <button
              type="button"
              data-testid="legend-save"
              disabled={!filled}
              onClick={() => {
                answerLegend(frame.id, draft)
                track('legend_card_answered', { card: frame.id })
                setBeat('cold')
              }}
              className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink disabled:border disabled:border-line-strong disabled:bg-transparent disabled:text-muted"
            >
              SAVE IT
            </button>
            <button
              type="button"
              data-testid="legend-skip"
              onClick={() => {
                answerLegend(frame.id, {})
                track('legend_card_skipped', { card: frame.id })
                onDone()
              }}
              className="tap-target text-center text-xs text-muted underline underline-offset-4"
            >
              Leave this one empty
            </button>
          </div>
        </>
      ) : null}

      {beat === 'cold' ? (
        <ColdSay
          ask={frame.ask}
          answer={sentence}
          helpers={frame.helpers}
          onDone={(clean) => {
            recordProof({ pt: sentence, en: frame.en, source: 'legend', clean })
            if (clean) rehearsedLegend(frame.id)
            onDone()
          }}
        />
      ) : null}
    </div>
  )
}

/**
 * Say it with nothing on screen.
 *
 * The same MiniBuild the release beat uses, so a Legend answer said clean counts on the
 * proof card on exactly the same terms as everything else — because it is exactly the
 * same thing: a sentence produced with no cue.
 */
function ColdSay({
  ask,
  answer,
  helpers,
  onDone,
}: {
  ask: string
  answer: string
  helpers?: Record<string, string>
  onDone: (clean: boolean) => void
}) {
  const [done, setDone] = useState(false)
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="eyebrow text-muted">NO CLUES</p>
        <p className="pt text-balance text-xl text-accent">{ask}</p>
      </div>
      <MiniBuild
        target={answer}
        helpers={helpers}
        onSolved={({ clean }) => {
          setDone(true)
          onDone(clean)
        }}
      />
      {done ? null : <div className="mt-auto" />}
    </div>
  )
}

/**
 * The run-through, and the cold open.
 *
 * Rehearsal is the existing no-cue mechanic pointed at the learner's own sentences. The
 * cold open is one question with no warning and a beat of silence before the answer is
 * available — which is the exact half-second in a bar where you either have it or you do
 * not, and the only way to practise the thing that actually goes wrong.
 *
 * Never scored, never timed. A cold open you get wrong shows the answer and moves on: the
 * moment there is a score attached to being put on the spot, the feature becomes the
 * anxiety it exists to remove.
 */
function RunThrough({
  cards,
  gender,
  cold,
  valuesFor,
  onDone,
}: {
  cards: LegendFrame[]
  gender: 'm' | 'f' | null
  cold: boolean
  valuesFor: (id: string) => Record<string, string> | undefined
  onDone: () => void
}) {
  // Shuffled once, after mount — a cold open in a fixed order is not cold.
  const order = useMemo(() => {
    if (!cold) return cards
    const out = [...cards]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out.slice(0, 1)
  }, [cards, cold])

  const [i, setI] = useState(0)
  const [shown, setShown] = useState(false)
  const frame = order[i]

  if (!frame) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-3">
        <p className="eyebrow text-accent">DONE</p>
        <p className="display text-balance text-2xl">
          {cold ? 'That is the one that counts.' : 'All the way through, out loud.'}
        </p>
        <button
          type="button"
          onClick={onDone}
          className="tap-target eyebrow mt-6 w-full rounded bg-accent px-5 py-3 text-accent-ink"
        >
          MY LEGEND
        </button>
      </div>
    )
  }

  const answer = fillFrame(frame, valuesFor(frame.id) ?? {}, gender)
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="eyebrow text-muted">{cold ? 'NO WARNING' : i + 1 + ' OF ' + order.length}</p>
        <div className="flex items-center gap-3">
          <AudioButton slug={slugFor(frame.ask)} text={frame.ask} size="sm" />
          <span className="pt min-w-0 text-xl text-accent">{frame.ask}</span>
        </div>
        {cold && !shown ? (
          <p className="mt-3 text-sm leading-relaxed text-muted">{LEGEND_COPY.cold_body}</p>
        ) : null}
      </div>

      {shown ? (
        <div className="flex flex-col gap-1 rounded border border-line bg-bg-elev px-4 py-3">
          <p className="eyebrow text-muted">YOURS</p>
          <p className="pt text-base text-accent">{answer}</p>
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-3">
        {!shown ? (
          <button
            type="button"
            data-testid="legend-reveal"
            onClick={() => {
              setShown(true)
              if (cold) rehearsedLegend(frame.id)
            }}
            className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink"
          >
            {cold ? 'SAID IT — SHOW ME' : 'SHOW ME'}
          </button>
        ) : (
          <button
            type="button"
            data-testid="legend-next"
            onClick={() => {
              setShown(false)
              setI(i + 1)
            }}
            className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink"
          >
            {i + 1 < order.length ? 'NEXT' : 'DONE'}
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className="tap-target text-center text-xs text-muted underline underline-offset-4"
        >
          Stop here
        </button>
      </div>
    </div>
  )
}
