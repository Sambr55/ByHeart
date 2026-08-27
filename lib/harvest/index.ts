import type { Candidate } from '@/lib/draft'

/**
 * Harvesting — the only part of the pipeline that touches the outside world.
 *
 * Deliberately the thinnest layer in it. A source is a function that returns candidates and
 * nothing else: no drafting, no language, no writing to disk. Everything on either side of
 * this file is pure and testable offline, which matters because this is the part that will
 * break — sites change, feeds move, an API key expires on a Sunday.
 *
 * What a source must never do is invent. If it cannot establish the venue, it returns
 * nothing for that event: a plausible-sounding address is the worst output this pipeline
 * can produce, because somebody will stand outside it.
 */
export interface Source {
  id: string
  /** Said plainly, because the drop page shows it and somebody has to be able to judge it. */
  about: string
  /** What licence or terms this is used under. Checked by a person, recorded here. */
  terms: string
  fetch(now: Date): Promise<Candidate[]>
}

/**
 * The nearest station, which is a fact and therefore has to be looked up rather than
 * guessed. Held here as a small authored table rather than pulled from a routing API,
 * because there are about a dozen venues in Lisbon that matter and a wrong station is
 * somebody walking forty minutes in the dark.
 */
export const VENUE_STATION: Record<string, string> = {
  'Altice Arena': 'Oriente',
  'Campo Pequeno': 'Campo Pequeno',
  'Coliseu dos Recreios': 'Restauradores',
  'Aula Magna': 'Cidade Universitária',
  'LAV — Lisboa ao Vivo': 'Alcântara-Mar',
  'Estádio da Luz': 'Colégio Militar',
  'Estádio José Alvalade': 'Campo Grande',
  'Casa da Música': 'Casa da Música',
}

export function stationFor(venue: string): string | null {
  return VENUE_STATION[venue] ?? null
}

/**
 * Run every source, keep what parses, and say what each one gave.
 *
 * One source failing must never stop the others: a harvest that returns nine candidates and
 * one error is a good run, and a harvest that throws because a website was down is a
 * pipeline that only works on quiet days.
 */
export async function harvest(
  sources: Source[],
  now: Date = new Date(),
): Promise<{ candidates: Candidate[]; report: { source: string; got: number; error?: string }[] }> {
  const candidates: Candidate[] = []
  const report: { source: string; got: number; error?: string }[] = []
  for (const source of sources) {
    try {
      const got = await source.fetch(now)
      candidates.push(...got)
      report.push({ source: source.id, got: got.length })
    } catch (e) {
      report.push({ source: source.id, got: 0, error: e instanceof Error ? e.message : String(e) })
    }
  }
  // Same event from two sources is one candidate. First one wins, which is why sources are
  // listed most-trusted first.
  const seen = new Set<string>()
  return {
    candidates: candidates.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true))),
    report,
  }
}
