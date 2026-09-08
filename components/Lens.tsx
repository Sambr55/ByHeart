'use client'

import { useEffect, useRef, useState } from 'react'
import { track } from '@/engine/analytics'
import { loadLearner } from '@/engine/learner'
import { registerFor } from '@/content/roots'
import { StatusBar } from '@/components/Native'

interface Line {
  pt: string
  en: string
}

/**
 * Point it at a menu.
 *
 * CAPTURE, NOT STREAM, and that is a spend decision rather than a technical one. Reading
 * text out of an image is billed per image — about a hundred and fifty times what
 * translating the words on it costs — so a live view that sends frames continuously is the
 * same feature at roughly a thousand times the price. At two frames a second it is about
 * eleven dollars an hour per person; one deliberate tap is a fifth of a penny.
 *
 * The viewfinder is still live, because holding a phone over a menu and watching nothing
 * happen is not a camera. What is deliberate is the moment of taking: you frame it, you
 * tap, and the answer arrives over the still you took. That also happens to be what people
 * actually do with a menu, so the cheap version and the good version are the same version.
 *
 * ONE ASK PER PHOTOGRAPH. The route meters this exactly as it meters a typed sentence, so
 * a menu costs one of the day's allowance however many lines are on it.
 *
 * AND A WAY IN THAT ALWAYS WORKS. getUserMedia has a long history of failing inside an
 * installed iOS PWA — the exact context DUB is used in — so a failure to start the camera
 * is not an error here, it is a fallback: the file input with `capture` opens the system
 * camera on every iPhone ever made. Both paths end in the same photograph.
 */
export function Lens({ onClose }: { onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const [live, setLive] = useState<'starting' | 'on' | 'no'>('starting')
  const [shot, setShot] = useState<string | null>(null)
  const [state, setState] = useState<'framing' | 'reading' | 'read' | 'failed'>('framing')
  const [lines, setLines] = useState<Line[]>([])
  const [note, setNote] = useState('')
  /** Lines the reader could not trust and left out. See the note under the list. */
  const [dropped, setDropped] = useState(0)
  const [why, setWhy] = useState('')

  /*
    The camera stops when this closes, and that is not a nicety.

    A stream left running holds the hardware and keeps the recording indicator lit, which on
    a phone reads as an app that is watching you after you told it to stop.
  */
  useEffect(() => {
    let dead = false
    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (dead) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream.current = s
        if (video.current) {
          video.current.srcObject = s
          await video.current.play().catch(() => {})
        }
        setLive('on')
      } catch {
        /* Not an error. The file input below opens the same camera. */
        setLive('no')
      }
    }
    void start()
    return () => {
      dead = true
      stream.current?.getTracks().forEach((t) => t.stop())
      stream.current = null
    }
  }, [])

  /*
    THE STREAM IS REATTACHED EVERY TIME THE VIEWFINDER COMES BACK.

    The stream is opened once, and `srcObject` was set inside that same effect — so it was
    attached to the FIRST <video> element and no other. Taking a photo swaps the viewfinder
    for the still, which unmounts that element; pressing ANOTHER mounts a brand new one with
    nothing attached to it. The result was a black screen with a READ THIS button that could
    not work, and the only way out was BACK and opening the camera again.

    Reported exactly that way. The camera itself was never broken — the picture simply had
    nowhere to arrive.
  */
  useEffect(() => {
    const el = video.current
    const s = stream.current
    if (!el || !s || shot) return
    if (el.srcObject !== s) el.srcObject = s
    void el.play().catch(() => {})
  }, [shot, live])

  /**
   * The frame, made small enough to send.
   *
   * A modern phone camera is twelve megapixels and none of that helps read a menu — it
   * costs upload seconds on a café's wifi and buys nothing. The long edge goes to 1400px,
   * which is comfortably enough to read printed text and about a tenth of the bytes.
   */
  function grab(): string | null {
    const v = video.current
    if (!v || !v.videoWidth) return null
    return shrink(v, v.videoWidth, v.videoHeight)
  }

  /*
    SMALL ENOUGH TO SEND, AND THAT IS A SIZE IN BYTES RATHER THAN IN PIXELS.

    This capped the long edge at 1400px and stopped there, which bounds the DIMENSIONS and
    says nothing about the payload: a dense page of printed text at 1400px carries far more
    detail than a photograph of a room, and base64 adds a third on top. Past the platform's
    body limit the request dies before it reaches the route, and the panel reported "no
    connection" — a sentence about the network for a fault that was nothing of the kind.

    So the quality steps down until it fits, and the dimension cap goes up to 1800: a menu
    is easy either way, and small printed text is exactly where the extra pixels earn their
    place. Trading quality for size beats trading resolution for it, because it is the
    letterforms that have to survive.
  */
  function shrink(source: CanvasImageSource, w: number, h: number): string | null {
    const long = Math.max(w, h)
    const scale = Math.min(1, 1800 / long)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    /* Comfortably inside the platform's body limit once base64 has added its third. */
    const CEILING = 2_600_000
    for (const q of [0.8, 0.68, 0.55, 0.42]) {
      const out = canvas.toDataURL('image/jpeg', q)
      if (out.length <= CEILING) return out
    }
    return canvas.toDataURL('image/jpeg', 0.3)
  }

  async function read(image: string) {
    setShot(image)
    setState('reading')
    setWhy('')
    track('lens_read', { bytes: image.length })
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          image,
          // The same register the lessons teach, as everywhere else the translator speaks.
          register: registerFor(loadLearner().profile?.age_band),
        }),
      })
      /*
        PARSED DEFENSIVELY, because a failure that is not JSON was becoming a lie.

        A rejected upload answers with a plain-text body, so res.json() threw and landed in
        the catch below — which says "no connection". The connection was fine; the
        photograph was too big. An error should name the thing that broke, and this one was
        naming something else entirely.
      */
      const data = (await res.json().catch(() => ({}))) as {
        lines?: Line[]
        dropped?: number
        note?: string
        error?: string
        why?: string
      }
      if (!res.ok || data.error) {
        setWhy(
          data.why ??
            (res.status === 413
              ? 'That photograph was too big to send. Try again a little further back.'
              : 'Could not read that one. This is ours, not yours.'),
        )
        setState('failed')
        return
      }
      setLines(data.lines ?? [])
      setDropped(data.dropped ?? 0)
      setNote(data.note ?? '')
      setState('read')
    } catch {
      setWhy('No connection. This one needs the internet.')
      setState('failed')
    }
  }

  /* The always-works path: the system camera, through a file input. */
  function fromFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const out = typeof reader.result === 'string' ? reader.result : ''
      if (out.startsWith('data:image/')) void read(out)
    }
    reader.readAsDataURL(file)
  }

  function again() {
    setShot(null)
    setLines([])
    setDropped(0)
    setNote('')
    setWhy('')
    setState('framing')
  }

  return (
    <div data-testid="lens" className="fixed inset-0 z-50 flex flex-col bg-[#241f1a] text-white">
      <StatusBar color="#241f1a" />

      <header className="safe-top flex items-center gap-3 px-5 pt-6">
        <button
          type="button"
          data-testid="lens-close"
          onClick={onClose}
          className="tap-target eyebrow text-white"
        >
          ← BACK
        </button>
        <span className="flex-1" />
        {state === 'read' || state === 'failed' ? (
          <button
            type="button"
            data-testid="lens-again"
            onClick={again}
            className="tap-target eyebrow text-white"
          >
            ANOTHER
          </button>
        ) : null}
      </header>

      <div className="relative flex-1 overflow-hidden">
        {/*
          The still replaces the viewfinder the instant it is taken.

          Leaving the camera running underneath a result is the version where somebody
          moves the phone and the words no longer match what they are looking at.
        */}
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot} alt="" aria-hidden className="h-full w-full object-cover" />
        ) : (
          <video
            ref={video}
            playsInline
            muted
            autoPlay
            aria-label="What the camera can see"
            className="h-full w-full object-cover"
          />
        )}

        {/* Ground under the words, so Portuguese over a photograph is readable. */}
        {state === 'read' || state === 'reading' || state === 'failed' ? (
          <div aria-hidden className="absolute inset-0 bg-black/70" />
        ) : null}

        {state === 'reading' ? (
          <p className="absolute inset-x-0 bottom-10 px-5 text-center text-sm text-white/85">
            Reading it…
          </p>
        ) : null}

        {state === 'failed' ? (
          <div className="absolute inset-x-0 bottom-10 px-5">
            <p data-testid="lens-why" className="text-sm leading-relaxed text-white/85">
              {why}
            </p>
          </div>
        ) : null}

        {state === 'read' ? (
          <div
            data-testid="lens-lines"
            className="card-pane absolute inset-0 overflow-y-auto px-5 pb-10"
          >
            {lines.length ? (
              <ul className="flex flex-col gap-6">
                {lines.map((l, i) => (
                  <li key={l.pt + i}>
                    {/*
                      The Portuguese first and larger, because it is the thing in front of
                      them. A learner is matching what DUB says against what is printed on
                      the card in their hand, so the line they are matching leads.
                    */}
                    <p className="pt display text-balance text-xl">{l.pt}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/80">{l.en}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-white/85">
                No Portuguese in that one. Try getting closer, or steadier.
              </p>
            )}
            {/*
              WHAT IT COULD NOT READ, SAID OUT LOUD.

              Lines the reader is not sure of are dropped before they reach here, which is
              the right call — a photograph read at an angle once came back as confident,
              fluent Portuguese that was not on the page. But silently showing four lines of
              a twelve-line menu looks like a four-line menu, so the count is the difference
              between a short answer and a wrong one.
            */}
            {dropped > 0 ? (
              <p className="mt-6 text-sm leading-relaxed text-white/70">
                {dropped === 1
                  ? 'One more line was too unclear to read. Closer, or steadier, and it will come.'
                  : dropped + ' more lines were too unclear to read. Closer, or steadier, and they will come.'}
              </p>
            ) : null}
            {note ? <p className="mt-6 text-sm leading-relaxed text-white/70">{note}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="nav-bar flex flex-col gap-3 px-5 pb-10 pt-6">
        {state === 'framing' && live === 'on' ? (
          <button
            type="button"
            data-testid="lens-take"
            onClick={() => {
              const image = grab()
              if (image) void read(image)
            }}
            className="tap-target eyebrow w-full rounded bg-[#1f5d8c] px-5 py-3 text-center text-white"
          >
            READ THIS
          </button>
        ) : null}

        {/*
          The fallback, and it is offered rather than hidden.

          When the live view will not start — an installed PWA on an iOS version that
          refuses, a permission declined, a device with no camera — this is not a degraded
          mode, it is the same photograph by another door.
        */}
        {state === 'framing' && live !== 'on' ? (
          <label className="tap-target eyebrow block w-full rounded bg-[#1f5d8c] px-5 py-3 text-center text-white">
            {live === 'starting' ? 'STARTING THE CAMERA' : 'TAKE A PHOTO'}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              data-testid="lens-file"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) fromFile(f)
              }}
            />
          </label>
        ) : null}

        <p className="text-center text-xs leading-relaxed text-white/60">
          One photo, one look. It reads what is printed and tells you what it says.
        </p>
      </div>
    </div>
  )
}
