'use client'

/**
 * A profile photo, on this device and nowhere else.
 *
 * Kept in its OWN storage key rather than on the learner, and that is the whole design
 * decision. The learner blob syncs — it is posted to /api/session, merged, and written to
 * every row this person owns — so putting a photograph of somebody's face on it would
 * quietly ship their face to a server that has no use for it. Nothing in DUB needs this
 * off the phone, so nothing takes it off the phone.
 *
 * It is downsized before it is stored, because a modern phone camera produces four
 * megabytes and localStorage gives you about five.
 */
const KEY = 'byheart.avatar.v1'
const SIZE = 256

export function getAvatar(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(KEY)
  } catch {
    // Private windows and blocked site data both throw. An avatar is not worth a crash.
    return null
  }
}

export function clearAvatar() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing to do, and nothing worth telling anybody */
  }
}

/**
 * Read a file, square it off, shrink it, keep it.
 *
 * Centre-cropped rather than squashed: a face stretched into a square is worse than a
 * face with its edges trimmed, and every avatar in the product is round or square.
 */
export async function setAvatarFromFile(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) return null
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const side = Math.min(img.width, img.height)
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
    const data = canvas.toDataURL('image/jpeg', 0.82)
    try {
      localStorage.setItem(KEY, data)
    } catch {
      // Out of quota, or storage blocked. The picture is not important enough to break
      // the screen it is on.
      return null
    }
    return data
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}
