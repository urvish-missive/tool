import { createIssue, findDuplicates, keywordFrequency } from '../../utils/helpers.js'

export function analyzeOnPage(pages) {
  const issues = []
  const summary = {
    totalPages: pages.length,
    missingTitles: 0,
    duplicateTitles: 0,
    shortTitles: 0,
    longTitles: 0,
    missingDescriptions: 0,
    duplicateDescriptions: 0,
    shortDescriptions: 0,
    longDescriptions: 0,
    missingH1: 0,
    multipleH1: 0,
    imagesWithoutAlt: 0,
    totalImages: 0,
    thinContentPages: 0,
    avgWordCount: 0,
  }

  summary.avgWordCount =
    pages.length > 0
      ? Math.round(pages.reduce((s, p) => s + p.wordCount, 0) / pages.length)
      : 0

  // ── 1. Page Title Tags ──────────────────────────────────────────
  const missingTitlePages = []
  const shortTitlePages = []
  const longTitlePages = []

  pages.forEach(p => {
    if (!p.title) {
      summary.missingTitles++
      missingTitlePages.push(p.url)
    } else if (p.title.length < 25) {
      summary.shortTitles++
      shortTitlePages.push({ url: p.url, title: p.title, length: p.title.length })
    } else if (p.title.length > 65) {
      summary.longTitles++
      longTitlePages.push({ url: p.url, title: p.title, length: p.title.length })
    }
  })

  if (missingTitlePages.length > 0) {
    issues.push(
      createIssue(
        'onpage',
        'CRITICAL',
        'Missing HTML Title Tags',
        'The title tag is one of the most critical on-page ranking signals. Search engines use it as the main clickable link in SERPs.',
        'Add a unique, descriptive <title> tag between 50-60 characters to each page containing primary search keywords.',
        {
          affectedPages: missingTitlePages,
          evidence: `${missingTitlePages.length} page(s) completely lack a <title> tag`,
        }
      )
    )
  }

  if (shortTitlePages.length > 0) {
    issues.push(
      createIssue(
        'onpage',
        'MEDIUM',
        'Short / Under-Optimized Title Tags',
        'Short titles under 25 characters fail to take full advantage of Google SERP display space and reduce keyword coverage.',
        'Expand short titles to 50-60 characters including secondary keywords or brand name.',
        {
          affectedPages: shortTitlePages.map(p => p.url),
          affectedItems: shortTitlePages.map(p => ({
            url: p.url,
            evidence: `"${p.title}" (${p.length} characters)`,
          })),
        }
      )
    )
  }

  if (longTitlePages.length > 0) {
    issues.push(
      createIssue(
        'onpage',
        'LOW',
        'Excessively Long Title Tags',
        'Title tags exceeding 65 characters get truncated with ellipses (...) in desktop and mobile search snippets.',
        'Keep title tags under 60-65 characters (or ~580px width) so the full message is visible in search results.',
        {
          affectedPages: longTitlePages.map(p => p.url),
          affectedItems: longTitlePages.map(p => ({
            url: p.url,
            evidence: `"${p.title}" (${p.length} characters)`,
          })),
        }
      )
    )
  }

  // Duplicate Titles
  const titleMap = new Map()
  pages.forEach(p => {
    if (p.title) {
      const existing = titleMap.get(p.title) || []
      existing.push(p.url)
      titleMap.set(p.title, existing)
    }
  })

  const duplicateTitles = [...titleMap.entries()].filter(([, urls]) => urls.length > 1)
  if (duplicateTitles.length > 0) {
    summary.duplicateTitles = duplicateTitles.reduce((acc, [, urls]) => acc + urls.length, 0)
    issues.push(
      createIssue(
        'onpage',
        'HIGH',
        'Duplicate Title Tags Across Multiple Pages',
        'Multiple pages sharing identical title tags create keyword cannibalization and confuse search engines about which page to rank.',
        'Ensure every indexable page has a distinct, descriptive title tag tailored to its unique topic.',
        {
          affectedPages: duplicateTitles.flatMap(([, urls]) => urls),
          affectedItems: duplicateTitles.map(([title, urls]) => ({
            url: urls[0],
            evidence: `"${title}" shared across ${urls.length} pages (${urls.join(', ')})`,
          })),
        }
      )
    )
  }

  // ── 2. Meta Descriptions ────────────────────────────────────────
  const missingDescPages = []
  const shortDescPages = []
  const longDescPages = []

  pages.forEach(p => {
    if (!p.metaDescription) {
      summary.missingDescriptions++
      missingDescPages.push(p.url)
    } else if (p.metaDescription.length < 70) {
      summary.shortDescriptions++
      shortDescPages.push({ url: p.url, desc: p.metaDescription, length: p.metaDescription.length })
    } else if (p.metaDescription.length > 160) {
      summary.longDescriptions++
      longDescPages.push({ url: p.url, desc: p.metaDescription, length: p.metaDescription.length })
    }
  })

  if (missingDescPages.length > 0) {
    issues.push(
      createIssue(
        'onpage',
        'HIGH',
        'Missing Meta Descriptions',
        'Meta descriptions act as ad copy in organic search results. Without one, Google generates an arbitrary snippet that may reduce CTR.',
        'Write compelling meta descriptions (120-155 characters) with a clear value proposition and call-to-action.',
        {
          affectedPages: missingDescPages,
          evidence: `${missingDescPages.length} page(s) missing <meta name="description">`,
        }
      )
    )
  }

  if (shortDescPages.length > 0) {
    issues.push(
      createIssue(
        'onpage',
        'MEDIUM',
        'Short Meta Descriptions (<70 characters)',
        'Short meta descriptions fail to communicate sufficient context to users in SERPs.',
        'Expand meta descriptions to 120-155 characters to maximize search snippet real estate.',
        {
          affectedPages: shortDescPages.map(p => p.url),
          affectedItems: shortDescPages.map(p => ({
            url: p.url,
            evidence: `"${p.desc}" (${p.length} characters)`,
          })),
        }
      )
    )
  }

  // Duplicate Descriptions
  const descMap = new Map()
  pages.forEach(p => {
    if (p.metaDescription) {
      const existing = descMap.get(p.metaDescription) || []
      existing.push(p.url)
      descMap.set(p.metaDescription, existing)
    }
  })

  const duplicateDescs = [...descMap.entries()].filter(([, urls]) => urls.length > 1)
  if (duplicateDescs.length > 0) {
    summary.duplicateDescriptions = duplicateDescs.reduce((acc, [, urls]) => acc + urls.length, 0)
    issues.push(
      createIssue(
        'onpage',
        'MEDIUM',
        'Duplicate Meta Descriptions',
        'Identical meta descriptions across multiple URLs reduce search snippet relevance and differentiation.',
        'Create custom meta descriptions highlighting the unique angle of each page.',
        {
          affectedPages: duplicateDescs.flatMap(([, urls]) => urls),
          affectedItems: duplicateDescs.map(([desc, urls]) => ({
            url: urls[0],
            evidence: `"${desc.substring(0, 70)}..." shared across ${urls.length} pages`,
          })),
        }
      )
    )
  }

  // ── 3. Headings (H1, H2, H3) with EXACT CONTENT EVIDENCE ──────────
  const missingH1Pages = []
  const multipleH1Pages = []

  pages.forEach(p => {
    const h1Count = p.h1?.length || 0
    if (h1Count === 0) {
      summary.missingH1++
      missingH1Pages.push(p.url)
    } else if (h1Count > 1) {
      summary.multipleH1++
      multipleH1Pages.push({
        url: p.url,
        count: h1Count,
        h1List: p.h1,
      })
    }
  })

  if (missingH1Pages.length > 0) {
    issues.push(
      createIssue(
        'onpage',
        'HIGH',
        'Missing Primary H1 Headings',
        'The H1 tag communicates the primary theme of the document to search engine crawlers and users.',
        'Add exactly one descriptive H1 tag to the top of the main content area.',
        {
          affectedPages: missingH1Pages,
          evidence: `${missingH1Pages.length} page(s) have no H1 tags detected in DOM`,
        }
      )
    )
  }

  if (multipleH1Pages.length > 0) {
    issues.push(
      createIssue(
        'onpage',
        'MEDIUM',
        'Multiple H1 Tags Detected on Same Page',
        'Multiple H1 headings dilute topical focus and create confusion regarding the main page subject for search bots and screen readers.',
        'Maintain a single primary H1 heading per page. Demote secondary section headings to H2 or H3 tags.',
        {
          affectedPages: multipleH1Pages.map(p => p.url),
          affectedItems: multipleH1Pages.map(p => ({
            url: p.url,
            evidence: `Found ${p.count} H1 tags:\n${p.h1List.map((h, i) => `  [H1 #${i + 1}]: "${h}"`).join('\n')}`,
            h1List: p.h1List,
          })),
        }
      )
    )
  }

  // ── 4. Image ALT Attributes with Exact Missing Images ───────────
  const missingAltPages = []

  pages.forEach(p => {
    summary.totalImages += p.totalImages || 0
    summary.imagesWithoutAlt += p.missingAltCount || 0
    if (p.missingAltCount > 0) {
      missingAltPages.push({
        url: p.url,
        count: p.missingAltCount,
        total: p.totalImages,
        sampleImages: (p.imagesMissingAlt || []).slice(0, 5).map(img => img.src || '[inline image]'),
      })
    }
  })

  if (missingAltPages.length > 0) {
    const totalMissing = summary.imagesWithoutAlt
    issues.push(
      createIssue(
        'onpage',
        totalMissing > 10 ? 'HIGH' : 'MEDIUM',
        'Images Missing Descriptive ALT Attributes',
        'ALT attributes are essential for visual search indexing (Google Images), accessibility screen readers, and image SEO contextual signals.',
        'Add concise, descriptive alt text to all informative images. Use empty alt="" for purely decorative graphics.',
        {
          affectedPages: missingAltPages.map(p => p.url),
          affectedItems: missingAltPages.map(p => ({
            url: p.url,
            evidence: `${p.count} image(s) missing alt text (e.g. ${p.sampleImages.join(', ')})`,
          })),
        }
      )
    )
  }

  // ── 5. Thin Content / Word Count ────────────────────────────────
  const thinPages = []
  pages.forEach(p => {
    if (p.wordCount < 300) {
      summary.thinContentPages++
      thinPages.push({ url: p.url, wordCount: p.wordCount })
    }
  })

  if (thinPages.length > 0) {
    issues.push(
      createIssue(
        'content',
        'MEDIUM',
        'Thin Content (<300 words)',
        'Pages with very low text content may be classified by Google as low-quality or non-satisfying for search user intent.',
        'Expand page content with comprehensive explanations, FAQs, case studies, or structured data.',
        {
          affectedPages: thinPages.map(p => p.url),
          affectedItems: thinPages.map(p => ({
            url: p.url,
            evidence: `Word count: ${p.wordCount} words (recommendation > 500 for core content)`,
          })),
        }
      )
    )
  }

  return { issues, summary }
}
