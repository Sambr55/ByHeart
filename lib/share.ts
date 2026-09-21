import { db } from '@/lib/db'

/**
 * Share cards.
 *
 * Frozen at creation. A card posted in August should still say what it said in August
 * rather than quietly restating itself as the learner goes on — the number is a claim
 * about a moment, and a claim that edits itself later is not evidence of anything.
 *
 * Anonymous learners can make one. The proof card is free at every tier and it is the
 * growth loop; requiring an account to share would be gating the one thing that brings
 * people in.
 */
export interface Snapshot {
  count: number
  worlds: number
  lines: { pt: string; en: string }[]
  made_at: string
  /*
    AN INVITATION, which is the same object doing a different job.

    A proof card says "here is what I can say"; this says "come to this with me", in
    Portuguese, about a night that is actually happening. Sam: "this is a perfect
    oppottyunity to mint an invite card to send to some one (in Portuguse) Do you want to
    come to this {insert event type} with me?"

    Carried on the snapshot rather than in a table of its own, because a share card is
    already a frozen JSON blob with a short public id and a page that renders it — and the
    freezing is exactly as important here. An invitation that quietly restated itself
    after the night had passed would be worse than one that expires.

    Absent on every card minted so far, which is why the page branches on it rather than
    on a version number: an old card has no invite and renders as it always did.
  */
  invite?: {
    /** The ask itself, already filled — "Queres vir comigo ao concerto no dia catorze?" */
    pt: string
    en: string
    /** Who is asking, when they have told DUB their name. */
    from?: string
    event: string
    venue: string
    /** ISO date of the night, so the card can say when without re-deriving it. */
    on: string
  }
}

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

function shortId(): string {
  let out = ''
  for (let i = 0; i < 7; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return out
}

export async function createShareCard(
  snapshot: Snapshot,
  userId: string | null,
  deviceId: string | null,
): Promise<string | null> {
  const sql = db()
  if (!sql) return null
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = shortId()
    try {
      await sql`
        insert into share_cards (id, user_id, device_id, snapshot)
        values (${id}, ${userId}, ${deviceId}, ${sql.json(snapshot as never)})
      `
      return id
    } catch {
      // Collision on a seven-character id. Try again rather than failing the share.
    }
  }
  return null
}

export async function getShareCard(id: string): Promise<Snapshot | null> {
  const sql = db()
  if (!sql) return null
  const rows = await sql<{ snapshot: Snapshot }[]>`
    select snapshot from share_cards where id = ${id}
  `
  return rows[0]?.snapshot ?? null
}
