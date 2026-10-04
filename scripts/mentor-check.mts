/**
 * THE FOUR VOICES, and the rules that stop them becoming one voice with four names.
 *
 *   npm run mentor
 *
 * Sam: "Give /Noticed a configurable Mentor type: The Coolest Teacher you had at School /
 * Your elder Brother's cool Best Mate / A Drill Sergeant / Your Gentle Dad — changing tone
 * of voice and potentially number of notifications", and then "add the pick your mentor
 * concept to the walk through and have some fun with it".
 *
 * WHAT THIS DEFENDS:
 *
 *   every voice is actually different. The failure mode of a feature like this is not a
 *      crash, it is four names over copy that drifted together — somebody edits the
 *      sergeant to be a bit kinder, the dad to be a bit firmer, and six months later
 *      nobody can tell them apart and the picker is a lie. Asserted line by line.
 *
 *   the mentor changes HOW, never WHAT. noticed() must produce the same observations in
 *      every voice: same ids, same subjects, same count. A product where the drill
 *      sergeant notices different things from the gentle dad is four products.
 *
 *   nobody is cruel. The repo's rule is that a miss "names the instrument, never the
 *      person" — so no voice, including the sergeant's, may call the learner a name or
 *      tell them they are bad at this. The sergeant is loud about the SENTENCE.
 *
 *   the picker survives the walk's own filter. Steps are dropped when their control is
 *      not on screen, and the mentor step has no control at all — so the one thing that
 *      would silently delete this whole feature is a filter that forgets to allow it.
 *
 *   an unknown mentor falls back. A record naming a mentor this build does not have must
 *      sound like the default, not crash the screen that was about to compliment someone.
 */
import { readFileSync } from 'node:fs'
import { MENTORS, DEFAULT_MENTOR, mentorFor, type MentorId } from '../content/mentors'
import { noticed } from '../content/noticed'
import { WALK } from '../content/walk'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

console.log('\nfour people, not four labels\n')
{
  ok('all four Sam named are here', MENTORS.length === 4, MENTORS.map((m) => m.id).join(', '))

  /*
    EVERY LINE IS DIFFERENT IN EVERY VOICE. Compared field by field rather than as whole
    objects: two mentors sharing one `rough` line is the exact way this decays, and it
    would pass any check that only asked whether the objects differed somewhere.
  */
  const FIELDS = ['won', 'stuck', 'nudge', 'rough', 'nearly', 'quiet', 'nothing'] as const
  const shared: string[] = []
  for (const field of FIELDS) {
    const seen = new Map<string, MentorId>()
    for (const m of MENTORS) {
      const line = m.voice[field]
      const had = seen.get(line)
      if (had) shared.push(field + ': ' + had + ' and ' + m.id)
      else seen.set(line, m.id)
    }
  }
  ok(
    'no two mentors say the same thing',
    shared.length === 0,
    shared.slice(0, 3).join(' | ') || FIELDS.length + ' lines × 4 voices, all distinct',
  )

  /* The cold line is a function, so it is compared at a value. */
  const colds = new Set(MENTORS.map((m) => m.voice.cold(3)))
  ok('and the count line differs too', colds.size === 4, [...colds].length + ' of 4')

  /*
    THE SAMPLE IS WHAT THE PICKER SHOWS, and it has to be the voice it advertises. A card
    whose sample was written separately from the voice would sell a mentor that does not
    exist — so it must BE one of that mentor's own lines.
  */
  const mismatched = MENTORS.filter((m) => m.sample !== m.voice.rough)
  ok(
    'the picker quotes a line the mentor actually says',
    mismatched.length === 0,
    mismatched.map((m) => m.id).join(', ') || 'sample is the stuck line',
  )

  ok(
    'the default is one of them',
    MENTORS.some((m) => m.id === DEFAULT_MENTOR),
    DEFAULT_MENTOR,
  )
  ok(
    'an unknown id falls back rather than throwing',
    mentorFor('nobody' as MentorId).id === DEFAULT_MENTOR && mentorFor(null).id === DEFAULT_MENTOR,
    'mentorFor(null) → ' + DEFAULT_MENTOR,
  )
}

console.log('\nnobody is cruel\n')
{
  /*
    A line about the PERSON rather than about the sentence. The sergeant is allowed to be
    loud — "unacceptable" is about a sentence that keeps winning — and no voice is allowed
    to tell somebody they are stupid, lazy, hopeless or bad at this.
  */
  const NASTY = /\b(stupid|idiot|useless|pathetic|hopeless|lazy|weak|embarrassing|terrible|awful|failure|fail)\b/i
  const cruel: string[] = []
  for (const m of MENTORS) {
    const lines = [...Object.values(m.voice).map((v) => (typeof v === 'function' ? v(3) : v)), m.sample, m.who]
    for (const line of lines) if (NASTY.test(line)) cruel.push(m.id + ': "' + line + '"')
  }
  ok(
    'no voice insults the learner',
    cruel.length === 0,
    cruel.slice(0, 3).join(' | ') || 'loud about the work, never about the person',
  )

  /*
    And the one Sam asked for explicitly: how often each would get in touch. The dad never
    nagging is the character, said in config — if every mentor nudges the same amount, the
    "potentially number of notifications" half of the brief has quietly gone.
  */
  const nudgeKinds = new Set(MENTORS.map((m) => m.nudges))
  ok(
    'they do not all nag the same amount',
    nudgeKinds.size >= 2 && MENTORS.some((m) => m.nudges === 'none'),
    [...nudgeKinds].join(', '),
  )
}

console.log('\nthe voice changes, the facts do not\n')
{
  const me = {
    proof: [
      { pt: 'Sou de Edinburgh.', en: 'x', clean: true, at: '2026-10-01', source: 'release' },
      { pt: 'Tenho fome.', en: 'x', clean: true, at: '2026-10-02', source: 'release' },
      { pt: 'Não quero.', en: 'x', clean: true, at: '2026-10-03', source: 'release' },
      { pt: 'Quero ver.', en: 'x', clean: false, at: '2026-10-04', source: 'release' },
    ],
    rough: [{ pt: 'Queres vir comigo ao concerto?', en: 'x', goes: 5, at: '2026-10-03' }],
  } as Parameters<typeof noticed>[0]

  const runs = MENTORS.map((m) => noticed({ ...me, mentor: m.id }))
  const shape = (ns: ReturnType<typeof noticed>) =>
    ns.map((n) => n.id + '|' + n.tone + '|' + (n.about ?? '')).join(' / ')
  const shapes = new Set(runs.map(shape))
  ok(
    'every mentor notices exactly the same things',
    shapes.size === 1,
    shapes.size === 1 ? runs[0].length + ' observations, identical in all four' : [...shapes].join('  VS  '),
  )

  const wordings = new Set(runs.map((ns) => ns.map((n) => n.say).join(' / ')))
  ok(
    'and says them in four different ways',
    wordings.size === 4,
    wordings.size + ' of 4 wordings',
  )
}

console.log('\nthe picker is reachable\n')
{
  const step = WALK.find((s) => s.pick === 'mentor')
  ok('the walk has a mentor step', Boolean(step), step?.id ?? 'missing')
  ok(
    'it points at nothing, because it asks rather than shows',
    step?.target === '',
    JSON.stringify(step?.target),
  )

  /*
    THE FILTER THAT WOULD DELETE IT. components/Walkthrough.tsx drops a step whose control
    is absent, and this step has no control — so the allowance has to be explicit. Read
    from the source because this is a one-character failure: `s.target &&` instead of
    `!s.target ||` removes the entire feature and every other step still works.
  */
  const walk = readFileSync('components/Walkthrough.tsx', 'utf8')
  const allows = /!s\.target\s*\|\|/.test(walk)
  ok(
    'and the walk keeps a step that has no target',
    allows,
    allows
      ? 'the filter allows an empty target'
      : 'the filter would drop the picker — the whole feature disappears silently',
  )
  ok(
    'the question is answered by tapping a mentor, not by NEXT',
    /chooseMentor\(/.test(walk) && /PICK FOR ME/.test(walk),
    'tap chooses; the button opts out',
  )
}

console.log(
  '\n' +
    (problems.length
      ? '✗ ' + problems.length + ' problem(s)\n' + problems.map((p) => '  - ' + p).join('\n')
      : '✓ four voices, one set of facts') +
    '\n',
)
process.exit(problems.length ? 1 : 0)
