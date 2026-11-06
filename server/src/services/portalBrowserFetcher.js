import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export const BNI_SEARCH_URL = 'https://www.bniconnectglobal.com/web/dashboard/search'
const HOSTS = new Set(['www.bniconnectglobal.com', 'bniconnectglobal.com'])
const fail = (message, status = 400) => Object.assign(new Error(message), { status })
let activeRuns = 0

function portalUrl(value) {
  let url
  try { url = new URL(value) } catch { throw fail('Enter a valid BNI Connect URL.') }
  if (url.protocol !== 'https:' || !HOSTS.has(url.hostname) || url.port || url.username || url.password) {
    throw fail('Browser automation supports HTTPS pages on bniconnectglobal.com only.')
  }
  return url.href
}

export function validateBrowserConfig(input = {}) {
  const config = {
    url: portalUrl(input.url || BNI_SEARCH_URL),
    loginUrl: input.loginUrl ? portalUrl(input.loginUrl) : '',
    username: String(input.username || ''), password: String(input.password || ''),
    usernameTarget: String(input.usernameTarget || 'input[autocomplete="username"], input[name="username"], input[type="email"]'),
    passwordTarget: String(input.passwordTarget || 'input[type="password"]'),
    loginTarget: String(input.loginTarget || 'button[type="submit"], input[type="submit"]'),
    readyTarget: String(input.readyTarget || ''),
    searchTarget: String(input.searchTarget || 'button:Search'),
    rowSelector: String(input.rowSelector || 'table tbody tr'),
    nextTarget: String(input.nextTarget || ''),
    maxPages: Math.min(50, Math.max(1, Number.parseInt(input.maxPages) || 1)),
    steps: input.steps || [], filters: input.filters || [], fields: input.fields || [],
  }
  if (!config.username || !config.password) throw fail('Enter your BNI Connect username and password.')
  for (const key of ['steps', 'filters', 'fields']) {
    if (!Array.isArray(config[key]) || config[key].length > 30) throw fail(`Use at most 30 ${key}.`)
  }
  for (const item of [...config.steps, ...config.filters]) {
    if (!item || !['click', 'fill', 'select', 'check', 'wait'].includes(item.action) || !String(item.target || '').trim()) {
      throw fail('Each step or filter needs an action and a page control.')
    }
  }
  if (!config.fields.length) throw fail('Add at least one data field to extract.')
  const names = new Set()
  for (const field of config.fields) {
    if (!field?.name?.trim() || !field.selector?.trim() || names.has(field.name.trim())) {
      throw fail('Each data field needs a unique name and a CSS selector inside a result row.')
    }
    names.add(field.name.trim())
  }
  if (JSON.stringify(config).length > 60000) throw fail('The browser configuration is too large.')
  return config
}

// Controls can be addressed by their accessible name or an explicit CSS selector.
export function findControl(page, target) {
  if (target.startsWith('label:')) return page.getByLabel(target.slice(6), { exact: true })
  if (target.startsWith('button:')) return page.getByRole('button', { name: target.slice(7), exact: true })
  if (target.startsWith('link:')) return page.getByRole('link', { name: target.slice(5), exact: true })
  if (target.startsWith('text:')) return page.getByText(target.slice(5), { exact: true })
  return page.locator(target)
}

export async function applyBrowserStep(page, step) {
  const control = findControl(page, step.target)
  if (step.action === 'fill') await control.fill(String(step.value ?? ''))
  else if (step.action === 'select') await control.selectOption({ label: String(step.value ?? '') })
  else if (step.action === 'check') await control.setChecked(step.value !== false)
  else if (step.action === 'wait') await control.waitFor({ state: 'visible' })
  else await control.click()
}

function publicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number)
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127))
  }
  // Only global unicast IPv6; excludes mapped IPv4, loopback and local ranges.
  return isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address)
}

export async function allowBrowserRequest(rawUrl, resolve = lookup) {
  try {
    const url = new URL(rawUrl)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return false
    const host = url.hostname.replace(/^\[|\]$/g, '')
    const addresses = isIP(host) ? [{ address: host }] : await resolve(host, { all: true })
    return addresses.length > 0 && addresses.every(({ address }) => publicAddress(address))
  } catch { return false }
}

export async function collectBrowserRows(page, config) {
  const rows = [], seenPages = new Set(), seenRows = new Set(), warnings = []
  let pagesFetched = 0, stoppedReason = 'max-pages'
  for (let index = 0; index < config.maxPages; index++) {
    await page.locator(config.rowSelector).first().waitFor({ state: 'visible' })
    const batch = await page.locator(config.rowSelector).evaluateAll((elements, fields) => elements.map((row) =>
      Object.fromEntries(fields.map((field) => {
        const element = field.selector === ':scope' ? row : row.querySelector(field.selector)
        const value = !element ? '' : field.attribute ? element.getAttribute(field.attribute) || '' : element.textContent || ''
        return [field.name.trim(), value.replace(/\s+/g, ' ').trim()]
      }))), config.fields)
    const fingerprint = JSON.stringify(batch)
    if (seenPages.has(fingerprint)) { stoppedReason = 'repeated-page'; warnings.push('The next page repeated. Check the Next control and results-ready selector.'); break }
    seenPages.add(fingerprint)
    pagesFetched++
    for (const row of batch) {
      if (Object.values(row).every((value) => !value)) continue
      const key = JSON.stringify(row)
      if (!seenRows.has(key)) { seenRows.add(key); rows.push(row) }
      if (rows.length >= 20000) break
    }
    if (rows.length >= 20000) { stoppedReason = 'row-limit'; break }
    if (!config.nextTarget) { stoppedReason = 'single-request'; break }
    if (index + 1 >= config.maxPages) break
    const next = findControl(page, config.nextTarget)
    if (!await next.count() || !await next.isVisible() || !await next.isEnabled() || await next.getAttribute('aria-disabled') === 'true') {
      stoppedReason = 'last-page'; break
    }
    const previous = (await page.locator(config.rowSelector).allTextContents()).join('\n')
    await next.click()
    // Wait for the rendered data to change, including client-side pagination.
    await page.waitForFunction(({ selector, previous }) => {
      const current = [...document.querySelectorAll(selector)].map((el) => el.textContent).join('\n')
      return current.trim() && current !== previous
    }, { selector: config.rowSelector, previous }).catch(() => {})
    if (config.readyTarget) await findControl(page, config.readyTarget).waitFor({ state: 'visible' })
  }
  if (!rows.length) warnings.push('No field values were found. Check the result-row and field selectors, or narrow your search.')
  return { rows, columns: config.fields.map((field) => field.name.trim()), totalRows: rows.length, pagesFetched, stoppedReason, warnings }
}

export async function fetchBrowserPortalData(input, { launch } = {}) {
  const config = validateBrowserConfig(input)
  if (activeRuns >= 2) throw fail('Both browser workers are busy. Please try again shortly.', 429)
  activeRuns++
  let browser, timer, timedOut = false
  let phase = 'starting the browser'
  const startedAt = Date.now()
  try {
    if (!launch) {
      const { chromium } = await import('playwright')
      launch = (options) => chromium.launch(options)
    }
    browser = await launch({ headless: true, timeout: 15000 })
    const context = await browser.newContext({ acceptDownloads: false, serviceWorkers: 'block' })
    context.setDefaultTimeout(10000)
    context.setDefaultNavigationTimeout(20000)
    await context.route('**/*', async (route) => {
      const request = route.request()
      // Credentials and documents must stay on BNI's host. Public assets are DNS checked.
      let allowed = true
      if (request.isNavigationRequest() || request.method() !== 'GET') {
        try { portalUrl(request.url()) } catch { allowed = false }
      }
      if (allowed) allowed = await allowBrowserRequest(request.url())
      await (allowed ? route.continue() : route.abort()).catch(() => {})
    })
    if (context.routeWebSocket) await context.routeWebSocket('**/*', (socket) => socket.close())
    timer = setTimeout(() => { timedOut = true; browser.close().catch(() => {}) }, 95000)
    const page = await context.newPage()
    phase = 'opening BNI Connect'
    await page.goto(config.loginUrl || config.url, { waitUntil: 'domcontentloaded' })
    phase = 'finding the login form (check login URL and controls)'
    await findControl(page, config.passwordTarget).waitFor({ state: 'visible' })
    // Confirm current origin before filling credentials, even after redirects.
    portalUrl(page.url())
    await findControl(page, config.usernameTarget).fill(config.username)
    await findControl(page, config.passwordTarget).fill(config.password)
    phase = 'logging in (check credentials; OTP or CAPTCHA needs the API mode)'
    await findControl(page, config.loginTarget).click()
    await findControl(page, config.passwordTarget).waitFor({ state: 'hidden' })
    await page.goto(config.url, { waitUntil: 'domcontentloaded' })
    phase = 'applying navigation steps and filters'
    for (const step of [...config.steps, ...config.filters]) await applyBrowserStep(page, step)
    if (config.searchTarget) {
      await findControl(page, config.searchTarget).click()
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    }
    if (config.readyTarget) await findControl(page, config.readyTarget).waitFor({ state: 'visible' })
    phase = 'reading results (check filters, row selector and field selectors)'
    const result = await collectBrowserRows(page, config)
    return { ...result, request: { method: 'BROWSER', host: new URL(config.url).host, path: new URL(config.url).pathname },
      status: 200, kind: 'browser', candidates: [], detectedPath: '', rawPreview: '', durationMs: Date.now() - startedAt }
  } catch (error) {
    // Never return Playwright messages: they may include typed passwords or page content.
    if (/Cannot find package|Executable doesn't exist/.test(error.message)) {
      throw fail('Browser automation is not installed on this server. Run npm install and npx playwright install chromium in server/.', 503)
    }
    throw fail(timedOut ? 'Browser run reached its 95-second limit. Use fewer pages or steps.' : `Browser run failed while ${phase}.`, 422)
  } finally {
    clearTimeout(timer)
    if (browser) await browser.close().catch(() => {})
    activeRuns--
  }
}
