import 'dotenv/config'
import { configurePortalBrowserEnvironment, launchPortalBrowser, browserStartupError } from '../src/utils/portalBrowserRuntime.js'

configurePortalBrowserEnvironment()
console.log(JSON.stringify({ node: process.version, platform: process.platform, architecture: process.arch,
  browserMode: process.env.PORTAL_BROWSER_CDP_ENDPOINT ? 'remote' : 'local',
  browserPath: process.env.PORTAL_BROWSER_CDP_ENDPOINT ? undefined : process.env.PLAYWRIGHT_BROWSERS_PATH }, null, 2))
let browser
let context
try {
  // No portal login, credentials, cookies, or external page is used in this check.
  browser = await launchPortalBrowser()
  context = await browser.newContext()
  const page = await context.newPage()
  await page.setContent('<title>Portal browser check</title><p>Browser is running</p>')
  if (await page.title() !== 'Portal browser check') throw new Error('Browser page check failed')
  console.log('PASS: Browser connected and rendered a page in an isolated session.')
} catch (error) {
  const diagnostic = browserStartupError(error)
  console.error(JSON.stringify({ code: diagnostic.code, error: diagnostic.message }, null, 2))
  // Admin-only CLI output from an empty browser, never from a user portal run.
  if (!process.env.PORTAL_BROWSER_CDP_ENDPOINT) {
    console.error('Startup details (no portal credentials were used):')
    console.error(String(error.message || error).replace(/\u001b\[[0-9;]*m/g, '').slice(0, 8000))
  }
  process.exitCode = 1
} finally {
  if (context) await context.close().catch(() => {})
  if (browser) await browser.close().catch(() => {})
}
