/**
 * Web app vs Chrome extension parity for Content QA.
 *
 * Web app:   POST /content-qa/import { url }  → content, title
 *            POST /content-qa/analyze { content, title, ...form defaults }
 * Extension: POST /content-qa/analyze { sourceHtml, ...same defaults }
 *
 * Both must produce the same scores. AI and the database are disabled here
 * (no keys, unreachable DB) so the test is offline and deterministic.
 */
import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'

for (const key of ['AI_API_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY', 'ZEN_API_KEY']) delete process.env[key]
process.env.DATABASE_URL = 'mongodb://127.0.0.1:1/parity-test?serverSelectionTimeoutMS=200&connectTimeoutMS=200'

let analyzeContentQAHandler, extractArticleFromHtml

before(async () => {
  ;({ analyzeContentQAHandler } = await import('../src/controllers/contentQaController.js'))
  ;({ extractArticleFromHtml } = await import('../src/services/contentQa/contentImportService.js'))
})

const PAGE = `<!doctype html><html lang="en"><head>
  <title>Doc title</title>
  <meta property="og:title" content="How to Build a Content Strategy That Ranks">
  <script>window.tracking = true</script>
</head><body>
  <header><nav><a href="/">Home</a></nav></header>
  <div class="cookie-banner">We use cookies.</div>
  <main><article>
    <h1>How to Build a Content Strategy That Ranks</h1>
    <p>In today's fast-paced digital landscape, content is king. Let's dive in — this is a game-changer.</p>
    <p>Last quarter we audited 40 B2B blogs. The ones that grew wrote for one specific reader: the person typing the query.</p>
    <h2>Start with search intent</h2>
    <ul><li>Informational queries want explanations.</li><li>Commercial queries want comparisons and proof.</li></ul>
    <h3>A quick checklist</h3>
    <p>Map each article to one intent, one audience and one primary keyword before you write anything at all.</p>
  </article></main>
  <footer>© 2026 Example</footer>
</body></html>`

// What the web form sends by default (client/src/schemas/contentQa.schema.js).
const WEB_DEFAULTS = {
  platform: 'website',
  contentTemplate: 'blog',
  supportingLineMode: 'recommended',
  insightFirstScope: 'DOCUMENT_INTRO',
}

function run(body) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code
        return this
      },
      json(payload) {
        resolve({ status: this.statusCode, body: payload })
      },
    }
    analyzeContentQAHandler({ body }, res).catch(reject)
  })
}

const comparable = (report) => ({
  overall: report.overall,
  overallQualityScore: report.overallQualityScore,
  categoryScores: report.categoryScores,
  statuses: report.statuses,
  statusCounts: report.statusCounts,
  highlights: report.highlights.map((h) => [h.type, h.text, h.index]),
})

describe('Content QA web/extension parity', () => {
  test('sourceHtml gives the same report as import + analyze', async () => {
    const imported = extractArticleFromHtml(PAGE)
    assert.equal(imported.success, true)

    const web = await run({ ...WEB_DEFAULTS, content: imported.content, title: imported.title })
    const ext = await run({ ...WEB_DEFAULTS, sourceHtml: PAGE })

    assert.equal(web.status, 200)
    assert.equal(ext.status, 200)
    assert.deepEqual(comparable(ext.body.report), comparable(web.body.report))
    assert.deepEqual(ext.body.source, {
      title: 'How to Build a Content Strategy That Ranks',
      wordCount: imported.wordCount,
      chars: imported.content.length,
      truncated: false,
    })
    assert.equal(web.body.source, undefined, 'web responses are unchanged')
  })

  test('rejects pages with no extractable text', async () => {
    const r = await run({ ...WEB_DEFAULTS, sourceHtml: '<html><body><nav>Menu</nav></body></html>' })
    assert.equal(r.status, 400)
  })

  test('caps oversized HTML', async () => {
    const r = await run({ ...WEB_DEFAULTS, sourceHtml: 'x'.repeat(5_000_001) })
    assert.equal(r.status, 413)
  })
})
