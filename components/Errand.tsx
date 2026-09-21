'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { CopyButton } from '@/components/CopyButton'
import { Wordmark } from '@/components/Wordmark'
import { slugFor } from '@/content/audio-manifest'
import { piecesIn } from '@/content/roots'
import { chapterById } from '@/content/chapters'
import type { Situation } from '@/content/situations'
import { loadLearner, recordProof, rememberFinishedCard, transferPieces } from '@/engine/learner'
import type { Drop } from '@/content/drops'
import { track } from '@/engine/analytics'

/**
 * Turn the ask into something you can actually send.
 *
 * The invite room already had the sentence — "Queres vir comigo ao concerto no dia
 * catorze?" — and it went nowhere. Somebody learned how to ask a person out in Portuguese
 * and the only thing to do with it was read it. Sam: "this is a perfect oppottyunity to
 * mint an invite card to send to some one (in Portuguse)".
 *
 * It rides the share card that already exists: a frozen JSON snapshot, a short public id,
 * and a page that renders it. Frozen matters more here than on a proof card — an
 * invitation that restated itself after the night had passed would be worse than one that
 * simply expires.
 *
 * Only on a room that IS the ask, and only when there is a night to ask about. Offering
 * this on "Finding the venue" would be a share button looking for a reason.
 */
function SendInvite({ situation, drop }: { situation: Situation; drop: Drop }) {
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const make = async () => {
    if (link) return link
    setBusy(true)
    setError(null)
    try {
      const me = loadLearner()
      /*
        THE RECIPIENT'S ENGLISH, not the learner's instruction.

        `release.ask` is a task — "Ask somebody to come with you on the fourth" — which is
        the right sentence on a screen telling somebody what to do and the wrong one on a
        card sent to the person being asked. The first line of the room carries the real
        translation ("Do you want to come to the concert with me?"), because it is the same
        sentence without the date on it.

        Falls back to the ask rather than to nothing: a card with clumsy English is still
        readable, and a card with none is only readable by the sender.
      */
      const english = situation.lines[0]?.en ?? situation.release.ask
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          /* The card's own line, so an invite link opened by somebody else still reads. */
          lines: [{ pt: situation.release.answer, en: english }],
          invite: {
            pt: situation.release.answer,
            en: english,
            from: me.display_name ?? '',
            event: drop.event,
            venue: drop.place.name,
            on: drop.on,
          },
        }),
      })
      const body = (await res.json()) as { ok: boolean; id?: string; reason?: string }
      if (!body.ok || !body.id) {
        setError(body.reason ?? 'Could not make a link just now.')
        return null
      }
      const full = window.location.origin + '/p/' + body.id
      setLink(full)
      track('invite_sent', { drop: drop.id, room: situation.id })
      return full
    } catch {
      setError('Could not make a link just now.')
      return null
    } finally {
      setBusy(false)
    }
  }

  const send = async () => {
    const url = await make()
    if (!url) return
    /*
      The share sheet where there is one, the clipboard where there is not.

      navigator.share is the whole point on a phone — it puts the card into the thread
      the person is already in — and it throws on cancel, which is not an error worth
      showing anybody.
    */
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: drop.event, text: situation.release.answer, url })
        return
      } catch {
        return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setError('Copy the link from the box below.')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        data-testid="errand-invite"
        disabled={busy}
        onClick={send}
        className="tap-target eyebrow w-full rounded border border-accent px-5 py-3 text-center text-accent transition hover:bg-accent hover:text-accent-ink disabled:opacity-50"
      >
        {busy ? 'MAKING IT…' : copied ? 'LINK COPIED' : 'SEND THIS TO SOMEBODY'}
      </button>
      {/* The link itself once it exists, because a share sheet can be dismissed by accident. */}
      {link ? (
        <p className="break-all text-center text-xs text-muted" data-testid="errand-invite-link">
          {link}
        </p>
      ) : null}
      {error ? <p className="text-center text-xs text-coach">{error}</p> : null}
    </div>
  )
}

/**
 * One Situation, end to end.
 *
 * This is the Club's answer to "I have to do a thing tomorrow" — a nervous person at
 * 11pm the night before, who would rather not do the whole exchange in English. Push
 * brings people back; this is the pull, and pull is why they stay.
 *
 * It runs on the shape the rest of the product already uses: read it, then have it taken
 * away and say it cold. Nothing here counts, and nothing congratulates — the only thing
 * it does is make being bad at this cost less.
 */
export function Errand({ situation, drop }: { situation: Situation; drop?: Drop }) {
  const chapter = chapterById(situation.chapter)
  /*
    The room that asks somebody out, which is the only one worth minting from.

    Matched on the room id's suffix rather than on its title: the templates name it
    `invite` and the hand-authored drop calls its room `drop_dd_invite`, while the titles
    are prose and differ between a concert and a match. `kind: 'moment'` is the other
    candidate and is wrong — it would catch any reflective room, including ones with
    nothing to send.
  */
  const isInvite = Boolean(drop) && /(^|_)invite$/.test(situation.id)
  /*
    A FOURTH STAGE, because I SAID IT walked straight out of the door.

    It banked the proof and assigned /club, so the one thing somebody had just claimed to
    have said was never shown to them. Sam: "I'm not really getting this I said It with a
    venue drop. Said what? Show them what to say."

    The rule that produced it is still right and is not being undone: a cold claim can
    only honestly be made BEFORE the reveal, which is why I SAID IT and OPEN are a fork
    rather than one screen. What was wrong is that taking the honest path was the only
    one that never showed you the answer — so the person who did the harder thing got
    less. `said` is the reveal after the claim, and it cannot bank anything, because the
    banking already happened on the tap that got here.
  */
  const [stage, setStage] = useState<'read' | 'cold' | 'said' | 'done'>('read')

  /*
    ONE PLACE THAT BANKS A ROOM, and it is what puts the Club on the ladder.

    The Club could not raise a rung at all. rungReached counts proof lines whose source is
    'release' and identifies the rung by matching the sentence EXACTLY against a root's
    transfer_prompt.answer — and room releases are a disjoint set of strings. Measured: 45
    rooms, zero matches, rung stays 1 whatever you do. Everything a learner did in the room
    the product calls home was invisible to the thing that opens more of it.

    A room already declares its own `rung`. It does not need to be matched to a root, it
    needs to be able to say so — so a room banks `source: 'room'` and carries `rung` on the
    line, and rungReached reads it directly.

    `clean` still means what it has always meant: said with nothing on screen. That is why
    it is an argument here rather than a constant — the cold stage passes true, the reveal
    passes false, and the proof card keeps counting only the first.
  */
  const bank = (clean: boolean) => {
    recordProof({
      pt: situation.release.answer,
      en: situation.release.ask,
      source: 'room',
      clean,
      rung: situation.rung,
    })
    /*
      And the words in it, when it was said cold.

      Only on the cold claim: a sentence read off the screen demonstrates nothing about the
      words in it. `transferPieces` reinforces what the learner already owns and adds
      nothing new — a room does not declare what it teaches, and guessing from the sentence
      would bank every `bom` and `um` it happens to contain.
    */
    if (clean) transferPieces(piecesIn(situation.release.answer))
    rememberFinishedCard(situation.id)
    track('errand_done', { id: situation.id, clean })
  }

  return (
    <main
      data-stage="REAL WORLD"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 bg-bg px-5 pb-10 pt-6 text-fg"
    >
      <header className="flex items-center gap-3">
        <Link href="/club" className="tap-target eyebrow flex shrink-0 items-center gap-1 text-accent">
          <span aria-hidden>←</span>
          <Wordmark mark="club" className="h-5" title="Back to the Club" />
        </Link>
        <span className="flex-1" />
      </header>

      {stage === 'read' ? (
        <>
          {/*
            The room, before the language for it.

            This is the evidence register rather than the front door's: an ordinary
            pharmacy on an ordinary afternoon, not a sunset. It is doing a different job
            too — the door makes you want to go, and this makes the place recognisable
            before you are standing in it, which is most of what being nervous is about.

            16:9 and short on purpose. It sets the scene and then gets out of the way,
            because the lines underneath are what somebody actually came for.
          */}
          {situation.image ? (
            <div className="relative -mx-5 aspect-[16/9] overflow-hidden">
              <Image
                src={situation.image.src}
                alt={situation.image.alt}
                fill
                sizes="(max-width: 448px) 100vw, 448px"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <p className="eyebrow text-muted">{chapter.city.toUpperCase()}</p>
            <h1 className="display text-balance text-3xl">{situation.title}</h1>
            <p className="text-sm leading-relaxed text-muted">{situation.why}</p>
          </div>

          {/*
            Ordered by the encounter, not by difficulty. The sequence IS the teaching:
            somebody rehearsing this is walking through the door in their head.
          */}
          <ol className="flex flex-col gap-3">
            {situation.lines.map((l) => (
              <li key={l.pt} className="flex flex-col gap-1 rounded border border-line bg-bg-elev px-4 py-3">
                <div className="flex items-center gap-3">
                  <AudioButton slug={slugFor(l.pt)} text={l.pt} size="sm" />
                  <p className="pt min-w-0 flex-1 text-lg text-accent">{l.pt}</p>
                  <CopyButton text={l.pt} size="sm" />
                </div>
                <p className="text-sm text-fg/80">{l.en}</p>
                <p className="text-xs leading-relaxed text-muted">{l.when}</p>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => {
              setStage('cold')
              track('errand_cold', { id: situation.id })
            }}
            /* mt-10, not mt-auto. See Journey's Cta. */
            className="tap-target eyebrow mt-10 w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            TAKE IT AWAY
          </button>
        </>
      ) : null}

      {stage === 'cold' ? (
        <div className="flex flex-1 flex-col justify-center gap-6">
          {/* Nothing on screen to copy from. That is the entire mechanism. */}
          <p className="eyebrow text-muted">SAY IT</p>
          <p className="t-ask display text-balance text-2xl">{situation.release.ask}</p>
          {/*
            THE CLAIM IS MADE HERE, WITH NOTHING ON SCREEN — which is what makes it a claim.

            I SAID IT used to live on the next stage, under the answer, so `clean: true` was
            banked by somebody reading the sentence they were claiming to have produced cold.
            recordProof only ever UPGRADES clean, so that true was permanent and
            uncorrectable: the one number DUB asks to be judged on was inflated by the
            easiest tap in the flow.

            A cold claim can only honestly be made before the reveal. So the fork is here —
            I said it, or show me — and the screen that shows the answer can no longer claim
            anything.
          */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              data-testid="errand-said"
              onClick={() => {
                bank(true)
                setStage('said')
              }}
              className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
            >
              I SAID IT
            </button>
            {/* Muted, because the trade should be visible before it is made. */}
            <p className="text-center text-xs text-muted">Banked as proof.</p>
            <button
              type="button"
              data-testid="errand-show"
              onClick={() => setStage('done')}
              className="tap-target eyebrow w-full rounded border border-line-strong px-5 py-3 text-center"
            >
              OPEN
            </button>
          </div>
        </div>
      ) : null}

      {stage === 'said' ? (
        <div className="flex flex-1 flex-col justify-center gap-6">
          {/*
            WHAT THEY JUST SAID, so the claim has something to be a claim ABOUT.

            Nothing here banks anything — the proof was recorded on the tap that arrived at
            this stage, and recordProof only ever upgrades `clean`, so a second write would
            be at best a no-op and at worst the inflation the cold stage's note warns about.

            The audio is the point of the screen as much as the text is. Somebody who said
            it into the air has no idea whether they said it well, and this is the only
            moment in the flow where the comparison is free.
          */}
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-accent">YOU SAID</p>
            <div className="flex items-center gap-3">
              <AudioButton
                slug={slugFor(situation.release.answer)}
                text={situation.release.answer}
              />
              <p className="pt text-balance text-2xl text-accent">{situation.release.answer}</p>
              <CopyButton text={situation.release.answer} />
            </div>
            <p className="text-sm text-muted">{situation.release.ask}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              data-testid="errand-done"
              onClick={() => window.location.assign('/club')}
              className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
            >
              DONE
            </button>
            {/*
              And the ask, made sendable — the moment it is worth offering.

              Right after somebody has said it out loud is when they know it works, and
              the invitation is the one sentence in a drop that has somewhere to go.
            */}
            {isInvite && drop ? <SendInvite situation={situation} drop={drop} /> : null}
          </div>
        </div>
      ) : null}

      {stage === 'done' ? (
        <div className="flex flex-1 flex-col justify-center gap-6">
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-muted">SAY IT</p>
            <p className="text-sm text-muted">{situation.release.ask}</p>
            <div className="flex items-center gap-3">
              <AudioButton slug={slugFor(situation.release.answer)} text={situation.release.answer} />
              <p className="pt text-balance text-2xl text-accent">{situation.release.answer}</p>
              <CopyButton text={situation.release.answer} />
            </div>
          </div>
          {/*
            NEITHER BUTTON CLAIMS ANYTHING NOW, because the answer is on the screen.

            GOT IT is the honest verb for "the answer was in front of me and I am done with
            it" — it marks the room spent and moves on. It still banks the sentence, because
            a room done with help is real work and belongs on the ladder; what it does not
            do is claim it was said cold.
          */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              data-testid="errand-got"
              onClick={() => {
                bank(false)
                window.location.assign('/club')
              }}
              className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
            >
              GOT IT
            </button>
            <button
              type="button"
              onClick={() => {
                track('errand_done', { id: situation.id, clean: false })
                setStage('read')
              }}
              className="tap-target eyebrow w-full rounded border border-line px-5 py-3 text-center text-muted"
            >
              SHOW ME AGAIN
            </button>
            {/* Here too: somebody who needed the answer still has somebody to ask. */}
            {isInvite && drop ? <SendInvite situation={situation} drop={drop} /> : null}
          </div>
        </div>
      ) : null}
    </main>
  )
}
