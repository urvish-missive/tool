/**
 * Settings live in chrome.storage.local. Recent results live in
 * chrome.storage.session: in-memory, cleared when the browser closes, and not
 * readable by content scripts (Chrome's default access level).
 */
import type { QaReport, StoredResult } from '../types/analysis'
import { normalizePageUrl } from '../utils/restrictedUrls'

export interface Settings {
  /** Run analysis as soon as the panel opens (uses one free analysis each time). */
  autoAnalyze: boolean
}

const SETTINGS_KEY = 'missive_settings'
const RESULT_PREFIX = 'result:'
const RESULT_INDEX_KEY = 'result_index'
const MAX_STORED_RESULTS = 10

export const DEFAULT_SETTINGS: Settings = { autoAnalyze: false }

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...(stored[SETTINGS_KEY] || {}) }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch }
  await chrome.storage.local.set({ [SETTINGS_KEY]: next })
  return next
}

/** Drop the large debug/trace payloads the panel never renders. */
function slimReport(report: QaReport): QaReport {
  const { debug: _debug, mathematicalTraceability: _trace, ...rest } = report as QaReport & {
    debug?: unknown
    mathematicalTraceability?: unknown
  }
  return rest
}

export async function getStoredResult(url: string): Promise<StoredResult | null> {
  const key = RESULT_PREFIX + normalizePageUrl(url)
  try {
    const stored = await chrome.storage.session.get(key)
    return (stored[key] as StoredResult) || null
  } catch {
    return null
  }
}

export async function storeResult(result: StoredResult): Promise<void> {
  const normalized = normalizePageUrl(result.url)
  const key = RESULT_PREFIX + normalized
  try {
    const { [RESULT_INDEX_KEY]: index = [] } = await chrome.storage.session.get(RESULT_INDEX_KEY)
    const nextIndex = [normalized, ...(index as string[]).filter((u) => u !== normalized)]
    const evicted = nextIndex.splice(MAX_STORED_RESULTS)
    await chrome.storage.session.set({
      [key]: { ...result, report: slimReport(result.report) },
      [RESULT_INDEX_KEY]: nextIndex,
    })
    if (evicted.length) await chrome.storage.session.remove(evicted.map((u) => RESULT_PREFIX + u))
  } catch {
    // Quota or storage unavailable: the result is still shown, just not cached.
  }
}

/** Cached reports only. The device ID is kept so this is not a usage-limit reset. */
export async function clearCachedResults(): Promise<void> {
  await chrome.storage.session.clear()
}
