/**
 * Lisbon, Portugal — 2026-10. Gathered 2026-09-02, verified 2026-09-02.
 *
 * VERIFIED MEANS: the event exists, on this date, at this venue — confirmed against the
 * venue's own agenda where it has one, and two independent sources where it does not.
 *
 * VERIFIED DOES NOT MEAN the metro station is right. Those are still from general
 * knowledge and remain the most likely thing on this page to be wrong — and the part a
 * learner acts on physically. Worth an afternoon with a map before anybody is sent
 * anywhere.
 *
 * WHAT VERIFICATION CHANGED, which is the argument for doing it at all:
 *
 *   TWO ROWS WERE WRONG AND ARE GONE. Tiësto on 1 October appears nowhere on the MEO
 *   Arena's own October agenda. Sporting v Académico de Viseu is deleted because sources
 *   disagree on both the DATE (24th or 25th) and on WHO IS AT HOME — one lists the fixture
 *   in Viseu. Sending somebody to Alvalade for a match being played 300km away is exactly
 *   the failure the flag exists to prevent.
 *
 *   ONE DATE WAS OFF BY A DAY. The Lemon Twigs are at LAV on the 22nd, not the 21st.
 *
 *   FIVE ROWS WERE MISSING. Obama, Djavan, Fontaines D.C., Laura Pausini and André Rieu
 *   are all on the arena's own agenda and none of them reached the first pass. The
 *   aggregator was both inventing and incomplete, which is the combination worth
 *   remembering before trusting one again.
 *
 * AND SEPARATELY: the product's only Drop, Duran Duran, was dated 14 November. The band
 * plays on 3 NOVEMBER — confirmed by the arena, by the official ticket seller and by
 * Bandsintown. The 14th is a different show entirely. Fixed in content/drops.ts.
 *
 * STILL NOTHING `moving`-ONLY. A finding rather than an omission: October 2026 has no
 * paperwork deadline a resident faces and a visitor does not. The purpose axis is real and
 * this month does not exercise it — worth knowing before concluding the routing is broken.
 *
 * The IMI second instalment is due 30 NOVEMBER, not October, and belongs in the next file
 * along with Web Summit (9–12 November).
 */
import type { CalendarRow } from '@/content/calendar'

export const LISBON_2026_10: CalendarRow[] = [
  {
    id: 'lisbon_evanescence',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-10-04',
    name: 'Evanescence at the MEO Arena',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://arena.meo.pt/en/full-agenda'],
    verified: true,
  },
  {
    /*
      A public holiday, and the one row this month that changes what is OPEN rather than
      what is on. The 5th falls on a Monday, so it makes a three-day weekend: the Junta is
      shut, Finanças is shut, and half the city is not at work.
    */
    id: 'lisbon_republica',
    chapter: 'lisbon',
    kind: 'holiday',
    on: '2026-10-05',
    name: 'Republic Day — a public holiday',
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://en.wikipedia.org/wiki/Public_holidays_in_Portugal',
      'https://www.theportugalnews.com/news/2025-10-22/when-are-the-public-holidays-in-portugal-in-2026/905835',
    ],
    verified: true,
  },
  {
    /*
      The most Lisbon-specific music row in the month, and the one a Portuguese speaker
      would actually talk to you about. Amor Azul is a new song-opera with an orchestra and
      a choir, not a greatest-hits night — worth knowing, because "what are you going to
      see" then has a much better answer than "Gilberto Gil".
    */
    id: 'lisbon_gilberto_gil',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-10-10',
    name: 'Gilberto Gil — Amor Azul — at the Coliseu',
    where: { name: 'Coliseu dos Recreios', area: 'Restauradores', station: 'Restauradores' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.publico.pt/2026/05/01/culturaipsilon/noticia/gilberto-gil-apresenta-espectaculo-amor-azul-coliseu-recreios-outubro-2173228',
      'https://observador.pt/2026/04/30/gilberto-gil-apresenta-espectaculo-amor-azul-no-coliseu-de-lisboa-em-outubro/',
      'https://coliseulisboa.com/eventos/gilberto-gil-amor-azul/',
    ],
    verified: true,
  },
  {
    id: 'lisbon_obama_forum',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'exhibition',
    on: '2026-10-10',
    name: 'Barack Obama at the Game Changers Forum',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://arena.meo.pt/en/full-agenda'],
    verified: true,
  },
  {
    /*
      Brazilian, at a Portuguese arena, which is the most useful accident on this page.
      Fifty years of Djavan is a room full of people singing along in the OTHER Portuguese,
      and hearing that difference is worth more than being told about it.
    */
    id: 'lisbon_djavan',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-10-11',
    name: 'Djavan — 50 anos, só sucessos',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://arena.meo.pt/en/full-agenda'],
    verified: true,
  },
  {
    // A European night, which is a different city entirely from a league Sunday.
    id: 'lisbon_benfica_celtic',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'match',
    on: '2026-10-15',
    name: 'Benfica v Celtic — Europa League',
    where: { name: 'Estádio da Luz', area: 'Benfica', station: 'Colégio Militar/Luz' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://seatpick.com/sl-benfica-vs-celtic-fc-tickets',
      'https://www.espn.com/soccer/team/fixtures/_/id/1929/benfica',
    ],
    verified: true,
  },
  {
    id: 'lisbon_sporting_lask',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'match',
    on: '2026-10-21',
    name: 'Sporting v LASK — Champions League',
    where: { name: 'Estádio José Alvalade', area: 'Alvalade', station: 'Campo Grande' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.goal.com/en/team/sporting-cp/fixtures-results/7catg5lpivcmpf4xhggh6d8rk',
      'https://www.espn.com/soccer/team/fixtures/_/id/2250/sporting-cp',
    ],
    verified: true,
  },
  {
    id: 'lisbon_fontaines_dc',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-10-21',
    name: 'Fontaines D.C. at the MEO Arena',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://arena.meo.pt/en/full-agenda'],
    verified: true,
  },
  {
    // The 22nd, not the 21st. The first pass had this a day early.
    id: 'lisbon_lemon_twigs',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-10-22',
    name: 'The Lemon Twigs at Lisboa Ao Vivo',
    where: { name: 'LAV — Lisboa Ao Vivo', area: 'Alcântara' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.livenation.com/artist/K8vZ9174G87/the-lemon-twigs-events',
      'https://www.songkick.com/metro-areas/31802-portugal-lisbon/october-2026',
    ],
    verified: true,
  },
  {
    id: 'lisbon_laura_pausini',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-10-22',
    name: 'Laura Pausini — Io Canto World Tour',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://arena.meo.pt/en/full-agenda'],
    verified: true,
  },
  {
    id: 'lisbon_yard_act',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-10-23',
    name: 'Yard Act at the Capitólio',
    where: { name: 'Capitólio', area: 'Parque Mayer', station: 'Avenida' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://www.songkick.com/metro-areas/31802-portugal-lisbon/october-2026'],
    verified: true,
  },
  {
    id: 'lisbon_jungle',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-10-24',
    name: 'Jungle at the MEO Arena',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://arena.meo.pt/en/agenda/jungle_en/16031',
      'https://www.songkick.com/concerts/43119787-jungle-at-meo-arena',
    ],
    verified: true,
  },
  {
    id: 'lisbon_anastacia',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-10-27',
    name: 'Anastacia at Campo Pequeno',
    where: { name: 'Sagres Campo Pequeno', area: 'Campo Pequeno', station: 'Campo Pequeno' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.ticketline.pt/en/evento/anastacia-ntktour-2026-98323',
      'https://artesonora.pt/anastacia-em-nome-proprio-no-sagres-campo-pequeno-em-2026-bilhetes/',
    ],
    verified: true,
  },
  {
    // Three nights, which is why it carries `until`. The city notices.
    id: 'lisbon_andre_rieu',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-10-29',
    until: '2026-10-31',
    name: 'André Rieu and the Johann Strauss Orchestra',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://arena.meo.pt/en/full-agenda'],
    verified: true,
  },
]
