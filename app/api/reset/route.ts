import { NextResponse } from 'next/server'
import { currentUser, deviceId, endSession, ensureDevice, forgetDevice } from '@/lib/auth'
import { forgetDeviceComp, moveDeviceComp } from '@/lib/comp'
import { forgetLearnerFor } from '@/lib/store'

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
 * A SIGNED-IN LEARNER IS REFUSED. Their account is the durable copy and this endpoint
 * would delete a device row while the account quietly restored it — a reset that looks
 * like it failed. Sign out first, which this also does on request, and then reset.
 */
export async function POST(request: Request) {
  const user = await currentUser()
  const alsoSignOut = new URL(request.url).searchParams.get('signout') === '1'
  /*
    ?comp=drop turns this device back into an ordinary free one.

    Without it a comp follows every reset, which is right for a tester who was given the
    product and wrong for anybody trying to see what a new person sees — including the
    person who built it, who could not reach the paywall on any device.
  */
  const dropComp = new URL(request.url).searchParams.get('comp') === 'drop'

  if (user && !alsoSignOut) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          'You are signed in, so this device is not the only copy — your account would ' +
          'restore it. Sign out first.',
        signed_in: true,
      },
      { status: 409 },
    )
  }

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
    kept_comp: keptComp,
    dropped_comp: droppedComp,
  })
}
