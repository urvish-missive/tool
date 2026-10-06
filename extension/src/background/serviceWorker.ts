/**
 * Service worker: opens the side panel, injects the content script on demand
 * and relays the extracted page back to the panel. It never talks to the API
 * and holds no state (MV3 workers can be stopped at any time).
 */
import { isRestrictedUrl } from '../utils/restrictedUrls'
import {
  CONTENT_EXTRACT_MESSAGE,
  type ExtractResult,
  type PanelEvent,
  type PanelRequest,
} from '../types/messages'

const EXTRACT_TIMEOUT_MS = 15000

function broadcast(event: PanelEvent) {
  // No listener when the panel is closed; that is expected.
  chrome.runtime.sendMessage(event).catch(() => {})
}

/* ── Opening the panel ─────────────────────────────────────────────── */

// action.onClicked (rather than openPanelOnActionClick, which stays at its
// default of false) guarantees the click grants activeTab for the current
// tab, which is what lets us read the page.
chrome.action.onClicked.addListener((tab) => {
  // Must run synchronously inside the user gesture.
  chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {})
  broadcast({ type: 'ACTIVE_TAB_CHANGED', windowId: tab.windowId })
})

/* ── Keep the panel in sync with the active tab ────────────────────── */

chrome.tabs.onActivated.addListener(({ windowId }) => {
  broadcast({ type: 'ACTIVE_TAB_CHANGED', windowId })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' || changeInfo.url || changeInfo.title) {
    broadcast({ type: 'TAB_UPDATED', tabId })
  }
})

/* ── Page extraction ───────────────────────────────────────────────── */

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

async function extractFromTab(tabId: number): Promise<ExtractResult> {
  let tab: chrome.tabs.Tab
  try {
    tab = await chrome.tabs.get(tabId)
  } catch {
    return { ok: false, code: 'EXTRACTION_FAILED', message: 'This tab is no longer open.' }
  }

  if (isRestrictedUrl(tab.url)) {
    return {
      ok: false,
      code: 'RESTRICTED_PAGE',
      message: 'Chrome does not allow extensions to read this page (browser, settings or Web Store pages).',
    }
  }

  try {
    await chrome.scripting.executeScript({ target: { tabId, frameIds: [0] }, files: ['content-script.js'] })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/chrome:\/\/|extensions gallery|cannot be scripted|error page|edge:\/\//i.test(message)) {
      return { ok: false, code: 'RESTRICTED_PAGE', message: 'Chrome does not allow extensions to read this page.' }
    }
    return {
      ok: false,
      code: 'NO_PERMISSION',
      message: 'Click the Missive SEO icon in the toolbar while on this page to let the extension read it.',
    }
  }

  try {
    const result = await withTimeout(
      chrome.tabs.sendMessage<{ type: string }, ExtractResult>(tabId, { type: CONTENT_EXTRACT_MESSAGE }, { frameId: 0 }),
      EXTRACT_TIMEOUT_MS,
    )
    return result ?? { ok: false, code: 'EXTRACTION_FAILED', message: 'Could not read the content of this page.' }
  } catch {
    return {
      ok: false,
      code: 'EXTRACTION_FAILED',
      message: 'Reading the page took too long or the page reloaded. Try again once it has finished loading.',
    }
  }
}

chrome.runtime.onMessage.addListener((message: PanelRequest, sender, sendResponse) => {
  // Only our own extension pages (not content scripts or other extensions).
  if (sender.id !== chrome.runtime.id || sender.tab) return false

  if (message?.type === 'EXTRACT_PAGE' && Number.isInteger(message.tabId)) {
    extractFromTab(message.tabId).then(sendResponse)
    return true
  }
  return false
})
