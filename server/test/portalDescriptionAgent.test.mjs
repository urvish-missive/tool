import { test } from 'node:test'
import assert from 'node:assert/strict'
import { redactAgentValue, validateAgentDecision, runDescriptionSearch } from '../src/services/portalDescriptionAgent.js'
import { validateBrowserConfig } from '../src/services/portalBrowserFetcher.js'

test('description mode accepts a task without selectors, fields or steps', () => {
  const config = validateBrowserConfig({ username: 'member', password: 'secret', automation: 'description', description: 'Find software members in Canada and collect names.' })
  assert.equal(config.automation, 'description')
  assert.deepEqual(config.fields, [])
  assert.throws(() => validateBrowserConfig({ ...config, description: '' }), /Describe/)
})

test('redacts nested and JSON-special credentials without breaking serialized content', () => {
  const value = redactAgentValue({ task: 'Search as m"ember with p\\ass', nested: ['m%22ember', 'p%5Cass'] }, ['m"ember', 'p\\ass'])
  assert.deepEqual(JSON.parse(JSON.stringify(value)), { task: 'Search as [redacted] with [redacted]', nested: ['[redacted]', '[redacted]'] })
})

test('AI actions must use observed controls and available dropdown labels', () => {
  const state = { controls: [{ id: 'c0', label: 'Country', tag: 'select', options: ['Canada'] }, { id: 'c1', label: 'Delete member', tag: 'button' }] }
  assert.throws(() => validateAgentDecision({ action: 'click', control: 'invented' }, state), /unavailable/)
  assert.throws(() => validateAgentDecision({ action: 'click', control: 'c1' }, state), /outside/)
  assert.throws(() => validateAgentDecision({ action: 'select', control: 'c0', value: 'France' }, state), /not available/)
  assert.throws(() => validateAgentDecision({ action: 'evaluate', code: 'anything' }, state), /unsupported/)
  assert.equal(validateAgentDecision({ action: 'select', control: 'c0', value: 'Canada' }, state).value, 'Canada')
})

test('description loop inspects each updated page and passes grounded fields to extraction', async () => {
  let snapshots = 0, calls = 0
  const config = { username: 'member', password: 'secret', description: 'Collect software members in Canada.', maxPages: 3 }
  const result = await runDescriptionSearch({ locator: () => ({ fill: async (value) => assert.equal(value, 'software') }), waitForLoadState: async () => {} }, config, {
    snapshot: async () => { snapshots++; return { controls: [{ id: 'c0', tag: 'input', label: 'Keywords' }] } },
    decide: async (messages) => {
      assert.equal(JSON.stringify(messages).includes('secret'), false)
      calls++
      return calls === 1 ? { action: 'fill', control: 'c0', value: 'software' } : { action: 'extract', rowSelector: '.member', fields: [{ name: 'Name', selector: '.name' }] }
    },
    validateConfig: (value) => value,
    collect: async (_, extraction) => { assert.equal(extraction.rowSelector, '.member'); assert.equal(extraction.safeExtraction, true); return { rows: [{ Name: 'Alice' }] } },
  })
  assert.equal(snapshots, 2)
  assert.deepEqual(result.rows, [{ Name: 'Alice' }])
})

test('description loop rejects unavailable next controls and secret-value extraction', async () => {
  const base = { username: 'member', password: 'secret', description: 'Collect members.' }
  for (const extra of [{ nextControl: 'nonexistent' }, { fields: [{ name: 'Token', selector: 'input', attribute: 'value' }] }]) {
    await assert.rejects(runDescriptionSearch({}, base, {
      snapshot: async () => ({ controls: [] }),
      decide: async () => ({ action: 'extract', rowSelector: '.member', fields: [{ name: 'Name', selector: '.name' }], ...extra }),
      validateConfig: (config) => config,
      collect: async () => { throw new Error('must not collect') },
    }), (error) => error.portalAgent === true)
  }
})

test('blocked tasks produce a concrete retry message, and repeated waits are bounded', async () => {
  const config = { description: 'Collect members.' }
  await assert.rejects(runDescriptionSearch({}, config, { snapshot: async () => ({ controls: [] }), decide: async () => ({ action: 'blocked' }) }), /could not complete/)
  await assert.rejects(runDescriptionSearch({ waitForLoadState: async () => {} }, config, { snapshot: async () => ({ controls: [] }), decide: async () => ({ action: 'wait' }) }), /15-step/)
})
