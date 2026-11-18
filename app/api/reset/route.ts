import { NextResponse } from 'next/server'
import { currentUser, deviceId, endSession, ensureDevice, forgetDevice } from '@/lib/auth'
import { forgetDeviceComp, moveDeviceComp } from '@/lib/comp'
import { forgetAccountLearner, forgetLearnerFor } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Start again on this device — the half that has to happen on the server.
 *
 * Clearing localStorage was not enough and the reason is worth stating, because it is
 * the sync working rather than failing. The device cookie is httpOnly, so no script can
 * clear it; the server holds a learner row keyed to that cookie; and restoreLearner
 * merges it back on the next page load. mergeLearner may only ever GAIN, so an emptied
 * local copy plus a full remote one produces the full one again. The wipe was being
 * undone by the invariant that makes syncing safe in the first place.
 *
 * So: delete the row, then drop the cookie that finds it.
 *
 * SAFE BY CONSTRUCTION. It reads the device id from the caller's own httpOnly cookie and
 * touches nothing else, so it cannot reach another person's data however it is called.
 *
 * TESTER ACCESS SURVIVES. A comp code redeemed on this device is bound to the cookie
 * this deletes, so a tester who resets in order to look at the first-run experience —
 * the exact thing testers are asked to do — would have silently landed back behind the
 * paywall. The grant is carried to the new device id. Progress goes; access does not.
 *
 * TWO RESETS, AND THE ANSWER SAYS WHICH ONE HAPPENED (2026-11-18).
 *
 *   this phone (the default)  — this device's copy goes, the device cookie goes, and anybody
 *                               signed in is signed out. The ACCOUNT is not touched: signing
 *                               back in with the email brings it all back, which is exactly
 *                               what a returning learner should get.
 *   ?scope=everywhere         — the account's copy goes too. Only for somebody signed in,
 *                               because deleting an account's work needs proof it is theirs.
 *                               (`?signout=1` is the old spelling and means the same.)
 *
 * Sam reset, typed his email, and his old lessons came back. He was not signed in on that
 * browser when he reset, so `if (user)` skipped the account delete — and the screen said
 * "Your account copy is gone too. Nothing will come back." anyway, because it reported the
 * box he ticked rather than what the server did. So the answer now carries
 * `account_cleared`, and the screen reads that.
 */
export async function POST(request: Request) {
  const user = await currentUser()
  const params = new URL(request.url).searchParams
  const everywhere = params.get('scope') === 'everywhere' || params.get('signout') === '1'
  /*
    ?comp=drop turns this device back into an ordinary free one.

    Without it a comp follows every reset, which is right for a tester who was given the
    product and wrong for anybody trying to see what a new person sees — including the
    person who built it, who could not reach the paywall on any device.
  */
  const dropComp = params.get('comp') === 'drop'

  /*
    EVERYWHERE NEEDS SOMEBODY TO BE EVERYWHERE AS. Refused before anything is touched, so
    the learner can sign in and ask again with nothing half done.
  */
  if (everywhere && !user) {
    return NextResponse.json(
      {
        ok: false,
        need_sign_in: true,
        reason: 'Sign in first — deleting your account\'s copy needs proof the account is yours.',
      },
      { status: 401 },
    )
  }

  /*
    THE ACCOUNT'S COPY, when asked for. Read BEFORE endSession, because after it there is
    no user to scope the delete to. (Sam, earlier: "I got into the club even though I have
    no legend" — the account row still held club_welcomed_at, and the next sign-in merged
    it back. Half a reset is worse than none.)
  */
  let accountCleared = false
  if (user && everywhere) {
    await forgetAccountLearner(user.id)
    accountCleared = true
  }
  /* Either way this phone stops being signed in: a fresh phone is a guest. */
  const signedOut = Boolean(user)
  if (user) await endSession()

  const device = await deviceId()
  // Nothing to forget is a success: the caller wanted a clean device and has one.
  if (device) await forgetLearnerFor(device)
  await forgetDevice()

  /*
    Mint the replacement here rather than leaving it to the next request, because the grant
    needs somewhere to land and this is the only moment both ids are known.

    The comp is carried across on purpose: a tester should not lose what they were given
    because they wanted a clean run. But carrying it ALWAYS means somebody comped can never
    see the free tier again, on any device, however many times they reset — which is how
    "I never see the paygate" turns out to be true and by design at the same time.

    So it is a choice now. Drop it and this device becomes an ordinary free one.
  */
  let keptComp = false
  let droppedComp = false
  if (device) {
    const fresh = await ensureDevice()
    if (dropComp) {
      await forgetDeviceComp(device)
      droppedComp = true
    } else {
      keptComp = await moveDeviceComp(device, fresh)
    }
  }

  return NextResponse.json({
    ok: true,
    forgot: Boolean(device),
    account_cleared: accountCleared,
    signed_out: signedOut,
    kept_comp: keptComp,
    dropped_comp: droppedComp,
  })
}
