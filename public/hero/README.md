# The hero

`lisbon.jpg` is in place: 1200×1600, JPEG at 82, 595KB. `next/image` serves AVIF/WebP
derivatives off it, so the source only has to be good enough to downsample from.

To replace it, overwrite that file and run `npm run door`.

What it needs to be:

- **Portrait**, and tall. It is `object-cover` on a full-screen `min-h-svh`, so anything
  landscape will be cropped hard to the centre on a phone.
- **Dark or busy at the foot.** The wordmark, the strapline and the button all sit in the
  bottom third over a black gradient. A bright pavement there fights them; the scrim is
  measured against worst-case white, so it will still be legible, but it will look muddy.
- **Around 1400px wide is plenty**, and JPEG at ~80. `next/image` serves AVIF/WebP off
  whatever is here, so the source only needs to be good enough to downsample from. A 4MB
  original is 4MB of nothing.
- **No text in the image.** It cannot be translated and it cannot be contrast-checked.

`npm run door` measures the result: button reachable, everything above the fold, contrast
against the brightest thing the photograph could possibly be, and the whole screen still
working with the image blocked outright.

## Rights

**Generated, not photographed.** The source file was `ChatGPT Image Aug 26, 2026,
11_23_48 AM.png` — so there is no photographer to credit and no licence to hold, which is
the cleanest answer available and worth having written down rather than assumed.

Two things that follow from it, neither urgent:

- It is a *composite* of Lisbon rather than a place. The tram, the tiles and the Tejo are
  all real things arranged into a street that is not one. Fine for a front door, which
  sells the destination — and exactly why the city content inside the Club must be
  evidence instead, or the product starts inventing the place it claims to teach.
- If it is ever replaced with a real photograph, that one needs a licence and a credit,
  and `SituationImage.rights_status` is where it goes.
