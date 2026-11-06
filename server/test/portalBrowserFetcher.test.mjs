import { test } from 'node:test'
import assert from 'node:assert/strict'
import { allowBrowserRequest, applyBrowserStep, validateBrowserConfig, collectBrowserRows, fetchBrowserPortalData } from '../src/services/portalBrowserFetcher.js'

const input = (extra = {}) => ({ username: 'member', password: 'private-password', fields: [{ name: 'Name', selector: '.name' }], ...extra })

test('BNI config restricts login and destination hosts and validates extraction', () => {
  const config = validateBrowserConfig(input({ maxPages: 300 }))
  assert.equal(config.url, 'https://www.bniconnectglobal.com/web/dashboard/search')
  assert.equal(config.maxPages, 50)
  for (const url of ['http://www.bniconnectglobal.com', 'https://bniconnectglobal.com.evil.test', 'https://127.0.0.1', 'https://member:secret@bniconnectglobal.com']) {
    assert.throws(() => validateBrowserConfig(input({ url })))
    assert.throws(() => validateBrowserConfig(input({ loginUrl: url })))
  }
  assert.throws(() => validateBrowserConfig(input({ fields: [] })), /data field/)
  assert.throws(() => validateBrowserConfig(input({ password: '' })), /username and password/)
  assert.throws(() => validateBrowserConfig(input({ steps: [{ action: 'execute', target: 'anything' }] })), /action/)
  assert.throws(() => validateBrowserConfig(input({ fields: [{ name: 'Name', selector: '.a' }, { name: 'Name', selector: '.b' }] })), /unique/)
})

test('browser requests reject internal addresses, mixed DNS answers and failed DNS', async () => {
  for (const url of ['http://127.0.0.1', 'http://10.0.0.1', 'http://169.254.169.254', 'http://100.64.0.1', 'http://[::1]', 'http://[::ffff:127.0.0.1]', 'file:///etc/passwd']) {
    assert.equal(await allowBrowserRequest(url), false, url)
  }
  assert.equal(await allowBrowserRequest('https://public.test', async () => [{ address: '8.8.8.8' }]), true)
  assert.equal(await allowBrowserRequest('https://public.test', async () => [{ address: '8.8.8.8' }, { address: '192.168.0.1' }]), false)
  assert.equal(await allowBrowserRequest('https://public.test', async () => { throw new Error('DNS failed') }), false)
})

test('steps resolve accessible labels and use correct input action', async () => {
  const calls = []
  const page = {
    getByLabel: (name) => ({ fill: async (value) => calls.push([name, value]) }),
    getByRole: (role, { name }) => ({ click: async () => calls.push([role, name]) }),
    locator: (selector) => ({ selectOption: async (option) => calls.push([selector, option]) }),
  }
  await applyBrowserStep(page, { action: 'fill', target: 'label:Keywords', value: 'Telecom' })
  await applyBrowserStep(page, { action: 'select', target: '#country', value: 'South Africa' })
  await applyBrowserStep(page, { action: 'click', target: 'button:Search' })
  assert.deepEqual(calls, [['Keywords', 'Telecom'], ['#country', { label: 'South Africa' }], ['button', 'Search']])
})

function resultPage(batches, disabled = false) {
  let index = 0
  const waits = []
  const page = {
    locator: () => ({
      first: () => ({ waitFor: async () => {} }),
      evaluateAll: async () => batches[index],
      allTextContents: async () => batches[index].map((row) => Object.values(row).join(' ')),
    }),
    getByRole: () => ({ count: async () => 1, isVisible: async () => true,
      isEnabled: async () => !disabled, getAttribute: async () => null,
      click: async () => { index = Math.min(index + 1, batches.length - 1) },
    }),
    waitForFunction: async (_, argument) => { waits.push(argument.previous) },
  }
  return { page, waits }
}

test('pagination waits against the previous page and merges duplicate rows', async () => {
  const { page, waits } = resultPage([[{ Name: 'Alice' }], [{ Name: 'Alice' }, { Name: 'Bob' }]])
  const config = validateBrowserConfig(input({ nextTarget: 'button:Next', maxPages: 2 }))
  const result = await collectBrowserRows(page, config)
  assert.equal(result.pagesFetched, 2)
  assert.deepEqual(result.rows, [{ Name: 'Alice' }, { Name: 'Bob' }])
  assert.deepEqual(waits, ['Alice'])
})

test('disabled Next stops; repeated data does not duplicate or loop', async () => {
  const config = validateBrowserConfig(input({ nextTarget: 'button:Next', maxPages: 5 }))
  let fixture = resultPage([[{ Name: 'Alice' }]], true)
  assert.equal((await collectBrowserRows(fixture.page, config)).stoppedReason, 'last-page')
  fixture = resultPage([[{ Name: 'Alice' }]])
  const repeated = await collectBrowserRows(fixture.page, config)
  assert.equal(repeated.stoppedReason, 'repeated-page')
  assert.equal(repeated.totalRows, 1)
})

test('runner closes browser on failure and never exposes Playwright credential errors', async () => {
  let closed = false
  await assert.rejects(fetchBrowserPortalData(input(), { launch: async () => ({
    newContext: async () => { throw new Error('fill private-password on member page') },
    close: async () => { closed = true },
  }) }), (error) => !error.message.includes('private-password') && error.status === 422)
  assert.equal(closed, true)
})
