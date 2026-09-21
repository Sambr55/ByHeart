'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { MiniBuild } from '@/components/Journey'
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
    A NIGHT IS ONE SEQUENCE, NOT FOUR ROOMS YOU MIGHT FIND.

    The first version of this put a list under TAKE IT AWAY called THE REST OF THE NIGHT.
    Sam: "The The Rest of teh Night and Take it away are jarring. It's too easy to miss teh
    rest of the night, make it into one flow, ending on teh invite."

    He is right, and the list was a patch rather than a fix: it made the other rooms
    REACHABLE without making them the obvious next thing, so the default was still to
    finish one room and stop. A drop is an evening — find it, get a ticket, get there, ask
    somebody — and the order was authored that way from the start. Nothing needed
    inventing; the rooms simply never handed on.

    So each room's exit carries to the next, and the last one is the invitation. Which is
    the shape the template's own note describes: three rooms about logistics and then the
    reason to have learned them.
  */
  const rooms = drop?.situations ?? []
  const at = rooms.findIndex((s2) => s2.id === situation.id)
  const nextRoom = at >= 0 ? rooms[at + 1] : undefined
  const onward = (id: string) =>
    '/errand/' + id + (back === '/profile' ? '?from=yours' : '')

  /*
    WHERE THIS ROOM WAS OPENED FROM, because it was always the Club.

    Every exit here — the wordmark, DONE and GOT IT — went to /club, which was true while
    a room could only be reached from the feed. It is not any more: DROPS on Yours
    lists the evenings somebody has been to, and finishing a room from there dumped them
    on a screen they had not asked for. Sam: "both the close back to a find teh venue card
    in club but we shoudl still be in YOURS."

    Read from ?from= rather than from the referrer, which is unreliable and empty on a
    fresh tab. Restricted to a known list rather than used as a URL: a `from` somebody can
    type is an open redirect, and this one is on a page anybody can link to.
  */
  const [back, setBack] = useState('/club')
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get('from')
    if (from === 'yours') setBack('/profile')
  }, [])
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
        <Link href={back} className="tap-target eyebrow flex shrink-0 items-center gap-1 text-accent">
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
            {/*
              WHERE THIS ROOM IS IN THE NIGHT, said in one line instead of a menu.

              The list that used to sit under TAKE IT AWAY made the other rooms reachable
              and made the screen read as two competing offers — "take this away" above
              "or go somewhere else". Sam: "The The Rest of teh Night and Take it away are
              jarring."

              The sequence is the flow now, so this only has to say where you are in it.
              Four dots and the event's name: enough to know there is more and that this is
              part of something, and not enough to be a decision.
            */}
            {drop && rooms.length > 1 ? (
              <div className="flex items-center gap-3" data-testid="night-progress">
                <span className="flex shrink-0 items-center gap-1" aria-hidden>
                  {rooms.map((s2, i) => (
                    <span
                      key={s2.id}
                      className={
                        'block h-1 w-4 rounded-full ' + (i <= at ? 'bg-accent' : 'bg-line')
                      }
                    />
                  ))}
                </span>
                <span className="eyebrow min-w-0 truncate text-muted">{drop.event}</span>
              </div>
            ) : (
              <p className="eyebrow text-muted">{chapter.city.toUpperCase()}</p>
            )}
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

          {/*
            AND A WAY TO ACTUALLY BUY ONE, on the room that is about buying one.

            Sam: "where tickets are available to buy online add a link." Drop has carried a
            `link` since the hand-authored one and nothing ever rendered it, so the room
            that teaches "Ainda há bilhetes?" could not sell you a ticket.

            On the ticket room only. A box office link under "Getting to Oriente" is a
            button looking for a home, and on the invitation it would compete with the one
            thing that screen is for.

            Under TAKE IT AWAY rather than above it: the language is what somebody came
            for, and this is the errand the language is about. Outlined, for the same
            reason — it leaves DUB, and nothing that leaves should outrank what does not.
          */}
          {drop?.link && /ticket/.test(situation.id) ? (
            <a
              href={drop.link.href}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="drop-tickets"
              className="tap-target eyebrow mt-3 block w-full rounded border border-accent px-5 py-3 text-center text-accent transition hover:bg-accent hover:text-accent-ink"
            >
              {drop.link.label} ↗
            </a>
          ) : null}

        </>
      ) : null}

      {stage === 'cold' ? (
        <div className="flex flex-1 flex-col justify-center gap-6">
          {/*
            YOUR TURN IS THE PROOF NOW, not a softer option beside it.

            Sam: "teh proof mechanism (cold) is being replaced by Your turn."

            The old fork was a self-marked claim — I SAID IT, with nothing on screen —
            and a reveal underneath it. That is honest arithmetic and it is a weak
            question: the product asked whether you had said something and took your word
            for it, which is the one measurement in DUB nobody can check, including the
            person making it.

            Building the sentence is the same claim with evidence. The tiles are the words
            and nothing else, in the wrong order, with the English above — so producing it
            means knowing what goes where rather than recognising a sentence you are shown.
            `clean` still means what it has always meant: right on the FIRST submission,
            which MiniBuild already tracks and which is exactly the cold claim made
            checkable.

            This is the vibes' own MiniBuild, unchanged, because a learner meeting two
            mechanics for one job is how a product starts feeling assembled — and because
            the reveal is not gone, it is what MiniBuild offers after three failed goes,
            which is the right moment for it rather than the first one.
          */}
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-accent">YOUR TURN</p>
            <p className="t-ask display text-balance text-2xl">{situation.release.ask}</p>
          </div>
          <MiniBuild
            target={situation.release.answer}
            onSolved={({ clean }) => {
              bank(clean)
              setStage('said')
            }}
          />
          {/*
            NO SECOND ESCAPE HERE, because MiniBuild already has one.

            A first version put SHOW ME THE ANSWER under the builder and it rendered
            directly beneath MiniBuild's own SHOW ME — two buttons, near-identical labels,
            one doing rather more than the other. The builder's version is the better one:
            it lays the sentence out in the tiles rather than printing it, and it marks the
            line as helped so nothing false is banked.
          */}
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
            {/*
              ON TO THE NEXT ROOM, which is what makes the night a night.

              DONE used to leave. That was right while a room was a thing you arrived at
              from a feed and left again — and it is why nine of Sam's nine finished rooms
              were the arrival: the product never once suggested there was more.

              The label names the room rather than saying NEXT, so the button is an offer
              with a subject. The way out is still there underneath, because a sequence
              somebody cannot leave is a trap rather than a flow.
            */}
            {nextRoom ? (
              <Link
                href={onward(nextRoom.id)}
                data-testid="errand-next"
                className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
              >
                {nextRoom.title.toUpperCase()}
              </Link>
            ) : null}
            {/*
              And the ask, made sendable — the moment it is worth offering.

              Right after somebody has said it out loud is when they know it works, and
              the invitation is the one sentence in a drop that has somewhere to go. It is
              the LAST room, so nothing follows it but this.
            */}
            {isInvite && drop ? <SendInvite situation={situation} drop={drop} /> : null}
            <button
              type="button"
              data-testid="errand-done"
              onClick={() => window.location.assign(back)}
              className={
                'tap-target eyebrow w-full rounded px-5 py-3 text-center ' +
                (nextRoom || isInvite
                  ? 'border border-line text-muted'
                  : 'bg-accent text-accent-ink')
              }
            >
              {nextRoom || isInvite ? 'THAT IS ENOUGH FOR NOW' : 'DONE'}
            </button>
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
            {/*
              GOT IT BANKS AND CARRIES ON, rather than banking and leaving.

              Same change as the cold path's DONE and for the same reason: a room that
              ends by closing the night is why nobody got past the first one. The verb is
              unchanged — GOT IT still marks the room spent without claiming it was said
              cold — what changes is where it puts you afterwards.
            */}
            <button
              type="button"
              data-testid="errand-got"
              onClick={() => {
                bank(false)
                window.location.assign(nextRoom ? onward(nextRoom.id) : back)
              }}
              className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
            >
              {nextRoom ? 'GOT IT — ' + nextRoom.title.toUpperCase() : 'GOT IT'}
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
