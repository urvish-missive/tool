import { test } from 'node:test'
import assert from 'node:assert/strict'
import { configurePortalBrowserEnvironment, browserStartupError, getPortalBrowserConnection, connectPortalBrowser } from '../src/utils/portalBrowserRuntime.js'

test('browser install and launch use an application-local default path', () => {
  const env = { NODE_ENV: 'production' }
  assert.equal(configurePortalBrowserEnvironment(env).PLAYWRIGHT_BROWSERS_PATH, '0')
  assert.equal(env.NODE_ENV, 'production')
})

test('browser path explicitly configured by the host is preserved', () => {
  const env = { PLAYWRIGHT_BROWSERS_PATH: '/opt/portal-browsers' }
  assert.equal(configurePortalBrowserEnvironment(env).PLAYWRIGHT_BROWSERS_PATH, '/opt/portal-browsers')
})

test('startup errors are classified without returning raw process output', () => {
  for (const [message, code] of [
    ["Executable doesn't exist at /private/path", 'BROWSER_NOT_INSTALLED'],
    ['error while loading shared libraries: libnss3.so', 'BROWSER_SYSTEM_DEPENDENCIES'],
    ['spawn EPERM', 'BROWSER_PERMISSION_DENIED'],
    ['No usable sandbox!', 'BROWSER_SANDBOX_UNAVAILABLE'],
    ['Exec format error', 'BROWSER_PLATFORM_MISMATCH'],
    ['browser closed: SIGKILL', 'BROWSER_RESOURCE_LIMIT'],
    ['Timeout 15000ms exceeded', 'BROWSER_STARTUP_TIMEOUT'],
    ['unknown private process details', 'BROWSER_STARTUP_FAILED'],
  ]) {
    const result = browserStartupError(new Error(message))
    assert.equal(result.code, code)
    assert.equal(result.status, 503)
    assert.equal(result.message.includes(message), false)
  }
})

test('remote mode validates secure endpoints without exposing provider tokens', () => {
  assert.equal(getPortalBrowserConnection({}).mode, 'local')
  assert.equal(getPortalBrowserConnection({ PORTAL_BROWSER_CDP_ENDPOINT: 'wss://browser.example/session?token=secret' }).mode, 'remote')
  for (const endpoint of ['invalid?token=secret', 'http://browser.example', 'ws://browser.example', 'https://user:secret@browser.example']) {
    assert.throws(() => getPortalBrowserConnection({ PORTAL_BROWSER_CDP_ENDPOINT: endpoint }),
      (error) => error.code === 'BROWSER_REMOTE_CONFIG_INVALID' && !error.message.includes('secret'))
  }
})

test('remote mode connects over CDP and does not launch a local process', async () => {
  const endpoint = 'wss://browser.example/session?token=secret'
  const browser = {}
  let calls = 0
  const chromium = {
    launch: async () => { throw new Error('must not spawn locally') },
    connectOverCDP: async (url, options) => { calls++; assert.equal(url, endpoint); assert.equal(options.timeout, 15000); return browser },
  }
  assert.equal(await connectPortalBrowser(chromium, {}, { PORTAL_BROWSER_CDP_ENDPOINT: endpoint }), browser)
  assert.equal(calls, 1)
})

test('local mode is preserved and remote failures never retain endpoint secrets', async () => {
  const browser = {}
  assert.equal(await connectPortalBrowser({ launch: async (options) => { assert.equal(options.headless, true); return browser } }, {}, {}), browser)
  const endpoint = 'wss://browser.example?token=private-token'
  await assert.rejects(connectPortalBrowser({ connectOverCDP: async () => { throw new Error(endpoint) } }, {}, { PORTAL_BROWSER_CDP_ENDPOINT: endpoint }),
    (error) => error.status === 503 && error.code === 'BROWSER_REMOTE_CONNECTION_FAILED' && !error.message.includes('private-token') && !error.cause && browserStartupError(error) === error)
})
