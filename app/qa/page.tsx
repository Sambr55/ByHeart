import type { Metadata } from 'next'
import { BRAND } from '@/content/brand'
import { AUDIO_MANIFEST } from '@/content/audio-manifest'
import { BLOCK_ORDER, EXAMPLES, TARGETS } from '@/content/targets'
import { allScreens } from '@/content/missions'
import type { BlockId } from '@/content/types'

export const metadata: Metadata = {
  title: 'DUB — European Portuguese QA sheet',
}

/**
 * Appendix A, generated rather than transcribed. A native reviewer can approve or
 * correct the target language here independently of the UX; every correction lands
 * in content/targets.ts and propagates to the lesson and the audio build.
 */
export default function QaPage() {
  const SCREENS = allScreens()
  const screensFor = (id: BlockId) =>
    SCREENS.filter(
      (s) =>
        ([] as BlockId[]).concat(s.introduces ?? []).includes(id) ||
        ([] as BlockId[]).concat(s.acquires ?? []).includes(id) ||
        s.chipHint === id,
    ).map((s) => s.id)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-fg">
      <p className="eyebrow text-accent">{BRAND.name} · CURRICULUM</p>
      <h1 className="display mt-3 text-3xl">European Portuguese QA sheet</h1>
      <p className="mt-3 max-w-prose text-sm text-muted">
        Every Portuguese string the prototype can show or speak. All of it is European
        Portuguese (Portugal). Mark anything unnatural, regionally wrong, or
        pedagogically misleading — language trust is existential, so corrections ship
        before any external test.
      </p>

      <h2 className="display mt-10 text-xl">The ten building blocks</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th className="py-2 pr-4">Block</th>
              <th className="py-2 pr-4">Gloss shown</th>
              <th className="py-2 pr-4">Internal grammar note</th>
              <th className="py-2">Screens</th>
            </tr>
          </thead>
          <tbody>
            {BLOCK_ORDER.map((id) => (
              <tr key={id} className="border-b border-line/60 align-top">
                <td className="py-3 pr-4">
                  <span className="pt text-base text-accent">{TARGETS[id].block}</span>
                </td>
                <td className="py-3 pr-4">{TARGETS[id].gloss}</td>
                <td className="py-3 pr-4 text-muted">
                  {TARGETS[id].grammar_note_internal}
                </td>
                <td className="py-3 text-xs tabular-nums text-muted">
                  {screensFor(id).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="display mt-12 text-xl">Every utterance</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th className="py-2 pr-4">Portuguese (pt-PT)</th>
              <th className="py-2 pr-4">English</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2">Audio slug</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLES.map((e) => (
              <tr key={e.example_id} className="border-b border-line/60">
                <td className="py-3 pr-4">
                  <span className="pt text-base text-accent">{e.pt_text}</span>
                </td>
                <td className="py-3 pr-4">{e.en_gloss}</td>
                <td className="py-3 pr-4 text-muted">{e.role}</td>
                <td className="py-3 font-mono text-xs text-muted">{e.audio_asset}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="display mt-12 text-xl">Audio build</h2>
      <p className="mt-2 text-sm text-muted">
        {AUDIO_MANIFEST.length} assets, all pt-PT. A bare block and its booster example
        share a recording where they are the same utterance.
      </p>

      <h2 className="display mt-12 text-xl">Source lines and their translations</h2>
      <p className="mt-2 max-w-prose text-sm text-muted">
        Each cultural moment is shown with the whole line in Portuguese underneath, and
        that line stays in view while the block is being taught. These renderings are
        the bridge between the moment and the language, so they need checking twice:
        for naturalness, and for whether they actually make the target block visible
        inside the sentence. The film titles are the released Portuguese titles as far
        as I can establish them — please correct any that are wrong, or that differ in
        Portugal from what is listed.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th className="py-2 pr-4">Source</th>
              <th className="py-2 pr-4">Line</th>
              <th className="py-2 pr-4">Portuguese shown</th>
              <th className="py-2">Screens</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(
              SCREENS.filter((s) => s.source).reduce<
                Record<string, { from: string; line: string; pt: string; ids: string[] }>
              >((acc, s) => {
                const src = s.source!
                const key = src.pt
                acc[key] ??= { from: src.from ?? '', line: src.line, pt: src.pt, ids: [] }
                acc[key].ids.push(s.id)
                return acc
              }, {}),
            ).map(([key, v]) => (
              <tr key={key} className="border-b border-line/60 align-top">
                <td className="py-3 pr-4 text-xs uppercase tracking-wider text-muted">
                  {v.from}
                </td>
                <td className="py-3 pr-4">“{v.line}”</td>
                <td className="py-3 pr-4">
                  <span className="pt text-base text-accent">{v.pt}</span>
                </td>
                <td className="py-3 font-mono text-xs text-muted">{v.ids.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="display mt-12 text-xl">Cultural hooks in use</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {SCREENS.filter((s) => s.hook).map((s) => (
          <li key={s.id} className="border-b border-line/60 pb-2">
            <span className="font-mono text-xs text-muted">{s.id}</span>{' '}
            <span className="text-fg">“{s.hook}”</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-prose text-xs text-muted">
        Brief reference only — no dialogue sequences, subtitle tracks, lyrics, footage,
        stills or likenesses. Aviation styling is original geometry, never film key art.
      </p>
    </main>
  )
}
