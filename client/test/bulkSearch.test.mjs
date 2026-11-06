import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findSample, substitute, parseValueList, buildCombinations, mergeResults } from '../src/tools/portal-data-fetcher/bulkSearch.js'

const bash = `curl 'https://www.bniconnectglobal.com/web/secure/search?keyword=Telecom&country=South%20Africa&page=1' -H 'cookie: s=1' --data-raw '{"q":"Telecom","countryName":"South Africa","companyTelecomFlag":true}'`

test('finds sample values in every encoding, whole words only', () => {
  assert.deepEqual(findSample(bash, 'Telecom').count, 2) // not "companyTelecomFlag"
  const c = findSample(bash, 'South Africa')
  assert.equal(c.count, 2)
  assert.deepEqual(c.forms.sort(), ['raw', 'url'])
  assert.equal(findSample(bash, 'Nope').count, 0)
})

test('substitutes keyword and country keeping encodings', () => {
  const out = substitute(bash, [
    { sample: 'Telecom', value: 'VoIP' },
    { sample: 'South Africa', value: 'United States' },
  ])
  assert.ok(out.includes('keyword=VoIP&country=United%20States'))
  assert.ok(out.includes('"q":"VoIP","countryName":"United States","companyTelecomFlag":true'))
})

test('form encoding and Windows cmd', () => {
  const form = `curl 'https://x.test/s' --data-raw 'kw=Telecom&c=South+Africa'`
  assert.ok(substitute(form, [{ sample: 'South Africa', value: 'New Zealand' }]).includes('c=New+Zealand'))
  const cmd = `curl ^"https://x.test/s?c=South^%20Africa^&k=IT^"`
  assert.ok(substitute(cmd, [{ sample: 'South Africa', value: 'Canada' }, { sample: 'IT', value: 'Accounting' }]).includes('c=Canada^&k=Accounting'))
})

test('value lists support numbering, commas and Label = value', () => {
  assert.deepEqual(parseValueList('1. Telecom\n2. Software\nIT, Accounting\n\ntelecom'), [
    { label: 'Telecom', value: 'Telecom' },
    { label: 'Software', value: 'Software' },
    { label: 'IT', value: 'IT' },
    { label: 'Accounting', value: 'Accounting' },
  ])
  assert.deepEqual(parseValueList('United States = 2'), [{ label: 'United States', value: '2' }])
})

test('combinations and merge with de-duplication', () => {
  const combos = buildCombinations([
    { name: 'Keyword', sample: 'Telecom', items: parseValueList('Telecom\nVoIP') },
    { name: 'Country', sample: 'South Africa', items: parseValueList('South Africa\nCanada') },
  ])
  assert.equal(combos.length, 4)
  const merged = mergeResults(
    [
      { combo: combos[0], columns: ['id', 'name'], rows: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] },
      { combo: combos[2], columns: ['id', 'name'], rows: [{ id: 1, name: 'A' }] },
    ],
    ['Keyword', 'Country']
  )
  assert.equal(merged.rows.length, 2)
  assert.equal(merged.duplicates, 1)
  assert.equal(merged.rows[0]['Search: Keyword'], 'Telecom, VoIP')
  assert.deepEqual(merged.columns, ['Search: Keyword', 'Search: Country', 'id', 'name'])
})

test('auto-detects which list value the copied search used', async () => {
  const { autoDetectSample } = await import('../src/tools/portal-data-fetcher/bulkSearch.js')
  const curl = `curl 'https://x.test/s' --data-raw '{"keywords":"telecom","country":"South Africa","limit":10}'`
  assert.equal(autoDetectSample(curl, parseValueList('Telecom\nIT\nVoIP')).value, 'Telecom') // case-insensitive ok for long values
  assert.equal(autoDetectSample(curl, parseValueList('South Africa\nCanada')).value, 'South Africa')
  assert.equal(autoDetectSample(`curl 'https://x.test/s?q=it'`, parseValueList('IT')), null) // short value needs exact case
  assert.equal(autoDetectSample(curl, parseValueList('Canada\nWellness')), null)
})

test('never matches or rewrites headers / tokens; BNI Connect request shape', async () => {
  const { detectPagination, autoDetectSample } = await import('../src/tools/portal-data-fetcher/bulkSearch.js')
  const bni = `curl --url 'https://api.bniconnectglobal.com/connect-search-api/search/member/advanced' \\
  -H 'authorization: Bearer abc.IT-xyz.IT_def' \\
  -H 'cookie: kw=IT' \\
  -H 'content-type: application/json' \\
  --data-raw '{"search_keywords":"IT","concept_id":1,"locale_code":"en_IN","page_no":1,"per_page":20}'`
  assert.equal(findSample(bni, 'IT').count, 1)
  const out = substitute(bni, [{ sample: 'IT', value: 'Telecom' }])
  assert.ok(out.includes(`"search_keywords":"Telecom"`))
  assert.ok(out.includes('Bearer abc.IT-xyz.IT_def') && out.includes('cookie: kw=IT'))
  assert.equal(autoDetectSample(bni, parseValueList('Telecom\nSoftware\nIT')).value, 'IT')
  assert.deepEqual(detectPagination(bni), { mode: 'page', param: 'page_no', start: 1, step: 1, location: 'body', pageSize: 20 })
  assert.deepEqual(detectPagination(`curl 'https://x.test/a?offset=0&limit=50'`), { mode: 'offset', param: 'offset', start: 0, step: 50, location: 'query', pageSize: 50 })
  assert.equal(detectPagination(`curl 'https://x.test/a'`), null)
})
