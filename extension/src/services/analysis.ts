/** Orchestrates: read active tab → extract page → call existing API → cache. */
import type { ExtractResult, PanelRequest } from '../types/messages'
import type { StoredResult } from '../types/analysis'
import type { PageContent } from '../types/page'
import { MIN_CONTENT_CHARS } from '../config'
import { buildAnalyzeRequest, type AnalyzeOptions } from '../utils/contentFormatter'
import { analyzeContentQa, ApiError } from './api'
import { storeResult } from './storage'

export interface ActiveTab {
  id: number
  windowId: number
  /** Undefined until the user grants access (activeTab click or site permission). */
  url?: string
  title?: string
}

export async function getActiveTab(windowId: number): Promise<ActiveTab | null> {
  const [tab] = await chrome.tabs.query({ active: true, windowId })
  if (!tab || typeof tab.id !== 'number') return null
  return { id: tab.id, windowId: tab.windowId, url: tab.url, title: tab.title }
}

export async function extractPage(tabId: number): Promise<ExtractResult> {
  const message: PanelRequest = { type: 'EXTRACT_PAGE', tabId }
  try {
    const result = (await chrome.runtime.sendMessage(message)) as ExtractResult | undefined
    return result ?? { ok: false, code: 'EXTRACTION_FAILED', message: 'Could not read this page.' }
  } catch {
    return { ok: false, code: 'EXTRACTION_FAILED', message: 'The extension background process is not responding. Try again.' }
  }
}

export async function runAnalysis(page: PageContent, options: AnalyzeOptions): Promise<StoredResult> {
  const { request, fallback } = buildAnalyzeRequest(page, options)
  if (fallback && fallback.content.trim().length < MIN_CONTENT_CHARS) {
    throw new ApiError('BAD_REQUEST', 'This page does not have enough readable text to analyze.')
  }

  const response = await analyzeContentQa(request)
  const result: StoredResult = {
    url: page.url,
    analyzedAt: new Date().toISOString(),
    report: response.report!,
    qaId: response.qaId ?? null,
    truncated: response.source?.truncated ?? fallback?.truncated ?? false,
    sentChars: response.source?.chars ?? fallback?.content.length ?? 0,
    matchesWebImport: !fallback,
  }
  await storeResult(result)
  return result
}

export async function hasAllSitesAccess(): Promise<boolean> {
  try {
    return await chrome.permissions.contains({ origins: ['http://*/*', 'https://*/*'] })
  } catch {
    return false
  }
}

/** Must be called from a click handler (user gesture). */
export async function requestAllSitesAccess(): Promise<boolean> {
  try {
    return await chrome.permissions.request({ origins: ['http://*/*', 'https://*/*'] })
  } catch {
    return false
  }
}
