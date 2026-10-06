/** Data extracted from the active tab by the content script. */

export type BlockType = 'heading' | 'paragraph' | 'list_item' | 'quote' | 'code'

export interface ContentBlock {
  type: BlockType
  /** 1-6 for headings, 0 otherwise */
  level: number
  text: string
}

export interface PageHeading {
  level: number
  text: string
}

export interface PageLink {
  url: string
  text: string
  type: 'internal' | 'external'
  /** No visible text, aria-label, title or image alt */
  emptyText: boolean
  /** "click here", "read more", ... */
  genericText: boolean
  nofollow: boolean
  /** Inside the detected main content (vs. nav, footer, sidebar) */
  inContent: boolean
}

export interface PageImage {
  src: string
  /** null = alt attribute missing entirely; '' = intentionally decorative */
  alt: string | null
}

export interface PageContent {
  url: string
  title: string
  metaDescription: string
  canonical: string
  language: string
  robots: string
  viewport: string

  headings: PageHeading[]

  /** Main-content blocks, in document order */
  blocks: ContentBlock[]
  /** Plain text of the main content */
  content: string
  wordCount: number
  paragraphCount: number
  contentLength: number
  /** Which strategy located the main content (article, main, density, ...) */
  contentRoot: string

  links: PageLink[]
  linkTotals: { internal: number; external: number; empty: number; generic: number }

  images: PageImage[]
  imageTotals: { total: number; withAlt: number; missingAlt: number; decorative: number }

  openGraph: { title?: string; description?: string; image?: string; type?: string }
  twitter: { card?: string; title?: string; description?: string; image?: string }

  structuredData: unknown[]
  structuredDataTypes: string[]

  /** Limits hit while extracting (so the UI can say so) */
  limits: { blocksCapped: boolean; linksCapped: boolean; imagesCapped: boolean }
  extractedAt: string
}
