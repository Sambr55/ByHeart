/**
 * The pictures the image bank is missing.
 *
 *   npm run images                 print the prompts, ten at a time, to paste anywhere
 *   npm run images -- --write      generate them here, if OPENAI_API_KEY is set
 *
 * Two ways because there are two situations. Pasting prompts into a chat window works and
 * is what has been happening; it is also ten at a time, manual downloads, manual renaming,
 * and prompts that live in a chat history rather than in the repo — so the next person
 * cannot reproduce the set, and nothing checks that what landed matches what was asked for.
 *
 * With a key it does the whole thing: reads the wanted list, generates at the right shape,
 * writes to public/bank with the slug as the filename, and prints the exact entries to add
 * to IMAGE_BANK. The prompt for every picture in DUB then lives in content/images.ts, in
 * git, next to the alt text — which is the actual point. The prompts ARE content.
 *
 * Costs money on somebody's account, so --write is required and it says what it will spend.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { IMAGE_BANK, WANTED } from '../content/images'

/*
  The house look, appended to every brief.

  Every photograph in DUB is a still life in Lisbon: a thing on a surface in real light,
  nobody posing, nothing staged for a brochure. And no text of any kind — words in an
  image are the overlay's job, and generated lettering is always slightly wrong in a way
  that reads as fake even when nobody can say why.
*/
const STYLE =
  'Photographic, natural available light, shallow depth of field, muted and warm. Lisbon. ' +
  'No text, no lettering, no signage, no logos, no watermarks anywhere in the frame. ' +
  'No faces and nobody posing or looking at the camera. Not a travel brochure — it should ' +
  'look like something somebody noticed rather than something arranged.'

/** Portrait, because every card it feeds is a full-bleed phone screen. */
const SIZE = '1024x1536'
const MODEL = 'gpt-image-1'

const write = process.argv.includes('--write')
const missing = WANTED.filter((w) => !IMAGE_BANK[w.slug])

if (!missing.length) {
  console.log('\nThe bank has everything the templates ask for.\n')
  process.exit(0)
}

const prompt = (w: (typeof WANTED)[number]) => w.brief + ' ' + STYLE

if (!write) {
  console.log('\n' + missing.length + ' picture(s) wanted. ' + SIZE + ', portrait.\n')
  /*
    Batched in tens because that is the limit of the tool these have been going into. The
    batching is a fact about the workflow rather than about the pictures.
  */
  for (let i = 0; i < missing.length; i += 10) {
    const batch = missing.slice(i, i + 10)
    console.log('─── batch ' + (i / 10 + 1) + ' ' + '─'.repeat(52))
    for (const w of batch) {
      console.log('\n' + w.slug + '   (' + w.used_by + ')')
      console.log(prompt(w))
    }
    console.log('')
  }
  console.log('Save each as public/bank/<slug>.jpg, then run this again to check.')
  console.log('Or set OPENAI_API_KEY and run: npm run images -- --write\n')
  process.exit(0)
}

const key = process.env.OPENAI_API_KEY
if (!key) {
  console.log('\nOPENAI_API_KEY is not set, so there is nothing to generate with.')
  console.log('Run without --write to get the prompts to paste instead.\n')
  process.exit(1)
}

console.log('\n' + missing.length + ' picture(s) to generate at ' + SIZE + ' on ' + MODEL + '.')
console.log('This spends money on the key in the environment.\n')

if (!existsSync('public/bank')) mkdirSync('public/bank', { recursive: true })

const made: string[] = []
for (const w of missing) {
  process.stdout.write('  ' + w.slug.padEnd(18))
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt: prompt(w), size: SIZE, n: 1 }),
    })
    if (!res.ok) {
      console.log('FAILED — ' + res.status + ' ' + (await res.text()).slice(0, 120))
      continue
    }
    const body = (await res.json()) as { data?: { b64_json?: string; url?: string }[] }
    const first = body.data?.[0]
    let bytes: Buffer | null = null
    if (first?.b64_json) bytes = Buffer.from(first.b64_json, 'base64')
    else if (first?.url) bytes = Buffer.from(await (await fetch(first.url)).arrayBuffer())
    if (!bytes) {
      console.log('FAILED — nothing came back')
      continue
    }
    const path = 'public/bank/' + w.slug.replace(/_/g, '-') + '.png'
    writeFileSync(path, bytes)
    made.push(w.slug)
    console.log('→ ' + path + '  ' + Math.round(bytes.length / 1024) + ' KB')
  } catch (e) {
    console.log('FAILED — ' + (e instanceof Error ? e.message : String(e)))
  }
}

if (made.length) {
  /*
    Printed rather than written into the file.

    The bank carries alt text, and alt text is the information a picture holds rather than
    a restatement of the brief — so it is written by somebody who has LOOKED at what came
    back. Auto-filling it from the prompt would produce a description of the picture we
    asked for, which is not always the picture we got.
  */
  console.log('\nAdd to IMAGE_BANK in content/images.ts, with alt text written from the')
  console.log('picture rather than from the brief:\n')
  for (const slug of made) {
    console.log('  ' + slug + ': {')
    console.log("    src: '/bank/" + slug.replace(/_/g, '-') + ".png',")
    console.log("    alt: '…what is actually in it…',")
    console.log("    rights_status: 'generated',")
    console.log('  },')
  }
  console.log('\nThen remove them from WANTED and run npm run drops.\n')
}
