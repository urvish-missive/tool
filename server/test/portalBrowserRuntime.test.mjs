import { test } from 'node:test'
import assert from 'node:assert/strict'
import { configurePortalBrowserEnvironment } from '../src/utils/portalBrowserRuntime.js'

test('browser install and launch use an application-local default path', () => {
  const env = { NODE_ENV: 'production' }
  assert.equal(configurePortalBrowserEnvironment(env).PLAYWRIGHT_BROWSERS_PATH, '0')
  assert.equal(env.NODE_ENV, 'production')
})

test('browser path explicitly configured by the host is preserved', () => {
  const env = { PLAYWRIGHT_BROWSERS_PATH: '/opt/portal-browsers' }
  assert.equal(configurePortalBrowserEnvironment(env).PLAYWRIGHT_BROWSERS_PATH, '/opt/portal-browsers')
})
