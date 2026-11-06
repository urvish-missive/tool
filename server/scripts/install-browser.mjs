import 'dotenv/config'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { configurePortalBrowserEnvironment, getPortalBrowserConnection } from '../src/utils/portalBrowserRuntime.js'

try {
  if (getPortalBrowserConnection().mode === 'remote') {
    console.log('[portal-browser] Remote Chromium configured; local browser download skipped.')
    process.exit(0)
  }
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

const require = createRequire(import.meta.url)
const cli = join(dirname(require.resolve('playwright/package.json')), 'cli.js')
const args = ['install', 'chromium']
if (process.argv.includes('--with-deps')) args.push('--with-deps')

console.log('[portal-browser] Installing Chromium for this deployment.')
const result = spawnSync(process.execPath, [cli, ...args], {
  env: configurePortalBrowserEnvironment({ ...process.env }),
  stdio: 'inherit',
  windowsHide: true,
})
if (result.error || result.status !== 0) {
  console.error('[portal-browser] Installation failed. Run npm run browser:install in server/. On Linux, npm run browser:install:deps also installs required system libraries.')
  process.exit(result.status || 1)
}
