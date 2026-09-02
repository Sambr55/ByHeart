/**
 * Lisbon, Portugal — 2026-10. Gathered 2026-09-02.
 *
 * EVERY ROW IS UNVERIFIED AND MAKES NO DROP UNTIL SOMEBODY SAYS SO. Read each one, follow
 * its sources, and set verified: true on the ones you would be happy for a learner to
 * mention out loud to a stranger. Delete the rest; a short month is a correct month.
 *
 * Then add this file's export to CALENDAR in content/calendar.ts. That import is by hand on
 * purpose — a directory scan would let a file join the product without anybody deciding it
 * should, which is exactly the property this content must not have.
 *
 * WHAT WAS LEFT OUT, and why it matters more than what went in:
 *
 *   The IMI second instalment. The obvious `moving` row for autumn, and it is due 30
 *   NOVEMBER, not October — confirmed against three Portuguese finance sources. It would
 *   have been the single most useful card in the month and putting it here would have sent
 *   somebody to Finanças a month early.
 *
 *   Web Summit. 9–12 November, at the Altice Arena and FIL, 70,000 people. Enormous, and
 *   outside the window. It belongs in lisbon-2026-11.ts and is the reason that file should
 *   be gathered next.
 *
 *   Strikes and closures. Nothing announced that could be confirmed. Portuguese transport
 *   strikes are typically called two to three weeks out, so this row type wants gathering
 *   late in the preceding month rather than early.
 *
 * AND NOTHING HERE IS `moving`-ONLY. That is a finding rather than an omission: October
 * 2026 has no paperwork deadline that a resident faces and a visitor does not. The purpose
 * axis is real and this particular month simply does not exercise it — which is worth
 * knowing before anybody concludes the routing is broken.
 *
 * STATIONS ARE UNVERIFIED. The dates and venues come from sources read on the day; the
 * nearest-metro fields are from general knowledge and were not checked against a map. They
 * are the most likely thing on this page to be wrong, and they are the part a learner will
 * act on physically.
 */
import type { CalendarRow } from '@/content/calendar'

export const LISBON_2026_10: CalendarRow[] = [
  {
    // Songkick lists it for Thursday 1 October at MEO Arena. Arena-scale, so the language
    // is getting there, getting a drink, and getting out.
    id: 'lisbon_tiesto',
    chapter: 'lisbon',
    kind: 'event',
    on: '2026-10-01',
    name: 'Tiësto at the MEO Arena',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://www.songkick.com/metro-areas/31802-portugal-lisbon/october-2026'],
    verified: false,
  },
  {
    /*
      A public holiday, and the one row this month that changes what is OPEN rather than
      what is on. Monday 5 October makes a three-day weekend: the Junta is shut, Finanças is
      shut, and half the city is not at work.
    */
    id: 'lisbon_republica',
    chapter: 'lisbon',
    kind: 'holiday',
    on: '2026-10-05',
    name: 'Republic Day — a public holiday',
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.theportugalnews.com/news/2025-10-22/when-are-the-public-holidays-in-portugal-in-2026/905835',
      'https://en.wikipedia.org/wiki/Public_holidays_in_Portugal',
    ],
    verified: false,
  },
  {
    id: 'lisbon_evanescence',
    chapter: 'lisbon',
    kind: 'event',
    on: '2026-10-04',
    name: 'Evanescence at the MEO Arena',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://www.songkick.com/metro-areas/31802-portugal-lisbon/october-2026'],
    verified: false,
  },
  {
    // The most Lisbon-specific music row in the month: Gilberto Gil at the Coliseu is an
    // event a Portuguese speaker would actually talk to you about.
    id: 'lisbon_gilberto_gil',
    chapter: 'lisbon',
    kind: 'event',
    on: '2026-10-10',
    name: 'Gilberto Gil at the Coliseu',
    where: { name: 'Coliseu dos Recreios', area: 'Restauradores', station: 'Restauradores' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.songkick.com/metro-areas/31802-portugal-lisbon/october-2026',
      'https://www.jambase.com/venue/coliseu-dos-recreios',
    ],
    verified: false,
  },
  {
    /*
      Benfica's only home match in the window, and a European night — which is a different
      city entirely from a league Sunday. ESPN lists it as home, Thursday 15 October.
    */
    id: 'lisbon_benfica_celtic',
    chapter: 'lisbon',
    kind: 'event',
    on: '2026-10-15',
    name: 'Benfica v Celtic',
    where: { name: 'Estádio da Luz', area: 'Benfica', station: 'Colégio Militar/Luz' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://www.espn.com/soccer/team/fixtures/_/id/1929/benfica'],
    verified: false,
  },
  {
    id: 'lisbon_kelela_lemon_twigs',
    chapter: 'lisbon',
    kind: 'event',
    on: '2026-10-21',
    name: 'The Lemon Twigs at Lisboa Ao Vivo',
    where: { name: 'LAV — Lisboa Ao Vivo', area: 'Alcântara' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://www.songkick.com/metro-areas/31802-portugal-lisbon/october-2026'],
    verified: false,
  },
  {
    /*
      ESPN's Sporting page contradicted itself — it says "2 fixtures" and then lists four.
      The dates below are what it actually printed, and this row is the clearest reason to
      check before publishing rather than after.
    */
    id: 'lisbon_sporting_lask',
    chapter: 'lisbon',
    kind: 'event',
    on: '2026-10-21',
    name: 'Sporting v LASK Linz',
    where: { name: 'Estádio José Alvalade', area: 'Alvalade', station: 'Campo Grande' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://www.espn.com/soccer/team/fixtures/_/id/2250/sporting-cp'],
    verified: false,
  },
  {
    id: 'lisbon_yard_act',
    chapter: 'lisbon',
    kind: 'event',
    on: '2026-10-23',
    name: 'Yard Act at the Capitólio',
    where: { name: 'Capitólio', area: 'Parque Mayer', station: 'Avenida' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://www.songkick.com/metro-areas/31802-portugal-lisbon/october-2026'],
    verified: false,
  },
  {
    id: 'lisbon_jungle',
    chapter: 'lisbon',
    kind: 'event',
    on: '2026-10-24',
    name: 'Jungle at the MEO Arena',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://www.songkick.com/metro-areas/31802-portugal-lisbon/october-2026'],
    verified: false,
  },
  {
    // A league Sunday at Alvalade — the ordinary version of a match day, and the one most
    // likely to involve standing in a queue talking to somebody.
    id: 'lisbon_sporting_viseu',
    chapter: 'lisbon',
    kind: 'event',
    on: '2026-10-25',
    name: 'Sporting v Académico de Viseu',
    where: { name: 'Estádio José Alvalade', area: 'Alvalade', station: 'Campo Grande' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://www.espn.com/soccer/team/fixtures/_/id/2250/sporting-cp'],
    verified: false,
  },
  {
    id: 'lisbon_anastacia',
    chapter: 'lisbon',
    kind: 'event',
    on: '2026-10-27',
    name: 'Anastacia at Campo Pequeno',
    where: { name: 'Campo Pequeno', area: 'Campo Pequeno', station: 'Campo Pequeno' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: ['https://www.songkick.com/metro-areas/31802-portugal-lisbon/october-2026'],
    verified: false,
  },
]
