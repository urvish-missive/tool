// Website scan for the Hub & Spoke planner.
// Reads the page the visitor entered, a handful of its main product/service pages, and the sitemap.
// Guarded against internal addresses; follows up to 3 redirects.
import { promises as dns } from 'dns'
import net from 'net'

export function isPrivate(ip) {
  if (net.isIPv6(ip)) return true // public IPv4 only, to keep the check simple
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127)
  )
}

async function safeFetch(raw, maxChars = 600000) {
  let url = new URL(raw)
  for (let hop = 0; hop < 4; hop++) {
    if (!/^https?:$/.test(url.protocol)) throw new Error('protocol')
    const { address } = await dns.lookup(url.hostname, { family: 4 })
    if (isPrivate(address)) throw new Error('private address')
    const r = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(7000),
      headers: {
        'User-Agent': 'HubSpokePlanner/1.0 (+content planning tool)',
        Accept: 'text/html,application/xml;q=0.9,*/*;q=0.5',
      },
    })
    const loc = r.headers.get('location')
    if (r.status >= 300 && r.status < 400 && loc) {
      url = new URL(loc, url)
      continue
    }
    if (!r.ok) throw new Error('status ' + r.status)
    return { url, body: (await r.text()).slice(0, maxChars) }
  }
  throw new Error('too many redirects')
}

const clean = (html) =>
  html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&rsquo;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

const slugTitle = (u) => {
  try {
    const s = new URL(u).pathname.split('/').filter(Boolean).pop() || 'Home'
    return decodeURIComponent(s)
      .replace(/\.[a-z]+$/i, '')
      .replace(/[-_]+/g, ' ')
  } catch {
    return ''
  }
}

const locs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, '&'))

const meta = (html) => {
  const title = clean((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '')
  const desc = (
    (html.match(
      /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']*)["']/i
    ) ||
      html.match(
        /<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["'](?:description|og:description)["']/i
      ) ||
      [])[1] || ''
  ).trim()
  const h1 = clean((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '')
  return { title, desc, h1 }
}

const sameOrigin = (u, origin) => {
  try {
    return new URL(u).origin === origin
  } catch {
    return false
  }
}

// Returns { url, text, pages: [{ url, title }], weak }.
export async function scanSite(raw) {
  const page = await safeFetch(raw)
  const html = page.body
  const origin = page.url.origin
  const pages = new Map()
  const nav = []
  const body = html.replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi, ' ') // links inside scripts are not real pages
  const { title, desc } = meta(html)
  pages.set(page.url.href, title.slice(0, 80)) // the page that was entered is an existing page too
  const heads = [...body.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((m) => clean(m[1]))
    .filter(Boolean)
    .slice(0, 40)
  const add = (href, text) => {
    try {
      const u = new URL(href, page.url)
      u.hash = ''
      u.search = ''
      if (
        u.origin !== origin ||
        /\.(png|jpe?g|gif|svg|webp|pdf|zip|css|js|xml|ico|mp4|woff2?)$/i.test(u.pathname)
      )
        return null
      if (!pages.has(u.href) || (!pages.get(u.href) && text)) pages.set(u.href, text || '')
      return u.href
    } catch {
      return null
    }
  }
  for (const m of body.matchAll(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    if (/^(#|mailto:|tel:|javascript:)/i.test(m[1])) continue
    const text = clean(m[2]).slice(0, 80)
    const href = add(m[1], text)
    if (
      href &&
      href !== page.url.href &&
      /product|solution|service|feature|software|platform|pricing|industr|use-case|what-we-do/i.test(
        href + ' ' + text
      )
    )
      nav.push(href)
  }

  // The main offering pages say what the business sells far better than the homepage alone.
  const keyUrls = [...new Set(nav)]
    .filter((u) => new URL(u).pathname.split('/').filter(Boolean).length <= 2)
    .slice(0, 5)
  const key = (await Promise.allSettled(keyUrls.map((u) => safeFetch(u, 300000))))
    .map((r, i) => {
      if (r.status !== 'fulfilled') return ''
      const k = meta(r.value.body)
      if (k.title && pages.has(keyUrls[i])) pages.set(keyUrls[i], k.title.slice(0, 80))
      return `- ${keyUrls[i]} | ${k.title} | ${k.h1} | ${k.desc}`.slice(0, 420)
    })
    .filter(Boolean)

  // Sitemaps list the existing content. robots.txt names them; otherwise try the usual locations.
  let maps = []
  try {
    maps = [
      ...(await safeFetch(origin + '/robots.txt', 100000)).body.matchAll(/^\s*sitemap:\s*(\S+)/gim),
    ]
      .map((m) => m[1])
      .filter((u) => sameOrigin(u, origin))
  } catch {}
  if (!maps.length) maps = [origin + '/sitemap.xml', origin + '/sitemap_index.xml']
  const want = (u) =>
    /tag|author|categor|attachment|image|video|news/i.test(u)
      ? 0
      : /page|post|blog|product|service|solution|resource|case|guide/i.test(u)
        ? 2
        : 1
  const found = []
  for (const m of maps.slice(0, 3)) {
    try {
      const sm = await safeFetch(m, 2000000)
      if (/<sitemapindex/i.test(sm.body)) {
        const subs = locs(sm.body)
          .filter((u) => sameOrigin(u, origin) && want(u))
          .sort((a, b) => want(b) - want(a))
          .slice(0, 6)
        for (const r of await Promise.allSettled(subs.map((u) => safeFetch(u, 2000000))))
          if (r.status === 'fulfilled') found.push(...locs(r.value.body))
      } else found.push(...locs(sm.body))
      if (found.length) break
    } catch {}
  }
  for (const u of found.slice(0, 1500)) add(u, '')

  const list = [...pages].slice(0, 250).map(([url, t]) => ({ url, title: t || slugTitle(url) }))
  const pageText = clean(body)
  const text = [
    title && 'Title: ' + title,
    desc && 'Description: ' + desc,
    heads.length && 'Headings: ' + heads.join(' | '),
    key.length && 'Main pages (URL | title | H1 | description):\n' + key.join('\n'),
    'Page text: ' + pageText.slice(0, 5000),
  ]
    .filter(Boolean)
    .join('\n')
  return { url: page.url.href, text, pages: list, weak: pageText.length < 300 && list.length < 5 }
}
