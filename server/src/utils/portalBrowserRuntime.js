// Install and launch from the same application-local path, independent of the
// build/runtime user's home directory. Explicit host paths take precedence.
export function configurePortalBrowserEnvironment(env = process.env) {
  if (!env.PLAYWRIGHT_BROWSERS_PATH) env.PLAYWRIGHT_BROWSERS_PATH = '0'
  return env
}

export function browserStartupError(error) {
  if (error?.portalBrowser) return error
  const message = String(error?.message || '')
  let code = 'BROWSER_STARTUP_FAILED'
  let guidance = 'Chromium could not start on the server. Run npm run browser:check in server/ as the same user that runs the backend, and inspect its diagnostic output.'
  if (/Cannot find package|Cannot find module|Executable doesn't exist|executable.*does not exist/i.test(message)) {
    code = 'BROWSER_NOT_INSTALLED'
    guidance = 'The server browser runtime is missing. Run npm ci and npm run browser:install in server/, then restart the backend.'
  } else if (/error while loading shared libraries|Host system is missing dependencies|cannot open shared object file|libnss3|libatk|libgbm|GLIBC_[\d.]+.*not found/i.test(message)) {
    code = 'BROWSER_SYSTEM_DEPENDENCIES'
    guidance = 'Chromium cannot load its system libraries on this server. On a supported Linux host, an administrator must run npm run browser:install:deps in server/. Run npm run browser:check afterward.'
  } else if (/EACCES|EPERM|permission denied|operation not permitted/i.test(message)) {
    code = 'BROWSER_PERMISSION_DENIED'
    guidance = 'The host denied Chromium permission to start. Check executable permissions and whether this hosting plan allows browser subprocesses. Run npm run browser:check as the backend user.'
  } else if (/No usable sandbox|SUID sandbox|zygote.*sandbox|Running as root without/i.test(message)) {
    code = 'BROWSER_SANDBOX_UNAVAILABLE'
    guidance = 'Chromium cannot initialize on this host because of its sandbox configuration. Run npm run browser:check and ask the server administrator to configure a supported browser runtime.'
  } else if (/ENOEXEC|Exec format error|wrong ELF class|bad CPU type/i.test(message)) {
    code = 'BROWSER_PLATFORM_MISMATCH'
    guidance = 'The installed browser does not match the server OS or CPU. Run npm run browser:install on the production server rather than copying browser files from another machine.'
  } else if (/EAGAIN|ENOMEM|SIGKILL|out of memory|resource temporarily unavailable/i.test(message)) {
    code = 'BROWSER_RESOURCE_LIMIT'
    guidance = 'The host could not allocate resources for Chromium or terminated it. Check process and memory limits, then run npm run browser:check as the backend user.'
  } else if (/Timeout.*exceeded|timed out/i.test(message)) {
    code = 'BROWSER_STARTUP_TIMEOUT'
    guidance = 'Chromium did not start within the server launch timeout. Run npm run browser:check and inspect host resource limits.'
  }
  // No raw Playwright text in an API response: it can contain local paths or
  // browser output. The CLI check runs without portal credentials instead.
  return Object.assign(new Error(guidance), { status: 503, code, portalBrowser: true, cause: error })
}

export function getPortalBrowserConnection(env = process.env) {
  const endpoint = String(env.PORTAL_BROWSER_CDP_ENDPOINT || '').trim()
  if (!endpoint) return { mode: 'local' }
  try {
    const url = new URL(endpoint)
    if (!['wss:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('invalid endpoint')
  } catch {
    throw Object.assign(new Error('PORTAL_BROWSER_CDP_ENDPOINT must be a secure HTTPS or WSS Chromium CDP endpoint configured by the server administrator.'),
      { status: 503, code: 'BROWSER_REMOTE_CONFIG_INVALID', portalBrowser: true })
  }
  return { mode: 'remote', endpoint }
}

export async function connectPortalBrowser(chromium, options = {}, env = process.env) {
  const connection = getPortalBrowserConnection(env)
  if (connection.mode === 'local') return chromium.launch({ headless: true, timeout: 15000, ...options })
  try {
    return await chromium.connectOverCDP(connection.endpoint, { timeout: options.timeout || 15000 })
  } catch {
    // Remote connection errors can contain the complete endpoint and API token.
    // Never retain the underlying error in a loggable cause or response.
    throw Object.assign(new Error('Could not connect to the configured remote browser. Check the endpoint, provider credentials, session availability, and outbound network access from Hostinger.'),
      { status: 503, code: 'BROWSER_REMOTE_CONNECTION_FAILED', portalBrowser: true })
  }
}

export async function launchPortalBrowser(options = {}) {
  configurePortalBrowserEnvironment()
  const { chromium } = await import('playwright')
  return connectPortalBrowser(chromium, options)
}
