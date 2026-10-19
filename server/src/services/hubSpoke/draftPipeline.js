// Publish-ready draft pipeline for the Hub & Spoke planner.
//   1. research  - the model lists the searches; Tavily runs them (TAVILY_API_KEY); top results become VERIFIED SOURCES
//   2. write     - the model writes from the outline, citing only those sources with real links
//   3. verify    - every external link is requested; dead ones lose the link, keep the text, and are reported
//   4. images    - [IMAGE]/[INFOGRAPHIC] placeholders become generated images (IMAGE_PROVIDER=openai) saved under uploads/
// Each step degrades on its own: no key = that step is skipped and the draft says so.
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { askModel } from './ai.js'
import { buildQueriesPrompt } from './prompts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads/hub-spoke')

const {
  TAVILY_API_KEY = '',
  IMAGE_PROVIDER = 'none',
  IMAGE_API_KEY = '',
  IMAGE_MODEL = 'gpt-image-1',
  MAX_IMAGES_PER_DRAFT = '4',
} = process.env

export const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
export const arr = (v, n, max) =>
  Array.isArray(v)
    ? v
        .slice(0, n)
        .map((x) => str(x, max))
        .filter(Boolean)
    : []

// The content QA checklist lives in checklist.txt, one item per line. Edit that file to change what drafts are scored against.
export const checklistText = () => {
  try {
    return fs.readFileSync(path.join(__dirname, 'checklist.txt'), 'utf8').trim()
  } catch {
    return ''
  }
}

export const outlineToMd = (d) => {
  const pts = (t) =>
    (Array.isArray(t) ? t : String(t || '').split('\n'))
      .map((x) => String(x).trim())
      .filter(Boolean)
  const secs = Array.isArray(d.sections) ? d.sections.slice(0, 20) : []
  return (
    `# ${str(d.title, 200)}\n\n- Meta title: ${str(d.meta_title, 120)}\n- Meta description: ${str(d.meta_description, 300)}\n- Primary keyword: ${str(d.primary_keyword, 120)}\n- Secondary keywords: ${str(d.secondary_keywords, 400)}\n- Search intent: ${str(d.search_intent, 200)}\n- Suggested length: ${str(String(d.word_count || ''), 10)} words\n\n` +
    secs
      .map(
        (x) =>
          `## ${str(x.heading, 200)}\n${pts(x.points)
            .slice(0, 15)
            .map((l) =>
              /^h3:\s*/i.test(l)
                ? `\n### ${l.replace(/^h3:\s*/i, '').slice(0, 200)}`
                : `- ${l.slice(0, 400)}`
            )
            .join('\n')}`
      )
      .join('\n\n') +
    `\n\n## FAQs\n${pts(d.faqs)
      .slice(0, 10)
      .map((l) => `- ${l.slice(0, 300)}`)
      .join('\n')}\n\n## Internal links\n${pts(d.internal_links)
      .slice(0, 15)
      .map((l) => `- ${l.slice(0, 400)}`)
      .join('\n')}\n\n## Call to action\n${str(d.cta, 300)}\n`
  )
}

export async function research(outlineMd) {
  if (!TAVILY_API_KEY)
    return {
      sources: [],
      note: 'No web research key configured (TAVILY_API_KEY), so statistics stay as placeholders.',
    }
  let queries = []
  try {
    const x = await askModel(buildQueriesPrompt(outlineMd), 600)
    queries = JSON.parse(x.slice(x.indexOf('['), x.lastIndexOf(']') + 1))
  } catch {
    queries = []
  }
  queries = (Array.isArray(queries) ? queries : [])
    .map((q) => str(q, 200))
    .filter(Boolean)
    .slice(0, 9)
  const seen = new Map()
  await Promise.allSettled(
    queries.map(async (q) => {
      const r = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + TAVILY_API_KEY },
        body: JSON.stringify({
          query: q,
          max_results: 5,
          search_depth: 'basic',
          include_answer: false,
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (!r.ok) return
      for (const x of (await r.json()).results || []) {
        if (!x.url || seen.has(x.url) || /reddit\.com|quora\.com|pinterest\./i.test(x.url)) continue
        seen.set(x.url, {
          url: x.url,
          title: str(x.title, 160),
          snippet: str((x.content || '').replace(/\s+/g, ' '), 500),
          published: str(x.published_date || '', 20),
          query: q,
        })
      }
    })
  )
  const sources = [...seen.values()].slice(0, 24)
  return {
    sources,
    note: sources.length
      ? ''
      : 'Web research returned nothing usable, so statistics stay as placeholders.',
    queries,
  }
}

export async function verifyLinks(md, allowed) {
  const urls = [
    ...new Set([...md.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1])),
  ].filter((u) => !allowed.has(u))
  const dead = []
  await Promise.allSettled(
    urls.map(async (u) => {
      try {
        const r = await fetch(u, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; HubSpokePlanner/1.0)',
            Range: 'bytes=0-2048',
          },
        })
        if (r.status >= 400 && r.status !== 403 && r.status !== 429) dead.push(u)
      } catch {
        dead.push(u)
      }
    })
  )
  for (const u of dead)
    md = md.replace(
      new RegExp(`\\[([^\\]]+)\\]\\(${u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
      '$1'
    )
  return { md, dead }
}

// Replace this function to use another image provider.
async function generateImage(prompt) {
  if (IMAGE_PROVIDER === 'openai' && IMAGE_API_KEY) {
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + IMAGE_API_KEY },
      body: JSON.stringify({ model: IMAGE_MODEL, prompt, size: '1536x1024', n: 1 }),
      signal: AbortSignal.timeout(120000),
    })
    if (!r.ok) throw new Error('image api ' + r.status)
    const j = await r.json()
    const b64 = j.data && j.data[0] && j.data[0].b64_json
    if (!b64) throw new Error('no image')
    return Buffer.from(b64, 'base64')
  }
  throw new Error('no provider')
}

export const imagesEnabled = () => IMAGE_PROVIDER !== 'none' && !!IMAGE_API_KEY

export async function addImages(md, title, publicBase) {
  const max = Number(MAX_IMAGES_PER_DRAFT) || 4
  const out = { md, made: 0, failed: 0 }
  if (!imagesEnabled()) return out
  const slots = [...md.matchAll(/^\[(IMAGE|INFOGRAPHIC):\s*([^\]]+)\]\s*$/gm)].slice(0, max)
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  for (const m of slots) {
    const style =
      m[1] === 'INFOGRAPHIC'
        ? 'Clean infographic-style illustration, flat vector, clear visual hierarchy, brand-neutral blue and teal palette, no small text, no logos.'
        : 'Clean editorial illustration for a B2B blog, flat vector style, blue and teal palette, no text, no logos.'
    try {
      const buf = await generateImage(
        `${style} Subject: ${m[2].slice(0, 400)}. Context: article titled "${title}".`
      )
      const name = crypto.randomBytes(8).toString('hex') + '.png'
      fs.writeFileSync(path.join(UPLOADS_DIR, name), buf)
      const alt = m[2].replace(/"/g, "'").slice(0, 160)
      out.md = out.md.replace(m[0], `![${alt}](${publicBase}/uploads/hub-spoke/${name})`)
      out.made++
    } catch (e) {
      console.error('[hub-spoke] image failed:', e.message)
      out.failed++
    }
  }
  return out
}
