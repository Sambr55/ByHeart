/**
 * What the product says about whose copy this is.
 *
 * One screen, and it only ever appears to somebody who has hit the refusal — two people's
 * records on one device, which is a shared laptop or a phone lent to a friend. Written to
 * be read by the SECOND person, who has done nothing wrong and is being told something
 * confusing about a device that is not theirs.
 *
 * The tone that matters: nothing is broken, nothing is lost, and the account's own record
 * is untouched on the server. Every one of those is true, and saying so is the difference
 * between an explanation and an error message.
 */
export const IDENTITY = {
  orphan_eyebrow: 'ANOTHER ACCOUNT',
  orphan_head: 'There is somebody else’s work on this device.',
  /*
    Says what happened, what was not done, and where their own record is — in that order,
    because that is the order the questions arrive in.
  */
  orphan_body:
    'Someone signed in here before you and their Portuguese is still saved on this browser. We have not merged it into your account and we will not — it is theirs. Everything of yours is safe on our side and comes back the moment this device has room for it.',
  orphan_reset: 'CLEAR THIS DEVICE AND START',
  /*
    The other option is simply to walk away, and it is worth saying so: on a borrowed
    laptop, doing nothing is the right answer and the product should not push.
  */
  orphan_note:
    'Clearing wipes what is saved in this browser and pulls your own record down instead. If this is not your device, you can simply sign out and leave it as it was.',
} as const
