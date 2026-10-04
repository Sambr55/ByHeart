import { Get } from '@/components/Get'

export const metadata = {
  title: 'Add DUB to your phone',
  /* A page for a printed QR code, not for a search result. */
  robots: { index: false, follow: false },
}

/**
 * /get — where the QR code points.
 *
 * Sam, handing out codes at a festival: "I was hoping to put it even pre-home page so then
 * it's just a straight click." This is that page. The straight click is not available on
 * iOS — see the note on the component — but a screen whose only job is the install is.
 *
 * Dynamic because the component branches on the device after mount and there is nothing
 * worth caching: one photograph and one instruction.
 */
export const dynamic = 'force-dynamic'

export default function GetPage() {
  return <Get />
}
