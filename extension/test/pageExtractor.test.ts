// @vitest-environment jsdom
// @vitest-environment-options {"url": "https://example.com/blog/post"}
import { beforeEach, describe, expect, it } from 'vitest'
import { extractPage, findMainContentRoot, serializeForImport } from '../src/utils/pageExtractor'

const LONG = 'This paragraph has enough words to count as real article content for the extractor. '.repeat(4)

function load(html: string) {
  document.documentElement.innerHTML = html
}

describe('extractPage', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('lang')
  })

  it('prefers <article>, keeps heading structure and drops nav, cookie banner, ads and hidden text', () => {
    load(`
      <head>
        <title>Test post title for the page</title>
        <meta name="description" content="A description">
        <link rel="canonical" href="/blog/post">
        <meta property="og:title" content="OG title">
        <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"BlogPosting"},{"@type":"Organization"}]}</script>
      </head>
      <body>
        <header><nav><a href="/">Home</a><a href="/about">About</a></nav></header>
        <div class="cookie-banner">We use cookies to improve your experience on this site.</div>
        <article>
          <h1>Main heading</h1>
          <p>${LONG}</p>
          <div class="ad-slot">Buy our sponsored product now</div>
          <h2>Second section</h2>
          <ul><li>First point</li><li>Second <strong>point</strong></li></ul>
          <p style="display:none">Hidden text should not appear</p>
          <p hidden>Also hidden</p>
          <p>Read the <a href="/guide">full guide</a> or <a href="https://other.org/x">click here</a>.</p>
          <img src="/a.png" alt="Diagram"><img src="/b.png"><img src="/c.png" alt="">
          <img src="/pixel.gif" width="1" height="1">
        </article>
        <footer>Copyright footer text</footer>
      </body>`)

    const page = extractPage(document, window)

    expect(page.contentRoot).toBe('article')
    expect(page.blocks[0]).toEqual({ type: 'heading', level: 1, text: 'Main heading' })
    expect(page.blocks.map((b) => b.text)).toContain('Second point')
    expect(page.blocks.find((b) => b.type === 'list_item')).toBeTruthy()
    expect(page.content).not.toMatch(/cookies|sponsored|Hidden text|Also hidden|Copyright|Home/)

    expect(page.title).toBe('Test post title for the page')
    expect(page.metaDescription).toBe('A description')
    expect(page.canonical).toBe('https://example.com/blog/post')
    expect(page.structuredDataTypes).toEqual(['BlogPosting', 'Organization'])

    expect(page.linkTotals.internal).toBe(3) // /, /about, /guide
    expect(page.linkTotals.external).toBe(1)
    expect(page.linkTotals.generic).toBe(1)
    expect(page.links.find((l) => l.url.endsWith('/guide'))?.inContent).toBe(true)
    expect(page.links.find((l) => l.url.endsWith('/about'))?.inContent).toBe(false)

    expect(page.imageTotals).toEqual({ total: 3, withAlt: 1, missingAlt: 1, decorative: 1 })
  })

  it('does not drop the article when its wrapper has a noise-looking class', () => {
    load(`<body><main class="post comments-enabled"><h1>Title</h1><p>${LONG}</p></main></body>`)
    const page = extractPage(document, window)
    expect(page.wordCount).toBeGreaterThan(40)
  })

  it('falls back to paragraph density when there is no article or main', () => {
    load(`<body>
      <div class="menu-wrap"><p>Short</p></div>
      <div id="wrapper"><div class="story"><p>${LONG}</p><p>${LONG}</p></div></div>
    </body>`)
    const { el, strategy } = findMainContentRoot(document)
    expect(strategy).toBe('paragraph-density')
    expect(el.className).toBe('story')
  })

  it('renders table rows as markdown table lines', () => {
    load(`<body><article><p>${LONG}</p><table><tr><th>Plan</th><th>Price</th></tr><tr><td>Pro</td><td>$10</td></tr></table></article></body>`)
    const page = extractPage(document, window)
    expect(page.blocks.map((b) => b.text)).toContain('| Pro | $10 |')
  })
})

describe('serializeForImport', () => {
  it('keeps text and meta but strips scripts, styles and media, without touching the live page', () => {
    document.documentElement.innerHTML =
      '<head><meta property="og:title" content="T"><script>var secret=1</script><style>p{}</style></head>' +
      '<body><article><h1>Hi</h1><p>Text</p><img src="a.png"><svg><text>x</text></svg></article></body>'
    const html = serializeForImport(document)!
    expect(html).toContain('og:title')
    expect(html).toContain('<h1>Hi</h1><p>Text</p>')
    expect(html).not.toMatch(/<script|<style|<img|<svg/)
    expect(document.querySelector('script')).not.toBeNull()
  })
})
