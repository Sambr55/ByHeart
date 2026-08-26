# The hero

Drop the Lisbon photograph here as **`lisbon.jpg`**, replacing the placeholder.

    public/hero/lisbon.jpg

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

Not recorded yet, and it has to be before this is public. The Situation model already has
the field for it — `rights_status: 'owned' | 'licensed' | 'cc-by' | 'permission-given'` —
because a photograph of a real place is somebody's property. If this one is generated,
that is its own answer and worth writing down too.
