import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseCurl,
  tokenizeShell,
  parseHeaderBlock,
  extractRecords,
  findRecordArrays,
  buildPageRequest,
  fetchPortalData,
} from '../src/services/portalDataFetcher.js'

test('parses a Chrome "Copy as cURL (bash)" command', () => {
  const cmd = `curl 'https://www.bniconnectglobal.com/web/secure/networkHome/members?chapterId=123' \\
  -H 'accept: application/json, text/plain, */*' \\
  -H 'cookie: JSESSIONID=abc; other=1' \\
  -H 'x-requested-with: XMLHttpRequest' \\
  --data-raw '{"page":1,"size":50}' \\
  --compressed`
  const r = parseCurl(cmd)
  assert.equal(r.method, 'POST')
  assert.equal(r.url, 'https://www.bniconnectglobal.com/web/secure/networkHome/members?chapterId=123')
  assert.equal(r.headers.cookie, 'JSESSIONID=abc; other=1')
  assert.equal(r.headers['x-requested-with'], 'XMLHttpRequest')
  assert.equal(r.body, '{"page":1,"size":50}')
})

test('parses a Windows "Copy as cURL (cmd)" command', () => {
  const cmd = `curl ^"https://api.example.com/v1/items?x=1^&y=2^" ^
  -H ^"accept: application/json^" ^
  -b ^"sid=xyz^"`
  const r = parseCurl(cmd)
  assert.equal(r.url, 'https://api.example.com/v1/items?x=1&y=2')
  assert.equal(r.method, 'GET')
  assert.equal(r.headers.cookie, 'sid=xyz')
})

test("handles $'...' strings, -X and -G", () => {
  assert.deepEqual(tokenizeShell(`curl $'a\\nb' 'c d'`), ['curl', 'a\nb', 'c d'])
  const r = parseCurl(`curl -G https://x.test/s -d q=1 -d page=2 -X GET`)
  assert.equal(r.url, 'https://x.test/s?q=1&page=2')
  assert.equal(r.body, null)
})

test('rejects non-curl input', () => {
  assert.throws(() => parseCurl('wget https://x.test'), /must start with "curl"/)
})

test('header block skips HTTP/2 pseudo headers', () => {
  const h = parseHeaderBlock(':authority: x.test\nCookie: a=1\nAccept: application/json')
  assert.deepEqual(h, { cookie: 'a=1', accept: 'application/json' })
})

test('auto-detects the largest list of records', () => {
  const json = { meta: { total: 3 }, data: { members: [{ name: 'A' }, { name: 'B' }, { name: 'C' }], tags: [{ t: 1 }] } }
  assert.equal(findRecordArrays(json)[0].path, 'data.members')
  const r = extractRecords({ text: JSON.stringify(json) })
  assert.equal(r.kind, 'json')
  assert.equal(r.detectedPath, 'data.members')
  assert.equal(r.records.length, 3)
})

test('extracts HTML tables', () => {
  const html = '<table><tr><th>Name</th><th>Company</th></tr><tr><td>Ann</td><td>Acme</td></tr></table>'
  const r = extractRecords({ text: html })
  assert.equal(r.kind, 'html')
  assert.deepEqual(r.records, [{ Name: 'Ann', Company: 'Acme' }])
})

test('builds page requests in query and JSON body', () => {
  const q = buildPageRequest({ method: 'GET', url: 'https://x.test/a?page=1', headers: {}, body: null }, { mode: 'page', param: 'page', start: 1, step: 1 }, 2)
  assert.equal(new URL(q.url).searchParams.get('page'), '3')
  const b = buildPageRequest(
    { method: 'POST', url: 'https://x.test/a', headers: { 'content-type': 'application/json' }, body: '{"paging":{"offset":0},"q":"x"}' },
    { mode: 'offset', param: 'paging.offset', start: 0, step: 50 },
    2
  )
  assert.deepEqual(JSON.parse(b.body), { paging: { offset: 100 }, q: 'x' })
})

test('blocks private / localhost targets (SSRF)', async () => {
  for (const url of ['http://127.0.0.1/x', 'http://localhost:5000/api', 'http://169.254.169.254/latest/meta-data', 'file:///etc/passwd']) {
    await assert.rejects(fetchPortalData({ request: { method: 'GET', url, headers: {} } }), /Blocked URL/)
  }
})

test('fetches every page, flattens nested fields and stops on an empty page', async () => {
  const members = Array.from({ length: 23 }, (_, i) => ({ id: i + 1, name: `M${i + 1}`, company: { name: `Co${i}` }, tags: ['a', 'b'] }))
  const realFetch = globalThis.fetch
  const seen = []
  globalThis.fetch = async (url, opts) => {
    seen.push({ url, cookie: opts.headers.cookie })
    const page = Number(new URL(url).searchParams.get('page'))
    const slice = members.slice((page - 1) * 10, page * 10)
    return new Response(JSON.stringify({ result: { content: slice } }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  try {
    const r = await fetchPortalData({
      request: { method: 'GET', url: 'https://portal.invalid/api/members?page=1', headers: { cookie: 's=1' } },
      pagination: { mode: 'page', param: 'page', start: 1, step: 1, maxPages: 10 },
    })
    assert.equal(r.totalRows, 23)
    assert.equal(r.pagesFetched, 4)
    assert.equal(r.stoppedReason, 'empty-page')
    assert.equal(r.detectedPath, 'result.content')
    assert.deepEqual(r.columns, ['id', 'name', 'company.name', 'tags'])
    assert.equal(r.rows[0].tags, 'a, b')
    assert.ok(seen.every((s) => s.cookie === 's=1'))
  } finally {
    globalThis.fetch = realFetch
  }
})

test('reports an expired session clearly', async () => {
  const realFetch = globalThis.fetch
  globalThis.fetch = async () => new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' })
  try {
    await assert.rejects(
      fetchPortalData({ request: { method: 'GET', url: 'https://portal.invalid/api', headers: {} } }),
      /401.*session has probably expired/
    )
  } finally {
    globalThis.fetch = realFetch
  }
})

test('drops credentials on a cross-origin redirect', async () => {
  const realFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, opts) => {
    calls.push({ url, cookie: opts.headers.cookie })
    if (calls.length === 1) return new Response(null, { status: 302, headers: { location: 'https://other.invalid/data' } })
    return new Response('[{"a":1}]', { status: 200 })
  }
  try {
    const r = await fetchPortalData({ request: { method: 'GET', url: 'https://portal.invalid/api', headers: { cookie: 'secret' } } })
    assert.equal(r.totalRows, 1)
    assert.equal(calls[1].cookie, undefined)
  } finally {
    globalThis.fetch = realFetch
  }
})

test('batch tokens: bound to device and tool, capped, tamper-proof', async () => {
  const { issueBatchToken, consumeBatchToken } = await import('../src/utils/batchToken.js')
  const t = issueBatchToken('dev-1', 'portal-data-fetcher', 2)
  const req = (token, dev = 'dev-1') => ({ headers: { 'x-batch-token': token, 'x-device-id': dev } })
  assert.equal(consumeBatchToken(req(t, 'dev-2'), 'portal-data-fetcher'), false)
  assert.equal(consumeBatchToken(req(t), 'seo-audit'), false)
  assert.equal(consumeBatchToken(req(t), 'portal-data-fetcher'), true)
  assert.equal(consumeBatchToken(req(t), 'portal-data-fetcher'), true)
  assert.equal(consumeBatchToken(req(t), 'portal-data-fetcher'), false) // cap reached
  const [b64, sig] = issueBatchToken('dev-1', 'portal-data-fetcher', 5).split('.')
  const forged = Buffer.from(Buffer.from(b64, 'base64url').toString().replace('.5.', '.99.')).toString('base64url') + '.' + sig
  assert.equal(consumeBatchToken(req(forged), 'portal-data-fetcher'), false)
  assert.equal(consumeBatchToken({ headers: {} }, 'portal-data-fetcher'), false)
})
