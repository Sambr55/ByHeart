/**
 * The clue pictures for the idiom cards.
 *
 *   npm run idiom-images              print the briefs, to paste anywhere
 *   npm run idiom-images -- --write   generate them, if OPENAI_API_KEY is set
 *
 * A sibling of scripts/make-images.mts rather than a second copy of it: the image BANK is
 * a shared pool of Lisbon still lifes that any card may draw from, and these are not that.
 * Each one belongs to exactly one phrase, is named after it, and is meaningless without it.
 * Keeping them in their own folder and their own script means neither list can be polluted
 * by the other's slugs, which is the failure mode WANTED already has a gate against.
 *
 * THE BRIEF LIVES WITH THE IDIOM. content/idioms.ts carries `clue` beside the phrase it
 * illustrates, so a picture cannot drift from the joke it is a clue to.
 */
import { loadEnv } from './env.mjs'
import { existsSync, mkdirSync } from 'node:fs'
import sharp from 'sharp'
import { IDIOMS } from '../content/idioms'

loadEnv()

/*
  A DIFFERENT HOUSE LOOK FROM THE REST OF THE PRODUCT, on purpose.

  Sam: "I want this to FEEL quite different to the true learning cards."

  The Club's photographs are Lisbon still lifes — a thing on a surface in real light, the
  place made recognisable before you stand in it. These are jokes. So they are lit harder
  and framed straighter, they are nowhere in particular, and the subject sits in the middle
  of the frame like an exhibit rather than being noticed in passing. The result should read
  as a picture of a THING rather than a picture of a place.

  No text, for the same reason the bank forbids it: the literal goes over the top in white,
  and generated lettering is always slightly wrong in a way that reads as fake.
*/
const STYLE =
  'Single clear subject, centred, plain uncluttered background. Bright even light, gentle ' +
  'shadows, slightly saturated. Shot straight on like a catalogue photograph rather than a ' +
  'candid. No text, no lettering, no signage, no logos, no watermarks. No people and no faces. ' +
  'It should read as a picture of one thing, with room around it.'

/** Portrait, because the card it fills is a full-bleed phone screen. */
const SIZE = '1024x1536'
const MODEL = 'gpt-image-1'
const OUT = 'public/idioms'

const write = process.argv.includes('--write')
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7)

const wanted = IDIOMS.filter(
  (i) => (!only || i.id === only) && !existsSync(OUT + '/' + i.id + '.jpg'),
)

if (!wanted.length) {
  console.log('\nEvery idiom has its clue picture.\n')
  process.exit(0)
}

const prompt = (i: (typeof IDIOMS)[number]) => i.clue + ' ' + STYLE

if (!write) {
  console.log('\n' + wanted.length + ' clue picture(s) wanted. ' + SIZE + ', portrait.\n')
  for (const i of wanted) {
    console.log('─'.repeat(64))
    console.log(i.id + '   (' + i.english + ' → ' + i.literal + ')')
    console.log(prompt(i))
    console.log('')
  }
  console.log('Save each as ' + OUT + '/<id>.jpg, then run again to check.')
  console.log('Or set OPENAI_API_KEY and run: npm run idiom-images -- --write\n')
  process.exit(0)
}

const key = process.env.OPENAI_API_KEY
/* The same guard make-images learned the hard way. */
if (key?.startsWith('sk-ant-')) {
  console.log('\nThat is an Anthropic key and this needs an OpenAI one — gpt-image-1 is theirs.\n')
  process.exit(1)
}
if (!key) {
  console.log('\nOPENAI_API_KEY is not set. Run without --write to get the briefs instead.\n')
  process.exit(1)
}

console.log('\n' + wanted.length + ' picture(s) at ' + SIZE + ' on ' + MODEL + '.')
console.log('This spends money on the key in the environment.\n')

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const made: string[] = []
for (const i of wanted) {
  process.stdout.write('  ' + i.id.padEnd(24))
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt: prompt(i), size: SIZE, n: 1 }),
    })
    if (!res.ok) {
      console.log('failed  ' + res.status + ' ' + (await res.text()).slice(0, 120))
      continue
    }
    const body = (await res.json()) as { data: { b64_json?: string; url?: string }[] }
    const one = body.data?.[0]
    const bytes = one?.b64_json
      ? Buffer.from(one.b64_json, 'base64')
      : one?.url
        ? Buffer.from(await (await fetch(one.url)).arrayBuffer())
        : null
    if (!bytes) {
      console.log('failed  no image in the response')
      continue
    }
    /*
      WRITTEN AS AN ACTUAL JPEG, because the API hands back PNG.

      The first run wrote the bytes verbatim to a .jpg and produced 30 PNGs with the wrong
      extension: 2.9MB each, 78MB for the set, against 218KB for the photographs already in
      public/vibes. Nothing would have caught it — the browser sniffs the format and renders
      it happily — so the cost would have been paid by every phone on the Club feed.

      1050 wide matches the bank, and quality 82 with mozjpeg is what got the set to 4.3MB.
    */
    await sharp(bytes)
      .resize({ width: 1050, height: 1575, fit: 'cover' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(OUT + '/' + i.id + '.jpg')
    made.push(i.id)
    console.log('ok')
  } catch (e) {
    console.log('failed  ' + (e as Error).message.slice(0, 100))
  }
}

console.log('\n' + made.length + ' written to ' + OUT + '.')
if (made.length) {
  /*
    The manifest, printed rather than written.

    content/feed.ts holds IDIOM_IMAGES — the set of ids that actually have a file — because
    the feed cannot ask the filesystem at render time and a card pointing at a missing
    picture is a broken card. Printed for a human to paste so that adding a picture stays a
    deliberate commit rather than a script quietly editing content.
  */
  console.log('\nAdd these to IDIOM_IMAGES in content/feed.ts:\n')
  console.log(made.map((m) => "  '" + m + "',").join('\n') + '\n')
}
