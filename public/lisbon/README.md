# Lisbon — the city layer

The evidence register. Deliberately unglamorous, because these are not selling the place,
they are making it recognisable before somebody is standing in it. That is most of what
being nervous in a foreign shop actually is.

| file | for | orientation |
|---|---|---|
| `pharmacy.jpg` | the pharmacy errand — **in use** | portrait |
| `bakery-queue.jpg` | a queue/ordering situation | portrait |
| `cafe-counter.jpg` | a café/coffee situation | portrait |
| `junta-doorway.jpg` | Junta de Freguesia, the NIF errand | portrait |
| `azulejo.jpg` | texture, quiet ground for type | portrait |
| `calcada.jpg` | texture, quiet ground for type | portrait |
| `wall.jpg` | texture, quiet ground for type | landscape |
| `tram-distant.jpg` | a share card alternate | landscape |

Everything here is **generated**, recorded as `rights_status: 'generated'` on the
Situation that uses it. Nobody to credit and no licence to hold. If a real photograph ever
replaces one, that one needs both, and the field is where they go.

## The rule these follow

The front door sells the destination and is allowed to be beautiful. **Nothing in here
is.** An image that could sell any city is the wrong image for this folder — the test is
whether it looks like a Tuesday.

## Adding one

Give the Situation an `image` with `src`, `alt` and `rights_status`. The lint requires all
three, requires the alt to be long enough to actually replace the picture, and refuses a
remote `src` because a hotlink breaks silently.
