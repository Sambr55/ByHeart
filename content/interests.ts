/**
 * WHAT SOMEBODY IS INTO, asked as a lesson and kept as vocabulary.
 *
 * Sam: "could everyone's legend be different? So someone who loves festivals needs to be
 * able to say I love going to festivals. That would mean forcing certain vibe cards, some
 * specific, some generic." And on the shape of the asking: "only if they are learning from
 * selecting genre and interests. Everything is a learning exercise."
 *
 * TWO QUESTIONS, NOT ONE, because they are genuinely about different things and the
 * measurement said so. Genre is what is ON in the city — football, fado, festivals — and
 * it drives the drops and the calendar, which it now does. This is what a person is INTO,
 * which drives what they can say about themselves. A person can love fado and still want
 * to know when Benfica play; one answer was never going to serve both.
 *
 * EVERY OPTION IS A PIECE, and that is what stops this being a preference form. Somebody
 * who taps `música` is not setting a flag, they are banking the word for music — it goes
 * into the inventory like any other extract, it counts towards their stage, and it is
 * theirs whether or not they ever open the calendar. A tick box teaches nothing; this
 * teaches one noun per tap.
 *
 * WHICH IS ALSO WHY THE LIST IS SHORT. Eight nouns a beginner can own, not a taxonomy.
 * Every one is high-frequency, concrete, and the kind of thing that actually comes up ten
 * seconds after "what do you do" — which is where the root that asks it sits.
 */
import type { Genre } from '@/content/calendar'

export interface Interest {
  id: string
  /** The Portuguese noun, as it appears after `gosto de`. */
  target: string
  /** With its article, for the ones that need one — see `article` below. */
  gloss: string
  /**
   * Nouns that take a definite article after `de`, contracted.
   *
   * Portuguese says gosto de música with no article and gosto DA praia with one, and the
   * de contracts: de + a = da, de + o = do. There is no rule an English speaker can apply
   * from the outside — it is idiom — so it is authored per noun rather than derived, and
   * the card shows the whole phrase so nobody has to work it out.
   */
  after_de: string
  /**
   * The genre this leans towards, where there is an honest one.
   *
   * Absent for the ones that do not map. Somebody who likes films has said nothing about
   * which nights out they want, and inventing a link would put events in their Club on
   * the strength of a guess. See the note on `genresFromInterests`.
   */
  genre?: Genre
}

export const INTERESTS: Interest[] = [
  { id: 'musica', target: 'música', gloss: 'music', after_de: 'de música', genre: 'rock_pop' },
  { id: 'futebol', target: 'futebol', gloss: 'football', after_de: 'de futebol', genre: 'sport_national' },
  { id: 'praia', target: 'praia', gloss: 'the beach', after_de: 'da praia', genre: 'beach_surf' },
  { id: 'fado', target: 'fado', gloss: 'fado', after_de: 'de fado', genre: 'classical_trad' },
  { id: 'festas', target: 'festas', gloss: 'parties and festivals', after_de: 'de festas', genre: 'festival' },
  /*
    The three with no genre, and the gap is deliberate.

    Films, books and cooking say something real about a person and nothing about which
    events they want in their Club. Mapping them to a genre would put concerts in the feed
    of somebody who said they like reading, on the strength of nothing.
  */
  { id: 'filmes', target: 'filmes', gloss: 'films', after_de: 'de filmes' },
  { id: 'livros', target: 'livros', gloss: 'books', after_de: 'de livros' },
  { id: 'cozinhar', target: 'cozinhar', gloss: 'cooking', after_de: 'de cozinhar' },
]

/** One interest by id, for a card or a check. */
export function interestById(id: string): Interest | undefined {
  return INTERESTS.find((i) => i.id === id)
}

/**
 * The genres implied by what somebody is into, for pre-ticking the calendar.
 *
 * A SUGGESTION AND NEVER A DECISION. This seeds the calendar chips so a person who has
 * already said they like football does not have to say it again — but the calendar still
 * asks, they can untick any of it, and `setGenres` overwrites this the moment they touch
 * a chip. An interest is a fact about a person; a genre is a request about a feed, and
 * inferring the second from the first is a convenience rather than an answer.
 *
 * Empty when nothing maps, which is the honest result for somebody who likes books and
 * cooking — and empty means everything downstream, never nothing. See dropsFor.
 */
export function genresFromInterests(ids: string[]): Genre[] {
  const out = new Set<Genre>()
  for (const id of ids) {
    const g = interestById(id)?.genre
    if (g) out.add(g)
  }
  return [...out]
}
