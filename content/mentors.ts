/**
 * WHO IS TEACHING YOU, and it is a real choice rather than a theme.
 *
 * Sam: "Give /Noticed a configurable Mentor type: The Coolest Teacher you had at School /
 * Your elder Brother's cool Best Mate / A Drill Sergeant / Your Gentle Dad — changing tone
 * of voice and potentially number of notifications." And then: "add the pick your mentor
 * concept to the walk through and have some fun with it."
 *
 * WHY THIS IS NOT A SETTING. A dropdown in Settings called "tone of voice" is a preference,
 * and nobody has ever changed one. Picking the person who is going to talk to you is a
 * character choice — it happens once, early, while somebody is still deciding what this
 * product is — so it belongs in the walk, which is the only place DUB introduces itself.
 *
 * THE FOUR ARE NOT FOUR ADJECTIVES. Each one is somebody specific, and the test for every
 * line in here is whether you can hear THAT person saying it and not the other three. A
 * voice that could belong to any of them is a voice that belongs to none of them, which is
 * how this becomes four names on one tone.
 *
 * WHAT CHANGES AND WHAT NEVER DOES. The mentor changes HOW an observation is said. It
 * never changes WHAT is observed, and it cannot invent an observation — see content/
 * noticed.ts, where the rule is that every line names a sentence, a word or a vibe. A
 * drill sergeant who made things up to shout about would be a liar with a gimmick.
 *
 * AND NOBODY IS CRUEL. The sergeant is the one that could go wrong: the product's own rule
 * is that a miss is coached in amber and never in red, and it "names the instrument, never
 * the person". The sergeant is loud about the WORK and never about the learner — he is a
 * bit on the learner's side, which is why the joke is funny rather than nasty. A line that
 * would make somebody feel stupid is wrong in every voice including his.
 */

/** The four, and the id is what the record stores. */
export type MentorId = 'teacher' | 'mate' | 'sergeant' | 'dad'

export interface Mentor {
  id: MentorId
  /** What the picker calls them. Short — this is a name, not a description. */
  name: string
  /** The one line under the name, in the picker. Says who they are, not how they sound. */
  who: string
  /**
   * THEM, TALKING, so the choice is made on evidence rather than on a label.
   *
   * The same observation in four voices is what makes the picker work: somebody reads
   * four versions of one sentence and picks the person they want to hear it from. So this
   * is deliberately the SAME fact every time — a sentence that keeps slipping — and only
   * the voice moves.
   */
  sample: string
  /** The glyph on the card. Drawn in the picker, named here so it cannot drift. */
  icon: 'teacher' | 'mate' | 'sergeant' | 'dad'
  /**
   * HOW MANY TIMES THEY WOULD GET IN TOUCH, which Sam asked for and which is a real
   * difference rather than a slider.
   *
   * A sergeant who notices you have gone quiet says so. A gentle dad does not — that is
   * the entire difference between them, and it is the honest version of "potentially
   * number of notifications". Nothing here SENDS anything: it is a cap that whatever
   * eventually does the sending must read. See `nudges`.
   */
  nudges: 'none' | 'one' | 'more'
  /** The lines themselves. One per thing noticed() can say. See NoticedTone. */
  voice: {
    /** The eyebrow over a win, a stuck line and a nudge. Three words at most. */
    won: string
    stuck: string
    nudge: string
    /** Said over a run of sentences produced cold. `n` is the count. */
    cold: (n: number) => string
    /** Said about one sentence that keeps beating them. */
    rough: string
    /** Said about a sentence they have only managed with the words on screen. */
    nearly: string
    /** Said when nothing has been spoken in a week. */
    quiet: string
    /** The empty state, before there is anything to notice at all. */
    nothing: string
  }
}

export const MENTORS: Mentor[] = [
  /*
    THE DEFAULT, because it is the voice the product was already written in — see
    content/noticed.ts, whose entire voice note is this person. Making a different one the
    default would silently rewrite every line somebody has already read.
  */
  {
    id: 'mate',
    name: "Your brother's mate",
    who: 'The one who is effortlessly cool and cannot be impressed by much.',
    sample: 'This one keeps slipping. Not you — it is a mouthful. Have another listen.',
    icon: 'mate',
    nudges: 'one',
    voice: {
      won: 'NICE',
      stuck: 'THIS ONE',
      nudge: 'GO ON',
      cold: (n) => n + ' sentences, no screen, no help. This was the last one.',
      rough: 'This one keeps slipping. Not you — it is a mouthful. Have another listen.',
      nearly:
        'You have only said this one with the words up. Try it blind — you are closer than you think.',
      quiet: 'Not heard you in a week. This was the last thing you said.',
      nothing:
        'Nothing yet — you have not said anything out loud. Do one sentence with the screen off and I will have something to tell you.',
    },
  },
  /*
    THE TEACHER WHO WAS ACTUALLY GOOD, which is a precise and uncommon thing: they were
    pleased when you did well and they showed it, and they never once made the room feel
    like a test. Warm, and slightly formal, because they are still a teacher — "well done"
    is a phrase this one is allowed and the other three are not.
  */
  {
    id: 'teacher',
    name: 'The best teacher you had',
    who: 'The one whose subject you were suddenly good at, for no reason you could name.',
    sample: 'That one is still giving you trouble — and it would, it is a mouthful. Listen again.',
    icon: 'teacher',
    nudges: 'one',
    voice: {
      won: 'WELL DONE',
      stuck: 'WORTH ANOTHER LOOK',
      nudge: 'TRY THIS',
      cold: (n) =>
        n + ' sentences, said with nothing in front of you. That is real. This was the last.',
      rough: 'That one is still giving you trouble — and it would, it is a mouthful. Listen again.',
      nearly:
        'You have had this one with the words up, never without. I think you have it. Try it blind.',
      quiet: 'It has been a week. Here is where you left off.',
      nothing:
        'Nothing to show you yet. Say one sentence with the screen off and we will have something to talk about.',
    },
  },
  /*
    THE SERGEANT, who is the fun one and the one that needs the most discipline in the
    writing.

    He is LOUD ABOUT THE WORK and never about the person. Everything he says is directed at
    the sentence — the sentence is the enemy, the sentence is being insubordinate — and the
    learner is the one he is on the side of. That is the difference between a joke and
    being horrible to somebody who is trying to learn a language on their phone.

    Shouting in text is CAPITALS in the eyebrow and short sentences in the body. Writing the
    body in capitals too would be unreadable at this size and would stop being funny on the
    second one.
  */
  {
    id: 'sergeant',
    name: 'A drill sergeant',
    who: 'Takes it personally. Not with you — with the sentence.',
    sample: 'This sentence has beaten you how many times now? Unacceptable. Again.',
    icon: 'sergeant',
    nudges: 'more',
    voice: {
      won: 'OUTSTANDING',
      stuck: 'THIS ONE AGAIN',
      nudge: 'MOVE',
      cold: (n) => n + ' sentences. Cold. No notes, no screen, no excuses. Last one in.',
      rough: 'This sentence has beaten you how many times now? Unacceptable. Again.',
      nearly:
        'You have never once said this without reading it. The words are a crutch. Drop them.',
      quiet: 'A week. Silence. I have not forgotten and neither has this sentence.',
      nothing:
        'Nothing on the board. Not one sentence out loud. Pick one, screen off, go.',
    },
  },
  /*
    GENTLE DAD, who is the opposite end and is NOT the soft version of the teacher.

    The teacher is pleased with your work. Dad is pleased with YOU, and is not really
    thinking about the work at all — he would be proud of you for trying this regardless of
    how it went, and he is faintly amazed you are doing it. He is also the one who never
    nags: `nudges: 'none'` is the whole character, said in config.

    The trap here is treacle. He is warm and he is not sentimental — short sentences, and
    he says one true thing rather than three nice ones.
  */
  {
    id: 'dad',
    name: 'Your gentle dad',
    who: 'Proud of you for trying it at all. Will never once nag.',
    sample: 'That one is tricky, love. No rush on it. Have a listen when you fancy.',
    icon: 'dad',
    nudges: 'none',
    voice: {
      won: 'LOOK AT YOU',
      stuck: 'TRICKY ONE',
      nudge: 'WHEN YOU FANCY',
      cold: (n) => n + ' sentences, all on your own, no help. Last one was this.',
      rough: 'That one is tricky, love. No rush on it. Have a listen when you fancy.',
      nearly: 'You have done this one with the words there. You could do it without, you know.',
      quiet: 'Been a little while. This was the last one you said, if you want it back.',
      nothing:
        'Nothing yet, and that is fine. Say one out loud when you are ready and I will tell you how it went.',
    },
  },
]

/** The one the product speaks in until somebody chooses otherwise. */
export const DEFAULT_MENTOR: MentorId = 'mate'

/**
 * The chosen mentor, or the default — and never undefined.
 *
 * Takes the id rather than the record so it can be called from anywhere, including from
 * the walk before anything has been saved. An unknown id falls back rather than throwing:
 * a record written by a future version naming a mentor this build does not have should
 * sound like the default, not crash the screen that was about to compliment somebody.
 */
export function mentorFor(id: MentorId | null | undefined): Mentor {
  return MENTORS.find((m) => m.id === id) ?? MENTORS.find((m) => m.id === DEFAULT_MENTOR)!
}
