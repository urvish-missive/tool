/**
 * Turns extracted page blocks into the markdown-style text the existing
 * Content QA engine parses (server/src/services/contentQa/blockParser.js):
 * "# " headings, "- " list items, "> " quotes, blank lines between blocks.
 * This is the same shape the server's own URL importer produces.
 */
import type { ContentBlock, PageContent } from '../types/page'
import type { AnalyzeRequest } from '../types/analysis'
import { MAX_CONTENT_CHARS, MAX_TITLE_CHARS } from '../config'
import { normalizeWhitespace, truncate } from './textCleaner'

export function blockToMarkdown(block: ContentBlock): string {
  switch (block.type) {
    case 'heading':
      return `${'#'.repeat(Math.min(Math.max(block.level, 1), 6))} ${block.text}`
    case 'list_item':
      return `- ${block.text}`
    case 'quote':
      return `> ${block.text}`
    case 'code':
      return '```\n' + block.text.replace(/```/g, "'''") + '\n```'
    default:
      return block.text
  }
}

export interface FormattedContent {
  content: string
  truncated: boolean
  keptBlocks: number
  totalBlocks: number
}

const SEPARATOR = '\n\n'

/**
 * Fits the page into maxChars without cutting mid-sentence:
 *  1. keep the opening of the page in full (where intros and hooks live),
 *  2. then keep only the remaining headings plus the first paragraph under
 *     each, so the engine still sees the whole outline,
 *  3. never split a block; drop whole blocks instead.
 */
export function formatContent(blocks: ContentBlock[], maxChars = MAX_CONTENT_CHARS): FormattedContent {
  const parts = blocks.map(blockToMarkdown)
  const full = parts.join(SEPARATOR)
  if (full.length <= maxChars) {
    return { content: full, truncated: false, keptBlocks: blocks.length, totalBlocks: blocks.length }
  }

  const kept = new Array<boolean>(parts.length).fill(false)
  let used = 0
  const fits = (i: number, budget: number) => used + parts[i].length + SEPARATOR.length <= budget

  // Pass 1: the opening, up to 75% of the budget.
  const openingBudget = Math.floor(maxChars * 0.75)
  let i = 0
  for (; i < parts.length && fits(i, openingBudget); i++) {
    kept[i] = true
    used += parts[i].length + SEPARATOR.length
  }

  // Pass 2: outline of the rest (headings first, they are short).
  for (let j = i; j < parts.length; j++) {
    if (blocks[j].type === 'heading' && fits(j, maxChars)) {
      kept[j] = true
      used += parts[j].length + SEPARATOR.length
    }
  }

  // Pass 3: the first paragraph under each kept heading, while room remains.
  for (let j = i; j < parts.length; j++) {
    if (!kept[j] || blocks[j].type !== 'heading') continue
    const next = j + 1
    if (next < parts.length && !kept[next] && blocks[next].type !== 'heading' && fits(next, maxChars)) {
      kept[next] = true
      used += parts[next].length + SEPARATOR.length
    }
  }

  const content = parts.filter((_, idx) => kept[idx]).join(SEPARATOR)
  return {
    content: content.slice(0, maxChars),
    truncated: true,
    keptBlocks: kept.filter(Boolean).length,
    totalBlocks: blocks.length,
  }
}

/** Headline, using the same priority as the server's web importer. */
export function pickTitle(page: PageContent): string {
  const firstH1 = page.headings.find((h) => h.level === 1)?.text
  const title = page.openGraph.title || page.twitter.title || firstH1 || page.title || ''
  return truncate(normalizeWhitespace(title), MAX_TITLE_CHARS)
}

export interface AnalyzeOptions {
  targetKeyword?: string
  targetAudience?: string
  /** Defaults to 'blog', the web form's default. */
  contentTemplate?: AnalyzeRequest['contentTemplate']
}

/**
 * Builds the same request the web app sends after "Import from URL":
 * identical option defaults, and the page HTML so the server runs the same
 * importer. No metaDescription/urlSlug: the web form does not send them, and
 * they would change the AI review input.
 *
 * Only if the page HTML is too large does it fall back to the extension's own
 * extracted text (results may then differ slightly from the web app).
 */
export function buildAnalyzeRequest(page: PageContent, options: AnalyzeOptions = {}) {
  const base = {
    platform: 'website',
    contentTemplate: options.contentTemplate || 'blog',
    supportingLineMode: 'recommended',
    insightFirstScope: 'DOCUMENT_INTRO',
    targetKeyword: truncate(normalizeWhitespace(options.targetKeyword), 100) || undefined,
    targetAudience: truncate(normalizeWhitespace(options.targetAudience), 200) || undefined,
  } as const

  if (page.html) {
    const request: AnalyzeRequest = { ...base, sourceHtml: page.html }
    return { request, fallback: null }
  }

  const fallback = formatContent(page.blocks)
  const request: AnalyzeRequest = { ...base, content: fallback.content, title: pickTitle(page) || undefined }
  return { request, fallback }
}
