import type { CultureFamily } from '@/content/roots'

/**
 * A photograph for every vibe.
 *
 * The shelf identified vibes by a tone and a line drawing, which was honest while there
 * were no pictures in the product and became the wrong call the moment there were: a vibe
 * is not read, it is CHOSEN, and nobody chooses Bridget Jones off a colour swatch.
 *
 * These are all still lifes in Lisbon, which is the whole trick. Not a film still and not
 * a stock photograph of the thing itself — a martini on a marble bar, a crumpled tissue
 * beside a large glass of white wine, a shutter pulled down on a shopfront. They say what
 * the vibe is by what they leave out, and they keep the product in one city rather than
 * turning the shelf into a poster wall from eleven different places.
 *
 * Kept out of CRATES on purpose. That list is what a vibe TEACHES; this is what it looks
 * like, and the alt text is real writing that deserves to sit somewhere it can be read
 * rather than buried between a rung and a blurb.
 */
export interface VibeImage {
  src: string
  /**
   * The information, not the mood — the same rule the Club's photographs follow.
   * Somebody who cannot see it should be able to choose on the same terms.
   */
  alt: string
  rights_status: 'generated'
}

export const VIBE_IMAGES: Record<CultureFamily, VibeImage> = {
  the_basics: {
    src: '/vibes/the-basics.jpg',
    alt: 'A stack of seven-inch records in worn paper sleeves on a dark wooden table, a tiled pillar and a Lisbon street through the window behind.',
    rights_status: 'generated',
  },
  top_gun: {
    src: '/vibes/top-gun.jpg',
    alt: 'Gold-framed aviator sunglasses with blue mirrored lenses lying on a zinc café table, blue-and-white tiles and a yellow wall behind.',
    rights_status: 'generated',
  },
  james_bond: {
    src: '/vibes/james-bond.jpg',
    alt: 'A martini with a single olive on a marble bar in a dark room, a lit lamp and tiled panelling behind it.',
    rights_status: 'generated',
  },
  bridget_jones: {
    src: '/vibes/bridget-jones.jpg',
    alt: 'A very large glass of white wine on a windowsill above Lisbon rooftops at dusk, with a crumpled tissue beside it.',
    rights_status: 'generated',
  },
  pulp_fiction: {
    src: '/vibes/pulp-fiction.jpg',
    alt: 'A tall metal cup beaded with condensation on a marble table in a Lisbon tasca, a red leather stool in the foreground.',
    rights_status: 'generated',
  },
  audrey_hepburn: {
    src: '/vibes/audrey-hepburn.jpg',
    alt: 'Black cat-eye sunglasses and a pearl necklace beside an espresso cup on a marble café table by a balcony, blue azulejo behind.',
    rights_status: 'generated',
  },
  marcus_aurelius: {
    src: '/vibes/marcus-aurelius.jpg',
    alt: 'Fluted stone columns in low evening sun on a cobbled pavement, a tiled panel in shadow behind them.',
    rights_status: 'generated',
  },
  portuguese_swearing: {
    src: '/vibes/portuguese-swearing.jpg',
    alt: 'A battered yellow roller shutter pulled down over a shopfront, blue tiles on the wall either side of it.',
    rights_status: 'generated',
  },
  flirting_m2f: {
    src: '/vibes/flirting-m2f.jpg',
    alt: 'Two glasses of cold white wine touching on a stone balcony wall at night, the lights of the city below.',
    rights_status: 'generated',
  },
  flirting_f2m: {
    src: '/vibes/flirting-f2m.jpg',
    alt: 'A hand striking a match beside an open matchbook on a dark bar, a glass of whisky behind.',
    rights_status: 'generated',
  },
  world_of_wizardry: {
    src: '/vibes/world-of-wizardry.jpg',
    alt: 'A curved wooden staircase with a carved banister in a dim old shop, a tiled dado and crowded shelves beside it.',
    rights_status: 'generated',
  },
  duran_duran_lisboa: {
    src: '/vibes/duran-duran-lisboa.jpg',
    alt: 'Wet cobbles at night reflecting floodlights, a torn ticket stub on the ground beside a tiled wall.',
    rights_status: 'generated',
  },
}

export function vibeImage(id: CultureFamily): VibeImage | null {
  return VIBE_IMAGES[id] ?? null
}
