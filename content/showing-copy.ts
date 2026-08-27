/**
 * Showing, in words.
 *
 * The register to hold: this is one person handing another person something, not a
 * platform announcing a connection. No "request", no "accepted", no "friend". Nobody has
 * gained a follower and the copy must never imply they have.
 */
/**
 * The closed set of report reasons.
 *
 * Lives here, next to the words, rather than beside the database — it is content, and it
 * has to be importable by a check that runs without a server. There is no "other, please
 * describe": a report box that accepts arbitrary prose is itself a way to send somebody a
 * message, and the one property holding this feature's moderation obligation down is that
 * nothing arbitrary can be written anywhere in it.
 */
export const REPORT_REASONS = [
  'not_who_they_said',
  'offensive',
  'spam',
  'something_else',
] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

export const SHOWING_COPY = {
  // ---- the sender, on /proof --------------------------------------------------
  send_label: 'SHOW THIS TO SOMEBODY',
  send_note:
    'Makes a link for one person. They see these sentences and nothing else about you — and they can show you theirs back.',
  sending: 'MAKING IT…',
  sent_head: 'Send them this.',
  sent_body: 'Only the person you send it to can open it, and it expires in a fortnight.',
  copy: 'COPY THE LINK',
  copied: 'COPIED',

  // ---- the list, on /proof ----------------------------------------------------
  mine_label: 'SHOWN',
  mine_waiting: 'Sent. Nothing back yet.',
  mine_returned: 'They showed you theirs.',
  mine_received: 'They showed you theirs.',
  mine_open: 'OPEN',

  // ---- the recipient, on /s/[id] ----------------------------------------------
  eyebrow: 'SOMEBODY SHOWED YOU THIS',
  head: 'Sentences they can say cold.',
  body: 'With nothing on screen to copy from. That is the only thing DUB counts, which is why it is worth showing somebody.',
  return_label: 'SHOW THEM YOURS BACK',
  return_note: 'They will see up to three of your sentences and your count. Nothing else.',
  returning: 'SHOWING…',
  returned_head: 'You showed them yours.',
  returned_body: 'You can both see both now. That is the whole thing — there is nothing to follow and no number going up.',
  nothing_yet:
    'You have not said anything cold yet, so there is nothing to show back. It takes about four minutes.',
  nothing_cta: 'START',

  // ---- the sender, looking at their own -----------------------------------------
  mine_head: 'You showed this to somebody.',
  mine_waiting_body: 'They have not shown you theirs yet. Nothing happens until they do.',
  their_head: 'And they showed you theirs.',

  // ---- the ends ---------------------------------------------------------------
  gone_head: 'That link has gone.',
  gone_body: 'Showings are addressed to one person and they do not stay open for ever.',
  taken_head: 'Somebody has already answered this.',
  taken_body: 'A showing is addressed to one person, and one person has opened it.',
  expired_head: 'That invitation has expired.',
  expired_body: 'They can make you another one in a couple of taps.',

  // ---- report and block --------------------------------------------------------
  safety_label: 'SOMETHING WRONG?',
  report_label: 'REPORT THIS',
  block_label: 'BLOCK THEM',
  block_note: 'They will never be able to show you anything again. It cannot be undone.',
  reported: 'Reported. Somebody reads these.',
  blocked_head: 'Blocked.',
  blocked_body: 'They cannot reach you here again.',
  report_reasons: [
    { id: 'not_who_they_said', label: 'Not who they said they were' },
    { id: 'offensive', label: 'Offensive' },
    { id: 'spam', label: 'Spam' },
    { id: 'something_else', label: 'Something else' },
  ],
} as const
