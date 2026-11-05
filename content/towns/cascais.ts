/**
 * CASCAIS (2026-11-05). Drafted from research, every gem `verified: false` until somebody
 * who knows the town has checked it. The fishing town under the resort: the market, the
 * fishermen's beach, the fishermen's own canteen, and the seafront path to São João.
 * Written in our own words; the sources are a reference for what exists, never for text.
 */
import type { Bairro, Gem } from '@/content/gems'
import type { Walk } from '@/content/walks'

export const CASCAIS_BAIRROS: Bairro[] = [
  { id: 'cascais-vila', chapter: 'cascais', name: 'Vila & Praia dos Pescadores', feel: 'The old fishing town under the resort: the market, the boats pulled up on the sand, and the fishermen’s own canteen.', centre: [38.6985, -9.4205] },
  { id: 'cascais-estoril', chapter: 'cascais', name: 'Estoril & São João', feel: 'The seafront path east of Cascais, where locals walk, swim off small beaches and stop for cake on the way.', centre: [38.7015, -9.3905] },
  { id: 'cascais-guincho', chapter: 'cascais', name: 'Guincho', feel: 'The wild Atlantic end of Cascais: wind, dunes, and the surf schools where locals learn.', centre: [38.7315, -9.4715] },
]

export const CASCAIS_GEMS: Gem[] = [
  // ── Vila & Praia dos Pescadores ──────────────────────────────────────────────
  {
    id: 'cascais-mercado-da-vila', bairro: 'cascais-vila', name: 'Mercado da Vila', kind: 'market',
    lat: 38.70171, lng: -9.42093, address: 'Rua Padre Moisés da Silva 29',
    why: 'The town’s covered market, where Cascais families still buy fish, fruit and cheese — and on Saturday mornings the saloio farmers from the inland villages set out their vegetables and flowers.',
    line: { pt: 'Bom dia, queria meio quilo de carapaus, se faz favor.', en: 'Good morning, I’d like half a kilo of horse mackerel, please.' },
    meet: 'The fishmongers and the farmers at the saloio stalls',
    tip: 'Saturday morning is the day. Wednesday morning is the big old-style fair of clothes and crockery instead.',
    room: 'lisbon_mercado',
    sources: ['https://www.timeout.com/cascais/things-to-do/mercado-da-vila', 'https://www.cascais.pt/sites/default/files/anexos/gerais/regulamentodosmercadosmunicipaisdoconcelhodecascai.pdf', 'https://www.timeout.com/cascais/shopping/the-best-markets-in-cascais'],
    unsure: 'Fresh-stall hours conflict between sources; newest listing found is 2021. Whether the fish stalls trade every weekday not confirmed.',
    verified: false,
  },
  {
    id: 'cascais-cantinho-da-luisa', bairro: 'cascais-vila', name: 'Cantinho da Luísa', kind: 'cafe',
    lat: 38.70165, lng: -9.42085, address: 'Mercado da Vila, Rua Padre Moisés da Silva 29',
    why: 'A café and deli counter inside the market — coffee, toast and pastries for the stallholders and shoppers, plus cheeses and cured meats from around the country.',
    line: { pt: 'Um galão e uma torrada, por favor.', en: 'A milky coffee and a slice of toast, please.' },
    meet: 'The people behind the counter, and the market regulars at the next stool',
    tip: 'Have breakfast here after the shopping, then ask them which cheese to take home.',
    room: 'lisbon_cafe',
    sources: ['https://www.timeout.com/cascais/restaurants/cantinho-da-luisa', 'https://www.timeout.com/cascais/restaurants/attention-sweet-tooth-the-best-pastry-shops-in-cascais', 'https://wanderlog.com/place/details/10218059/cantinho-da-luísa'],
    unsure: 'Exact stall position and hours not found; coordinates are the market. Has a second branch in Estoril; reviews mixed.',
    verified: false,
  },
  {
    id: 'cascais-praia-dos-pescadores', bairro: 'cascais-vila', name: 'Praia dos Pescadores & the lota', kind: 'other',
    lat: 38.69669, lng: -9.4198, address: 'Praia da Ribeira (lota: Rua das Flores)',
    why: 'The small beach in the bay where Cascais has fished since Roman times. The boats still come up on the sand, men mend nets beside them, and the catch goes to the lota on the corner.',
    line: { pt: 'Bom dia! Os barcos já chegaram?', en: 'Good morning! Have the boats come in yet?' },
    meet: 'The fishermen on the sand, mending nets or hauling the boats',
    tip: 'Go early, and ask before you take a photo of anyone. The lota is a working auction, not a shop.',
    room: 'lisbon_ola',
    sources: ['https://www.cascais.pt/sites/default/files/anexos/gerais/new/pesca_e_pescadores.pdf', 'https://www.timeout.com/cascais/attractions/praia-da-ribeira-de-cascais', 'https://360.cascais.pt/en/node/4334', 'https://echoboomer.pt/lota-de-cascais-parcialmente-requalificada/'],
    unsure: 'Auction times and whether the public can watch not confirmed; the lota building is due for partial renovation (date unclear). Fleet is much smaller than it was.',
    verified: false,
  },
  {
    id: 'cascais-cantinho-da-belinha', bairro: 'cascais-vila', name: 'O Cantinho da Belinha (Casa dos Pescadores)', kind: 'tasca',
    lat: 38.69599, lng: -9.42258, address: 'Avenida Vasco da Gama 133',
    why: 'A plain restaurant in the fishermen’s own house, cooking fish straight off the boats — sardines in summer, whatever came in the rest of the year — with a sheltered courtyard for windy nights.',
    line: { pt: 'Que peixe é que chegou hoje?', en: 'What fish came in today?' },
    meet: 'The staff taking orders, and the fishermen’s families at the tables',
    tip: 'Book, it fills with locals. Said to open Tuesday to Saturday, lunch and dinner.',
    room: 'lisbon_tasca',
    sources: ['https://www.timeout.com/cascais/restaurants/o-cantinho-da-belinha', 'https://lifecooler.com/artigo/comer/restaurante-o-cantinho-da-belinha-casa-dos-pescadores/402466', 'https://wanderlog.com/place/details/1264410'],
    unsure: 'Newest dated source is 2021; no 2025–26 confirmation it is open; hours from Time Out only.',
    verified: false,
  },
  {
    id: 'cascais-o-pereira', bairro: 'cascais-vila', name: 'O Pereira', kind: 'tasca',
    lat: 38.70063, lng: -9.42229, address: 'Travessa da Bela Vista 42',
    why: 'An old Cascais house two streets from the market, reopened by a new team after its owner Senhor Manuel died — whitewashed now, but with the press clippings still on the wall and the arrozes and caldeirada still on the menu.',
    line: { pt: 'A caldeirada dá para duas pessoas?', en: 'Is the fish stew enough for two people?' },
    meet: 'The waiters, and the regulars who came here in Senhor Manuel’s day',
    tip: 'Ask for the sugestões do dia before you open the menu. Said to close Thursdays.',
    room: 'lisbon_mesa',
    sources: ['https://www.timeout.pt/lisboa/pt/noticias/o-pereira-ja-nao-e-o-mesmo-mas-a-alma-esta-la-080221', 'https://www.timeout.com/cascais/restaurants/o-pereira', 'https://cardapio.menu/restaurants/cascais/o-pereira'],
    unsure: 'Newest dated source is 2021; still busy on review sites but no dated 2025–26 article. Hours conflict.',
    verified: false,
  },
  {
    id: 'cascais-jazz-club', bairro: 'cascais-vila', name: 'Cascais Jazz Club', kind: 'venue',
    lat: 38.69819, lng: -9.41968, address: 'Largo Cidade de Vitória 36',
    why: 'A small non-profit club by the fishermen’s beach, run by a cultural association since 2011 — jazz, blues and bossa nova most nights, with singer Maria Viana at the heart of it.',
    line: { pt: 'A que horas começa a música hoje?', en: 'What time does the music start tonight?' },
    meet: 'Maria Viana and the association’s people at the door, the musicians between sets',
    tip: 'Wednesday to Sunday, from about half past eight. Arrive early for a seat near the band.',
    room: 'lisbon_bilhetes',
    sources: ['https://www.timeout.com/cascais/news/from-a-love-story-the-cascais-jazz-club-was-born-030725', 'https://www.timeout.com/cascais/music/cascais-jazz-club', 'https://www.estorilportugal.com/?p=6440'],
    unsure: 'Opening days conflict (Wed–Sun vs Thu–Sun, 2025 article says Thu–Sun); entry price unknown; coordinates are the largo.',
    verified: false,
  },

  // ── Estoril & São João ───────────────────────────────────────────────────────
  {
    id: 'cascais-pastelaria-garrett', bairro: 'cascais-estoril', name: 'Pastelaria Garrett', kind: 'bakery',
    lat: 38.70387, lng: -9.39615, address: 'Avenida de Nice 54, Estoril',
    why: 'A family pastry shop on the same avenue since 1934, where Estoril’s older residents take their morning coffee, and the whole coast comes for bolo-rei at Christmas.',
    line: { pt: 'Uma bica e uma queijada, por favor.', en: 'An espresso and a little cheese tart, please.' },
    meet: 'The staff at the long counter, and the regulars at their usual tables',
    tip: 'Stand at the counter like the regulars. Said to close on Tuesdays.',
    room: 'lisbon_padaria',
    sources: ['https://www.timeout.com/cascais/restaurants/pastelaria-garrett', 'https://www.timeout.pt/time-out-market-lisboa/pt/noticias/a-garrett-do-estoril-chegou-ao-time-out-market-mesmo-a-tempo-do-natal-121825-1', 'https://www.timeout.com/cascais/restaurants/attention-sweet-tooth-the-best-pastry-shops-in-cascais'],
    unsure: 'Now also has a counter at Time Out Market Lisboa (Dec 2025); the Estoril shop is the original. Closing day from Time Out only.',
    verified: false,
  },
  {
    id: 'cascais-praia-da-poca', bairro: 'cascais-estoril', name: 'Praia da Poça', kind: 'other',
    lat: 38.70174, lng: -9.39145, address: 'Paredão, São João do Estoril',
    why: 'A small town beach off the seafront path, five minutes from Estoril station — swimmers in summer, local surfers on the reef when the autumn and winter swells come in.',
    line: { pt: 'Desculpe, para a Praia da Poça é por aqui?', en: 'Excuse me, is this the way to Praia da Poça?' },
    meet: 'Walkers and runners on the paredão, the surfers checking the waves',
    tip: 'Come by the Cascais line and get off at Estoril. In winter, watch the surfers from the wall.',
    room: 'lisbon_praia',
    sources: ['https://www.timeout.com/cascais/things-to-do/the-best-things-to-do-in-sao-joao-do-estoril', 'https://cdn.whereismybeach.com/en/beach/praia-de-sao-joao-do-estoril', 'https://www.surfmarket.org/es/olas/europa/portugal/praia-da-rocha/previous-listing'],
    unsure: 'Beach facilities and the summer beach bar not confirmed for 2025–26.',
    verified: false,
  },
  {
    id: 'cascais-praia-da-azarujinha', bairro: 'cascais-estoril', name: 'Praia da Azarujinha', kind: 'miradouro',
    lat: 38.70059, lng: -9.38925, address: 'Paredão, São João do Estoril',
    why: 'A tiny cove under the cliff, reached by stairs from the seafront path and sheltered by a rock — the top of the stairs is one of the best views back along the bay to Cascais.',
    line: { pt: 'Pode tirar-nos uma fotografia, se faz favor?', en: 'Could you take a photo of us, please?' },
    meet: 'Neighbours who swim here year-round, and the people at the beach bar',
    tip: 'Take the photo from the top of the stairs, then go down — the water is calmer than at the bigger beaches.',
    room: 'lisbon_foto',
    sources: ['https://visitportugal.com/en/node/141364', 'https://www.cascais.pt/galeria-de-imagens/praia-da-azarujinha?page=1', 'https://www.timeout.com/cascais/things-to-do/the-best-things-to-do-in-sao-joao-do-estoril'],
    unsure: 'Beach bar renovated in 2025 (Time Out); off-season hours unknown.',
    verified: false,
  },
  {
    id: 'cascais-alcatruz', bairro: 'cascais-estoril', name: 'Alcatruz', kind: 'cafe',
    lat: 38.69886, lng: -9.385, address: 'Rua Vasco da Gama 2, São João do Estoril',
    why: 'A half-hidden café on a terrace above Praia do Forte, off the seafront path — boards of cheese and sausage, salads and a glass of wine with the whole bay in front of you.',
    line: { pt: 'Pode trazer a conta, se faz favor?', en: 'Could you bring the bill, please?' },
    meet: 'The staff on the terrace, and São João locals ending the day',
    tip: 'Come for the last hour of light. Said to close at 20:00.',
    room: 'lisbon_conta',
    sources: ['https://www.timeout.com/cascais/restaurants/alcatruz', 'https://www.timeout.com/cascais/things-to-do/the-best-things-to-do-in-sao-joao-do-estoril', 'https://www.timeout.com/lisbon/restaurants/alcatruz'],
    unsure: 'Hours from a 2021 listing; winter opening not confirmed.',
    verified: false,
  },

  // ── Guincho ──────────────────────────────────────────────────────────────────
  {
    id: 'cascais-moana-surf-school', bairro: 'cascais-guincho', name: 'Moana Surf School', kind: 'workshop',
    lat: 38.7305, lng: -9.4725, address: 'Estrada do Abano, Praia do Guincho',
    why: 'A surf school based on Guincho beach, teaching beginners in small groups and renting boards and wetsuits — lessons in Portuguese if you ask for them.',
    line: { pt: 'É a minha primeira vez. Há aulas para principiantes amanhã?', en: 'It’s my first time. Are there beginner lessons tomorrow?' },
    meet: 'The instructors, and the others in your group',
    tip: 'Ask for the lesson in Portuguese — the vocabulary is small and repeated: rema, levanta, agora! Lessons move to Carcavelos when Guincho is too wild.',
    room: 'lisbon_aulas',
    sources: ['https://www.moanasurfschool.com/', 'https://www.timeout.com/lisbon/sport-and-fitness/moana-surf-school', 'https://www.checkyeti.com/en/p/1477/moana-surf-school'],
    unsure: 'Coordinates approximate (not in OSM). Caters to visitors too; prices (from €40 group) from its own site. Guincho is a bus or bike ride from the Vila, not a walk.',
    verified: false,
  },
]

export const CASCAIS_WALKS: Walk[] = [
  {
    id: 'cascais-vila-saturday',
    bairro: 'cascais-vila',
    title: 'A Saturday in the old fishing town',
    pt: 'Um sábado na vila dos pescadores',
    when: 'Saturday, from early morning into the night',
    intro: 'The market when the farmers are in, breakfast at its counter, the boats on the sand, lunch in the fishermen’s own house, and jazz by the bay at night.',
    stops: [
      { gem: 'cascais-mercado-da-vila', do: 'Start early at the market. Ask for your fish by weight.' },
      { gem: 'cascais-cantinho-da-luisa', do: 'Breakfast at the market counter. Order a galão and a torrada.' },
      { gem: 'cascais-praia-dos-pescadores', do: 'Walk down to the boats and say good morning to the men mending nets.' },
      { gem: 'cascais-cantinho-da-belinha', do: 'Lunch in the Casa dos Pescadores. Ask what came in today.' },
      { gem: 'cascais-jazz-club', do: 'After dark, back by the beach for the music. Ask when it starts.' },
    ],
    finish: 'A whole day in Cascais, and none of it in English.',
  },
  {
    id: 'cascais-estoril-paredao',
    bairro: 'cascais-estoril',
    title: 'Along the seafront to São João',
    pt: 'Pelo paredão até São João',
    when: 'Any day but Tuesday, late morning to sunset',
    intro: 'Coffee and a tart in a 1930s pastry shop, two small beaches off the seafront path, and the last of the light over the bay.',
    stops: [
      { gem: 'cascais-pastelaria-garrett', do: 'Start at the counter in Estoril. A bica and a queijada, standing up.' },
      { gem: 'cascais-praia-da-poca', do: 'Down to the seafront path. Ask the way to the beach, even if you know it.' },
      { gem: 'cascais-praia-da-azarujinha', do: 'At the top of the stairs, ask somebody to take your photo.' },
      { gem: 'cascais-alcatruz', do: 'End on the terrace above the beach, and ask for the bill yourself.' },
    ],
    finish: 'Three kilometres of sea, and every stop in Portuguese.',
  },
]
