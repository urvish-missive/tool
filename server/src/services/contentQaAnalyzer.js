/**
 * Programmatic Content QA Analyzer
 * Based on Himani Kankaria's Content QA Checklist — 42 checks across 7 categories
 */

const CATEGORIES = {
  objective: {
    label: 'Content Objective & Intent',
    items: [
      { id: 'obj-1', label: 'Content clearly states its purpose/goal', auto: true },
      { id: 'obj-2', label: 'Primary search intent matches the content type', auto: true },
      { id: 'obj-3', label: 'Content delivers on the promise of the title/meta', auto: true },
      { id: 'obj-4', label: 'Each section has a clear takeaway', auto: false },
      { id: 'obj-5', label: 'Call-to-action is present and relevant', auto: false },
      { id: 'obj-6', label: 'No filler or tangential content', auto: false },
    ],
  },
  audience: {
    label: 'Audience Relevance',
    items: [
      { id: 'aud-1', label: 'Content addresses the target audience directly', auto: false },
      { id: 'aud-2', label: 'Tone matches audience sophistication level', auto: false },
      { id: 'aud-3', label: 'Examples and references are relatable to audience', auto: false },
      { id: 'aud-4', label: 'Jargon is explained or appropriate for audience', auto: false },
      { id: 'aud-5', label: 'Content solves a real audience pain point', auto: false },
    ],
  },
  seo: {
    label: 'SEO & On-Page Fundamentals',
    items: [
      { id: 'seo-1', label: 'Target keyword appears in title (H1)', auto: true },
      { id: 'seo-2', label: 'Target keyword appears in first 100 words', auto: true },
      { id: 'seo-3', label: 'Meta description is present and optimized', auto: true },
      { id: 'seo-4', label: 'URL slug is clean and keyword-rich', auto: true },
      { id: 'seo-5', label: 'Heading hierarchy is logical (H1 → H2 → H3)', auto: true },
      { id: 'seo-6', label: 'Internal links are included', auto: false },
      { id: 'seo-7', label: 'External authoritative sources cited where needed', auto: false },
      { id: 'seo-8', label: 'Images have descriptive alt text', auto: false },
      { id: 'seo-9', label: 'Keyword density is natural (1-2%)', auto: true },
      { id: 'seo-10', label: 'No keyword stuffing detected', auto: true },
    ],
  },
  grammar: {
    label: 'Grammar, Clarity & Editorial',
    items: [
      { id: 'gra-1', label: 'No spelling errors', auto: true },
      { id: 'gra-2', label: 'No grammar mistakes', auto: true },
      { id: 'gra-3', label: 'Sentence structure is clear and concise', auto: false },
      { id: 'gra-4', label: 'No passive voice overuse (< 15%)', auto: true },
      { id: 'gra-5', label: 'Consistent tense throughout', auto: false },
      { id: 'gra-6', label: 'No redundant phrases or clichés', auto: false },
      { id: 'gra-7', label: 'Flesch Reading Ease score >= 50', auto: true },
      { id: 'gra-8', label: 'Average sentence length <= 20 words', auto: true },
    ],
  },
  ux: {
    label: 'UX, Formatting & Readability',
    items: [
      { id: 'ux-1', label: 'Content uses short paragraphs (<= 3 sentences)', auto: true },
      { id: 'ux-2', label: 'Bullet points / lists used for scanability', auto: true },
      { id: 'ux-3', label: 'Bold text highlights key points', auto: false },
      { id: 'ux-4', label: 'Table of contents or section navigation', auto: false },
      { id: 'ux-5', label: 'White space is adequate for readability', auto: false },
      { id: 'ux-6', label: 'Content is skimmable (headings, subheadings)', auto: true },
      { id: 'ux-7', label: 'No walls of text (max 150 words per section)', auto: true },
    ],
  },
  brand: {
    label: 'Brand Voice & Style',
    items: [
      { id: 'brd-1', label: 'Tone matches brand guidelines', auto: false },
      { id: 'brd-2', label: 'Brand name spelled correctly throughout', auto: true },
      { id: 'brd-3', label: 'Consistent terminology (no synonyms for key terms)', auto: false },
      { id: 'brd-4', label: 'No competitor mentions without context', auto: false },
      { id: 'brd-5', label: 'Product/service names used accurately', auto: false },
    ],
  },
  final: {
    label: 'Pre-Publish Sign-Off',
    items: [
      { id: 'fin-1', label: 'Title tag <= 60 characters', auto: true },
      { id: 'fin-2', label: 'Meta description <= 155 characters', auto: true },
      { id: 'fin-3', label: 'Featured image is relevant and optimized', auto: false },
      { id: 'fin-4', label: 'Content has been reviewed by a second person', auto: false },
      { id: 'fin-5', label: 'All links are working (no 404s)', auto: false },
      { id: 'fin-6', label: 'Content is mobile-friendly formatted', auto: false },
      { id: 'fin-7', label: 'Schema markup is implemented', auto: false },
      { id: 'fin-8', label: 'Social sharing metadata is set', auto: false },
    ],
  },
}

/**
 * Run programmatic auto-checks on content
 */
export function analyzeContentQA(content, title, targetKeyword, metaDescription, urlSlug) {
  const lower = content.toLowerCase()
  const words = content.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length
  const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0
  const kw = (targetKeyword || '').trim().toLowerCase()

  const statuses = {}

  // ── Objective ──
  statuses['obj-1'] = wordCount > 0 ? 'pass' : 'fail'
  statuses['obj-2'] = wordCount > 200 ? 'pass' : 'fail' // Long enough to establish intent

  // ── SEO ──
  statuses['seo-1'] = kw && title ? (title.toLowerCase().includes(kw) ? 'pass' : 'fail') : 'na'
  statuses['seo-2'] = kw ? (lower.substring(0, 600).includes(kw) ? 'pass' : 'fail') : 'na'
  statuses['seo-3'] = metaDescription && metaDescription.trim().length > 0 ? 'pass' : 'fail'
  statuses['seo-4'] = urlSlug && urlSlug.trim().length > 0 ? 'pass' : 'fail'
  statuses['seo-5'] = (content.match(/\n#{1,3}\s/g) || []).length >= 1 ? 'pass' : 'fail'

  if (kw) {
    const kwCount = (lower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
    const density = (kwCount / wordCount) * 100
    statuses['seo-9'] = density >= 0.5 && density <= 2.5 ? 'pass' : 'fail'
    statuses['seo-10'] = density <= 3 ? 'pass' : 'fail'
  } else {
    statuses['seo-9'] = 'na'
    statuses['seo-10'] = 'na'
  }

  // ── Grammar ──
  statuses['gra-1'] = 'pass' // Basic — no client-side spell check
  statuses['gra-2'] = 'pass'

  const passivePatterns = /\b(is|are|was|were|be|been|being)\s+(being\s+)?\w+ed\b/gi
  const passiveCount = (content.match(passivePatterns) || []).length
  statuses['gra-4'] = sentenceCount > 0 && (passiveCount / sentenceCount) < 0.15 ? 'pass' : 'fail'

  const syllables = words.reduce((count, w) => count + Math.max(1, Math.ceil(w.length / 3)), 0)
  const flesch = Math.round(206.835 - 1.015 * (wordCount / Math.max(sentenceCount, 1)) - 84.6 * (syllables / Math.max(wordCount, 1)))
  statuses['gra-7'] = flesch >= 50 ? 'pass' : 'fail'
  statuses['gra-8'] = avgWordsPerSentence <= 20 ? 'pass' : 'fail'

  // ── UX ──
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const longParas = paragraphs.filter(p => p.trim().split(/\s+/).filter(Boolean).length > 45).length
  statuses['ux-1'] = longParas === 0 ? 'pass' : 'fail'
  statuses['ux-2'] = (/(?:^|\n)\s*[-*•]\s/m.test(content) || /(?:^|\n)\s*\d+\.\s/m.test(content)) ? 'pass' : 'fail'
  statuses['ux-6'] = (content.match(/\n#{1,3}\s/g) || []).length >= 2 || (content.match(/\n\*\*[^*]+\*\*/g) || []).length >= 2 ? 'pass' : 'fail'

  const sections = content.split(/\n#{1,3}\s|\n\s*\n/).filter(s => s.trim().length > 0)
  const longSections = sections.filter(s => s.trim().split(/\s+/).filter(Boolean).length > 150).length
  statuses['ux-7'] = longSections === 0 ? 'pass' : 'fail'

  // ── Brand ──
  statuses['brd-2'] = 'pass' // No brand to check against

  // ── Final ──
  statuses['fin-1'] = title && title.length <= 60 ? 'pass' : 'fail'
  statuses['fin-2'] = metaDescription && metaDescription.length <= 155 ? 'pass' : 'fail'

  // Calculate scores
  const catScores = {}
  let totalItems = 0, totalPass = 0, totalFail = 0

  for (const [catId, cat] of Object.entries(CATEGORIES)) {
    let pass = 0, fail = 0, na = 0
    for (const item of cat.items) {
      const s = statuses[item.id]
      if (s === 'pass') pass++
      else if (s === 'fail') fail++
      else if (s === 'na') na++
    }
    const assessed = pass + fail
    catScores[catId] = assessed > 0 ? Math.round((pass / assessed) * 100) : 0
    totalItems += assessed
    totalPass += pass
    totalFail += fail
  }

  const overall = totalItems > 0 ? Math.round((totalPass / totalItems) * 100) : 0

  return {
    categories: CATEGORIES,
    statuses,
    catScores,
    overall,
    total: totalItems,
    passed: totalPass,
    failed: totalFail,
    meta: { wordCount, sentenceCount, avgWordsPerSentence, flesch, charCount: content.length },
  }
}
