// Hub & Spoke Planner (replaces the Blog Topic Generator at /blog-topic-generator).
// Routes live under /api/hub-spoke.
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { askJson } from '../services/hubSpoke/ai.js'
import { scanSite } from '../services/hubSpoke/siteScan.js'
import { buildPrompt, buildOutlinePrompt, buildDraftPrompt } from '../services/hubSpoke/prompts.js'
import {
  str,
  arr,
  checklistText,
  outlineToMd,
  research,
  verifyLinks,
  addImages,
  imagesEnabled,
  UPLOADS_DIR,
} from '../services/hubSpoke/draftPipeline.js'

const {
  HUB_SPOKE_ACCESS = 'open',
  HUB_SPOKE_SUMMARY_ACCESS = 'paid',
  FETCH_URLS = 'true',
  WP_URL = '',
  WP_USER = '',
  WP_APP_PASSWORD = '',
  PUBLIC_BASE_URL = '',
} = process.env

// ---------------------------------------------------------------------------------------------
// UPGRADED PLAN CHECK. This site has no accounts or billing, so HUB_SPOKE_ACCESS=open (the default)
// gives every visitor the upgraded features: website scan, file upload, outlines, drafts, WordPress
// and the strategy summary. Set HUB_SPOKE_ACCESS=paid to lock them again, and replace this body with
// a real subscription check once one exists.
// ---------------------------------------------------------------------------------------------
export function isPro(_req) {
  return HUB_SPOKE_ACCESS === 'open'
}

const publicBase = (req) =>
  (PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '')

const ERRORS = {
  bad_input: 'Please type a topic, keyword or brief first.',
  invalid_json: 'The AI reply came back incomplete. Please try again.',
  rate_limited: 'The planner is busy right now. Please wait a few minutes and try again.',
  upstream_error: 'Something went wrong while talking to the AI. Please try again.',
  upgrade_required: 'That feature is part of the upgraded plan.',
  not_configured:
    'WordPress is not connected on this site yet. Ask your developer to add the site address and an application password.',
  wordpress_error: 'WordPress did not accept the post. Check the connection and try again.',
}
const sendError = (res, status, code, extra = {}) =>
  res
    .status(status)
    .json({ success: false, code, error: ERRORS[code] || ERRORS.upstream_error, ...extra })

const fail = (res, e) => {
  if (!e.status) console.error('[hub-spoke]', e)
  sendError(res, e.status || 502, e.status === 429 ? 'rate_limited' : 'upstream_error')
}

export function me(req, res) {
  res.json({ success: true, pro: isPro(req) })
}

export async function cluster(req, res) {
  const b = req.body || {}
  const pro = isPro(req)
  const f = {
    input: str(b.input, 2000),
    info: str(b.info, 3000),
    level: ['Simpler', 'Balanced', 'Advanced'].includes(b.level) ? b.level : 'Balanced',
    existing: str(b.existing, 4000),
    industry: str(b.industry, 80),
    saved: str(b.saved, 3000),
    url: pro ? str(b.url, 300) : '',
    source: pro ? str(b.source, 60000) : '',
    source_name: pro ? str(b.source_name, 200) : '',
  }
  if (pro && !f.url && /^https?:\/\/\S+$/i.test(f.input)) f.url = f.input // an upgraded visitor pasted the address into the topic box
  if (f.input.length < 2 && !f.url && !f.source) return sendError(res, 400, 'bad_input')
  try {
    let scan = null
    if (f.url && FETCH_URLS === 'true') {
      try {
        scan = await scanSite(f.url)
      } catch (e) {
        console.error('[hub-spoke] site scan failed:', f.url, e.message)
      }
    }
    const plan = await askJson(
      buildPrompt(f, scan),
      8000,
      (d) => d.hub && Array.isArray(d.spokes) && d.spokes.length
    )
    if (!plan) return sendError(res, 502, 'invalid_json')
    // Trust only URLs that came from the scan: anything else is downgraded to "new" or dropped.
    const known = new Set(scan ? scan.pages.map((p) => p.url) : [])
    const fix = (r) => {
      if (r && r.status === 'existing' && !known.has(r.existing_url)) {
        r.status = 'new'
        r.existing_url = ''
        if (r.action && !/^write/i.test(r.action)) r.action = 'Write'
      }
    }
    fix(plan.hub)
    for (const s of plan.spokes) {
      fix(s)
      s.site_links = (Array.isArray(s.site_links) ? s.site_links : [])
        .filter((l) => l && known.has(l.url))
        .slice(0, 2)
        .map((l) => ({ url: l.url, anchor: str(l.anchor, 120) }))
    }
    if (scan)
      plan.site = {
        url: scan.url,
        pages: scan.pages.slice(0, 40),
        count: scan.pages.length,
        weak: scan.weak,
      }
    else {
      plan.site_profile = null
      plan.gap_summary = []
      if (f.url) plan.site_error = true
    }
    // never send the paid summary to free visitors
    if (!pro && HUB_SPOKE_SUMMARY_ACCESS === 'paid')
      plan.summary = { hub_concept: (plan.summary && plan.summary.hub_concept) || '' }
    res.json({ success: true, plan })
  } catch (e) {
    fail(res, e)
  }
}

export async function outline(req, res) {
  if (!isPro(req)) return sendError(res, 403, 'upgrade_required')
  const b = req.body || {}
  const p = b.page || {}
  const c = {
    page: {
      type: p.type === 'Pillar' ? 'Pillar' : 'Supporting',
      title: str(p.title, 200),
      stage: str(p.stage, 40),
      level: str(p.level, 40),
      purpose: str(p.purpose, 80),
      format: str(p.format, 80),
      intent: str(p.intent, 60),
      link: str(p.link, 300),
      cta: str(p.cta, 200),
    },
    pillar: str(b.pillar, 200),
    siblings: arr(b.siblings, 14, 200),
    audience: str(b.audience, 600),
    offer: str(b.offer, 300),
    industry: str(b.industry, 80),
    pages: arr(b.pages, 40, 300),
  }
  if (c.page.title.length < 3) return sendError(res, 400, 'bad_input')
  try {
    const data = await askJson(
      buildOutlinePrompt(c),
      4000,
      (d) => Array.isArray(d.sections) && d.sections.length
    )
    if (!data) return sendError(res, 502, 'invalid_json')
    res.json({ success: true, outline: data })
  } catch (e) {
    fail(res, e)
  }
}

export async function draft(req, res) {
  if (!isPro(req)) return sendError(res, 403, 'upgrade_required')
  const b = req.body || {}
  const o = b.outline || {}
  const x = b.context || {}
  if (!o.title || !Array.isArray(o.sections) || !o.sections.length)
    return sendError(res, 400, 'bad_input')
  const c = {
    pillar: str(x.pillar, 200),
    audience: str(x.audience, 600),
    offer: str(x.offer, 300),
    industry: str(x.industry, 80),
    pages: arr(x.pages, 40, 300),
  }
  try {
    const omd = outlineToMd(o)
    const notes = []
    const rs = await research(omd)
    if (rs.note) notes.push(rs.note)
    const d = await askJson(
      buildDraftPrompt(
        omd,
        c,
        checklistText(),
        str(b.feedback, 3000),
        str(b.previous, 40000),
        rs.sources
      ),
      12000,
      (v) => typeof v.markdown === 'string' && v.markdown.length > 200
    )
    if (!d) return sendError(res, 502, 'invalid_json')
    const allowed = new Set(c.pages.map((p) => p.split(' | ')[0]))
    const v = await verifyLinks(d.markdown, allowed)
    d.markdown = v.md
    if (v.dead.length)
      notes.push(
        `${v.dead.length} external link(s) did not respond and were removed: ${v.dead.slice(0, 5).join(', ')}`
      )
    const im = await addImages(d.markdown, str(o.title, 200), publicBase(req))
    d.markdown = im.md
    if (!imagesEnabled())
      notes.push(
        'No image provider configured (IMAGE_PROVIDER), so images stay as briefs for your designer.'
      )
    else if (im.failed)
      notes.push(`${im.failed} image(s) could not be generated and stay as briefs.`)
    d.sources = rs.sources
      .filter((s) => d.markdown.includes(s.url))
      .map((s) => ({ url: s.url, title: s.title, published: s.published }))
    d.pipeline_notes = notes
    d.editor_notes = [...(Array.isArray(d.editor_notes) ? d.editor_notes : []), ...notes]
    res.json({ success: true, draft: d })
  } catch (e) {
    fail(res, e)
  }
}

// WordPress: creates a DRAFT post through the site's REST API with an Application Password
// (WordPress 5.6+, Users -> Profile -> Application Passwords). Nothing is published without a human.
export async function wordpress(req, res) {
  if (!isPro(req)) return sendError(res, 403, 'upgrade_required')
  if (!WP_URL || !WP_USER || !WP_APP_PASSWORD) return sendError(res, 500, 'not_configured')
  const b = req.body || {}
  const post = {
    title: str(b.title, 300),
    content: typeof b.content === 'string' ? b.content.slice(0, 400000) : '',
    excerpt: str(b.excerpt, 500),
    slug: str(b.slug, 120),
    status: 'draft',
  }
  if (!post.title || post.content.length < 50) return sendError(res, 400, 'bad_input')
  const base = WP_URL.replace(/\/$/, '')
  const auth = 'Basic ' + Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64')
  // Images in the post (generated files under /uploads/hub-spoke or inline data URIs) go into the WordPress media library first.
  const imgs = [...new Set([...post.content.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]))]
    .filter((u) => /\/uploads\/hub-spoke\/[a-f0-9]+\.png$/.test(u) || /^data:image\//.test(u))
    .slice(0, 10)
  for (const u of imgs) {
    try {
      let buf
      let type = 'image/png'
      if (u.startsWith('data:')) {
        const m = u.match(/^data:(image\/[a-z]+);base64,(.*)$/s)
        type = m[1]
        buf = Buffer.from(m[2], 'base64')
      } else buf = fs.readFileSync(path.join(UPLOADS_DIR, path.basename(u)))
      const r = await fetch(base + '/wp-json/wp/v2/media', {
        method: 'POST',
        headers: {
          authorization: auth,
          'content-type': type,
          'content-disposition': `attachment; filename="${crypto.randomBytes(6).toString('hex')}.${type.split('/')[1]}"`,
        },
        body: buf,
        signal: AbortSignal.timeout(60000),
      })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.source_url) post.content = post.content.split(u).join(j.source_url)
    } catch (e) {
      console.error('[hub-spoke] media upload failed', e.message)
    }
  }
  try {
    const r = await fetch(base + '/wp-json/wp/v2/posts', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: auth },
      body: JSON.stringify(post),
      signal: AbortSignal.timeout(20000),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) {
      console.error('[hub-spoke] WordPress error', r.status, JSON.stringify(j).slice(0, 300))
      return sendError(res, 502, 'wordpress_error', { message: j.message || '' })
    }
    res.json({
      success: true,
      id: j.id,
      url: `${base}/wp-admin/post.php?post=${j.id}&action=edit`,
      link: j.link || '',
    })
  } catch (e) {
    console.error('[hub-spoke]', e)
    sendError(res, 502, 'wordpress_error')
  }
}
