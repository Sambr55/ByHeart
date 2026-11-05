import { DrawPage } from '@/components/venues/DrawPage'
import { DRAW_TERMS, HOLIDAY_PRIZE } from '@/content/board'
import { drawOn, holidayOn } from '@/lib/venue-rules'

export const metadata = { title: 'The DUB prize draw' }
export const dynamic = 'force-dynamic'

export default function Draw() {
  const live = drawOn() && DRAW_TERMS !== null
  return <DrawPage live={live} terms={live ? DRAW_TERMS : null} holiday={live && holidayOn() ? HOLIDAY_PRIZE : null} />
}
