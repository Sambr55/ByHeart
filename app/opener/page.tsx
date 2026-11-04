import { Opener } from '@/components/Opener'

export const metadata = {
  title: 'My opening line — DUB',
  /* Its own manifest and home-screen name, so an iPhone can give it an icon of its own. */
  manifest: '/opener/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'My line', statusBarStyle: 'black-translucent' as const },
}

/**
 * /opener — "My opening line", the rescue card (Sam, 2026-11-02).
 *
 * A new route rather than /line, which already exists and is a different thing: /line is
 * "Today", the daily line and its push notification. This one is for the pavement outside
 * a shop — the next room's first line and the save under it, at arm's length. See
 * components/Opener.tsx.
 *
 * Its own URL so the manifest can point a home-screen shortcut at it (app/manifest.ts).
 * Everything on it is read from the learner on the device, so the server renders a shell.
 */
export default function OpenerPage() {
  return <Opener />
}
