import { fetchWithTimeout, validateURL, resolveAndValidate, countWords } from '../../utils/helpers.js'
import * as cheerio from 'cheerio'
import mammoth from 'mammoth'

/**
 * Import content from Google Docs URLs, Web pages, or articles
 */
export async function importContentFromUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Please provide a valid URL')
  }

  const url = rawUrl.trim()

  // ── 1. GOOGLE DOCS IMPORT ──────────────────────────────────────────
  const isGoogleDoc = /docs\.google\.com\/document\//i.test(url)
  if (isGoogleDoc) {
    return await handleGoogleDocImport(url)
  }

  // ── 2. WEB PAGE / ARTICLE IMPORT ──────────────────────────────────
  return await handleWebArticleImport(url)
}

/**
 * Extract content and title from a Google Doc link
 */
async function handleGoogleDocImport(url) {
  const docIdMatch = url.match(/\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/i)
  const pubMatch = url.match(/\/document\/d\/e\/([a-zA-Z0-9_-]+)\/pub/i)

  let exportUrl = url
  let isDirectPub = false

  if (pubMatch) {
    exportUrl = url.split('?')[0]
    if (!exportUrl.endsWith('/pub')) exportUrl += '/pub'
    isDirectPub = true
  } else if (docIdMatch) {
    const docId = docIdMatch[1]
    // Export as HTML preserves headings, bullet lists, and the exact title from the document!
    exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`
  }

  try {
    const response = await fetchWithTimeout(
      exportUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
        },
        redirect: 'follow',
      },
      12000
    )

    const finalUrl = response.url || ''
    if (
      finalUrl.includes('accounts.google.com') ||
      response.status === 401 ||
      response.status === 403
    ) {
      return {
        success: false,
        source: 'google_doc',
        error:
          'This Google Doc is private. Please open your Google Doc, click "Share" → set General Access to "Anyone with the link" (Viewer), or copy and paste the text directly.',
      }
    }

    if (!response.ok) {
      // If HTML export failed, try TXT export
      if (docIdMatch && !isDirectPub) {
        const txtUrl = `https://docs.google.com/document/d/${docIdMatch[1]}/export?format=txt`
        const txtResp = await fetchWithTimeout(txtUrl, { redirect: 'follow' }, 8000)
        if (txtResp.ok) {
          const rawTxt = await txtResp.text()
          const lines = rawTxt
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
          const title = lines.length > 0 && lines[0].length < 120 ? lines[0] : ''
          return {
            success: true,
            source: 'google_doc',
            title,
            content: rawTxt.trim(),
            wordCount: countWords(rawTxt),
          }
        }
      }
      return {
        success: false,
        source: 'google_doc',
        error: `Could not access Google Doc (HTTP ${response.status}). Please ensure the doc is shared with "Anyone with the link".`,
      }
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Document Title
    let title = $('title').text().replace(/ - Google Docs$/i, '').trim()
    if (!title || title === 'Google Docs' || title === 'Untitled document') {
      const firstH1 = $('h1').first().text().trim()
      if (firstH1) title = firstH1
    }

    // Clean out styling and script tags
    $('style, script, noscript').remove()

    // Extract structured content preserving paragraphs and lists
    const paragraphs = []
    $('p, h1, h2, h3, h4, h5, h6, li').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim()
      if (!text) return

      const tagName = el.tagName.toLowerCase()
      if (tagName === 'h1') paragraphs.push(`# ${text}`)
      else if (tagName === 'h2') paragraphs.push(`## ${text}`)
      else if (tagName === 'h3') paragraphs.push(`### ${text}`)
      else if (tagName === 'li') paragraphs.push(`- ${text}`)
      else paragraphs.push(text)
    })

    let extractedContent = paragraphs.join('\n\n').trim()

    // Fallback if paragraph parsing was sparse
    if (!extractedContent || extractedContent.length < 20) {
      extractedContent = $('body').text().replace(/\s+/g, ' ').trim()
    }

    if (!extractedContent || extractedContent.length < 20) {
      return {
        success: false,
        source: 'google_doc',
        error: 'The Google Doc appears to be empty or could not be read.',
      }
    }

    return {
      success: true,
      source: 'google_doc',
      title: title && title !== 'Untitled document' ? title : '',
      content: extractedContent,
      wordCount: countWords(extractedContent),
    }
  } catch (err) {
    return {
      success: false,
      source: 'google_doc',
      error: `Failed to import Google Doc: ${err.message}. Please verify the link is shared as "Anyone with the link".`,
    }
  }
}

/**
 * Extract content and title from a web article / blog post URL
 */
async function handleWebArticleImport(url) {
  let parsed
  try {
    const raw = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    parsed = validateURL(raw)
    await resolveAndValidate(parsed.hostname)
  } catch (err) {
    return { success: false, source: 'web', error: err.message || 'Invalid or blocked web URL' }
  }

  try {
    const response = await fetchWithTimeout(
      parsed.href,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      },
      12000
    )

    if (!response.ok) {
      return {
        success: false,
        source: 'web',
        error: `Could not fetch web page (HTTP ${response.status}).`,
      }
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract Title
    let title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('h1').first().text() ||
      $('title').text() ||
      ''
    title = title.replace(/\s+/g, ' ').trim()

    // Remove boilerplate elements
    $(
      'script, style, noscript, nav, header, footer, aside, form, iframe, svg, .sidebar, .comments, .advertisement, .ad, .social-share, .cookie-banner, .popup'
    ).remove()

    // Find main article container if available
    let $root = $('article')
    if (!$root.length) $root = $('main')
    if (!$root.length) $root = $('[role="main"]')
    if (!$root.length)
      $root = $('.post-content, .entry-content, .article-content, .blog-post, .content-area, .content')
    if (!$root.length) $root = $('body')

    const paragraphs = []
    $root.find('p, h1, h2, h3, h4, li').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim()
      if (!text || text.length < 3) return

      const tagName = el.tagName.toLowerCase()
      if (tagName === 'h1') paragraphs.push(`# ${text}`)
      else if (tagName === 'h2') paragraphs.push(`## ${text}`)
      else if (tagName === 'h3') paragraphs.push(`### ${text}`)
      else if (tagName === 'li') paragraphs.push(`- ${text}`)
      else paragraphs.push(text)
    })

    let content = paragraphs.join('\n\n').trim()
    if (!content || content.length < 50) {
      content = $root.text().replace(/\s+/g, ' ').trim()
    }

    if (!content || content.length < 20) {
      return {
        success: false,
        source: 'web',
        error:
          'Could not extract article text from this page. You can copy and paste the text directly.',
      }
    }

    return {
      success: true,
      source: 'web',
      title,
      content,
      wordCount: countWords(content),
    }
  } catch (err) {
    return {
      success: false,
      source: 'web',
      error: `Failed to extract web content: ${err.message}`,
    }
  }
}

/**
 * Import content from an uploaded file (Base64 or raw text)
 */
export async function importContentFromFile({ base64Data, textData, filename = '', mimeType = '' }) {
  const cleanFilename = filename.toLowerCase()
  const cleanTitle = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')

  // 1. Text or Markdown file
  if (textData || cleanFilename.endsWith('.txt') || cleanFilename.endsWith('.md')) {
    const raw = textData || (base64Data ? Buffer.from(base64Data, 'base64').toString('utf-8') : '')
    return {
      success: true,
      source: 'file',
      title: cleanTitle,
      content: raw.trim(),
      wordCount: countWords(raw),
    }
  }

  // 2. HTML file
  if (cleanFilename.endsWith('.html') || cleanFilename.endsWith('.htm') || mimeType.includes('html')) {
    const raw = textData || (base64Data ? Buffer.from(base64Data, 'base64').toString('utf-8') : '')
    const $ = cheerio.load(raw)
    const title = $('title').text().trim() || cleanTitle
    $('script, style, noscript, nav, header, footer').remove()
    const content = $('body').text().replace(/\s+/g, ' ').trim()
    return {
      success: true,
      source: 'file',
      title,
      content,
      wordCount: countWords(content),
    }
  }

  // 3. Word Document (.docx)
  if (cleanFilename.endsWith('.docx') || mimeType.includes('openxmlformats-officedocument.wordprocessingml')) {
    if (!base64Data) {
      throw new Error('File data is missing')
    }
    const buffer = Buffer.from(base64Data, 'base64')
    const result = await mammoth.extractRawText({ buffer })
    const extractedText = (result.value || '').trim()

    if (!extractedText) {
      throw new Error('Could not extract text from .docx file. It may be empty or password-protected.')
    }

    return {
      success: true,
      source: 'file',
      title: cleanTitle,
      content: extractedText,
      wordCount: countWords(extractedText),
    }
  }

  // Fallback UTF-8 decode
  if (base64Data) {
    const raw = Buffer.from(base64Data, 'base64').toString('utf-8')
    if (raw && raw.length > 20) {
      return {
        success: true,
        source: 'file',
        title: cleanTitle,
        content: raw.trim(),
        wordCount: countWords(raw),
      }
    }
  }

  throw new Error('Unsupported file format. Please upload a .docx, .txt, .md, or .html file.')
}
