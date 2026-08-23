import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The home directory above this project is itself a git repo; pin the root so
  // Turbopack does not walk up and pick up an unrelated lockfile.
  turbopack: { root: __dirname },
}

export default nextConfig
