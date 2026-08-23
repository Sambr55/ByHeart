import type { BlockId, CulturalMoment, Example, LearningTarget } from './types'

/**
 * The curriculum. Spec §4 session inventory.
 * Nothing here references Top Gun — that separation is the whole point of §12.
 */
export const TARGETS: Record<BlockId, LearningTarget> = {
  comigo: {
    target_id: 'pt_comigo_001',
    locale: 'pt-PT',
    block: 'comigo',
    label: 'COMIGO',
    gloss: 'with me',
    type: 'chunk',
    frequency_priority: 1,
    grammar_note_internal:
      'Fused pronoun (com + mim). Taught as one object; the verb in front is the variable.',
    generativity: ['Fala comigo', 'Vem comigo', 'Fica comigo'],
  },
  podes: {
    target_id: 'pt_podes_002',
    locale: 'pt-PT',
    block: 'podes…',
    label: 'PODES…',
    gloss: 'you can / can you…',
    type: 'hinge',
    frequency_priority: 2,
    grammar_note_internal:
      '2sg of poder. Fronting it makes a request; no interrogative inversion needed in speech.',
    generativity: ['Podes vir comigo?', 'Podes repetir?'],
  },
  preciso_de: {
    target_id: 'pt_preciso_de_003',
    locale: 'pt-PT',
    block: 'preciso de…',
    label: 'PRECISO DE…',
    gloss: 'I need…',
    type: 'chunk',
    frequency_priority: 3,
    grammar_note_internal:
      'precisar governs de. Taught as an inseparable block; the preposition lesson comes later.',
    generativity: ['Preciso de água', 'Preciso de um táxi'],
  },
  nao_consigo: {
    target_id: 'pt_nao_consigo_004',
    locale: 'pt-PT',
    block: 'não consigo…',
    label: 'NÃO CONSIGO…',
    gloss: 'I can’t / I can’t manage to…',
    type: 'chunk',
    frequency_priority: 4,
    grammar_note_internal:
      'conseguir = manage/succeed, distinct from poder. Takes a bare infinitive.',
    generativity: ['Não consigo perceber', 'Não consigo dormir'],
  },
  perdi: {
    target_id: 'pt_perdi_005',
    locale: 'pt-PT',
    block: 'perdi…',
    label: 'PERDI…',
    gloss: 'I lost…',
    type: 'chunk',
    frequency_priority: 5,
    grammar_note_internal:
      '1sg pretérito perfeito of perder. One form only — no tense system taught in this session.',
    generativity: ['Perdi as chaves', 'Perdi o bilhete'],
  },
  nao_vou: {
    target_id: 'pt_nao_vou_006',
    locale: 'pt-PT',
    block: 'não vou…',
    label: 'NÃO VOU…',
    gloss: 'I’m not going to…',
    type: 'pattern',
    frequency_priority: 6,
    grammar_note_internal:
      'ir + infinitive as near future, negated. Productive with any infinitive.',
    generativity: ['Não vou esperar', 'Não vou beber'],
  },
  o_que_estas_a: {
    target_id: 'pt_o_que_estas_a_007',
    locale: 'pt-PT',
    block: 'o que estás a…?',
    label: 'O QUE ESTÁS A…?',
    gloss: 'what are you …ing?',
    type: 'pattern',
    frequency_priority: 7,
    grammar_note_internal:
      'European Portuguese progressive: estar a + infinitive. The "a" is the pt-PT tell — never the gerund.',
    generativity: ['O que estás a fazer?', 'O que estás a beber?'],
  },
  quando: {
    target_id: 'pt_quando_008',
    locale: 'pt-PT',
    block: 'quando',
    label: 'QUANDO',
    gloss: 'when',
    type: 'hinge',
    frequency_priority: 8,
    grammar_note_internal:
      'Question word. Direct questions need no inversion in speech: Quando vais?',
    generativity: ['Quando vais?', 'Quando vamos?'],
  },
  claro: {
    target_id: 'pt_claro_009',
    locale: 'pt-PT',
    block: 'claro',
    label: 'CLARO',
    gloss: 'of course',
    type: 'booster',
    frequency_priority: 9,
    grammar_note_internal: 'Discourse marker. Also "claro que sim" for emphasis.',
    generativity: ['Claro.'],
  },
  porque_nao: {
    target_id: 'pt_porque_nao_010',
    locale: 'pt-PT',
    block: 'porque não?',
    label: 'PORQUE NÃO?',
    gloss: 'why not?',
    type: 'booster',
    frequency_priority: 10,
    grammar_note_internal:
      'Written as two words in a question. Distinct from the conjunction porque.',
    generativity: ['Porque não?'],
  },
}

export const BLOCK_ORDER: BlockId[] = [
  'comigo',
  'podes',
  'preciso_de',
  'nao_consigo',
  'perdi',
  'nao_vou',
  'o_que_estas_a',
  'quando',
  'claro',
  'porque_nao',
]

/**
 * Cultural hooks. Brief reference only — spec §6. No dialogue sequences, no subtitle
 * tracks, no lyrics. rights_status is carried so a later licensing pass can filter.
 */
export const MOMENTS: CulturalMoment[] = [
  {
    property_id: 'top_gun',
    moment_id: 'tg_talk_to_me',
    short_reference_hook: 'TALK TO ME, GOOSE.',
    familiarity_weight: 'high',
    rights_status: 'brief-reference-prototype',
    thematic_tags: ['partnership', 'cockpit'],
  },
  {
    property_id: 'top_gun',
    moment_id: 'tg_wingman',
    short_reference_hook: 'YOU CAN BE MY WINGMAN ANYTIME.',
    familiarity_weight: 'high',
    rights_status: 'brief-reference-prototype',
    thematic_tags: ['ability', 'offer'],
  },
  {
    property_id: 'top_gun',
    moment_id: 'tg_the_need',
    short_reference_hook: 'I FEEL THE NEED…',
    familiarity_weight: 'high',
    rights_status: 'brief-reference-prototype',
    thematic_tags: ['need', 'speed'],
  },
  {
    property_id: 'top_gun',
    moment_id: 'tg_comms_failure',
    short_reference_hook: '',
    familiarity_weight: 'medium',
    rights_status: 'brief-reference-prototype',
    thematic_tags: ['inability', 'radio'],
  },
  {
    property_id: 'top_gun',
    moment_id: 'tg_lost_that_feeling',
    short_reference_hook: 'SHE’S LOST THAT LOVING FEELING.',
    familiarity_weight: 'high',
    rights_status: 'brief-reference-prototype',
    thematic_tags: ['loss', 'romance'],
  },
  {
    property_id: 'top_gun',
    moment_id: 'tg_not_leaving',
    short_reference_hook: 'I’M NOT LEAVING MY WINGMAN.',
    familiarity_weight: 'high',
    rights_status: 'brief-reference-prototype',
    thematic_tags: ['intention', 'refusal'],
  },
  {
    property_id: 'top_gun',
    moment_id: 'tg_what_were_you_thinking',
    short_reference_hook: 'WHAT WERE YOU THINKING?',
    familiarity_weight: 'medium',
    rights_status: 'brief-reference-prototype',
    thematic_tags: ['question', 'reprimand'],
  },
  {
    property_id: 'top_gun',
    moment_id: 'tg_when_im_ready',
    short_reference_hook: 'WHEN I’M READY.',
    familiarity_weight: 'medium',
    rights_status: 'brief-reference-prototype',
    thematic_tags: ['time', 'defiance'],
  },
]

/**
 * Every Portuguese utterance the session can speak. This is the single source for
 * Appendix A (the native-reviewer QA sheet) and for the audio manifest — correcting
 * a phrase here corrects it in the lesson, the QA sheet and the audio build at once.
 */
export const EXAMPLES: Example[] = [
  { example_id: 'ex_001', target_id: 'comigo', pt_text: 'Fala comigo.', en_gloss: 'Talk to me.', audio_asset: 'fala-comigo', context_tag: 'hook', role: 'Hook phrase / comigo pattern' },
  { example_id: 'ex_002', target_id: 'comigo', pt_text: 'Vem comigo.', en_gloss: 'Come with me.', audio_asset: 'vem-comigo', context_tag: 'transfer', role: 'Transfer' },
  { example_id: 'ex_003', target_id: 'comigo', pt_text: 'Fica comigo.', en_gloss: 'Stay with me.', audio_asset: 'fica-comigo', context_tag: 'distractor', role: 'Distractor meaning' },
  { example_id: 'ex_004', target_id: 'podes', pt_text: 'Podes vir comigo?', en_gloss: 'Can you come with me?', audio_asset: 'podes-vir-comigo', context_tag: 'manipulate', role: 'Podes + vir + comigo' },
  { example_id: 'ex_005', target_id: 'podes', pt_text: 'Podes repetir?', en_gloss: 'Can you repeat?', audio_asset: 'podes-repetir', context_tag: 'transfer', role: 'Conversation repair' },
  { example_id: 'ex_006', target_id: 'preciso_de', pt_text: 'Preciso de água.', en_gloss: 'I need water.', audio_asset: 'preciso-de-agua', context_tag: 'manipulate', role: 'Need block' },
  { example_id: 'ex_007', target_id: 'preciso_de', pt_text: 'Preciso de um táxi.', en_gloss: 'I need a taxi.', audio_asset: 'preciso-de-um-taxi', context_tag: 'transfer', role: 'Travel transfer' },
  { example_id: 'ex_008', target_id: 'nao_consigo', pt_text: 'Não consigo perceber.', en_gloss: 'I can’t understand.', audio_asset: 'nao-consigo-perceber', context_tag: 'manipulate', role: 'Ability / repair' },
  { example_id: 'ex_009', target_id: 'nao_consigo', pt_text: 'Não consigo dormir.', en_gloss: 'I can’t sleep.', audio_asset: 'nao-consigo-dormir', context_tag: 'transfer', role: 'Transfer' },
  { example_id: 'ex_010', target_id: 'perdi', pt_text: 'Perdi as chaves.', en_gloss: 'I lost my keys.', audio_asset: 'perdi-as-chaves', context_tag: 'manipulate', role: 'Past verb' },
  { example_id: 'ex_011', target_id: 'perdi', pt_text: 'Perdi o bilhete.', en_gloss: 'I lost my ticket.', audio_asset: 'perdi-o-bilhete', context_tag: 'transfer', role: 'Travel transfer' },
  { example_id: 'ex_012', target_id: 'nao_vou', pt_text: 'Não vou esperar.', en_gloss: 'I’m not going to wait.', audio_asset: 'nao-vou-esperar', context_tag: 'manipulate', role: 'Near-future intention' },
  { example_id: 'ex_013', target_id: 'nao_vou', pt_text: 'Não vou beber.', en_gloss: 'I’m not going to drink.', audio_asset: 'nao-vou-beber', context_tag: 'transfer', role: 'Social transfer' },
  { example_id: 'ex_014', target_id: 'o_que_estas_a', pt_text: 'O que estás a beber?', en_gloss: 'What are you drinking?', audio_asset: 'o-que-estas-a-beber', context_tag: 'manipulate', role: 'pt-PT progressive' },
  { example_id: 'ex_015', target_id: 'o_que_estas_a', pt_text: 'O que estás a fazer?', en_gloss: 'What are you doing?', audio_asset: 'o-que-estas-a-fazer', context_tag: 'transfer', role: 'pt-PT progressive' },
  { example_id: 'ex_016', target_id: 'quando', pt_text: 'Quando vais?', en_gloss: 'When are you going?', audio_asset: 'quando-vais', context_tag: 'manipulate', role: 'Question word' },
  { example_id: 'ex_017', target_id: 'quando', pt_text: 'Quando vamos?', en_gloss: 'When are we going?', audio_asset: 'quando-vamos', context_tag: 'transfer', role: 'Question word' },
  { example_id: 'ex_018', target_id: 'claro', pt_text: 'Claro.', en_gloss: 'Of course.', audio_asset: 'claro', context_tag: 'booster', role: 'Booster' },
  { example_id: 'ex_019', target_id: 'porque_nao', pt_text: 'Porque não?', en_gloss: 'Why not?', audio_asset: 'porque-nao', context_tag: 'booster', role: 'Booster' },
]

/** Bare blocks also need audio — they are revealed and tapped on their own screens. */
export const BLOCK_AUDIO: Record<BlockId, string> = {
  comigo: 'comigo',
  podes: 'podes',
  preciso_de: 'preciso-de',
  nao_consigo: 'nao-consigo',
  perdi: 'perdi',
  nao_vou: 'nao-vou',
  o_que_estas_a: 'o-que-estas-a',
  quando: 'quando',
  claro: 'claro',
  porque_nao: 'porque-nao',
}
