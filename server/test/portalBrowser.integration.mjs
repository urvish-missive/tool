import assert from 'node:assert/strict'
import { launchPortalBrowser } from '../src/utils/portalBrowserRuntime.js'
import { applyBrowserStep, collectBrowserRows, validateBrowserConfig, discoverLoginControls } from '../src/services/portalBrowserFetcher.js'
import { runDescriptionSearch } from '../src/services/portalDescriptionAgent.js'

const browser = await launchPortalBrowser()
try {
  const page = await browser.newPage()
  page.setDefaultTimeout(2000)
  await page.setContent('<form><label>Email<input name="email" type="email"></label><input type="password"><button type="submit">Sign in</button></form>')
  const login = await discoverLoginControls(page)
  assert.equal(await page.locator(login.usernameTarget).getAttribute('name'), 'email')
  assert.equal(await page.locator(login.passwordTarget).getAttribute('type'), 'password')
  assert.equal(await page.locator(login.loginTarget).innerText(), 'Sign in')
  const fixture = `
    <label>Keywords<input id="keyword"></label>
    <label for="country">Country</label><select id="country"><option>Canada</option><option>South Africa</option></select>
    <button onclick="document.querySelector('table').hidden = false">Search</button>
    <table hidden><tbody><tr><td class="name"> Alice </td><td><a href="mailto:alice@example.test">Email</a></td></tr></tbody></table>
    <button id="next" onclick="setTimeout(() => { document.querySelector('tbody').innerHTML = '<tr><td class=name>Bob</td><td><a href=mailto:bob@example.test>Email</a></td></tr>'; this.disabled = true }, 100)">Next</button>
    <input type="hidden" value="private-token"><script>window.privateToken = 'private-token'</script>
    <span hidden>private-token</span>
  `
  await page.setContent(fixture)
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
  await page.setContent(fixture)
  let decisions = 0
  const described = await runDescriptionSearch(page, { ...config, automation: 'description', description: 'Find Telecom members in South Africa and export names and email links.' }, {
    decide: async (messages) => {
      const serialized = JSON.stringify(messages)
      assert.equal(serialized.includes('private-token'), false, 'Hidden content and script values must not enter AI snapshots')
      const state = JSON.parse(messages[1].content).page
      const find = (label) => state.controls.find((control) => control.label === label)
      const sequence = [
        { action: 'fill', control: find('Keywords')?.id, value: 'Telecom' },
        { action: 'select', control: find('Country')?.id, value: 'South Africa' },
        { action: 'click', control: find('Search')?.id },
        { action: 'extract', rowSelector: 'table tbody tr', fields: config.fields, nextControl: find('Next')?.id },
      ]
      return sequence[decisions++]
    },
    collect: collectBrowserRows, validateConfig: validateBrowserConfig,
  })
  assert.deepEqual(described.rows, result.rows)
  assert.equal(decisions, 4)
  assert.equal(await page.getByLabel('Keywords').inputValue(), 'Telecom')
  assert.equal(await page.getByLabel('Country').inputValue(), 'South Africa')
  console.log('Chromium integration passed: auto login discovery, manual and description-driven filters/search, redacted snapshots, field extraction, async pagination, disabled Next. Description planner is mocked; no live AI/BNI call.')
} finally { await browser.close() }
