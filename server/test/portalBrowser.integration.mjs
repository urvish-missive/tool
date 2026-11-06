import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { applyBrowserStep, collectBrowserRows, validateBrowserConfig } from '../src/services/portalBrowserFetcher.js'

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  page.setDefaultTimeout(2000)
  await page.setContent(`
    <label>Keywords<input id="keyword"></label>
    <label for="country">Country</label><select id="country"><option>Canada</option><option>South Africa</option></select>
    <button onclick="document.querySelector('table').hidden = false">Search</button>
    <table hidden><tbody><tr><td class="name"> Alice </td><td><a href="mailto:alice@example.test">Email</a></td></tr></tbody></table>
    <button id="next" onclick="setTimeout(() => { document.querySelector('tbody').innerHTML = '<tr><td class=name>Bob</td><td><a href=mailto:bob@example.test>Email</a></td></tr>'; this.disabled = true }, 100)">Next</button>
  `)
  await applyBrowserStep(page, { action: 'fill', target: 'label:Keywords', value: 'Telecom' })
  await applyBrowserStep(page, { action: 'select', target: 'label:Country', value: 'South Africa' })
  await applyBrowserStep(page, { action: 'click', target: 'button:Search' })
  assert.equal(await page.locator('#keyword').inputValue(), 'Telecom')
  assert.equal(await page.getByLabel('Country').inputValue(), 'South Africa')
  const config = validateBrowserConfig({ username: 'fixture', password: 'fixture', maxPages: 5, nextTarget: 'button:Next',
    fields: [{ name: 'Name', selector: '.name' }, { name: 'Email link', selector: 'a', attribute: 'href' }] })
  const result = await collectBrowserRows(page, config)
  assert.deepEqual(result.rows, [
    { Name: 'Alice', 'Email link': 'mailto:alice@example.test' },
    { Name: 'Bob', 'Email link': 'mailto:bob@example.test' },
  ])
  assert.equal(result.pagesFetched, 2)
  assert.equal(result.stoppedReason, 'last-page')
  console.log('Chromium integration passed: filters, search, field/attribute extraction, async pagination, disabled Next.')
} finally { await browser.close() }
