import { BLOCK_AUDIO, EXAMPLES, TARGETS } from './targets'
import { BLOCK_ORDER } from './targets'
import { COLLISIONS, ROOTS } from './roots'
import { NO_CUE_PROMPTS } from './front-door'

/** Deterministic slug for any Portuguese string, so generation and playback agree. */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const byText = new Map(EXAMPLES.map((e) => [e.pt_text, e.audio_asset]))

/**
 * Phrases whose slug would collide with a DIFFERENT phrase, given their own file.
 *
 * `slugify` strips accents on purpose — it is the contract between generation and
 * playback, and it has to be stable — but that makes `o quê?` and `o que` the same
 * string. They are not the same thing: `o quê?` is the standalone stressed interrogative
 * ("What?"), `o que` is the unstressed relative ("that which"), and roots.ts already
 * separates them as `o_que_ask` and `o_que`. The manifest builds a Map keyed by slug, so
 * whichever was written second silently took the other's recording and the product read
 * one of them aloud in the wrong stress.
 *
 * Keyed by the exact reviewed string, like `byText` above, so nothing is guessed. Add an
 * entry only when two genuinely different phrases fold together — a question mark against
 * a full stop is the same recording and belongs nowhere near this table.
 */
const DISTINCT: Record<string, string> = {
  'o quê?': 'o-que-ask',
  'O quê?': 'o-que-ask',
  'Desculpa, o quê?': 'desculpa-o-que-ask',
}

export function slugFor(text: string): string {
  return byText.get(text) ?? DISTINCT[text] ?? slugify(text)
}

const bySlug = new Map(EXAMPLES.map((e) => [e.audio_asset, e.pt_text]))

/**
 * Tiles carry bare words, so a built sentence comes out unpunctuated ("Vem comigo").
 * Display the reviewed form from the QA sheet instead — the Portuguese is the hero,
 * and it should never appear on screen in a shape a native reviewer never signed off.
 */
export function canonicalPhrase(text: string): string {
  return bySlug.get(slugFor(text)) ?? text
}

export interface AudioEntry {
  slug: string
  text: string
  kind: 'block' | 'example'
}

/** Two entries are the same recording if they differ only in case or trailing marks. */
export function normalisePhrase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.…?!]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Everything the pt-PT audio build must produce, one entry per slug. A bare block and
 * a booster example can resolve to the same recording (claro / Claro.) — the example
 * wins, because that is the form a speaker would actually say.
 */
export const AUDIO_MANIFEST: AudioEntry[] = (() => {
  const bySlug = new Map<string, AudioEntry>()
  for (const id of BLOCK_ORDER) {
    bySlug.set(BLOCK_AUDIO[id], {
      slug: BLOCK_AUDIO[id],
      text: TARGETS[id].block.replace('…', '').replace(' + verb', '').trim(),
      kind: 'block',
    })
  }
  for (const e of EXAMPLES) {
    bySlug.set(e.audio_asset, {
      slug: e.audio_asset,
      text: e.pt_text,
      kind: 'example',
    })
  }
  // Everything the v0.6 root graph can speak. Roots, their branches, their culture-free
  // release, the collisions and the no-cue prompts — the whole spoken surface.
  const add = (text: string) => {
    const slug = slugify(text)
    if (!bySlug.has(slug)) bySlug.set(slug, { slug, text, kind: 'example' })
  }
  for (const root of ROOTS) {
    add(root.target)
    root.branches.forEach((b) => add(b.target))
    root.extracts.forEach((e) => add(e.target.replace('…', '').trim()))
    root.voice_options?.forEach((v) => add(v.target))
    add(root.transfer_prompt.answer)
  }
  COLLISIONS.forEach((c) => add(c.answer))
  NO_CUE_PROMPTS.forEach((p) => add(p.answer))
  return [...bySlug.values()]
})()
