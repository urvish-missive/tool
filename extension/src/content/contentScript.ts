/**
 * Content script. Injected on demand by the service worker (chrome.scripting)
 * only after the user opens the extension on a tab; it is never declared to
 * run on every site. It reads the DOM and answers one message type.
 */
import { extractPage } from '../utils/pageExtractor'
import { CONTENT_EXTRACT_MESSAGE, type ContentRequest, type ExtractResult } from '../types/messages'

type ExtractListener = Parameters<typeof chrome.runtime.onMessage.addListener>[0]

declare global {
  interface Window {
    __missiveQaListener?: ExtractListener
  }
}

function whenReady(): Promise<void> {
  if (document.readyState !== 'loading') return Promise.resolve()
  return new Promise((resolve) => document.addEventListener('DOMContentLoaded', () => resolve(), { once: true }))
}

async function handleExtract(): Promise<ExtractResult> {
  try {
    await whenReady()
    const page = extractPage(document, window)
    if (page.wordCount < 5) {
      return { ok: false, code: 'EMPTY_PAGE', message: 'This page has no readable text content to analyze.' }
    }
    return { ok: true, page }
  } catch {
    return { ok: false, code: 'EXTRACTION_FAILED', message: 'Could not read the content of this page.' }
  }
}

// Re-injection ("Analyze again") must not stack listeners, and after an
// extension reload the window global survives while the old listener is dead.
// So always swap in a fresh listener instead of using an "already installed" flag.
const listener: ExtractListener = (message: ContentRequest, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || message?.type !== CONTENT_EXTRACT_MESSAGE) return false
  handleExtract().then(sendResponse)
  return true
}
if (window.__missiveQaListener) chrome.runtime.onMessage.removeListener(window.__missiveQaListener)
window.__missiveQaListener = listener
chrome.runtime.onMessage.addListener(listener)
