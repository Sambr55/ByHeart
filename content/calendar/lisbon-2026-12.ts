/**
 * Lisbon, Portugal — 2026-12. Gathered 2026-11-02 with web search, every row checked against
 * the venue's or organiser's own page and one independent source.
 *
 * Landed verified: false per scripts/calendar.mts; Sam approved every row on 2026-11-02
 * ("approve all") after reading the list, MEDIUM notes included, and the flags were flipped
 * then. The MEDIUM rows are still the first place to look if anything turns out wrong.
 *
 * LEFT OUT ON PURPOSE (re-check later, they will firm up):
 *   - League rounds 13–16, including Benfica v Sporting (weekend of 27 Dec): the Liga has not
 *     published days or times yet. Add them when it does — the derby above all.
 *   - New Year's Eve at Terreiro do Paço: not announced for 2026 yet.
 *   - Jane Monheit (Tivoli, 7 Dec): one source only.
 */
import type { CalendarRow } from '@/content/calendar'

export const LISBON_2026_12: CalendarRow[] = [
  {
    /* A Tuesday, so many take the Monday too. */
    id: 'lisbon_restauracao',
    chapter: 'lisbon',
    kind: 'holiday',
    on: '2026-12-01',
    name: 'Restoration of Independence — a public holiday',
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.santander.pt/salto/feriados-portugal-2026',
      'https://sabiasque.pt/trabalho/legislacao/2441-decima-alteracao-ao-codigo-do-trabalho-reposicao-de-feriados-lei-n-8-2016.html',
    ],
    verified: true,
  },
  {
    id: 'lisbon_seong_jin_cho_gulbenkian',
    genre: 'classical_trad',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-12-06',
    name: 'Seong-Jin Cho at the Gulbenkian',
    where: { name: 'Fundação Calouste Gulbenkian', area: 'Avenidas Novas', station: 'São Sebastião' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://gulbenkian.pt/musica/agenda/seong-jin-cho-3/',
    sources: [
      'https://gulbenkian.pt/musica/agenda/seong-jin-cho-3/',
      'https://www.deutschegrammophon.com/de/kuenstler/seong-jin-cho/live-termine',
    ],
    verified: true,
  },
  {
    id: 'lisbon_iolanda_coliseu',
    genre: 'rock_pop',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-12-07',
    name: 'Iolanda at the Coliseu',
    where: { name: 'Coliseu dos Recreios', area: 'Restauradores', station: 'Restauradores' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.bol.pt/Comprar/Bilhetes/168837-iolanda-coliseu_de_lisboa/Sessoes',
    sources: [
      'https://coliseulisboa.com/eventos/iolanda/',
      'https://www.noticiasaominuto.com/cultura/2902171/iolanda-edita-album-de-estreia-e-atua-no-coliseu-de-lisboa-em-2026',
    ],
    verified: true,
  },
  {
    /* Also a Tuesday. */
    id: 'lisbon_imaculada',
    chapter: 'lisbon',
    kind: 'holiday',
    on: '2026-12-08',
    name: 'Immaculate Conception — a public holiday',
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.santander.pt/salto/feriados-portugal-2026',
      'https://invoicexpress.com/blog/feriados-portugal-2026/',
    ],
    verified: true,
  },
  {
    /* Date from UEFA; kick-off not yet official. */
    id: 'lisbon_benfica_ofi',
    genre: 'sport_national',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'match',
    on: '2026-12-10',
    name: 'Benfica v OFI Crete at the Luz (Europa League)',
    where: { name: 'Estádio da Luz', area: 'Benfica', station: 'Colégio Militar/Luz' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.uefa.com/uefaeuropaleague/clubs/50147--benfica/matches/',
      'https://diadejogo.pt/benfica/proximos-jogos',
    ],
    verified: true,
  },
  {
    id: 'lisbon_richie_campbell_meo',
    genre: 'rock_pop',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-12-12',
    name: 'Richie Campbell at the MEO Arena',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.ticketline.pt/en/evento/richie-campbell-104877',
    sources: [
      'https://arena.meo.pt/en/agenda/richie-campbell_en/16260',
      'https://www.nit.pt/cultura/musica/richie-campbell-vai-dar-um-concerto-na-meo-arena-para-apresentar-o-novo-album',
    ],
    verified: true,
  },
  {
    id: 'lisbon_osp_xmas_mozart_tivoli',
    genre: 'classical_trad',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-12-12',
    name: 'Christmas with Mozart — the Portuguese Symphony Orchestra at the Tivoli',
    where: { name: 'Teatro Tivoli BBVA', area: 'Avenida da Liberdade', station: 'Avenida' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.ticketline.pt/evento/tribeca-xmas-with-mozart-osp-108739',
    sources: [
      'https://www.teatrotivolibbva.pt/tribeca-xmas-with-mozart-osp/',
      'https://www.rtp.pt/noticias/cultura/teatro-s-carlos-ainda-fora-de-portas-na-proxima-temporada-com-33-recitas-de-opera-e-16-concertos_n1750478',
    ],
    verified: true,
  },
  {
    /* MEDIUM: the same unclear Gulbenkian status labels. */
    id: 'lisbon_canzoniere_gulbenkian',
    genre: 'classical_trad',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-12-12',
    name: 'Canzoniere Grecanico Salentino at the Gulbenkian',
    where: { name: 'Fundação Calouste Gulbenkian', area: 'Avenidas Novas', station: 'São Sebastião' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://gulbenkian.pt/musica/agenda/canzoniere-grecanico-salentino/',
    sources: [
      'https://gulbenkian.pt/musica/agenda/canzoniere-grecanico-salentino/',
      'https://www.nit.pt/cultura/musica/ja-foi-revelada-a-programacao-da-nova-temporada-da-gulbenkian-com-mais-de-120-espetaculos',
    ],
    verified: true,
  },
  {
    /* Part of Misty Fest. Two sessions, 18:00 and 21:00, per the Coliseu. */
    id: 'lisbon_rodrigo_leao_coliseu',
    genre: 'classical_trad',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-12-18',
    name: 'Rodrigo Leão — Alma Mater — at the Coliseu',
    where: { name: 'Coliseu dos Recreios', area: 'Restauradores', station: 'Restauradores' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.bol.pt/Comprar/Bilhetes/177819-rodrigo_leao_alma_mater_misty_fest-coliseu_de_lisboa/Sessoes',
    sources: [
      'https://coliseulisboa.com/eventos/rodrigo-leao-alma-mater-misty-fest/',
      'https://www.rodrigoleao.pt/en/rodrigo-leao-revisita-alma-mater-no-misty-fest-2026/',
    ],
    verified: true,
  },
  {
    /* Belém is a train stop (Cais do Sodré line) or tram 15, not the metro. */
    id: 'lisbon_bach_mass_ccb',
    genre: 'classical_trad',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-12-20',
    name: 'Bach\'s Mass in B minor at the CCB',
    where: { name: 'Centro Cultural de Belém', area: 'Belém', station: 'Belém' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.bol.pt/Comprar/Bilhetes/180224/1956226/Sectores?lang=en-US',
    sources: [
      'https://www.ccb.pt/en/evento/christmas-concert-bachs-mass-in-b-minor/',
      'https://www.rtp.pt/noticias/cultura/teatro-s-carlos-ainda-fora-de-portas-na-proxima-temporada-com-33-recitas-de-opera-e-16-concertos_n1750478',
    ],
    verified: true,
  },
  {
    id: 'lisbon_natal',
    chapter: 'lisbon',
    kind: 'holiday',
    on: '2026-12-25',
    name: 'Christmas Day — a public holiday',
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.santander.pt/salto/feriados-portugal-2026',
      'https://invoicexpress.com/blog/feriados-portugal-2026/',
    ],
    verified: true,
  },
]
