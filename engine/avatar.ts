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

/*
  AND A SECOND COPY IN INDEXEDDB, because iOS throws the first one away.

  Sam uploaded a photo, came back to the same phone later, and it was gone. It was not a
  bug in this file — the write succeeds, it survives a reload, and it is still there after
  a navigation. What happens is Safari: localStorage for a web app is evicted under
  storage pressure and after seven days without opening the app, and a home-screen DUB is
  exactly the case that rule was written for.

  Two changes, neither of which is a workaround for the other:

  IndexedDB holds the picture as well. Safari's seven-day rule applies to script-writable
  storage generally, but eviction under pressure hits localStorage first and hardest, and
  IndexedDB is where a 45KB blob belonged anyway — localStorage is a small synchronous
  key-value store being asked to hold a photograph.

  And `navigator.storage.persist()` asks the browser not to evict at all. It is a request
  rather than a guarantee and Safari often refuses it, which is why it is not the whole
  fix — but on the installed PWA, which is the case that matters here, it is frequently
  granted, and it protects the learner record too.

  localStorage stays as the fast path. It is synchronous, so the photo is on screen in the
  first render rather than a frame later, and IndexedDB refills it when it has been wiped.
*/
const DB = 'byheart'
const STORE = 'avatar'

function idb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null)
      const req = indexedDB.open(DB, 1)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      /* Safari can leave this pending for ever in a private window. */
      setTimeout(() => resolve(null), 2000)
    } catch {
      resolve(null)
    }
  })
}

async function idbPut(value: string | null) {
  const db = await idb()
  if (!db) return
  try {
    const tx = db.transaction(STORE, 'readwrite')
    if (value === null) tx.objectStore(STORE).delete(KEY)
    else tx.objectStore(STORE).put(value, KEY)
  } catch {
    /* A photo is not worth a crash. */
  }
}

async function idbGet(): Promise<string | null> {
  const db = await idb()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY)
      req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

/**
 * Ask the browser to stop evicting us.
 *
 * Covers the learner record as much as the photo — one grant protects everything this
 * origin stores. Called on the screens that own a person's things rather than at boot,
 * because Safari weighs the request against engagement and asking on first paint of a
 * landing page is the version most likely to be refused.
 */
export async function askToKeep(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false
    if (await navigator.storage.persisted?.()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export function getAvatar(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(KEY)
  } catch {
    // Private windows and blocked site data both throw. An avatar is not worth a crash.
    return null
  }
}

/**
 * The photo, from wherever it survived.
 *
 * Reads the fast copy first and falls back to IndexedDB, putting anything it finds there
 * back into localStorage — so a learner whose localStorage was evicted gets their face
 * back on the next visit rather than an ADD A PHOTO button.
 */
export async function loadAvatar(): Promise<string | null> {
  const fast = getAvatar()
  if (fast) return fast
  const kept = await idbGet()
  if (!kept) return null
  try {
    localStorage.setItem(KEY, kept)
  } catch {
    /* Still returned — the caller only needs it on screen. */
  }
  return kept
}

export function clearAvatar() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing to do, and nothing worth telling anybody */
  }
  void idbPut(null)
}

/**
 * THE ONES YOU CAN PICK INSTEAD OF TAKING A PHOTOGRAPH.
 *
 * Sam, beside the name field: "Add Avatar selector option and provide a selection to
 * choose from."
 *
 * WHY THERE HAS TO BE A SECOND WAY IN. The photo is optional and the screen says so, which
 * makes the real choice "a picture of my face, or nothing" — and a great many people
 * decline a camera on a screen they met four minutes ago and then have no face at all. The
 * copy beside the field already explains what the picture is FOR: "it will be useful when
 * you start sharing with friends." A blank circle is the one outcome that makes that
 * sentence false, and it is the outcome the layout was steering most people towards.
 *
 * DRAWN RATHER THAN DOWNLOADED. These are SVGs built here as data URIs, which means no
 * image files to ship, no network request on the one screen somebody is deciding whether
 * to continue, and nothing to go missing. They go through exactly the same storage path as
 * a photograph — the same key, the same IndexedDB copy, the same never leaving the device
 * — so everything downstream that reads an avatar reads one thing.
 *
 * NO FACES, AND THAT IS THE POINT. A set of cartoon people is a set of decisions about
 * skin, hair, gender and age made by somebody who has never met this person, and six of
 * them is six ways to be the wrong one. These are the azulejo palette the product is
 * already built out of: a tile, a colour, a letter-free mark. Nobody has to find
 * themselves in a drawing of somebody else.
 */
export const AVATARS: { id: string; label: string; svg: string }[] = (
  [
    ['tile', 'Blue tile', '#1f5d8c', '#e9e2d4'],
    ['sand', 'Sand', '#c9a227', '#241f1a'],
    ['tram', 'Tram yellow', '#e0b43b', '#241f1a'],
    ['river', 'River', '#2f6f6b', '#e9e2d4'],
    ['roof', 'Rooftop', '#b4573a', '#f2ece0'],
    ['night', 'Night', '#241f1a', '#e9e2d4'],
  ] as const
).map(([id, label, bg, ink]) => ({
  id,
  label,
  /*
    One mark, four times, turned — the azulejo construction, which is why four quarter
    arcs and nothing else. It reads as a tile at 64px and as a tile at 16px, which is the
    whole requirement: this thing appears beside a name in a share sheet and inside a
    circle on a card.

    encodeURIComponent rather than base64 so the string stays readable in storage and in a
    diff, and so a colour can be found by eye when one of these looks wrong.
  */
  svg:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect width="64" height="64" fill="' + bg + '"/>' +
        '<g fill="none" stroke="' + ink + '" stroke-width="3">' +
        '<path d="M32 4a28 28 0 0 1 28 28"/>' +
        '<path d="M60 32a28 28 0 0 1-28 28"/>' +
        '<path d="M32 60A28 28 0 0 1 4 32"/>' +
        '<path d="M4 32A28 28 0 0 1 32 4"/>' +
        '<circle cx="32" cy="32" r="11"/>' +
        '</g></svg>',
    ),
}))

/**
 * Keep a chosen avatar, by the same route a photograph takes.
 *
 * Not a separate key and not a separate field on the learner: everything that draws a
 * face in this product reads `getAvatar()`, and a second source would mean every one of
 * those places learning about two. What is stored is the picture itself, so nothing
 * downstream needs to know whether somebody chose it or took it.
 */
export function setAvatarFromPick(id: string): string | null {
  const picked = AVATARS.find((a) => a.id === id)
  if (!picked) return null
  void idbPut(picked.svg)
  void askToKeep()
  try {
    localStorage.setItem(KEY, picked.svg)
  } catch {
    /* In IndexedDB either way — see the note in setAvatarFromFile. */
  }
  return picked.svg
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
    /*
      IndexedDB first, and not conditional on localStorage working.

      If the quota is gone the synchronous write below throws, and the old code returned
      null there — losing the picture entirely on the one device where storage is tight.
      The durable copy is written regardless, so a full localStorage costs the fast path
      rather than the photo.
    */
    void idbPut(data)
    void askToKeep()
    try {
      localStorage.setItem(KEY, data)
    } catch {
      // Out of quota, or storage blocked. The picture is in IndexedDB either way, and
      // loadAvatar will find it.
    }
    return data
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}
