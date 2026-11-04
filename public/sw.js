/**
 * DUB service worker.
 *
 * Its only job today is push. The notification carries the whole lesson — the
 * Portuguese in the title, the translation and the note in the body — because the
 * point of The Line is that reading it on a lock screen is already worth something.
 * Opening the app is optional and never nagged for.
 */

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'DUB', body: event.data ? event.data.text() : '' }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'DUB', {
      body: data.body || '',
      icon: '/icon',
      badge: '/icon',
      // Replace yesterday's of the same kind rather than stacking a column of unread guilt;
      // a table reminder has its own tag so it never knocks the morning line off.
      tag: data.tag || 'dub-line',
      renotify: true,
      data: { url: data.url || '/line' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/line'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      /*
        An app already open is brought forward and taken to the room, rather than a second
        window being opened beside it. navigate() only works on a window this worker
        controls, so anything else falls back to opening one.
      */
      const open = list.find((c) => 'focus' in c)
      if (open) {
        return open
          .focus()
          .then((c) => (c && 'navigate' in c ? c.navigate(url) : self.clients.openWindow(url)))
          .catch(() => self.clients.openWindow(url))
      }
      return self.clients.openWindow(url)
    }),
  )
})

/*
 * NAVIGATIONS GO TO THE NETWORK, ALWAYS.
 *
 * Reported as "opening it from the home screen shows an old version", and that is iOS doing
 * what iOS does: a standalone web app holds its shell and does not revalidate the document
 * on launch, so somebody can be looking at a build from days ago while the deploy that
 * fixed their bug is sitting on the server. It is a bad enough failure on its own; it is
 * worse when it makes every fix look like it did not work.
 *
 * `cache: 'reload'` is the point — it bypasses the HTTP cache rather than merely asking it
 * nicely. Only navigations, so scripts, images and audio still come from the cache where
 * they belong and the app is not slower for it.
 *
 * Offline still works exactly as well as it did, which is to say not at all: if the network
 * refuses, this hands the request back to the browser to fail in its usual way rather than
 * inventing an error page nobody has designed.
 */
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.mode !== 'navigate') return
  event.respondWith(
    fetch(req, { cache: 'reload' }).catch(() => fetch(req)),
  )
})

/*
 * And the new worker takes over immediately rather than waiting for every tab to close.
 *
 * Without these, a fix to the worker itself would sit behind the very staleness it exists
 * to remove.
 */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
