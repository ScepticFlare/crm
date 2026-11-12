import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { env } from 'node:process'

import { makeBuildInfo } from './build/buildInfo.js'

// One id per build: compiled into the bundle (import.meta.env.VITE_BUILD_ID) and
// published next to it as /version.json, so an open tab can notice that a newer
// build has been deployed and offer a refresh (src/hooks/useFrontendUpdate.js).
// See DEPLOYMENT.md for the cache headers this relies on.
const buildInfo = makeBuildInfo(env)

const versionFile = {
  name: 'crm-version-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(buildInfo) + '\n' })
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionFile],
  define: {
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildInfo.buildId),
    'import.meta.env.VITE_BUILD_COMMIT': JSON.stringify(buildInfo.commit || ''),
  },
})
