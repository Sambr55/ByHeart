import { redirect } from 'next/navigation'

/**
 * VIBES IS RETIRED AS A SEPARATE LOOP (Sam, 2026-11-03).
 *
 * It was a second app beside the path — its own picker, sections, sittings and Legend
 * hand-off — and two loops was half of "I get lost in my own app in seconds". Its lasting
 * part, the shapes (NÃO + VERB, -ÇÃO, POSSO …?, the bluffs), is now the Foundations row on
 * the Path (components/path/Foundations.tsx). Old links, push notifications and installed
 * shortcuts that still say /vibes land home. The journey code (VibesView, components/
 * Journey.tsx) stays in the tree, because the front door still renders through it.
 */
export default function VibesPage() {
  redirect('/club')
}
