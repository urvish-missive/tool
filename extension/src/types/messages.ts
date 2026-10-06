import type { PageContent } from './page'

/** Side panel → service worker */
export type PanelRequest =
  | { type: 'EXTRACT_PAGE'; tabId: number }

/** Service worker → content script */
export const CONTENT_EXTRACT_MESSAGE = 'MISSIVE_QA_EXTRACT' as const
export type ContentRequest = { type: typeof CONTENT_EXTRACT_MESSAGE }

/** Service worker → side panel (broadcast) */
export type PanelEvent =
  | { type: 'ACTIVE_TAB_CHANGED'; windowId: number }
  | { type: 'TAB_UPDATED'; tabId: number }

export type ExtractErrorCode =
  | 'RESTRICTED_PAGE'
  | 'NO_PERMISSION'
  | 'EXTRACTION_FAILED'
  | 'EMPTY_PAGE'

export type ExtractResult =
  | { ok: true; page: PageContent }
  | { ok: false; code: ExtractErrorCode; message: string }
