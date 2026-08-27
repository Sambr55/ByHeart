# Lisbon — the city layer

The evidence register. Deliberately unglamorous, because these are not selling the place,
they are making it recognisable before somebody is standing in it. That is most of what
being nervous in a foreign shop actually is.

| file | for | orientation |
|---|---|---|
| `pharmacy.jpg` | The pharmacy — **in use** | portrait |
| `cafe-counter.jpg` | A coffee, standing up — **in use** | portrait |
| `bakery-queue.jpg` | The bread queue — **in use** | portrait |
| `junta-doorway.jpg` | The Junta de Freguesia — **in use** | portrait |
| `tram-distant.jpg` | Getting on the 28 — **in use** | landscape |
| `azulejo.jpg` | texture, quiet ground for type | portrait |
| `calcada.jpg` | texture, quiet ground for type | portrait |
| `wall.jpg` | texture, quiet ground for type | landscape |

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
