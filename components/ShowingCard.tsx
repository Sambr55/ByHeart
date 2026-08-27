import type { Snapshot } from '@/lib/share'

/**
 * Somebody's card, rendered the same way wherever it appears.
 *
 * Three sentences and an honest number. What is NOT here is the point of the component:
 * no name unless they set one, no photograph, no vibes they have opened, no when they
 * last used the app, no what they got wrong. Those are all things a social product would
 * put on a profile, and none of them are things anybody wanted to see.
 */
export function ShowingCard({ card, whose }: { card: Snapshot; whose: 'YOURS' | 'THEIRS' }) {
  // Your own card said "one thing they already knew" about you, which reads as a third
  // person describing you on your own screen.
  const mine = whose === 'YOURS'
  const knew = mine ? 'you already knew' : 'they already knew'
  return (
    <section className="rounded border border-line bg-bg-elev p-6">
      <p className="eyebrow text-accent">{whose}</p>
      <ul className="mt-3 flex flex-col gap-3">
        {card.lines.map((l) => (
          <li key={l.pt}>
            <p className="pt display text-balance text-2xl">{l.pt}</p>
            <p className="mt-1 text-sm text-muted">{l.en}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 border-t border-line pt-6 text-sm leading-relaxed text-muted">
        {card.count} said with nothing on screen to copy from, off{' '}
        {card.worlds === 1 ? 'one thing ' + knew : card.worlds + ' unrelated things'}.
      </p>
    </section>
  )
}
