/**
 * SINTRA & CASCAIS — one city of two towns (Sam, 2026-11-05: "consolidate Cascais and
 * Sintra into one 'City' and then run agents to populate its content and set it live").
 *
 * ON WHAT `verified: true` MEANS HERE. Lisbon's flag is a person's word (content/gems.ts).
 * For this launch Sam asked for the city to go live from research, so a town gem is
 * verified when a source DATED 2025–26 shows it operating at that address — each gem's
 * `unsure` says what confirmed it and what is still unchecked. Undated aggregators never
 * counted. A gem nobody could confirm stays `verified: false`, off production. The places
 * listed in the PR for a visit in person are the ones to walk past first.
 */
import type { Bairro, Gem } from '@/content/gems'
import type { Walk } from '@/content/walks'
import { CASCAIS_BAIRROS, CASCAIS_GEMS, CASCAIS_WALKS } from './cascais'
import { SINTRA_BAIRROS, SINTRA_GEMS, SINTRA_WALKS } from './sintra'

export const TOWN_BAIRROS: Bairro[] = [...CASCAIS_BAIRROS, ...SINTRA_BAIRROS]
export const TOWN_GEMS: Gem[] = [...CASCAIS_GEMS, ...SINTRA_GEMS]
export const TOWN_WALKS: Walk[] = [...CASCAIS_WALKS, ...SINTRA_WALKS]
