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
      tag: 'dub-line',
      // Replace yesterday's rather than stacking a column of unread guilt.
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
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
