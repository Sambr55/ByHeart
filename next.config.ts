import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The home directory above this project is itself a git repo; pin the root so
  // Turbopack does not walk up and pick up an unrelated lockfile.
  turbopack: { root: __dirname },
  /*
    SOURCEMAPS IN PRODUCTION, so a crash on a phone names a file rather than a letter.

    Sam photographed the error screen and it read "undefined is not an object (evaluating
    'e.target')". That `e` is a minified parameter: it could be any handler in the bundle,
    and the message is the same whichever one it was. Reading the code for candidates
    found four plausible ones and none of them was it, because a guess is not a diagnosis.

    With maps served, the stack the error screen already records carries real file names
    and line numbers — which turns that same screenshot into an address.

    The cost is that the sources are readable by anybody who opens devtools. There is no
    secret in this bundle: the content ships to the device anyway, the keys are on the
    server, and a learner's record never leaves their phone. A crash nobody can locate is
    the more expensive of the two.
  */
  productionBrowserSourceMaps: true,
}

export default nextConfig
