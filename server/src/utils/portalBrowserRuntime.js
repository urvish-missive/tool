// Install and launch from the same application-local path, independent of the
// build/runtime user's home directory. Explicit host paths take precedence.
export function configurePortalBrowserEnvironment(env = process.env) {
  if (!env.PLAYWRIGHT_BROWSERS_PATH) env.PLAYWRIGHT_BROWSERS_PATH = '0'
  return env
}

export async function launchPortalBrowser(options = {}) {
  configurePortalBrowserEnvironment()
  const { chromium } = await import('playwright')
  return chromium.launch({ headless: true, timeout: 15000, ...options })
}
