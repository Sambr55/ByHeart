import type { SituationImage } from '@/content/situations'

/**
 * A PHOTOGRAPH FOR EVERY ROOM ON THE PATH.
 *
 * Sam, 2026-11-02: "generate the images" — the Road showed most rooms as an icon because
 * 40 of the 46 rooms on the three Lisbon paths had no picture. These are generated
 * documentary stills in one look (natural light, people from behind or out of focus, no
 * text), each written from the room's own `why`. A room that sets its own `image` keeps
 * it; these only fill the gaps (see SITUATIONS in content/situations.ts).
 */
export const ROOM_IMAGES: Record<string, SituationImage> = {
  lisbon_aeroporto: { src: '/rooms/lisbon_aeroporto.jpg', alt: 'The arrivals hall at the airport, a traveller with a suitcase walking towards the ticket machines.', rights_status: 'generated' as const },
  lisbon_arranjar: { src: '/rooms/lisbon_arranjar.jpg', alt: 'A small repair shop: a cobbler at his bench under shelves of tools, a customer waiting by the door.', rights_status: 'generated' as const },
  lisbon_aulas: { src: '/rooms/lisbon_aulas.jpg', alt: 'A classroom in an old building, two people at a table signing up, plants in the window.', rights_status: 'generated' as const },
  lisbon_banco: { src: '/rooms/lisbon_banco.jpg', alt: 'A bank desk with a lamp and two empty chairs, someone at a screen behind it.', rights_status: 'generated' as const },
  lisbon_bilhetes: { src: '/rooms/lisbon_bilhetes.jpg', alt: 'A queue snaking between ropes towards a monument door.', rights_status: 'generated' as const },
  lisbon_cabeleireiro: { src: '/rooms/lisbon_cabeleireiro.jpg', alt: 'A barber at work in a small salon, chairs and mirrors along the wall.', rights_status: 'generated' as const },
  lisbon_carro: { src: '/rooms/lisbon_carro.jpg', alt: 'Two people looking over a parked car on a cobbled street by the river.', rights_status: 'generated' as const },
  lisbon_cartao_sim: { src: '/rooms/lisbon_cartao_sim.jpg', alt: 'A phone shop counter, a customer from behind talking to the assistant.', rights_status: 'generated' as const },
  lisbon_casa_de_banho: { src: '/rooms/lisbon_casa_de_banho.jpg', alt: 'A narrow street of cafés, tables on the pavement, someone walking past.', rights_status: 'generated' as const },
  lisbon_centro_saude: { src: '/rooms/lisbon_centro_saude.jpg', alt: 'A health centre waiting room: a reception desk and rows of empty chairs.', rights_status: 'generated' as const },
  lisbon_checkin: { src: '/rooms/lisbon_checkin.jpg', alt: 'A guesthouse reception with a suitcase by the desk and a lamp lit.', rights_status: 'generated' as const },
  lisbon_comboio: { src: '/rooms/lisbon_comboio.jpg', alt: 'A hand validating a ticket at a yellow machine on a busy station platform.', rights_status: 'generated' as const },
  lisbon_conta: { src: '/rooms/lisbon_conta.jpg', alt: 'A restaurant table after the meal, bread and olives, a plate pushed away.', rights_status: 'generated' as const },
  lisbon_contrato: { src: '/rooms/lisbon_contrato.jpg', alt: 'Two people at a table in a bright room, papers between them.', rights_status: 'generated' as const },
  lisbon_costume: { src: '/rooms/lisbon_costume.jpg', alt: 'A café table on a pavement corner, one coffee waiting, a tram passing below.', rights_status: 'generated' as const },
  lisbon_emergencia: { src: '/rooms/lisbon_emergencia.jpg', alt: 'Someone kneeling beside a person sitting on a step, others hurrying over.', rights_status: 'generated' as const },
  lisbon_encomenda: { src: '/rooms/lisbon_encomenda.jpg', alt: 'Someone at a shop doorway asking after a parcel, plants by the step.', rights_status: 'generated' as const },
  lisbon_escola: { src: '/rooms/lisbon_escola.jpg', alt: 'A school corridor, a parent from behind watching children go in.', rights_status: 'generated' as const },
  lisbon_fado: { src: '/rooms/lisbon_fado.jpg', alt: 'A dim fado house, a Portuguese guitar against the tiled wall, the room listening.', rights_status: 'generated' as const },
  lisbon_foto: { src: '/rooms/lisbon_foto.jpg', alt: 'Two visitors at a viewpoint, a church dome beyond them.', rights_status: 'generated' as const },
  lisbon_ginasio: { src: '/rooms/lisbon_ginasio.jpg', alt: 'A gym by big windows, a form and pen on the counter in the foreground.', rights_status: 'generated' as const },
  lisbon_lavandaria: { src: '/rooms/lisbon_lavandaria.jpg', alt: 'A row of washing machines in a tiled launderette, a laundry basket on a bench.', rights_status: 'generated' as const },
  lisbon_loja_cidadao: { src: '/rooms/lisbon_loja_cidadao.jpg', alt: 'A citizen-services hall: a number screen and people waiting on rows of seats.', rights_status: 'generated' as const },
  lisbon_luz_agua: { src: '/rooms/lisbon_luz_agua.jpg', alt: 'An empty flat with an unlit bulb, someone on the phone beside an open electricity meter.', rights_status: 'generated' as const },
  lisbon_mercado: { src: '/rooms/lisbon_mercado.jpg', alt: 'A market stall of dried fruit and nuts under an old hanging scale.', rights_status: 'generated' as const },
  lisbon_mesa: { src: '/rooms/lisbon_mesa.jpg', alt: 'A table for two laid outside a restaurant in a narrow lane.', rights_status: 'generated' as const },
  lisbon_multibanco: { src: '/rooms/lisbon_multibanco.jpg', alt: 'A shop till and card machine, a bowl of oranges on the counter.', rights_status: 'generated' as const },
  lisbon_navegante: { src: '/rooms/lisbon_navegante.jpg', alt: 'Blue ticket machines in a metro station hall.', rights_status: 'generated' as const },
  lisbon_nif: { src: '/rooms/lisbon_nif.jpg', alt: 'Someone walking towards a government office door on a city street.', rights_status: 'generated' as const },
  lisbon_perdido: { src: '/rooms/lisbon_perdido.jpg', alt: 'Two people looking up at a castle gateway, unsure which way.', rights_status: 'generated' as const },
  lisbon_praia: { src: '/rooms/lisbon_praia.jpg', alt: 'A train at a seaside platform, people with beach bags getting off.', rights_status: 'generated' as const },
  lisbon_roubo: { src: '/rooms/lisbon_roubo.jpg', alt: 'A street with a tram passing, someone from behind checking a bag.', rights_status: 'generated' as const },
  lisbon_sem: { src: '/rooms/lisbon_sem.jpg', alt: 'At a restaurant table, a hand gesturing at a plate as the waiter leans in to listen.', rights_status: 'generated' as const },
  lisbon_supermercado: { src: '/rooms/lisbon_supermercado.jpg', alt: 'A supermarket checkout with vegetables on the belt.', rights_status: 'generated' as const },
  lisbon_talho: { src: '/rooms/lisbon_talho.jpg', alt: "A butcher's counter, a customer from behind waiting their turn.", rights_status: 'generated' as const },
  lisbon_tasca: { src: '/rooms/lisbon_tasca.jpg', alt: 'A small tasca with paper tablecloths, a man walking towards the kitchen.', rights_status: 'generated' as const },
  lisbon_taxi: { src: '/rooms/lisbon_taxi.jpg', alt: 'Someone getting into a taxi on a street of tall tiled buildings.', rights_status: 'generated' as const },
  lisbon_telemovel: { src: '/rooms/lisbon_telemovel.jpg', alt: 'A small shop counter, a customer from behind facing the shopkeeper.', rights_status: 'generated' as const },
  lisbon_visita: { src: '/rooms/lisbon_visita.jpg', alt: 'Two people walking into an empty flat with tall windows.', rights_status: 'generated' as const },
  lisbon_vizinho: { src: '/rooms/lisbon_vizinho.jpg', alt: 'Steep stone steps between houses, a neighbour climbing with a cane.', rights_status: 'generated' as const },
}
