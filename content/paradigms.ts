/**
 * The forms a word can wear.
 *
 * DUB has always known which forms a learner has MET — `lemma` and `form` on every
 * extract, which is what stopped `tenho` and `tens` being unrelated rows stages apart.
 * What it has never known is which forms EXIST. Without that, "you can say quero, here is
 * queres" is not a card the product can make; it is a sentence somebody has to write.
 *
 * This is that table, and it is the reason derived cards can be trusted. The rule the
 * whole of spec-derived-cards.md hangs on:
 *
 *   A derived card ASSEMBLES. It never invents. Every Portuguese word it shows already
 *   exists here, authored and reviewed. If it is not in this table, there is no card.
 *
 * A model may choose which combination is worth showing somebody today. It may not decide
 * what the Portuguese is. That single line is the difference between infinite supply you
 * can trust and infinite supply that quietly teaches Brazilian.
 *
 * ---
 *
 * European Portuguese, and the specifics that means:
 *
 *   - Five persons, not six. `vós` is gone from the spoken language and teaching it would
 *     be teaching a museum.
 *   - `você` takes the third person, so it needs no column — it is a social choice about
 *     which person to use, not a person of its own. That choice is content, and it belongs
 *     on a card rather than in a table.
 *   - `tu` is alive here, unlike in most of Brazil, and it conjugates properly: `tens`,
 *     not `você tem`. This is the single most visible pt-PT marker in the product.
 *   - Second person negative imperative is the present subjunctive — `não digas`, never
 *     `não diz`. Getting this wrong is the classic generated-Portuguese tell.
 *
 * Scope is deliberately not "the eighty most frequent verbs". It is exactly the lemmas the
 * content already teaches: a paradigm for a word no learner owns generates cards nobody can
 * be shown. The table grows when the content does, and `npm run paradigms` fails when it
 * has not.
 */

export type Person = 'eu' | 'tu' | 'ele' | 'nos' | 'eles'
export type Tense = 'present' | 'past' | 'imperfect'

/** Where a form has been checked by somebody who speaks it. */
export type ReviewState = 'needs-review' | 'reviewed'

export interface VerbParadigm {
  kind: 'verb'
  lemma: string
  /** MEANING ONLY, matching the house style for a gloss. */
  gloss: string
  infinitive: string
  present: Partial<Record<Person, string>>
  /** Pretérito perfeito — the one thing that happened. */
  past?: Partial<Record<Person, string>>
  /** Imperfeito. Also how politeness is done: `queria`, `gostava`. */
  imperfect?: Partial<Record<Person, string>>
  /** tu, affirmative. `diz`, `vai`, `dá`. */
  imperative?: string
  /** tu, negative — the present subjunctive, and the classic generated-Portuguese tell. */
  imperative_negative?: string
  /**
   * The English, authored rather than generated.
   *
   * A derived card has to say what the new form MEANS, and generating English morphology
   * is the one place a rule reliably produces "he cans" and "he sayes". Two strings —
   * the base and the third person — cover all five persons exactly, and English is the
   * language it is safe to author here.
   */
  en: { base: string; third: string }
  /** Impersonal verbs live only in the third person: `há`, `custa`, `apetece`. */
  impersonal?: boolean
  /** Carries a reflexive pronoun: `chamar-se`, `esquecer-se`. */
  reflexive?: boolean
  review: ReviewState
}

export interface AgreementParadigm {
  kind: 'agreement'
  lemma: string
  gloss: string
  m: string
  f: string
  mp?: string
  fp?: string
  review: ReviewState
}

export type Paradigm = VerbParadigm | AgreementParadigm

const v = (
  lemma: string,
  gloss: string,
  en: { base: string; third: string },
  present: Partial<Record<Person, string>>,
  rest: Partial<Omit<VerbParadigm, 'kind' | 'lemma' | 'gloss' | 'present' | 'infinitive' | 'review' | 'en'>> = {},
): VerbParadigm => ({
  kind: 'verb',
  lemma,
  gloss,
  en,
  infinitive: lemma,
  present,
  review: 'needs-review',
  ...rest,
})

const a = (
  lemma: string,
  gloss: string,
  m: string,
  f: string,
  mp?: string,
  fp?: string,
): AgreementParadigm => ({ kind: 'agreement', lemma, gloss, m, f, mp, fp, review: 'needs-review' })

export const PARADIGMS: Paradigm[] = [
  // ---------------------------------------------------------------- the big irregulars
  v('ser', 'to be — permanently',
    { base: 'am/are', third: 'is' },
    { eu: 'sou', tu: 'és', ele: 'é', nos: 'somos', eles: 'são' },
    {
      past: { eu: 'fui', tu: 'foste', ele: 'foi', nos: 'fomos', eles: 'foram' },
      imperfect: { eu: 'era', tu: 'eras', ele: 'era', nos: 'éramos', eles: 'eram' },
      imperative: 'sê',
      imperative_negative: 'não sejas',
    }),
  v('estar', 'to be — right now',
    { base: 'am/are', third: 'is' },
    { eu: 'estou', tu: 'estás', ele: 'está', nos: 'estamos', eles: 'estão' },
    {
      past: { eu: 'estive', tu: 'estiveste', ele: 'esteve', nos: 'estivemos', eles: 'estiveram' },
      imperfect: { eu: 'estava', tu: 'estavas', ele: 'estava', nos: 'estávamos', eles: 'estavam' },
      imperative: 'está',
      imperative_negative: 'não estejas',
    }),
  v('ter', 'to have',
    { base: 'have', third: 'has' },
    { eu: 'tenho', tu: 'tens', ele: 'tem', nos: 'temos', eles: 'têm' },
    {
      past: { eu: 'tive', tu: 'tiveste', ele: 'teve', nos: 'tivemos', eles: 'tiveram' },
      imperfect: { eu: 'tinha', tu: 'tinhas', ele: 'tinha', nos: 'tínhamos', eles: 'tinham' },
      imperative: 'tem',
      imperative_negative: 'não tenhas',
    }),
  /* ir + infinitive is the near future, and it is the reason the future tense can wait:
     one owned piece plus a verb you already have, which is also how people actually talk. */
  v('ir', 'to go',
    { base: 'go', third: 'goes' },
    { eu: 'vou', tu: 'vais', ele: 'vai', nos: 'vamos', eles: 'vão' },
    {
      past: { eu: 'fui', tu: 'foste', ele: 'foi', nos: 'fomos', eles: 'foram' },
      imperfect: { eu: 'ia', tu: 'ias', ele: 'ia', nos: 'íamos', eles: 'iam' },
      imperative: 'vai',
      imperative_negative: 'não vás',
    }),
  v('poder', 'to be able to, to be allowed to',
    { base: 'can', third: 'can' },
    { eu: 'posso', tu: 'podes', ele: 'pode', nos: 'podemos', eles: 'podem' },
    {
      past: { eu: 'pude', tu: 'pudeste', ele: 'pôde', nos: 'pudemos', eles: 'puderam' },
      imperfect: { eu: 'podia', tu: 'podias', ele: 'podia', nos: 'podíamos', eles: 'podiam' },
    }),
  /* The imperfect of querer is not a past. `queria um café` is how a polite person orders,
     and it is the single most useful piece of softening in the language. */
  v('querer', 'to want',
    { base: 'want', third: 'wants' },
    { eu: 'quero', tu: 'queres', ele: 'quer', nos: 'queremos', eles: 'querem' },
    {
      past: { eu: 'quis', tu: 'quiseste', ele: 'quis', nos: 'quisemos', eles: 'quiseram' },
      imperfect: { eu: 'queria', tu: 'querias', ele: 'queria', nos: 'queríamos', eles: 'queriam' },
    }),
  v('fazer', 'to do, to make',
    { base: 'do', third: 'does' },
    { eu: 'faço', tu: 'fazes', ele: 'faz', nos: 'fazemos', eles: 'fazem' },
    {
      past: { eu: 'fiz', tu: 'fizeste', ele: 'fez', nos: 'fizemos', eles: 'fizeram' },
      imperfect: { eu: 'fazia', tu: 'fazias', ele: 'fazia', nos: 'fazíamos', eles: 'faziam' },
      imperative: 'faz',
      imperative_negative: 'não faças',
    }),
  v('dizer', 'to say',
    { base: 'say', third: 'says' },
    { eu: 'digo', tu: 'dizes', ele: 'diz', nos: 'dizemos', eles: 'dizem' },
    {
      past: { eu: 'disse', tu: 'disseste', ele: 'disse', nos: 'dissemos', eles: 'disseram' },
      imperfect: { eu: 'dizia', tu: 'dizias', ele: 'dizia', nos: 'dizíamos', eles: 'diziam' },
      imperative: 'diz',
      imperative_negative: 'não digas',
    }),
  v('ver', 'to see',
    { base: 'see', third: 'sees' },
    { eu: 'vejo', tu: 'vês', ele: 'vê', nos: 'vemos', eles: 'veem' },
    {
      past: { eu: 'vi', tu: 'viste', ele: 'viu', nos: 'vimos', eles: 'viram' },
      imperfect: { eu: 'via', tu: 'vias', ele: 'via', nos: 'víamos', eles: 'viam' },
      imperative: 'vê',
      imperative_negative: 'não vejas',
    }),
  v('vir', 'to come',
    { base: 'come', third: 'comes' },
    { eu: 'venho', tu: 'vens', ele: 'vem', nos: 'vimos', eles: 'vêm' },
    {
      past: { eu: 'vim', tu: 'vieste', ele: 'veio', nos: 'viemos', eles: 'vieram' },
      imperfect: { eu: 'vinha', tu: 'vinhas', ele: 'vinha', nos: 'vínhamos', eles: 'vinham' },
      imperative: 'vem',
      imperative_negative: 'não venhas',
    }),
  v('dar', 'to give',
    { base: 'give', third: 'gives' },
    { eu: 'dou', tu: 'dás', ele: 'dá', nos: 'damos', eles: 'dão' },
    {
      past: { eu: 'dei', tu: 'deste', ele: 'deu', nos: 'demos', eles: 'deram' },
      imperfect: { eu: 'dava', tu: 'davas', ele: 'dava', nos: 'dávamos', eles: 'davam' },
      imperative: 'dá',
      imperative_negative: 'não dês',
    }),
  v('pedir', 'to ask for, to order',
    { base: 'ask for', third: 'asks for' },
    { eu: 'peço', tu: 'pedes', ele: 'pede', nos: 'pedimos', eles: 'pedem' },
    {
      past: { eu: 'pedi', tu: 'pediste', ele: 'pediu', nos: 'pedimos', eles: 'pediram' },
      imperfect: { eu: 'pedia', tu: 'pedias', ele: 'pedia', nos: 'pedíamos', eles: 'pediam' },
      imperative: 'pede',
      imperative_negative: 'não peças',
    }),
  v('conhecer', 'to know — a person or a place',
    { base: 'know', third: 'knows' },
    { eu: 'conheço', tu: 'conheces', ele: 'conhece', nos: 'conhecemos', eles: 'conhecem' },
    {
      past: { eu: 'conheci', tu: 'conheceste', ele: 'conheceu', nos: 'conhecemos', eles: 'conheceram' },
      imperfect: { eu: 'conhecia', tu: 'conhecias', ele: 'conhecia', nos: 'conhecíamos', eles: 'conheciam' },
      imperative: 'conhece',
      imperative_negative: 'não conheças',
    }),
  v('oferecer', 'to offer',
    { base: 'offer', third: 'offers' },
    { eu: 'ofereço', tu: 'ofereces', ele: 'oferece', nos: 'oferecemos', eles: 'oferecem' },
    {
      past: { eu: 'ofereci', tu: 'ofereceste', ele: 'ofereceu', nos: 'oferecemos', eles: 'ofereceram' },
      imperfect: { eu: 'oferecia', tu: 'oferecias', ele: 'oferecia', nos: 'oferecíamos', eles: 'ofereciam' },
      imperative: 'oferece',
      imperative_negative: 'não ofereças',
    }),

  // ---------------------------------------------------------------------- the regulars
  v('gostar', 'to like — always with de',
    { base: 'like', third: 'likes' },
    { eu: 'gosto', tu: 'gostas', ele: 'gosta', nos: 'gostamos', eles: 'gostam' },
    {
      past: { eu: 'gostei', tu: 'gostaste', ele: 'gostou', nos: 'gostámos', eles: 'gostaram' },
      imperfect: { eu: 'gostava', tu: 'gostavas', ele: 'gostava', nos: 'gostávamos', eles: 'gostavam' },
      imperative: 'gosta',
      imperative_negative: 'não gostes',
    }),
  v('precisar', 'to need — always with de',
    { base: 'need', third: 'needs' },
    { eu: 'preciso', tu: 'precisas', ele: 'precisa', nos: 'precisamos', eles: 'precisam' },
    {
      past: { eu: 'precisei', tu: 'precisaste', ele: 'precisou', nos: 'precisámos', eles: 'precisaram' },
      imperfect: { eu: 'precisava', tu: 'precisavas', ele: 'precisava', nos: 'precisávamos', eles: 'precisavam' },
    }),
  v('trabalhar', 'to work',
    { base: 'work', third: 'works' },
    { eu: 'trabalho', tu: 'trabalhas', ele: 'trabalha', nos: 'trabalhamos', eles: 'trabalham' },
    {
      past: { eu: 'trabalhei', tu: 'trabalhaste', ele: 'trabalhou', nos: 'trabalhámos', eles: 'trabalharam' },
      imperfect: { eu: 'trabalhava', tu: 'trabalhavas', ele: 'trabalhava', nos: 'trabalhávamos', eles: 'trabalhavam' },
    }),
  v('falar', 'to speak',
    { base: 'speak', third: 'speaks' },
    { eu: 'falo', tu: 'falas', ele: 'fala', nos: 'falamos', eles: 'falam' },
    {
      past: { eu: 'falei', tu: 'falaste', ele: 'falou', nos: 'falámos', eles: 'falaram' },
      imperfect: { eu: 'falava', tu: 'falavas', ele: 'falava', nos: 'falávamos', eles: 'falavam' },
      imperative: 'fala',
      imperative_negative: 'não fales',
    }),
  v('adorar', 'to love — a thing, not a person',
    { base: 'love', third: 'loves' },
    { eu: 'adoro', tu: 'adoras', ele: 'adora', nos: 'adoramos', eles: 'adoram' },
    {
      past: { eu: 'adorei', tu: 'adoraste', ele: 'adorou', nos: 'adorámos', eles: 'adoraram' },
      imperfect: { eu: 'adorava', tu: 'adoravas', ele: 'adorava', nos: 'adorávamos', eles: 'adoravam' },
    }),
  v('procurar', 'to look for',
    { base: 'am/are looking for', third: 'is looking for' },
    { eu: 'procuro', tu: 'procuras', ele: 'procura', nos: 'procuramos', eles: 'procuram' },
    {
      past: { eu: 'procurei', tu: 'procuraste', ele: 'procurou', nos: 'procurámos', eles: 'procuraram' },
      imperfect: { eu: 'procurava', tu: 'procuravas', ele: 'procurava', nos: 'procurávamos', eles: 'procuravam' },
      imperative: 'procura',
      imperative_negative: 'não procures',
    }),
  v('aproveitar', 'to make the most of',
    { base: 'make the most of', third: 'makes the most of' },
    { eu: 'aproveito', tu: 'aproveitas', ele: 'aproveita', nos: 'aproveitamos', eles: 'aproveitam' },
    {
      past: { eu: 'aproveitei', tu: 'aproveitaste', ele: 'aproveitou', nos: 'aproveitámos', eles: 'aproveitaram' },
      imperfect: { eu: 'aproveitava', tu: 'aproveitavas', ele: 'aproveitava', nos: 'aproveitávamos', eles: 'aproveitavam' },
      imperative: 'aproveita',
      imperative_negative: 'não aproveites',
    }),
  v('ligar', 'to call, to ring',
    { base: 'call', third: 'calls' },
    { eu: 'ligo', tu: 'ligas', ele: 'liga', nos: 'ligamos', eles: 'ligam' },
    {
      past: { eu: 'liguei', tu: 'ligaste', ele: 'ligou', nos: 'ligámos', eles: 'ligaram' },
      imperfect: { eu: 'ligava', tu: 'ligavas', ele: 'ligava', nos: 'ligávamos', eles: 'ligavam' },
      imperative: 'liga',
      imperative_negative: 'não ligues',
    }),
  v('guardar', 'to keep, to put away',
    { base: 'keep', third: 'keeps' },
    { eu: 'guardo', tu: 'guardas', ele: 'guarda', nos: 'guardamos', eles: 'guardam' },
    {
      past: { eu: 'guardei', tu: 'guardaste', ele: 'guardou', nos: 'guardámos', eles: 'guardaram' },
      imperfect: { eu: 'guardava', tu: 'guardavas', ele: 'guardava', nos: 'guardávamos', eles: 'guardavam' },
      imperative: 'guarda',
      imperative_negative: 'não guardes',
    }),
  v('chamar', 'to call — and reflexively, to be named',
    { base: 'call', third: 'calls' },
    { eu: 'chamo', tu: 'chamas', ele: 'chama', nos: 'chamamos', eles: 'chamam' },
    {
      past: { eu: 'chamei', tu: 'chamaste', ele: 'chamou', nos: 'chamámos', eles: 'chamaram' },
      imperfect: { eu: 'chamava', tu: 'chamavas', ele: 'chamava', nos: 'chamávamos', eles: 'chamavam' },
      imperative: 'chama',
      imperative_negative: 'não chames',
    }),

  // ------------------------------------------------------------------------ reflexives
  v('esquecer-se', 'to forget',
    { base: 'forget', third: 'forgets' },
    { eu: 'esqueço-me', tu: 'esqueces-te', ele: 'esquece-se', nos: 'esquecemo-nos', eles: 'esquecem-se' },
    {
      past: { eu: 'esqueci-me', tu: 'esqueceste-te', ele: 'esqueceu-se', nos: 'esquecemo-nos', eles: 'esqueceram-se' },
      imperfect: { eu: 'esquecia-me', tu: 'esquecias-te', ele: 'esquecia-se', nos: 'esquecíamo-nos', eles: 'esqueciam-se' },
      reflexive: true,
    }),

  // ----------------------------------------------------------------------- impersonals
  /*
    Third person only, and that is a fact about the verb rather than a gap in the table.
    `apetecer` is the good one: Portuguese does not say "I fancy a coffee", it says the
    coffee appeals to me — apetece-me um café — and the person moves to a pronoun.
  */
  v('haver', 'there is, there are',
    { base: 'there is', third: 'there is' },
    { ele: 'há' },
    {
      past: { ele: 'houve' },
      imperfect: { ele: 'havia' },
      impersonal: true,
    }),
  v('custar', 'to cost',
    { base: 'cost', third: 'costs' },
    { ele: 'custa', eles: 'custam' },
    {
      past: { ele: 'custou', eles: 'custaram' },
      imperfect: { ele: 'custava', eles: 'custavam' },
      impersonal: true,
    }),
  v('apetecer', 'to fancy — literally, to appeal to',
    { base: 'fancy', third: 'fancies' },
    { ele: 'apetece', eles: 'apetecem' },
    {
      past: { ele: 'apeteceu', eles: 'apeteceram' },
      imperfect: { ele: 'apetecia', eles: 'apeteciam' },
      impersonal: true,
    }),
  v('importar', 'to mind, to matter',
    { base: 'mind', third: 'minds' },
    { ele: 'importa', eles: 'importam' },
    {
      past: { ele: 'importou', eles: 'importaram' },
      imperfect: { ele: 'importava', eles: 'importavam' },
      impersonal: true,
    }),

  // ------------------------------------------------- the verbs the backfill brought in
  v('deixar', 'to leave something, to let somebody',
    { base: 'leave', third: 'leaves' },
    { eu: 'deixo', tu: 'deixas', ele: 'deixa', nos: 'deixamos', eles: 'deixam' },
    {
      past: { eu: 'deixei', tu: 'deixaste', ele: 'deixou', nos: 'deixámos', eles: 'deixaram' },
      imperfect: { eu: 'deixava', tu: 'deixavas', ele: 'deixava', nos: 'deixávamos', eles: 'deixavam' },
      imperative: 'deixa',
      imperative_negative: 'não deixes',
    }),
  v('mudar', 'to change',
    { base: 'change', third: 'changes' },
    { eu: 'mudo', tu: 'mudas', ele: 'muda', nos: 'mudamos', eles: 'mudam' },
    {
      past: { eu: 'mudei', tu: 'mudaste', ele: 'mudou', nos: 'mudámos', eles: 'mudaram' },
      imperfect: { eu: 'mudava', tu: 'mudavas', ele: 'mudava', nos: 'mudávamos', eles: 'mudavam' },
      imperative: 'muda',
      imperative_negative: 'não mudes',
    }),
  /* perceber, not entender. "Não percebi" is what Lisbon says, and it means the sentence
     went past you rather than that you are incapable — friendlier, and truer. */
  v('perceber', 'to catch, to get what somebody said',
    { base: 'get', third: 'gets' },
    { eu: 'percebo', tu: 'percebes', ele: 'percebe', nos: 'percebemos', eles: 'percebem' },
    {
      past: { eu: 'percebi', tu: 'percebeste', ele: 'percebeu', nos: 'percebemos', eles: 'perceberam' },
      imperfect: { eu: 'percebia', tu: 'percebias', ele: 'percebia', nos: 'percebíamos', eles: 'percebiam' },
      imperative: 'percebe',
      imperative_negative: 'não percebas',
    }),

  // ------------------------------------------------------------------------- agreement
  /*
    These five were already in the content — as prose, in a `note`: "A woman says estou
    nervosa", "A woman is engraçada". True, useful, and sitting somewhere nothing could
    generate from, so a woman using DUB was being taught to say `estou farto` about herself
    and told the correction in small print underneath. Structured, it becomes a card that
    arrives when she needs it.
  */
  a('farto', 'fed up', 'farto', 'farta', 'fartos', 'fartas'),
  a('nervoso', 'nervous', 'nervoso', 'nervosa', 'nervosos', 'nervosas'),
  a('engraçado', 'funny', 'engraçado', 'engraçada', 'engraçados', 'engraçadas'),
  a('ridículo', 'ridiculous', 'ridículo', 'ridícula', 'ridículos', 'ridículas'),
  /*
    Not conjugation, and it needed saying in the model rather than being forced into one.
    `obrigado` agrees with the person SAYING it, which is the single most common mistake an
    English speaker makes in Portuguese and the best card in family four.
  */
  a('obrigado', 'thank you — agrees with whoever is saying it', 'obrigado', 'obrigada', 'obrigados', 'obrigadas'),
  a('inglês', 'English', 'inglês', 'inglesa', 'ingleses', 'inglesas'),
  a('giro', 'lovely, nice-looking', 'giro', 'gira', 'giros', 'giras'),
  a('bom', 'good', 'bom', 'boa', 'bons', 'boas'),
  a('novo', 'new, young', 'novo', 'nova', 'novos', 'novas'),
  a('casado', 'married', 'casado', 'casada', 'casados', 'casadas'),
  a('solteiro', 'single', 'solteiro', 'solteira', 'solteiros', 'solteiras'),
  a('divorciado', 'divorced', 'divorciado', 'divorciada', 'divorciados', 'divorciadas'),
  a('fechado', 'closed', 'fechado', 'fechada', 'fechados', 'fechadas'),
  a('ele', 'he — and the plural DUB already teaches', 'ele', 'ela', 'eles', 'elas'),
]

export const PARADIGM: Record<string, Paradigm> = Object.fromEntries(
  PARADIGMS.map((p) => [p.lemma, p]),
)

/** Every Portuguese string this table vouches for. The allow-list a derived card draws on. */
export function everyForm(p: Paradigm): string[] {
  if (p.kind === 'agreement') return [p.m, p.f, p.mp, p.fp].filter(Boolean) as string[]
  return [
    p.infinitive,
    ...Object.values(p.present),
    ...Object.values(p.past ?? {}),
    ...Object.values(p.imperfect ?? {}),
    p.imperative,
    p.imperative_negative,
  ].filter(Boolean) as string[]
}

/** Everything the whole table vouches for, lowercased. */
export const VOUCHED: ReadonlySet<string> = new Set(
  PARADIGMS.flatMap(everyForm).map((s) => s.toLowerCase()),
)

/** The order persons are taught in. Life's order, not a textbook's. See the spec. */
export const PERSON_ORDER: Person[] = ['eu', 'tu', 'ele', 'nos', 'eles']

export const PERSON_LABEL: Record<Person, string> = {
  eu: 'I',
  tu: 'you',
  ele: 'he, she, it',
  nos: 'we',
  eles: 'they',
}
