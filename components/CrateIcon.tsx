/**
 * One drawn object per crate.
 *
 * The graphics slot already existed and rendered the same generic tint on every card, so
 * ten crates still looked alike — and the drop got no slot at all.
 *
 * Objects, never marques: a car rather than THAT car, a jet rather than a specific
 * airframe. No badges, no logos, no lettering, no key art. Same posture as the content,
 * and it keeps every icon usable if a crate is ever renamed.
 *
 * Single path where possible, currentColor throughout, so each one takes the crate's own
 * tone from the tile it sits on.
 */
const PATHS: Record<string, string> = {
  // A jet, banking
  top_gun: 'M3 14l8-3 2-7 2 7 8 3-8 2-2 6-2-6z',
  // A car in three-quarter silhouette
  james_bond: 'M3 15h18M5 15l2-5h10l2 5M7 18a1.6 1.6 0 100-3.2A1.6 1.6 0 007 18zm10 0a1.6 1.6 0 100-3.2 1.6 1.6 0 000 3.2z',
  // The big knickers
  bridget_jones: 'M4 7h16v3a6 6 0 01-4 5.6L12 17l-4-1.4A6 6 0 014 10z',
  // A milkshake with a straw
  pulp_fiction: 'M8 8h8l-1 12H9zM8 8l8-3M14 5l3-2',
  // Sunglasses
  audrey_hepburn: 'M3 9h18M6 9a3.5 3.5 0 107 0zm5 0h2m0 0a3.5 3.5 0 107 0z',
  // A column capital
  marcus_aurelius: 'M5 7h14M7 7v11M12 7v11M17 7v11M4 18h16M6 5h12',
  // A speech bubble with a lightning bolt
  portuguese_swearing: 'M4 5h16v10H9l-4 4V5zm9 2l-3 4h3l-2 4',
  // Two glasses touching
  flirting_m2f: 'M4 5h6l-2 6H6zm10 0h6l-2 6h-2zM7 11v7M17 11v7M5 19h4M15 19h4',
  // A struck match
  flirting_f2m: 'M12 20V9M12 9c-2-1-3-3-1-5 3 1 4 3 1 5z',
  // A wand with a spark
  world_of_wizardry: 'M4 20L15 9M17 7l1-3 1 3 3 1-3 1-1 3-1-3-3-1zM14 5l1 2',
  // A torn ticket stub
  duran_duran_lisboa: 'M3 8h18v3a2 2 0 000 4v3H3v-3a2 2 0 000-4zM14 8v11',
}

export function CrateIcon({ crate, className }: { crate: string; className?: string }) {
  const d = PATHS[crate]
  if (!d) return null
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  )
}
