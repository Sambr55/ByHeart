import type { Situation } from '@/content/situations'
/* content/legend.ts's AUTHORED_NAME, copied: legend.ts reaches the room list through roots.ts. */
const AUTHORED_NAME = 'Ana'
import { say } from '@/content/numbers'

/**
 * BASICS — the first level of every path (Sam, 2026-11-03: "basics first, 1–20, Hello,
 * Goodbye and thank you, then arrive etc. … it should all be one flow").
 *
 * They are rooms like every other, so they are tiles on the Panel and stops on the Road,
 * played in the same room screen, laid by the same `finished_cards`. With the save (which
 * stays in content/blocks/lisbon-save.ts) and "Who you are", which is the door to the
 * Legend — Sam: "put build your legend near the top of the flow".
 *
 * Free on every path (lib/entitlements.ts). Portuguese is European, and every line here
 * awaits native review like the rest of the new rooms.
 */
const ALL = ['visiting', 'staying', 'moving'] as const

const run = (a: number, b: number) =>
  Array.from({ length: b - a + 1 }, (_, i) => say(a + i)).join(', ')

export const LISBON_BASICS: Situation[] = [
  {
    id: 'lisbon_ola',
    chapter: 'lisbon',
    kind: 'moment',
    purposes: [...ALL],
    title: 'Hello, goodbye, thank you',
    why: 'The words you will say a hundred times a day. Walking into a shop without a bom dia reads as brusque here; walking out without an obrigado reads worse.',
    lines: [
      { pt: 'Olá.', en: 'Hello.', when: 'To anybody, any time. Friendly, never rude.' },
      { pt: 'Bom dia.', en: 'Good morning.', when: 'Until lunch — and said walking in, before you ask for anything.' },
      { pt: 'Boa tarde.', en: 'Good afternoon.', when: 'From lunch until it gets dark. After that, boa noite.' },
      { pt: 'Obrigado.', f: 'Obrigada.', en: 'Thank you.', when: 'A woman says obrigada: it agrees with the person saying it, not the one being thanked.' },
      { pt: 'Até logo.', en: 'See you later.', when: 'Leaving a shop or a café. Adeus is for a real goodbye.' },
    ],
    release: { ask: 'Good afternoon — and, on the way out, thank you.', answer: 'Boa tarde. Obrigado.', answer_f: 'Boa tarde. Obrigada.' },
    image: {
      src: '/rooms/lisbon_ola.jpg',
      alt: 'Somebody walking into a small café between blue-and-white tiled walls, the owner raising a hand from behind the counter.',
      rights_status: 'generated',
    },
    rung: 1,
    qa_status: 'pending-native-review',
  },
  {
    id: 'lisbon_numeros',
    chapter: 'lisbon',
    kind: 'moment',
    purposes: [...ALL],
    title: 'Count to twenty',
    why: 'Prices, platforms, times, tables, the number on the tram. Twenty words, and every till in the city stops being a guess.',
    lines: [
      { pt: run(1, 5), en: 'One to five', when: 'Dois is two whatever it counts; duas when it counts something feminine — duas bicas.' },
      { pt: run(6, 10), en: 'Six to ten', when: 'Seis and sete are the pair people mix up. Seis has the sh at the end.' },
      { pt: run(11, 15), en: 'Eleven to fifteen', when: 'Words of their own, like eleven and twelve in English.' },
      { pt: run(16, 20), en: 'Sixteen to twenty', when: 'Ten-and-six, ten-and-seven, run together: dezasseis, dezassete. Then vinte.' },
    ],
    release: { ask: 'It’s sixteen euros.', answer: 'São dezasseis euros.' },
    image: {
      src: '/rooms/lisbon_numeros.jpg',
      alt: 'Twenty custard tarts in neat rows on a bakery tray.',
      rights_status: 'generated',
    },
    rung: 1,
    qa_status: 'pending-native-review',
  },
  {
    id: 'lisbon_legend',
    chapter: 'lisbon',
    kind: 'person',
    purposes: [...ALL],
    title: 'Who you are',
    why: 'The first thing a stranger asks, and the start of your Legend: your name, where you are from and why you are here, said in Portuguese without reading it.',
    lines: [
      { pt: 'Como te chamas?', en: 'What’s your name?', when: 'What you will be asked. Como se chama? if they are being formal.' },
      { pt: 'Chamo-me ' + AUTHORED_NAME + '.', en: 'My name is ' + AUTHORED_NAME + '.', when: 'Then your own name. Your Legend writes it in for you.' },
      { pt: 'Sou de Londres.', en: 'I’m from London.', when: 'Sou de and the place. Your Legend swaps in yours.' },
      { pt: 'Estou cá de férias.', en: 'I’m here on holiday.', when: 'Or estou cá a trabalhar, for work — the Legend asks why you are here.' },
    ],
    release: { ask: 'My name is ' + AUTHORED_NAME + '. I’m from London.', answer: 'Chamo-me ' + AUTHORED_NAME + '. Sou de Londres.' },
    image: {
      src: '/rooms/lisbon_legend.jpg',
      alt: 'Two people shaking hands across a café table, two espressos between them.',
      rights_status: 'generated',
    },
    rung: 1,
    qa_status: 'pending-native-review',
  },
]
