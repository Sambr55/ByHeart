import { Wordmark } from '@/components/Wordmark'

/**
 * THE MEMBERSHIP CARD (2026-11-18).
 *
 * Sam, about sign-in: "it doesn't feel meaty enough." Typing a code and landing on a
 * settings page is a login, not a moment. Signing in now makes you a sócio of the Dub Club,
 * and this is what you come away with: a card with your number on it, the date you joined,
 * and the city. It sits at the top of /account for good.
 *
 * EVERY LABEL IS A LESSON. Sócio nº, sócio desde, the date in Portuguese: the card teaches the
 * words for the thing it is, with the English underneath in small type. Sócia for somebody who
 * has said she is a woman — the same choice the lessons make.
 *
 * The number is null before migration 021 has run; the card then simply leaves it off.
 */
export function MemberCard({
  no,
  since,
  name,
  feminine = false,
  tier = 'free',
  city = 'Lisboa',
}: {
  no: number | null
  since: string
  name: string
  feminine?: boolean
  tier?: 'free' | 'pro' | 'comp'
  city?: string
}) {
  const word = feminine ? 'Sócia' : 'Sócio'
  const joined = new Date(since).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
  const level = tier === 'pro' ? word + ' Pro' : tier === 'comp' ? word + ' convidad' + (feminine ? 'a' : 'o') : word
  const levelEn = tier === 'pro' ? 'Pro member' : tier === 'comp' ? 'guest member' : 'member'
  return (
    <section
      data-testid="member-card"
      aria-label={'Dub Club membership card' + (no ? ', number ' + no : '')}
      className="relative overflow-hidden rounded-2xl bg-[#1f5d8c] px-5 py-5 text-white shadow-sm"
    >
      {/* The tile, faintly: a card from Lisbon should look like it came from Lisbon. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, transparent 38%, #fff 39%, #fff 41%, transparent 42%), linear-gradient(45deg, transparent 47%, #fff 48%, #fff 52%, transparent 53%)',
          backgroundSize: '36px 36px',
        }}
      />
      <div className="relative flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <Wordmark mark="club" className="h-4 text-white" />
          <p className="eyebrow text-white/80">{city}</p>
        </div>

        <div>
          <p className="eyebrow text-white/70" lang="pt-PT">
            {word} nº
          </p>
          <p className="text-[0.7rem] italic text-white/60">member number</p>
          <p className="display mt-1 text-4xl tabular-nums tracking-wide" data-testid="member-no">
            {no ? String(no).padStart(4, '0') : '—'}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{name}</p>
            <p className="text-xs text-white/80">
              {level} <span className="text-white/55">· {levelEn}</span>
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="eyebrow text-white/70" lang="pt-PT">
              {word} desde
            </p>
            <p className="text-[0.7rem] italic text-white/60">member since</p>
            <p lang="pt-PT" className="text-xs">
              {joined}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
