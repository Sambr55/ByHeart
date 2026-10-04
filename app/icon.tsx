import { ImageResponse } from 'next/og'
import { DUB_MARK } from '@/content/marks'

export const contentType = 'image/png'

/**
 * The mark: the U and its speech-bubble tail.
 *
 * It drew the word DUB until now, which is the one thing an icon must not do — three
 * letters at 16px are three grey smudges. The U is the glyph carrying the tail, the tail
 * is the idea in the mark, and a single bold letterform is what survives a browser tab.
 *
 * THREE VARIANTS, because they have different jobs and a downscale cannot serve any two.
 *
 * At 512 `tile` is an azulejo — the frame and the four corner motifs, the same thing that
 * appears as the band under every header and the block on every crate card. At 32 `small`
 * turns all of that to mud, so the frame goes and the letterform gets the whole square.
 * Checked at 16px rather than assumed.
 *
 * AND `mask` AT 512, WHICH IS THE AZULEJO WITH ITS FRAME TAKEN OFF.
 *
 * Android crops a maskable icon to whatever shape the launcher wants — a circle, a
 * squircle, a rounded square — and guarantees only the centre 80%. Measured against this
 * art: the frame sits 46px in on a 512 canvas and the safe margin is 51.2px, so the frame
 * is CLIPPED. Declaring the tile maskable would crop off the thing the icon is of.
 *
 * Without a maskable variant at all, Android letterboxes the tile into a white circle,
 * which reads as a bookmark rather than an app — so neither doing nothing nor flipping a
 * flag is right. This is the third option: the mark alone, bigger, on the azulejo blue,
 * with the whole 512 as bleed so every launcher shape finds colour under it. The corner
 * motifs stay — at 60px in they survive the crop — so it is recognisably the same object
 * as the tile rather than a different logo.
 *
 * The glyph grows from 196x230 to 232x272: an icon that will be cropped has to carry
 * further from the centre to read at the same weight.
 *
 * Written for Satori: explicit top/right/bottom/left rather than the `inset` shorthand,
 * which it ignores — that is what once turned the tile into a rectangle with the letters
 * hanging off its edge. It renders <svg> and <path>, so this is the real mark rather
 * than a redrawing of it, and lint:content fails if it stops matching the file.
 */
export function generateImageMetadata() {
  return [
    { id: 'small', size: { width: 32, height: 32 }, contentType: 'image/png' },
    { id: 'tile', size: { width: 512, height: 512 }, contentType: 'image/png' },
    { id: 'mask', size: { width: 512, height: 512 }, contentType: 'image/png' },
  ]
}

// `id` arrives as a Promise in Next 16 — awaited, not read. Read directly it is an
// object, `id === 'tile'` is quietly false, and both sizes render the small variant
// with no error anywhere. Caught by rendering them and looking.
export default async function Icon({ id }: { id: Promise<string> }) {
  const which = await id
  const tile = which === 'tile'
  const mask = which === 'mask'
  const size = tile || mask ? { width: 512, height: 512 } : { width: 32, height: 32 }

  const motif = (style: Record<string, number>) => ({
    position: 'absolute' as const,
    width: 22,
    height: 22,
    background: '#efe7d9',
    transform: 'rotate(45deg)',
    display: 'flex',
    ...style,
  })

  const glyph = (w: number, h: number) => (
    <svg viewBox={DUB_MARK.viewBox} width={w} height={h} fill="#efe7d9" fillRule="evenodd">
      <path d={DUB_MARK.d} />
    </svg>
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f5d8c',
        }}
      >
        {mask ? (
          /*
            NO FRAME, AND THE MOTIFS PULLED INSIDE THE SAFE ZONE.

            60px in rather than the tile's 46 + 14, so they clear the 51.2px the crop can
            take. No bordered box at all: the background div behind this is the bleed, and
            a launcher that cuts a circle out of it finds azulejo blue at every edge.
          */
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={motif({ top: 74, left: 74 })} />
            <div style={motif({ top: 74, right: 74 })} />
            <div style={motif({ bottom: 74, left: 74 })} />
            <div style={motif({ bottom: 74, right: 74 })} />
            {glyph(232, 272)}
          </div>
        ) : tile ? (
          <div
            style={{
              position: 'absolute',
              top: 46,
              right: 46,
              bottom: 46,
              left: 46,
              border: '9px solid #efe7d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={motif({ top: 14, left: 14 })} />
            <div style={motif({ top: 14, right: 14 })} />
            <div style={motif({ bottom: 14, left: 14 })} />
            <div style={motif({ bottom: 14, right: 14 })} />
            {glyph(196, 230)}
          </div>
        ) : (
          glyph(22, 26)
        )}
      </div>
    ),
    size,
  )
}
