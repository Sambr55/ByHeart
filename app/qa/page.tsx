import type { Metadata } from 'next'
import { BRAND } from '@/content/brand'
import {
  COLLISIONS,
  CRATES,
  NO_CUE_LINES,
  PIECES,
  ROOTS_BY_FAMILY,
  RUNGS,
  SETS,
  displayForm,
  setPieces,
} from '@/content/roots'

export const metadata: Metadata = { title: 'DUB — European Portuguese QA sheet' }

/**
 * Every Portuguese string a learner can meet, generated from the graph.
 *
 * This is the sheet a native reviewer is handed, and it is the last true blocker on
 * charging money — so it being WRONG is the most expensive kind of stale. It was
 * generated from content/targets.ts and content/missions: the ten-block, two-mission
 * model DUB left behind. A reviewer approving it would have approved nothing a learner
 * can currently see.
 *
 * Generated rather than transcribed, so a correction lands in content/roots.ts and
 * propagates to the lesson, the library, the daily line and the audio build at once.
 *
 * Laid out for the job: one crate at a time, and within a root every string in the order
 * the learner meets it — the cue, the Portuguese, the pieces, the branches, the build.
 * A reviewer needs the context to judge naturalness, which a flat word list destroys.
 */
export default function QaPage() {
  const crates = CRATES.filter((c) => (ROOTS_BY_FAMILY[c.id] ?? []).length > 0)
  const total = crates.reduce((n, c) => n + (ROOTS_BY_FAMILY[c.id] ?? []).length, 0)

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10 text-fg">
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-accent">{BRAND.name} · QA</p>
        <h1 className="display text-3xl">European Portuguese QA sheet</h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted">
          Every Portuguese string DUB can show or speak, generated from the content graph.
          All of it is European Portuguese as spoken in Portugal — not Brazilian. Mark
          anything unnatural, regionally wrong, or pedagogically misleading. Language
          trust is existential here, so corrections ship before any external test.
        </p>
        <p className="max-w-prose text-sm leading-relaxed text-muted">
          Two things worth knowing before you start. The <em>cue</em> column is a cultural
          reference and is deliberately not a translation — it is what the learner already
          recognises. And a <em>build</em> is what they have to produce from scratch with
          nothing on screen to copy from, so it matters most that it is a sentence a real
          person would actually say.
        </p>
        <p className="text-xs tabular-nums text-muted">
          {crates.length} crates · {total} roots · {Object.keys(PIECES).length} pieces ·{' '}
          {COLLISIONS.length} combinations · {NO_CUE_LINES.length} cold prompts
        </p>
      </div>

      {crates.map((crate) => {
        const roots = ROOTS_BY_FAMILY[crate.id] ?? []
        return (
          <section key={crate.id} className="flex flex-col gap-3 border-t border-line pt-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="display text-xl">{crate.title}</h2>
              <span className="eyebrow text-muted">{roots.length} roots</span>
            </div>
            {roots.map((root) => (
              <article
                key={root.root_id}
                className="flex flex-col gap-3 rounded border border-line bg-bg-elev px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="eyebrow text-accent">{root.root_id}</span>
                  <span className="text-xs text-muted">
                    stage {root.rung} · {RUNGS[root.rung - 1].name}
                  </span>
                  <span className="text-xs text-muted">{root.rights_status}</span>
                </div>

                <dl className="flex flex-col gap-1 text-sm">
                  <div className="flex flex-wrap gap-3">
                    <dt className="w-24 shrink-0 text-xs uppercase tracking-wider text-muted">cue</dt>
                    <dd className="min-w-0 flex-1 text-muted">{root.root_display}</dd>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <dt className="w-24 shrink-0 text-xs uppercase tracking-wider text-muted">root</dt>
                    <dd className="pt min-w-0 flex-1 text-accent">{root.target}</dd>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <dt className="w-24 shrink-0 text-xs uppercase tracking-wider text-muted">why</dt>
                    <dd className="min-w-0 flex-1 text-xs leading-relaxed text-muted">
                      {root.semantic_bridge}
                    </dd>
                  </div>
                </dl>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted">pieces</p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {root.extracts.map((e) => (
                      <li key={e.id} className="flex flex-wrap items-baseline gap-3 text-sm">
                        <span className="pt text-accent">{displayForm(PIECES[e.id] ?? e)}</span>
                        <span className="text-xs text-muted">{e.gloss}</span>
                        {e.note ? (
                          <span className="w-full text-xs leading-relaxed text-muted">{e.note}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted">branches</p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {root.branches.map((b) => (
                      <li key={b.target} className="flex flex-wrap items-baseline gap-3 text-sm">
                        <span className="pt">{b.target}</span>
                        <span className="text-xs text-muted">{b.en}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted">
                    build — said cold, nothing on screen
                  </p>
                  <p className="mt-1 text-xs text-muted">{root.transfer_prompt.context}</p>
                  <p className="pt mt-1 text-sm text-accent">{root.transfer_prompt.answer}</p>
                  <p className="text-xs text-muted">{root.transfer_prompt.ask}</p>
                </div>

                {root.voice_options?.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted">register</p>
                    <ul className="mt-1 flex flex-col gap-1">
                      {root.voice_options.map((v) => (
                        <li key={v.target} className="flex flex-wrap items-baseline gap-3 text-sm">
                          <span className="pt">{v.target}</span>
                          <span className="text-xs text-muted">
                            {v.register} — {v.when}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        )
      })}

      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 className="display text-xl">Combinations</h2>
        <p className="max-w-prose text-xs leading-relaxed text-muted">
          Pieces from two unrelated crates in one sentence. These are the strings most
          likely to be grammatical and still sound wrong, so they are worth the most
          attention.
        </p>
        <ul className="flex flex-col gap-3">
          {COLLISIONS.map((c) => (
            <li key={c.id} className="rounded border border-line bg-bg-elev px-4 py-3">
              <p className="text-xs text-muted">{c.context}</p>
              <p className="pt mt-1 text-sm text-accent">{c.answer}</p>
              <p className="text-xs text-muted">{c.ask}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 className="display text-xl">Cold prompts</h2>
        <ul className="flex flex-col gap-3">
          {NO_CUE_LINES.map((p) => (
            <li key={p.answer} className="rounded border border-line bg-bg-elev px-4 py-3">
              <p className="text-xs text-muted">{p.context}</p>
              <p className="pt mt-1 text-sm text-accent">{p.answer}</p>
              <p className="text-xs text-muted">{p.ask}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 className="display text-xl">Closed sets</h2>
        <p className="max-w-prose text-xs leading-relaxed text-muted">
          Groups shown to the learner as a whole, so the gaps are visible. A member with
          no piece behind it is not taught yet — those are a content brief, not an error.
        </p>
        <ul className="flex flex-col gap-3">
          {SETS.map((s) => {
            const taught = setPieces(s)
            return (
              <li key={s.id} className="rounded border border-line bg-bg-elev px-4 py-3">
                <p className="text-sm font-semibold">{s.label}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {s.members.map((m) => (
                    <span
                      key={m}
                      className={'pt text-sm ' + (taught.has(m) ? 'text-accent' : 'text-muted')}
                    >
                      {m}
                    </span>
                  ))}
                </p>
                <p className="mt-1 text-xs tabular-nums text-muted">
                  {taught.size} of {s.members.length} taught
                </p>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
