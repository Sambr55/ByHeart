import { BLOCK_AUDIO, EXAMPLES, TARGETS } from './targets'
import { BLOCK_ORDER } from './targets'

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

export function slugFor(text: string): string {
  return byText.get(text) ?? slugify(text)
}

export interface AudioEntry {
  slug: string
  text: string
  kind: 'block' | 'example'
}

/** Everything the pt-PT audio build must produce. Feed this to the TTS script. */
export const AUDIO_MANIFEST: AudioEntry[] = [
  ...BLOCK_ORDER.map((id) => ({
    slug: BLOCK_AUDIO[id],
    text: TARGETS[id].block.replace('…', '').replace(' + verb', '').trim(),
    kind: 'block' as const,
  })),
  ...EXAMPLES.map((e) => ({
    slug: e.audio_asset,
    text: e.pt_text,
    kind: 'example' as const,
  })),
]
