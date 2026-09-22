'use client'


/**
 * The journey, drawn — where you are and what is next.
 *
 * Two problems, one shape. The deal screen explained a six-stage ladder that the product
 * no longer shows anywhere, so a learner was briefed on a system they would never see;
 * and a learner who finished the basics and two crates hit a screen saying "nothing new
 * is open" with no link on it and no idea that a gate was the next thing.
 *
 * So the same five steps are drawn in both places, with the current one marked. It is
 * the answer to "what happens next", and it is worth more than any of the prose it
 * replaces.
 */
interface Step {
  id: string
  label: string
  note: string
  /** The one step that is a door rather than a place. Drawn differently. */
  gate?: boolean
}

export const PATH: Step[] = [
  { id: 'basics', label: 'The basics', note: 'Hello, thank you, yes, no, one to ten.' },
  /* "the free three" was wrong twice over — FREE_CRATES is 5, and this step is the door's
     three chosen vibes rather than the allowance. It names neither number now, because
     the step is about choosing and the counts live where they are enforced. */
  { id: 'picking', label: 'Vibes you pick', note: 'Any you like, and they stay yours.' },
  /*
    THE LEGEND BEFORE THE GATE, because that is the order it happens in.

    Membership sat above "Your Legend opens", which drew the door as something you pay
    your way past — and it is not: the Legend opens on the free tier, off the basics and
    the vibes somebody has already chosen, and the Club behind it is what membership is
    for. Drawn the old way, the map answered "how do I open my Legend" with "pay", which
    is both wrong and the worst possible wrong answer on the one screen selling the thing.

    And the note said "When the basics are done", which is the half-truth that cost Sam a
    session: the door is the basics AND the vibes. Naming both halves here costs four
    words and is the whole reason this step is on the map.
  */
  { id: 'legend', label: 'Your Legend opens', note: 'Once the basics and your vibes are done.' },
  { id: 'gate', label: 'Membership', note: 'If you want to carry on.', gate: true },
  { id: 'club', label: 'Dub Club', note: 'Where your Legend grows.' },
]

export function Path({ at, className = '' }: { at: number; className?: string }) {
  return (
    <ol className={'flex flex-col ' + className} aria-label="Where you are">
      {PATH.map((step, i) => {
        const done = i < at
        const here = i === at
        return (
          <li key={step.id} className="flex gap-3">
            {/* The rail and the marker. Drawn with borders rather than an SVG so it
                scales with the text and needs no viewBox. */}
            <div className="flex w-3 shrink-0 flex-col items-center">
              <span
                aria-hidden
                className={
                  'mt-1 h-3 w-3 shrink-0 border-2 ' +
                  (step.gate ? 'rotate-45 ' : 'rounded-full ') +
                  (done
                    ? 'border-accent bg-accent'
                    : here
                      ? 'border-accent bg-bg'
                      : 'border-line-strong bg-bg')
                }
              />
              {i < PATH.length - 1 ? (
                <span
                  aria-hidden
                  className={'w-0.5 flex-1 ' + (done ? 'bg-accent' : 'bg-line')}
                />
              ) : null}
            </div>
            <div className={'flex flex-col gap-1 pb-6 ' + (here ? '' : 'opacity-70')}>
              <span className={'text-sm ' + (here ? 'font-semibold text-accent' : 'font-semibold')}>
                {step.label}
                {here ? <span className="ml-3 text-xs font-normal text-accent">you are here</span> : null}
              </span>
              <span className="text-xs leading-relaxed text-muted">{step.note}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
