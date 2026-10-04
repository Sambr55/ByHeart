import type { Genre } from '@/content/calendar'
import { DEFAULT_CHAPTER, type ChapterId } from '@/content/chapters'
import type { Drop } from '@/content/drops'
import { dropDaysLeft, dropOpensOn, dropWhen, dropsFor } from '@/content/feed'
import type { Purpose } from '@/content/situations'

/**
 * The inbox — what has landed in your feed, and nothing else.
 *
 * Sam: "there should be an inbox, where a user gets an in-app message as to new content
 * that has dropped into their feed."
 *
 * ---------------------------------------------------------------------------
 * THE ONE RULE, AND IT IS THE WHOLE FILE.
 *
 * A message is DERIVED from a drop that is live in this learner's feed right now. It is
 * not stored, not authored, and not queued. There is no table of messages anywhere, no
 * localStorage list of things that were once announced, and nothing in this module can
 * produce a message about content that is not in the feed at the moment somebody looks.
 *
 * That is deliberate and it is the opposite of how an inbox is normally built. The normal
 * shape is: something happens, you write a row, the row is delivered later. Which means
 * the row OUTLIVES the thing it is about — and the first time a drop expires, or a genre
 * preference changes, or a chapter switches, the inbox is telling somebody about a night
 * that is no longer in their Club. A message promising content the feed does not contain
 * is the exact failure this codebase cares most about, so the only safe design is one
 * where the message cannot exist apart from the content.
 *
 * So: `inboxFor` calls `dropsFor` — the same function the Club feed calls, with the same
 * arguments — and maps what comes back. If the feed has eleven drops, the inbox has eleven
 * messages. If the feed empties, so does the inbox. They cannot disagree because there is
 * only one list.
 *
 * `scripts/inbox-check.mts` asserts that property against the real content, and it is the
 * check that matters here rather than any amount of care in this file.
 * ---------------------------------------------------------------------------
 *
 * WHAT A MESSAGE SAYS. The event, where it is, when it is, and how long is left — the four
 * facts somebody needs to decide whether to care, which are the four facts the drop
 * already carries. It names the rooms it brought, because "four rooms about getting into
 * the Luz" is the part that is about learning Portuguese rather than about football.
 *
 * It does NOT say "new" and it does not count anything. A message is not a notification
 * badge wearing a sentence — see `unreadCount`, which exists and is deliberately about one
 * date rather than a per-message read flag.
 */

/**
 * The day a drop ARRIVED, which is the day its window opened.
 *
 * Not the day it was authored and not the day the calendar was harvested. A drop is a date
 * in the diary until `dropOpensOn`, and the moment it crosses that line is the moment it
 * appears in somebody's Club — so that is the honest timestamp for "this landed in your
 * feed", and it is a property of the content rather than a record of when anybody looked.
 *
 * This is also what makes the retro-fill real rather than a demo: the eleven messages Sam
 * sees today are dated the days those eleven drops genuinely opened, back in July, because
 * gigs open ninety days out. Nothing is being back-dated to look populated — see
 * RETRO-FILL below.
 */
export interface InboxMessage {
  /** The drop's id. One message per drop, so the drop's identity is the message's. */
  id: string
  /** ISO date, from dropOpensOn. When this entered the feed. */
  at: string
  /** The event, in the words the drop uses about it. */
  headline: string
  /** Where, as somebody would say it: venue then area. */
  where: string
  /** The date of the thing itself: "Thu 15 Oct". */
  when: string
  /** Whole days until it goes. 0 is the last day. */
  left: number
  /** What it brought — the rooms, named, in teaching order. */
  rooms: string[]
  /** Sort of night, where the drop has one. The calendar colours by it. */
  genre?: Genre
}

/**
 * The inbox, for this learner, right now.
 *
 * THE ARGUMENTS ARE dropsFor's ARGUMENTS, passed straight through, and that is not
 * laziness — it is the mechanism. Purpose ranks the drops and genre leads them; if this
 * function took a different shape of input, or defaulted one of them differently, the
 * inbox and the feed would be two lists computed two ways and they would eventually
 * disagree. One call site, one list.
 *
 * Ordered newest-arrival first, which is the only ordering an inbox has ever had. The feed
 * orders by urgency because the feed is asking "what should you do next"; an inbox is
 * asking "what have I missed", and those are different questions with different answers.
 * Both orderings are over the SAME SET, which is the part that has to hold.
 */
export function inboxFor(
  chapter: ChapterId = DEFAULT_CHAPTER,
  now: Date = new Date(),
  genres: Genre[] | null = null,
  purpose: Purpose | null = null,
): InboxMessage[] {
  const drops: Drop[] = dropsFor(chapter, now, false, genres, purpose).flatMap((c) =>
    c.kind === 'situation' && c.drop ? [c.drop] : [],
  )
  return drops
    .map((d): InboxMessage => ({
      id: d.id,
      at: dropOpensOn(d).toISOString().slice(0, 10),
      headline: d.event,
      /*
        The area is dropped when it is empty rather than printed as a trailing separator.

        `place.area` is `?? ''` all the way back through candidateFor, so a generated drop
        from a row with no area would otherwise render "MEO Arena · " — a dangling middot
        that reads as a missing fact rather than an absent one.
      */
      where: d.place.area ? d.place.name + ' · ' + d.place.area : d.place.name,
      when: dropWhen(d),
      left: dropDaysLeft(d, now),
      rooms: d.situations.map((s) => s.title),
      ...(d.genre ? { genre: d.genre } : {}),
    }))
    /*
      Newest first, and the drop's own date breaks the tie.

      Eleven gigs harvested in one sitting open on eleven consecutive days — see the lead
      time — so arrival alone very nearly orders them already. Where two opened the same
      morning, the one happening sooner goes above, because that is the one with something
      at stake.
    */
    .sort((a, b) => b.at.localeCompare(a.at) || a.left - b.left)
}

/**
 * How many of these arrived since the learner last opened the inbox.
 *
 * ONE DATE, NOT A READ FLAG PER MESSAGE, and that follows from messages being derived. A
 * per-message flag needs somewhere to live, and the only place to put it is a list of ids
 * on the learner — at which point the product is storing the names of drops, which is the
 * stored-message design this file exists to avoid. It would also be a list that only ever
 * grows, about content that expires.
 *
 * A single "last looked" timestamp answers the only question a badge needs to answer and
 * costs one field. It is also self-healing: a drop that expires stops being counted
 * because it stops being in the list, with nothing to clean up.
 *
 * Null means never opened, and then everything counts — which is what makes the retro-fill
 * visible on a first open rather than needing to be seeded.
 */
export function unreadCount(messages: InboxMessage[], lastOpened: string | null): number {
  if (!lastOpened) return messages.length
  return messages.filter((m) => m.at > lastOpened.slice(0, 10)).length
}

/*
  RETRO-FILL — "retro fill this with the most recent so users can see how it works".

  There is no retro-fill code, and that is the point worth writing down, because the
  absence looks like the task was skipped.

  A retro-fill normally means generating history: walk the content, synthesise a message
  per past event, write them somewhere so the inbox has something in it. Every one of those
  messages would be a stored row about a thing that may no longer be live, which is the
  failure above.

  Deriving from the feed retro-fills by construction. The eleven drops live in Lisbon today
  opened between the 12th of July and the 5th of August — they are already in the past, so
  a learner opening the inbox for the first time this morning gets eleven messages dated
  across three weeks of July, every one of them about a night that is genuinely in their
  Club right now. Nothing was seeded, nothing was back-dated, and there is no fixture to
  delete before launch.

  WHAT A LEARNER CANNOT SEE, stated plainly so nobody goes looking for it: messages about
  drops that have already expired. A drop is gone the morning after the thing it is about
  and it leaves the feed, so it leaves the inbox. That is a real loss — "you missed Djavan"
  is a sentence somebody might want — and it is the right trade, because the alternative is
  an inbox that keeps talking about content the product no longer has.
*/
