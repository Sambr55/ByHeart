import { createHash } from 'node:crypto'

/** A 4-digit staff PIN, salted with the venue so one venue's PIN is no use at another. */
export function pinHash(gem: string, pin: string): string {
  return createHash('sha256').update('dub-venue:' + gem + ':' + pin).digest('hex')
}
