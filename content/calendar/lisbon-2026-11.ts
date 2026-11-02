/**
 * Lisbon, Portugal — 2026-11. Gathered 2026-11-02 with web search, every row checked against
 * the venue's or organiser's own page and one independent source.
 *
 * EVERY ROW LANDS verified: false, per scripts/calendar.mts — a model found these and a
 * person has not looked yet, and an unverified row makes no drop. Rows marked MEDIUM in
 * their note are the ones worth an actual look rather than a glance.
 *
 * LEFT OUT ON PURPOSE (re-check later, they will firm up):
 *   - Christmas markets (Wonderland Lisboa, Rossio): no official 2026 dates yet.
 *   - Sporting v União da Serra (Taça, 21 or 22 Nov): day not fixed.
 *   - Portugal v Denmark (14 Nov) is in Braga, not Lisbon.
 *   - Al Bano, Janeiro, David Fonseca, Danças Ocultas: one source only.
 */
import type { CalendarRow } from '@/content/calendar'

export const LISBON_2026_11: CalendarRow[] = [
  {
    /* Kick-off 20:00 per Benfica's ticket page. */
    id: 'lisbon_benfica_lechpoznan',
    genre: 'sport_national',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'match',
    on: '2026-11-05',
    name: 'Benfica v Lech Poznań at the Luz (Europa League)',
    where: { name: 'Estádio da Luz', area: 'Benfica', station: 'Colégio Militar/Luz' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.slbenfica.pt/loja/bilhetes/jogos/comprav2/pt-PT/event/ALXCR171JNYX',
    sources: [
      'https://www.slbenfica.pt/pt-pt/bilhetes',
      'https://www.uefa.com/uefaeuropaleague/clubs/50147--benfica/matches/',
    ],
    verified: false,
  },
  {
    /* No station: LAV is in Marvila (its own coordinates), not Alcântara as the October file says, and the nearest metro (Chelas?) is unchecked. No station means no drop rather than a wrong route. */
    id: 'lisbon_max_cooper_lav',
    genre: 'rock_pop',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-11-05',
    name: 'Max Cooper at LAV',
    where: { name: 'LAV — Lisboa Ao Vivo', area: 'Marvila' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.lisboaaovivo.com/',
      'https://feverup.com/m/648920/en',
    ],
    verified: false,
  },
  {
    /* Main venue only; screenings spread across several cinemas. */
    id: 'lisbon_leffest',
    genre: 'festival',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'exhibition',
    on: '2026-11-06',
    until: '2026-11-15',
    name: 'LEFFEST — the Lisbon film festival',
    where: { name: 'Cinema São Jorge', area: 'Avenida da Liberdade', station: 'Avenida' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.leffest.com/',
    sources: [
      'https://www.leffest.com/',
      'https://www.timeout.pt/lisboa/pt/filmes/leffest',
    ],
    verified: false,
  },
  {
    /* Many venues, so no `where` and no shape: on the calendar, never a drop. Dates from Visit Lisboa only; the festival site confirms the 2026 edition without dates — MEDIUM confidence. */
    id: 'lisbon_misty_fest',
    genre: 'festival',
    chapter: 'lisbon',
    kind: 'event',
    on: '2026-11-01',
    until: '2026-11-29',
    name: 'Misty Fest — a month of concerts across Lisbon',
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.misty-fest.com/',
    sources: [
      'https://www.visitlisboa.com/en/events/misty-fest-2?date=2026-11-01',
      'https://www.misty-fest.com/',
    ],
    verified: false,
  },
  {
    /* Liga round 11, 20:30. */
    id: 'lisbon_sporting_moreirense',
    genre: 'sport_national',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'match',
    on: '2026-11-07',
    name: 'Sporting v Moreirense at Alvalade',
    where: { name: 'Estádio José Alvalade', area: 'Alvalade', station: 'Campo Grande' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.abola.pt/noticias/ja-ha-data-para-o-fc-porto-benfica-os-horarios-ate-a-12a-jornada-da-liga-2026090319073200619',
      'https://www.record.pt/futebol/futebol-nacional/liga-betclic/detalhe/ja-e-conhecida-a-data-e-hora-do-fc-porto-benfica',
    ],
    verified: false,
  },
  {
    /* Opening night at the arena, conference at FIL. The venue is from third-party listings; websummit.com confirms the dates. */
    id: 'lisbon_web_summit',
    genre: 'festival',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'exhibition',
    on: '2026-11-09',
    until: '2026-11-12',
    name: 'Web Summit',
    where: { name: 'MEO Arena and FIL', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://websummit.com/',
    sources: [
      'https://websummit.com/',
      'https://hadea.ec.europa.eu/events/web-summit-2026-2026-11-09_en',
      'https://english.rvo.nl/events/web-summit-2026-lisbon',
    ],
    verified: false,
  },
  {
    /* MEDIUM: neither page prints the year. No station, as for Max Cooper. */
    id: 'lisbon_last_internationale_lav',
    genre: 'rock_pop',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-11-10',
    name: 'The Last Internationale at LAV',
    where: { name: 'LAV — Lisboa Ao Vivo', area: 'Marvila' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.lisboaaovivo.com/',
      'https://www.visitlisboa.com/en/events/the-last-internationale',
    ],
    verified: false,
  },
  {
    id: 'lisbon_luisa_sobral_tivoli',
    genre: 'rock_pop',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-11-11',
    name: 'Luísa Sobral at the Tivoli',
    where: { name: 'Teatro Tivoli BBVA', area: 'Avenida da Liberdade', station: 'Avenida' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.ticketline.pt/evento/luisa-sobral-cartas-de-desamor-105338',
    sources: [
      'https://www.teatrotivolibbva.pt/luisa-sobral-cartas-de-desamor/',
      'https://observador.pt/2026/06/05/luisa-sobral-edita-novo-album-em-outubro-que-apresenta-em-novembro-em-lisboa-e-porto/',
    ],
    verified: false,
  },
  {
    id: 'lisbon_rubel_coliseu',
    genre: 'rock_pop',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-11-13',
    name: 'Rubel at the Coliseu',
    where: { name: 'Coliseu dos Recreios', area: 'Restauradores', station: 'Restauradores' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.bol.pt/Comprar/Bilhetes/169651-rubel_beleza_rubel_violao-coliseu_de_lisboa/Sessoes',
    sources: [
      'https://coliseulisboa.com/eventos/rubel-beleza-rubel-violao/',
      'https://dnbrasil.dn.pt/entretenimento-dn-brasil/rubel-volta-a-portugal-aps-shows-esgotados-em-2025',
    ],
    verified: false,
  },
  {
    /* The smaller hall inside the arena; same entrance and station. */
    id: 'lisbon_amon_amarth_meo',
    genre: 'rock_pop',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-11-15',
    name: 'Amon Amarth at the MEO Arena (Sala Tejo)',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.blueticket.pt/Event/15718?lang=EN',
    sources: [
      'https://arena.meo.pt/en/agenda/amon-amarth_en/15718',
      'https://www.metalblade.com/us/news/amon-amarth-announce-uk-eu-2026-tour-dates-tease-new-album/',
    ],
    verified: false,
  },
  {
    id: 'lisbon_bryan_adams_meo',
    genre: 'rock_pop',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-11-20',
    until: '2026-11-21',
    name: 'Bryan Adams at the MEO Arena',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.blueticket.pt/Event/15883?lang=EN',
    sources: [
      'https://arena.meo.pt/en/agenda/bryan-adams-roll-with-the-punches_en/15883',
      'https://www.forbespt.com/?p=181954',
    ],
    verified: false,
  },
  {
    id: 'lisbon_em_casa_damalia_coliseu',
    genre: 'classical_trad',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-11-21',
    name: 'Em Casa d\'Amália — fado at the Coliseu',
    where: { name: 'Coliseu dos Recreios', area: 'Restauradores', station: 'Restauradores' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.bol.pt/Comprar/Bilhetes/167640-em_casa_d_amalia_o_concerto_ao_vivo-coliseu_de_lisboa/Sessoes',
    sources: [
      'https://coliseulisboa.com/eventos/em-casa-damalia-o-concerto-ao-vivo/',
      'https://echoboomer.pt/em-casa-d-amalia-o-concerto-ao-vivo-novas-datas-coliseus/',
    ],
    verified: false,
  },
  {
    /* Date from UEFA; kick-off (20:00) only from unofficial sites. */
    id: 'lisbon_sporting_manutd',
    genre: 'sport_national',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'match',
    on: '2026-11-25',
    name: 'Sporting v Manchester United at Alvalade (Champions League)',
    where: { name: 'Estádio José Alvalade', area: 'Alvalade', station: 'Campo Grande' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.uefa.com/uefachampionsleague/clubs/50149--sporting-cp/matches/',
      'https://www.record.pt/futebol/futebol-nacional/liga-betclic/sporting/detalhe/sporting-define-criterios-para-os-bilhetes-da-champions-venda-comeca-quarta-feira',
    ],
    verified: false,
  },
  {
    /* Gulbenkian pages carry "Cancelado/Esgotado" labels on every event, almost certainly template text — check the page before approving. */
    id: 'lisbon_apollos_fire_gulbenkian',
    genre: 'classical_trad',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-11-26',
    name: 'Apollo\'s Fire with Jeanine De Bique at the Gulbenkian',
    where: { name: 'Fundação Calouste Gulbenkian', area: 'Avenidas Novas', station: 'São Sebastião' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://gulbenkian.pt/musica/agenda/jeanine-de-bique-apollos-fire/',
    sources: [
      'https://gulbenkian.pt/musica/agenda/jeanine-de-bique-apollos-fire/',
      'https://apollosfire.org/europe2026/',
    ],
    verified: false,
  },
  {
    id: 'lisbon_hmb_tim_tivoli',
    genre: 'rock_pop',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-11-26',
    name: 'HMB and Tim at the Tivoli',
    where: { name: 'Teatro Tivoli BBVA', area: 'Avenida da Liberdade', station: 'Avenida' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.ticketline.pt/evento/e-agora-um-concerto-terapia-c-hmb-e-tim-103892',
    sources: [
      'https://www.teatrotivolibbva.pt/hmb-e-tim-e-agora-um-concerto-terapia/',
      'https://rfm.pt/atualidade/22720/e-agora-hmb-com-tim-ao-vivo-com-a-rfm',
    ],
    verified: false,
  },
  {
    id: 'lisbon_tony_carreira_meo',
    genre: 'rock_pop',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'concert',
    on: '2026-11-28',
    name: 'Tony Carreira at the MEO Arena',
    where: { name: 'MEO Arena', area: 'Parque das Nações', station: 'Oriente' },
    purposes: ['visiting', 'staying', 'moving'],
    tickets: 'https://www.blueticket.pt/Event/15781?lang=EN',
    sources: [
      'https://arena.meo.pt/en/agenda/tony-carreira_en/15781',
      'https://www.noticiasaominuto.com/fama/2946582/a-cada-grande-sala-esgotada-dou-por-mim-a-questionar-se-sera-a-ultima',
    ],
    verified: false,
  },
  {
    /* Liga round 12, Monday 20:15. One resale site says the 29th; the league's published round says the 30th. */
    id: 'lisbon_benfica_famalicao',
    genre: 'sport_national',
    chapter: 'lisbon',
    kind: 'event',
    shape: 'match',
    on: '2026-11-30',
    name: 'Benfica v Famalicão at the Luz',
    where: { name: 'Estádio da Luz', area: 'Benfica', station: 'Colégio Militar/Luz' },
    purposes: ['visiting', 'staying', 'moving'],
    sources: [
      'https://www.abola.pt/noticias/ja-ha-data-para-o-fc-porto-benfica-os-horarios-ate-a-12a-jornada-da-liga-2026090319073200619',
      'https://www.record.pt/futebol/futebol-nacional/liga-betclic/detalhe/ja-e-conhecida-a-data-e-hora-do-fc-porto-benfica',
    ],
    verified: false,
  },
  {
    /* The first `moving`-side row the calendar has had: only owners paying IMI in instalments (bills over €100). A visitor never sees it. */
    id: 'lisbon_imi_last_instalment',
    chapter: 'lisbon',
    kind: 'deadline',
    on: '2026-11-30',
    name: 'Last IMI property-tax instalment due',
    purposes: ['staying', 'moving'],
    sources: [
      'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/calendario_fiscal/Pages/Quadro_res_Pag_2026.aspx',
      'https://www.deco.proteste.pt/dinheiro/impostos/noticias/prazos-imi-2026',
      'https://www.idealista.pt/news/node/73971',
    ],
    verified: false,
  },
]
