/**
 * Generate the pt-PT audio assets from the content manifest.
 *
 *   ELEVENLABS_API_KEY=... npm run audio:generate
 *   GOOGLE_TTS_API_KEY=...  npm run audio:generate
 *
 * Writes public/audio/pt-PT/<slug>.mp3 plus a manifest.json. Existing files are
 * skipped, so a native-speaker recording dropped in by hand is never overwritten
 * by a synthetic one — delete the file to force a regenerate.
 *
 * European Portuguese only. A Brazilian voice fails the language standard in §6.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { AUDIO_ALL as AUDIO_MANIFEST, slugCollisions } from '../content/audio-all'

const OUT = join(process.cwd(), 'public', 'audio', 'pt-PT')

/** A pt-PT voice. Override with ELEVENLABS_VOICE_ID / GOOGLE_TTS_VOICE. */
const ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID ?? ''
const GOOGLE_VOICE = process.env.GOOGLE_TTS_VOICE ?? 'pt-PT-Wavenet-A'

async function eleven(text: string, key: string): Promise<Buffer> {
  if (!ELEVEN_VOICE) {
    throw new Error(
      'Set ELEVENLABS_VOICE_ID to a European Portuguese voice from your library.',
    )
  }
  const res = await fetch(
    'https://api.elevenlabs.io/v1/text-to-speech/' + ELEVEN_VOICE + '?output_format=mp3_44100_128',
    {
      method: 'POST',
      headers: { 'xi-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  )
  if (!res.ok) throw new Error('ElevenLabs ' + res.status + ': ' + (await res.text()))
  return Buffer.from(await res.arrayBuffer())
}

async function google(text: string, key: string): Promise<Buffer> {
  const res = await fetch(
    'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + key,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'pt-PT', name: GOOGLE_VOICE },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
      }),
    },
  )
  if (!res.ok) throw new Error('Google TTS ' + res.status + ': ' + (await res.text()))
  const body = (await res.json()) as { audioContent: string }
  return Buffer.from(body.audioContent, 'base64')
}

/** Retried on rate limits and server errors, so a run of a thousand lines finishes. */
async function withRetry(f: () => Promise<Buffer>): Promise<Buffer> {
  for (let i = 0; ; i++) {
    try {
      return await f()
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      if (i >= 4 || !/ (429|500|502|503|504):/.test(m)) throw e
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i))
    }
  }
}

/*
  SAMPLE FIRST (2026-11-10). AUDIO_SAMPLE=1 writes three lines in each of Google's pt-PT
  voices to public/audio/samples/, so the voice is chosen by ear before a thousand files are
  made in it. Then GOOGLE_TTS_VOICE=<name> for the real run (default pt-PT-Wavenet-A).
*/
async function samples(key: string) {
  const dir = join(process.cwd(), 'public', 'audio', 'samples')
  await mkdir(dir, { recursive: true })
  const lines = ['Boa tarde. Tenho uma reserva para duas noites.', 'Queria dois pastéis de nata, por favor.', 'Desculpe, não percebi. Pode falar mais devagar?']
  for (const voice of ['pt-PT-Wavenet-A', 'pt-PT-Wavenet-B', 'pt-PT-Wavenet-C', 'pt-PT-Wavenet-D']) {
    const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + key, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input: { text: lines.join(' ') }, voice: { languageCode: 'pt-PT', name: voice }, audioConfig: { audioEncoding: 'MP3' } }),
    })
    if (!res.ok) throw new Error('Google TTS ' + res.status + ': ' + (await res.text()))
    await writeFile(join(dir, voice + '.mp3'), Buffer.from(((await res.json()) as { audioContent: string }).audioContent, 'base64'))
    console.log('  sample: public/audio/samples/' + voice + '.mp3')
  }
}

async function main() {
  const clash = slugCollisions()
  if (clash.length) throw new Error('Two sentences would share one file:\n  ' + clash.join('\n  '))
  if (process.env.AUDIO_SAMPLE && process.env.GOOGLE_TTS_API_KEY) return samples(process.env.GOOGLE_TTS_API_KEY)
  const elevenKey = process.env.ELEVENLABS_API_KEY
  const googleKey = process.env.GOOGLE_TTS_API_KEY
  const synth = elevenKey
    ? (t: string) => eleven(t, elevenKey)
    : googleKey
      ? (t: string) => google(t, googleKey)
      : null

  await mkdir(OUT, { recursive: true })
  await writeFile(
    join(OUT, 'manifest.json'),
    JSON.stringify({ locale: 'pt-PT', assets: AUDIO_MANIFEST }, null, 2) + '\n',
  )

  if (!synth) {
    console.log(
      'No TTS key set. Wrote the manifest only.\n' +
        'Set ELEVENLABS_API_KEY (with ELEVENLABS_VOICE_ID) or GOOGLE_TTS_API_KEY to generate audio.\n',
    )
    console.log(AUDIO_MANIFEST.length + ' assets required:')
    for (const a of AUDIO_MANIFEST) console.log('  ' + a.slug.padEnd(24) + a.text)
    return
  }

  let made = 0
  let skipped = 0
  const todo = AUDIO_MANIFEST.filter((a) => {
    if (existsSync(join(OUT, a.slug + '.mp3'))) {
      skipped++
      return false
    }
    return true
  })
  /* A few at a time: a thousand lines one by one is a long wait, all at once is a 429. */
  let next = 0
  const worker = async () => {
    for (let i = next++; i < todo.length; i = next++) {
      const a = todo[i]
      const buf = await withRetry(() => synth(a.text))
      await writeFile(join(OUT, a.slug + '.mp3'), buf)
      made++
      if (made % 50 === 0 || made === todo.length) console.log('  ' + made + ' / ' + todo.length)
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker))
  console.log('\n' + made + ' generated, ' + skipped + ' already present.')
  if (skipped) console.log('Delete a file to regenerate it.')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
