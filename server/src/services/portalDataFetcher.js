/**
 * Portal API Data Fetcher
 *
 * Replays an API request that a web portal (e.g. BNI Connect, a CRM, an admin
 * dashboard) makes from the user's logged-in browser, then turns the JSON (or
 * HTML table) response into rows and columns for export.
 *
 * The user copies the request from DevTools ("Copy as cURL"), so it carries
 * their own session cookie / bearer token. Those credentials are used only for
 * the outgoing request(s) and are never stored or logged.
 */
import * as cheerio from 'cheerio'
import { validateURL, resolveAndValidate } from '../utils/helpers.js'

export const LIMITS = {
  maxPages: 50,
  maxRows: 20000,
  maxColumns: 250,
  maxResponseBytes: 15 * 1024 * 1024,
  requestTimeoutMs: 30000,
  totalTimeoutMs: 100000,
  maxRedirects: 3,
  pageDelayMs: 250,
}

const FORBIDDEN_HEADERS = new Set([
  'host',
  'content-length',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'te',
  'trailer',
  'proxy-authorization',
  'proxy-connection',
  'accept-encoding',
])

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])

// ─── cURL parsing ──────────────────────────────────────────────

/**
 * Split a shell command into arguments. Understands the formats Chrome,
 * Edge and Firefox produce with "Copy as cURL": bash (single quotes, $'..'
 * ANSI-C strings, backslash line continuations) and Windows cmd (^ escapes,
 * double quotes).
 */
export function tokenizeShell(input) {
  let src = String(input || '').trim()

  // Windows cmd flavour: "curl ^"https://...^" ^\n  -H ^"accept: ...^""
  const isCmd = /\^\s*\r?\n/.test(src) || /\^"/.test(src)
  if (isCmd) {
    src = src.replace(/\^\s*\r?\n/g, ' ').replace(/\^(.)/g, '$1')
  }
  // bash / PowerShell-ish line continuations
  src = src.replace(/\\\r?\n/g, ' ').replace(/`\r?\n/g, ' ')

  const tokens = []
  let cur = ''
  let inToken = false
  let i = 0

  while (i < src.length) {
    const ch = src[i]

    if (/\s/.test(ch)) {
      if (inToken) {
        tokens.push(cur)
        cur = ''
        inToken = false
      }
      i++
      continue
    }

    inToken = true

    if (ch === '$' && src[i + 1] === "'") {
      // ANSI-C quoted string
      i += 2
      while (i < src.length && src[i] !== "'") {
        if (src[i] === '\\' && i + 1 < src.length) {
          const n = src[i + 1]
          const map = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', '0': '\0' }
          if (n === 'x' && /^[0-9a-fA-F]{2}$/.test(src.substr(i + 2, 2))) {
            cur += String.fromCharCode(parseInt(src.substr(i + 2, 2), 16))
            i += 4
            continue
          }
          if (n === 'u' && /^[0-9a-fA-F]{4}$/.test(src.substr(i + 2, 4))) {
            cur += String.fromCharCode(parseInt(src.substr(i + 2, 4), 16))
            i += 6
            continue
          }
          cur += map[n] !== undefined ? map[n] : n
          i += 2
          continue
        }
        cur += src[i++]
      }
      i++
      continue
    }

    if (ch === "'") {
      i++
      while (i < src.length && src[i] !== "'") cur += src[i++]
      i++
      continue
    }

    if (ch === '"') {
      i++
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\' && !isCmd && i + 1 < src.length && '"\\$`'.includes(src[i + 1])) {
          cur += src[i + 1]
          i += 2
          continue
        }
        cur += src[i++]
      }
      i++
      continue
    }

    if (ch === '\\' && !isCmd && i + 1 < src.length) {
      cur += src[i + 1]
      i += 2
      continue
    }

    cur += ch
    i++
  }
  if (inToken) tokens.push(cur)
  return tokens
}

/**
 * Parse a "Copy as cURL" command into { method, url, headers, body }.
 */
export function parseCurl(command) {
  const tokens = tokenizeShell(command)
  if (!tokens.length || !/^curl(\.exe)?$/i.test(tokens[0])) {
    throw new Error('The command must start with "curl". In DevTools use right-click → Copy → Copy as cURL.')
  }

  let url = null
  let method = null
  const headers = {}
  const dataParts = []
  let getMode = false

  const setHeader = (raw) => {
    const idx = raw.indexOf(':')
    if (idx <= 0) return
    const name = raw.slice(0, idx).trim()
    const value = raw.slice(idx + 1).trim()
    if (name) headers[name.toLowerCase()] = value
  }

  for (let i = 1; i < tokens.length; i++) {
    let tok = tokens[i]
    let inlineValue = null

    if (tok.startsWith('--') && tok.includes('=')) {
      const eq = tok.indexOf('=')
      inlineValue = tok.slice(eq + 1)
      tok = tok.slice(0, eq)
    }
    const next = () => (inlineValue !== null ? inlineValue : tokens[++i])

    switch (tok) {
      case '-X':
      case '--request':
        method = String(next() || '').toUpperCase()
        break
      case '-H':
      case '--header':
        setHeader(next() || '')
        break
      case '-b':
      case '--cookie':
        headers.cookie = next() || ''
        break
      case '-A':
      case '--user-agent':
        headers['user-agent'] = next() || ''
        break
      case '-e':
      case '--referer':
        headers.referer = next() || ''
        break
      case '-u':
      case '--user':
        headers.authorization = 'Basic ' + Buffer.from(next() || '').toString('base64')
        break
      case '-d':
      case '--data':
      case '--data-raw':
      case '--data-binary':
      case '--data-ascii':
        dataParts.push(next() ?? '')
        break
      case '--data-urlencode': {
        const v = next() ?? ''
        const eq = v.indexOf('=')
        dataParts.push(eq >= 0 ? `${v.slice(0, eq)}=${encodeURIComponent(v.slice(eq + 1))}` : encodeURIComponent(v))
        break
      }
      case '--json':
        dataParts.push(next() ?? '')
        headers['content-type'] = headers['content-type'] || 'application/json'
        headers.accept = headers.accept || 'application/json'
        break
      case '-G':
      case '--get':
        getMode = true
        break
      case '--url':
        url = next()
        break
      // flags with a value we don't need
      case '-o':
      case '--output':
      case '-m':
      case '--max-time':
      case '--connect-timeout':
      case '-x':
      case '--proxy':
      case '-w':
      case '--write-out':
      case '-F':
      case '--form':
        next()
        break
      default:
        if (!tok.startsWith('-') && !url) url = tok
        break
    }
  }

  if (!url) throw new Error('No URL found in the cURL command.')

  let body = dataParts.length ? dataParts.join('&') : null
  if (getMode && body) {
    url += (url.includes('?') ? '&' : '?') + body
    body = null
  }
  if (!method) method = body !== null ? 'POST' : 'GET'

  if (body !== null && !headers['content-type']) {
    headers['content-type'] = 'application/x-www-form-urlencoded'
  }

  return { method, url, headers, body }
}

/** Parse a "Name: value" per line header block. */
export function parseHeaderBlock(text) {
  const headers = {}
  for (const line of String(text || '').split(/\r?\n/)) {
    const idx = line.indexOf(':')
    // HTTP/2 pseudo headers copied from DevTools (":authority: x") are skipped.
    if (idx <= 0) continue
    const name = line.slice(0, idx).trim().toLowerCase()
    if (name) headers[name] = line.slice(idx + 1).trim()
  }
  return headers
}

// ─── Request execution ─────────────────────────────────────────

function cleanHeaders(headers) {
  const out = {}
  for (const [k, v] of Object.entries(headers || {})) {
    const name = String(k).trim().toLowerCase()
    if (!name || name.startsWith(':') || FORBIDDEN_HEADERS.has(name)) continue
    if (!/^[a-z0-9!#$%&'*+.^_`|~-]+$/.test(name)) continue
    out[name] = String(v ?? '').replace(/[\r\n]+/g, ' ')
  }
  if (!out['user-agent']) {
    out['user-agent'] =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
  }
  if (!out.accept) out.accept = 'application/json, text/plain, */*'
  return out
}

async function assertSafeUrl(rawUrl) {
  let parsed
  try {
    parsed = validateURL(rawUrl)
  } catch (err) {
    throw Object.assign(new Error(`Blocked URL: ${err.message}`), { status: 400 })
  }
  await resolveAndValidate(parsed.hostname).catch((err) => {
    throw Object.assign(new Error(`Blocked URL: ${err.message}`), { status: 400 })
  })
  return parsed
}

async function readLimited(response, limit) {
  const reader = response.body?.getReader?.()
  if (!reader) return Buffer.from(await response.arrayBuffer())
  const chunks = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > limit) {
      await reader.cancel().catch(() => {})
      throw Object.assign(new Error(`Response is larger than ${Math.round(limit / 1048576)} MB.`), { status: 413 })
    }
    chunks.push(Buffer.from(value))
  }
  return Buffer.concat(chunks)
}

/**
 * Run one HTTP request with SSRF checks on every hop, a timeout and a size cap.
 */
export async function executeRequest({ method, url, headers, body }) {
  let currentUrl = url
  let currentMethod = method
  let currentBody = body
  const sendHeaders = cleanHeaders(headers)

  for (let hop = 0; hop <= LIMITS.maxRedirects; hop++) {
    const parsed = await assertSafeUrl(currentUrl)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), LIMITS.requestTimeoutMs)
    let response
    try {
      response = await fetch(parsed.href, {
        method: currentMethod,
        headers: sendHeaders,
        body: ['GET', 'HEAD'].includes(currentMethod) ? undefined : currentBody ?? undefined,
        redirect: 'manual',
        signal: controller.signal,
      })
    } catch (err) {
      clearTimeout(timer)
      const msg = err.name === 'AbortError' ? 'The portal took too long to respond.' : `Could not reach the portal (${err.cause?.code || err.message}).`
      throw Object.assign(new Error(msg), { status: 502 })
    }

    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      clearTimeout(timer)
      const location = new URL(response.headers.get('location'), parsed.href)
      // A cross-origin redirect must not receive the user's credentials.
      if (location.origin !== parsed.origin) {
        delete sendHeaders.cookie
        delete sendHeaders.authorization
      }
      if (response.status === 303 || ((response.status === 301 || response.status === 302) && currentMethod === 'POST')) {
        currentMethod = 'GET'
        currentBody = null
      }
      currentUrl = location.href
      continue
    }

    try {
      const buf = await readLimited(response, LIMITS.maxResponseBytes)
      return {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type') || '',
        finalUrl: parsed.href,
        text: buf.toString('utf8'),
      }
    } finally {
      clearTimeout(timer)
    }
  }
  throw Object.assign(new Error('Too many redirects.'), { status: 502 })
}

// ─── Response → records ───────────────────────────────────────

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

export function getByPath(obj, path) {
  if (!path) return obj
  let cur = obj
  for (const part of String(path).split('.').filter(Boolean)) {
    if (cur == null) return undefined
    cur = Array.isArray(cur) && /^\d+$/.test(part) ? cur[Number(part)] : cur[part]
  }
  return cur
}

/**
 * Find every array of objects in a JSON document, largest first.
 */
export function findRecordArrays(root) {
  const found = []
  const seen = new Set()
  const walk = (node, path, depth) => {
    if (depth > 8 || node === null || typeof node !== 'object' || seen.has(node)) return
    seen.add(node)
    if (Array.isArray(node)) {
      const objects = node.filter(isPlainObject).length
      if (node.length && objects / node.length >= 0.6) {
        found.push({ path, count: node.length })
      }
      // Look inside the first element for nested lists (e.g. [ { items: [...] } ])
      if (node.length && isPlainObject(node[0]) && node.length === 1) walk(node[0], path ? `${path}.0` : '0', depth + 1)
      return
    }
    for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, depth + 1)
  }
  walk(root, '', 0)
  return found.sort((a, b) => b.count - a.count || a.path.length - b.path.length)
}

function flattenRecord(record, prefix = '', out = {}, depth = 0) {
  if (!isPlainObject(record)) {
    out[prefix || 'value'] = record
    return out
  }
  for (const [k, v] of Object.entries(record)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (isPlainObject(v) && depth < 3) {
      flattenRecord(v, key, out, depth + 1)
    } else if (Array.isArray(v)) {
      out[key] = v.every((x) => x === null || typeof x !== 'object') ? v.join(', ') : JSON.stringify(v)
    } else if (isPlainObject(v)) {
      out[key] = JSON.stringify(v)
    } else {
      out[key] = v
    }
  }
  return out
}

function extractHtmlTables(html) {
  const $ = cheerio.load(html)
  const tables = []
  $('table').each((ti, table) => {
    const $t = $(table)
    let headers = $t.find('thead tr').first().find('th,td').map((_, c) => $(c).text().trim()).get()
    let bodyRows = $t.find('tbody tr').length ? $t.find('tbody tr') : $t.find('tr')
    if (!headers.length) {
      const first = bodyRows.first()
      if (first.find('th').length) {
        headers = first.find('th,td').map((_, c) => $(c).text().trim()).get()
        bodyRows = bodyRows.slice(1)
      }
    }
    const rows = []
    bodyRows.each((_, tr) => {
      const cells = $(tr).find('td,th').map((__, c) => $(c).text().replace(/\s+/g, ' ').trim()).get()
      if (!cells.length || cells.every((c) => !c)) return
      const row = {}
      cells.forEach((c, idx) => {
        row[headers[idx] || `Column ${idx + 1}`] = c
      })
      rows.push(row)
    })
    if (rows.length) tables.push({ path: `table[${ti}]`, count: rows.length, rows })
  })
  return tables.sort((a, b) => b.count - a.count)
}

/**
 * Turn one response body into records.
 * Returns { kind, records, detectedPath, candidates, parsed }
 */
export function extractRecords(response, dataPath) {
  const text = response.text || ''
  let json
  try {
    json = JSON.parse(text.replace(/^\)\]\}',?\s*/, '')) // strip XSSI prefix
  } catch {
    json = undefined
  }

  if (json !== undefined) {
    const candidates = findRecordArrays(json)
    let path = dataPath?.trim() || ''
    let target
    if (path) {
      target = getByPath(json, path)
      if (target === undefined) {
        throw Object.assign(new Error(`Data path "${path}" was not found in the response.`), { status: 422 })
      }
    } else if (candidates.length) {
      path = candidates[0].path
      target = getByPath(json, path)
    } else {
      target = json
    }
    const list = Array.isArray(target) ? target : [target]
    return { kind: 'json', records: list, detectedPath: path, candidates: candidates.slice(0, 15), parsed: json }
  }

  if (/<table[\s>]/i.test(text)) {
    const tables = extractHtmlTables(text)
    if (tables.length) {
      let pick = tables[0]
      if (dataPath && /^table\[\d+\]$/.test(dataPath.trim())) {
        pick = tables.find((t) => t.path === dataPath.trim()) || pick
      }
      return {
        kind: 'html',
        records: pick.rows,
        detectedPath: pick.path,
        candidates: tables.map(({ path, count }) => ({ path, count })),
        parsed: null,
      }
    }
  }

  return { kind: 'text', records: [], detectedPath: '', candidates: [], parsed: null }
}

// ─── Pagination ───────────────────────────────────────────────

/**
 * Build the request for page N (0-based index). Supports page-number and
 * offset styles, in the query string or in a JSON / form body.
 */
export function buildPageRequest(base, pagination, index) {
  if (!pagination || pagination.mode === 'none' || index === 0 && pagination.applyToFirst === false) return base
  const param = String(pagination.param || '').trim()
  if (!param) return base

  const start = Number.isFinite(Number(pagination.start)) ? Number(pagination.start) : pagination.mode === 'offset' ? 0 : 1
  const step = Number(pagination.step) > 0 ? Number(pagination.step) : 1
  const value = start + index * step

  const req = { ...base, headers: { ...base.headers } }
  const where = pagination.location || 'auto'
  const ct = (base.headers['content-type'] || '').toLowerCase()

  const inBody = where === 'body' || (where === 'auto' && base.body && !new URL(base.url).searchParams.has(param))

  if (inBody && base.body) {
    if (ct.includes('json') || /^\s*[{[]/.test(base.body)) {
      try {
        const obj = JSON.parse(base.body)
        setDeep(obj, param, value)
        req.body = JSON.stringify(obj)
        return req
      } catch {
        /* fall through to form encoding */
      }
    }
    const params = new URLSearchParams(base.body)
    params.set(param, String(value))
    req.body = params.toString()
    return req
  }

  const u = new URL(base.url)
  u.searchParams.set(param, String(value))
  req.url = u.href
  return req
}

function setDeep(obj, path, value) {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!isPlainObject(cur[parts[i]])) cur[parts[i]] = {}
    cur = cur[parts[i]]
  }
  cur[parts[parts.length - 1]] = value
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── Main entry ───────────────────────────────────────────────

/**
 * @param {object} input
 * @param {{method,url,headers,body}} input.request
 * @param {object} [input.pagination] { mode: 'none'|'page'|'offset', param, start, step, maxPages, location }
 * @param {string} [input.dataPath]
 */
export async function fetchPortalData({ request, pagination, dataPath }) {
  const method = String(request.method || 'GET').toUpperCase()
  if (!ALLOWED_METHODS.has(method)) throw Object.assign(new Error(`Unsupported HTTP method ${method}.`), { status: 400 })
  const base = { method, url: String(request.url || '').trim(), headers: request.headers || {}, body: request.body ?? null }
  if (!base.url) throw Object.assign(new Error('API URL is required.'), { status: 400 })

  const paginate = pagination && pagination.mode && pagination.mode !== 'none' && pagination.param
  const maxPages = paginate ? Math.min(Math.max(parseInt(pagination.maxPages) || 10, 1), LIMITS.maxPages) : 1

  const startedAt = Date.now()
  const warnings = []
  const allRows = []
  const fingerprints = new Set()
  let first = null
  let pagesFetched = 0
  let stoppedReason = paginate ? 'max-pages' : 'single-request'

  for (let i = 0; i < maxPages; i++) {
    if (Date.now() - startedAt > LIMITS.totalTimeoutMs) {
      warnings.push('Stopped early to stay within the time limit. Narrow the request or lower "max pages".')
      stoppedReason = 'time-limit'
      break
    }

    const req = buildPageRequest(base, paginate ? pagination : null, i)
    const res = await executeRequest(req)
    pagesFetched++

    if (res.status >= 400) {
      if (i === 0) {
        const hint =
          res.status === 401 || res.status === 403
            ? ' Your portal session has probably expired. Log in again, then copy a fresh cURL.'
            : ''
        throw Object.assign(new Error(`The portal answered ${res.status} ${res.statusText || ''}.${hint}`.trim()), {
          status: 422,
          preview: res.text.slice(0, 3000),
        })
      }
      warnings.push(`Page ${i + 1} returned ${res.status}; stopped there.`)
      stoppedReason = 'http-error'
      break
    }

    const extracted = extractRecords(res, dataPath || first?.detectedPath)
    if (i === 0) {
      first = { ...extracted, response: res }
      if (extracted.kind === 'html' && /<form[^>]+(login|signin)|type=["']password/i.test(res.text) && !extracted.records.length) {
        throw Object.assign(new Error('The portal returned a login page. Your session has expired: log in again and copy a fresh cURL.'), { status: 422 })
      }
    }

    if (!extracted.records.length) {
      stoppedReason = i === 0 ? 'no-records' : 'empty-page'
      break
    }

    // Stop when a page repeats the previous one (portal ignored the page param).
    const fp = JSON.stringify(extracted.records[0]) + '|' + extracted.records.length + '|' + JSON.stringify(extracted.records[extracted.records.length - 1])
    if (fingerprints.has(fp)) {
      if (i === 1) warnings.push(`Page 2 was identical to page 1, so the portal probably ignores "${pagination.param}". Check the parameter name.`)
      stoppedReason = 'repeated-page'
      break
    }
    fingerprints.add(fp)

    for (const rec of extracted.records) {
      if (allRows.length >= LIMITS.maxRows) break
      allRows.push(flattenRecord(rec))
    }
    if (allRows.length >= LIMITS.maxRows) {
      warnings.push(`Row limit reached (${LIMITS.maxRows.toLocaleString()}). Only the first rows are included.`)
      stoppedReason = 'row-limit'
      break
    }

    if (paginate && pagination.mode === 'offset' && Number(pagination.step) > 0 && extracted.records.length < Number(pagination.step)) {
      stoppedReason = 'last-page'
      break
    }

    if (paginate && i < maxPages - 1) await sleep(LIMITS.pageDelayMs)
  }

  // Column order: first-seen order across rows.
  const columnSet = new Set()
  for (const row of allRows) for (const k of Object.keys(row)) columnSet.add(k)
  let columns = [...columnSet]
  if (columns.length > LIMITS.maxColumns) {
    warnings.push(`Only the first ${LIMITS.maxColumns} of ${columns.length} columns are included.`)
    columns = columns.slice(0, LIMITS.maxColumns)
  }

  if (!allRows.length && first?.kind === 'json') {
    warnings.push('The response is JSON but no list of records was found. Pick a data path from the raw response.')
  }
  if (first?.kind === 'text') {
    warnings.push('The response is neither JSON nor an HTML table. Make sure you copied the API (Fetch/XHR) request, not the page itself.')
  }

  return {
    request: { method: base.method, host: new URL(base.url).host, path: new URL(base.url).pathname },
    status: first?.response.status,
    contentType: first?.response.contentType,
    kind: first?.kind,
    detectedPath: first?.detectedPath || '',
    candidates: first?.candidates || [],
    pagesFetched,
    stoppedReason,
    totalRows: allRows.length,
    columns,
    rows: allRows,
    rawPreview: (first?.response.text || '').slice(0, 20000),
    warnings,
    durationMs: Date.now() - startedAt,
  }
}
