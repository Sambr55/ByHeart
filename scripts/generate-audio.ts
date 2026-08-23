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
import { AUDIO_MANIFEST } from '../content/audio-manifest'

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

async function main() {
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
  for (const a of AUDIO_MANIFEST) {
    const path = join(OUT, a.slug + '.mp3')
    if (existsSync(path)) {
      skipped++
      continue
    }
    const buf = await synth(a.text)
    await writeFile(path, buf)
    made++
    console.log('  + ' + a.slug + '.mp3  ' + a.text)
  }
  console.log('\n' + made + ' generated, ' + skipped + ' already present.')
  if (skipped) console.log('Delete a file to regenerate it.')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
