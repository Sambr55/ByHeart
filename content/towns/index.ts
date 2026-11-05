/**
 * THE TOWNS BESIDE LISBON (2026-11-05): Cascais and Sintra. Their bairros, gems and walks,
 * drafted from research with sources and `verified: false` until somebody who knows each
 * town has checked them — content/gems.ts visibleGems keeps them off production till then,
 * and the boarding pass (cityReady) says "coming soon" for a town with nothing checked.
 */
import type { Bairro, Gem } from '@/content/gems'
import type { Walk } from '@/content/walks'
import { CASCAIS_BAIRROS, CASCAIS_GEMS, CASCAIS_WALKS } from './cascais'
import { SINTRA_BAIRROS, SINTRA_GEMS, SINTRA_WALKS } from './sintra'

export const TOWN_BAIRROS: Bairro[] = [...CASCAIS_BAIRROS, ...SINTRA_BAIRROS]
export const TOWN_GEMS: Gem[] = [...CASCAIS_GEMS, ...SINTRA_GEMS]
export const TOWN_WALKS: Walk[] = [...CASCAIS_WALKS, ...SINTRA_WALKS]
