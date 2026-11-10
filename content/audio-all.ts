/**
 * EVERY LINE DUB SPEAKS, FOR RECORDING (Sam, 2026-11-10: a tester heard "male / English
 * accent audio whereas I only ever hear female / Portuguese").
 *
 * There were no recordings: every play button used the phone's own voice, and a phone with
 * no Portuguese voice read the Portuguese in English. AUDIO_MANIFEST (audio-manifest.ts)
 * listed the vibes' roots and the blocks only. This adds the rest of the spoken surface —
 * every room's lines and release (and the woman's form where it differs), every place's
 * line, every hack's and bluff's lines, every idiom's Portuguese — so one pt-PT voice is
 * shipped as mp3 for all of it (scripts/generate-audio.ts, Google pt-PT).
 *
 * Kept out of audio-manifest.ts on purpose: that module is in the app bundle (slugFor), and
 * this one pulls in all the content. Only the generator and scripts/audio-check.mts use it.
 */
import { AUDIO_MANIFEST, slugify, type AudioEntry } from './audio-manifest'
import { SITUATIONS } from './situations'
import { DROP_SITUATIONS } from './drops'
import { GEMS } from './gems'
import { CHEATS } from './cheats'
import { IDIOMS } from './idioms'

export const AUDIO_ALL: AudioEntry[] = (() => {
  const bySlug = new Map<string, AudioEntry>(AUDIO_MANIFEST.map((a) => [a.slug, a]))
  const add = (text: string | undefined) => {
    const t = text?.trim()
    if (!t) return
    const slug = slugify(t)
    if (slug && !bySlug.has(slug)) bySlug.set(slug, { slug, text: t, kind: 'example' })
  }
  for (const s of [...SITUATIONS, ...DROP_SITUATIONS]) {
    for (const l of s.lines) {
      add(l.pt)
      add(l.f)
    }
    add(s.release.answer)
    add(s.release.answer_f)
  }
  for (const g of GEMS) {
    add(g.line.pt)
    add(g.line.f)
  }
  for (const c of CHEATS) for (const l of c.says) add(l.pt)
  for (const i of IDIOMS) add(i.equivalent)
  return [...bySlug.values()]
})()

/** Two different sentences that would share one file — the slug drops accents and marks. */
export function slugCollisions(list: AudioEntry[] = AUDIO_ALL): string[] {
  const seen = new Map<string, string>()
  const clash: string[] = []
  const norm = (t: string) => t.toLowerCase().replace(/[.…?!,;:]+/g, '').replace(/\s+/g, ' ').trim()
  for (const a of list) {
    const had = seen.get(a.slug)
    if (had !== undefined && norm(had) !== norm(a.text)) clash.push(a.slug + ': "' + had + '" / "' + a.text + '"')
    else seen.set(a.slug, a.text)
  }
  return clash
}
