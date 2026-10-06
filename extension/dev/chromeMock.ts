/**
 * Minimal chrome.* stand-in so the real side panel can run in a normal tab
 * during `npm run preview`. The "active tab" is a fixture page loaded in a
 * hidden same-origin iframe, and extraction runs the real pageExtractor on it.
 * Development only: nothing in dev/ is part of the extension build.
 */
import { extractPage } from '../src/utils/pageExtractor'
import type { ExtractResult } from '../src/types/messages'

const params = new URLSearchParams(location.search)
const fixture = params.get('fixture') || 'article'
const fixtureUrl = `${location.origin}/dev/fixtures/${fixture}.html`

function memoryArea() {
  const data = new Map<string, unknown>()
  return {
    async get(keys?: string | string[] | null) {
      if (keys == null) return Object.fromEntries(data)
      const list = Array.isArray(keys) ? keys : [keys]
      return Object.fromEntries(list.filter((k) => data.has(k)).map((k) => [k, data.get(k)]))
    },
    async set(items: Record<string, unknown>) {
      for (const [k, v] of Object.entries(items)) data.set(k, structuredClone(v))
    },
    async remove(keys: string | string[]) {
      for (const k of Array.isArray(keys) ? keys : [keys]) data.delete(k)
    },
    async clear() {
      data.clear()
    },
  }
}

function loadFixture(): Promise<HTMLIFrameElement> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe')
    frame.style.cssText = 'position:absolute;left:-9999px;width:1280px;height:900px;'
    frame.src = fixtureUrl
    frame.onload = () => resolve(frame)
    frame.onerror = reject
    document.body.appendChild(frame)
  })
}

const framePromise = loadFixture()

async function extract(): Promise<ExtractResult> {
  if (fixture === 'restricted') return { ok: false, code: 'RESTRICTED_PAGE', message: 'Chrome does not allow extensions to read this page.' }
  const frame = await framePromise
  const page = extractPage(frame.contentDocument!, frame.contentWindow!)
  if (page.wordCount < 5) return { ok: false, code: 'EMPTY_PAGE', message: 'This page has no readable text content to analyze.' }
  return { ok: true, page }
}

const mock = {
  runtime: {
    id: 'preview',
    async sendMessage(message: { type: string }) {
      if (message?.type === 'EXTRACT_PAGE') return extract()
      return undefined
    },
    onMessage: { addListener() {}, removeListener() {} },
    openOptionsPage() {
      window.open('/options.html', '_blank')
    },
  },
  storage: { local: memoryArea(), session: memoryArea() },
  windows: { async getCurrent() { return { id: 1 } } },
  tabs: {
    async query() {
      const frame = await framePromise
      return [{ id: 7, windowId: 1, url: fixture === 'restricted' ? 'chrome://settings' : fixtureUrl, title: frame.contentDocument?.title }]
    },
  },
  permissions: {
    async contains() { return false },
    async request() { return true },
    async remove() { return true },
  },
}

;(globalThis as unknown as { chrome: typeof mock }).chrome = mock

// ?mock=limit|blocked|ratelimit replays the backend's real error bodies (toolAccess.js).
const apiMock = params.get('mock')
if (apiMock) {
  const bodies: Record<string, [number, object]> = {
    limit: [429, { success: false, deviceLimitReached: true, limit: 3, usageCount: 3, toolSlug: 'content-qa', toolName: 'Content QA', error: 'Complimentary limit reached for Content QA (3 of 3 free generations used). Please enter your email to request extended access.' }],
    blocked: [403, { success: false, deviceBlocked: true, error: 'Access to this tool is currently restricted. Please contact support.' }],
    ratelimit: [429, { success: false, error: 'Rate limit exceeded for Content QA. Max 20 requests per hour.', retryAfter: 1800 }],
  }
  const realFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const url = String(input instanceof Request ? input.url : input)
    if (url.includes('/content-qa/analyze') && bodies[apiMock]) {
      const [status, body] = bodies[apiMock]
      return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    }
    if (url.includes('/devices/status')) {
      return new Response(JSON.stringify({ success: true, usageCount: 3, limit: 3, remaining: 0, isBlocked: apiMock === 'blocked' }), { status: 200 })
    }
    if (url.includes('/devices/link-email')) {
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }
    return realFetch(input, init)
  }
}
