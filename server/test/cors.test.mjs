import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cors from 'cors'
import { isAllowedOrigin, getCorsOptions } from '../src/utils/corsConfig.js'

describe('isAllowedOrigin unit tests', () => {
  test('allows requests with no origin (curl, server-to-server, same-origin)', () => {
    assert.equal(isAllowedOrigin(undefined), true)
    assert.equal(isAllowedOrigin(null), true)
    assert.equal(isAllowedOrigin(''), true)
  })

  test('allows any localhost or 127.0.0.1 on any port in development and production', () => {
    const devEnv = { NODE_ENV: 'development', CLIENT_URL: 'http://localhost:5173' }
    assert.equal(isAllowedOrigin('http://localhost:5173', devEnv), true)
    assert.equal(isAllowedOrigin('http://localhost:5174', devEnv), true)
    assert.equal(isAllowedOrigin('http://localhost:3000', devEnv), true)
    assert.equal(isAllowedOrigin('http://127.0.0.1:5173', devEnv), true)
    assert.equal(isAllowedOrigin('http://127.0.0.1:5174', devEnv), true)
    assert.equal(isAllowedOrigin('http://[::1]:5173', devEnv), true)

    // Even when deployed to production (e.g. Render), local frontend developers can connect
    const prodEnv = { NODE_ENV: 'production', CLIENT_URL: 'https://tools.missivedigital.com' }
    assert.equal(isAllowedOrigin('http://localhost:5173', prodEnv), true)
    assert.equal(isAllowedOrigin('http://localhost:5174', prodEnv), true)
    assert.equal(isAllowedOrigin('http://127.0.0.1:5173', prodEnv), true)
  })

  test('allows private LAN IPs in development', () => {
    const devEnv = { NODE_ENV: 'development' }
    assert.equal(isAllowedOrigin('http://192.168.1.50:5173', devEnv), true)
    assert.equal(isAllowedOrigin('http://10.0.0.5:3000', devEnv), true)
  })

  test('strips trailing slashes from both origin and CLIENT_URL', () => {
    const env = { NODE_ENV: 'production', CLIENT_URL: 'https://tools.missivedigital.com/' }
    assert.equal(isAllowedOrigin('https://tools.missivedigital.com', env), true)
    assert.equal(isAllowedOrigin('https://tools.missivedigital.com/', env), true)
  })

  test('supports comma-separated CLIENT_URL values with spaces', () => {
    const env = {
      NODE_ENV: 'production',
      CLIENT_URL: 'https://app1.com, https://app2.com/ , http://localhost:5173',
    }
    assert.equal(isAllowedOrigin('https://app1.com', env), true)
    assert.equal(isAllowedOrigin('https://app2.com', env), true)
    assert.equal(isAllowedOrigin('http://localhost:5173', env), true)
    assert.equal(isAllowedOrigin('https://unlisted.com', env), false)
  })

  test('allows wildcard * in CLIENT_URL', () => {
    const env = { NODE_ENV: 'production', CLIENT_URL: '*' }
    assert.equal(isAllowedOrigin('https://any-domain-example.com', env), true)
  })

  test('allows Missive Digital production domains in any environment', () => {
    const prodEnv = { NODE_ENV: 'production', CLIENT_URL: '' }
    assert.equal(isAllowedOrigin('https://tool.missivedigital.com', prodEnv), true)
    assert.equal(isAllowedOrigin('https://tool.missivedigital.com/', prodEnv), true)
    assert.equal(isAllowedOrigin('https://tools.missivedigital.com', prodEnv), true)
    assert.equal(isAllowedOrigin('https://missivedigital.com', prodEnv), true)
    assert.equal(isAllowedOrigin('https://www.missivedigital.com', prodEnv), true)
  })

  test('allows Render API backend from ALLOWED_ORIGINS array with or without /api/ path', () => {
    const prodEnv = { NODE_ENV: 'production', CLIENT_URL: '' }
    assert.equal(isAllowedOrigin('https://tool-2jmg.onrender.com', prodEnv), true)
    assert.equal(isAllowedOrigin('https://tool-2jmg.onrender.com/api/', prodEnv), true)
  })

  test('allows Vercel preview and production subdomains', () => {
    const prodEnv = { NODE_ENV: 'production', CLIENT_URL: '' }
    assert.equal(isAllowedOrigin('https://seo-tools-preview-git.vercel.app', prodEnv), true)
    assert.equal(isAllowedOrigin('https://missivedigital-tools.vercel.app', prodEnv), true)
  })

  test('allows Render deployments', () => {
    const prodEnv = { NODE_ENV: 'production', CLIENT_URL: '' }
    assert.equal(isAllowedOrigin('https://tool-2jmg.onrender.com', prodEnv), true)
  })

  test('rejects malicious or untrusted origins in production', () => {
    const prodEnv = { NODE_ENV: 'production', CLIENT_URL: 'https://tools.missivedigital.com' }
    assert.equal(isAllowedOrigin('https://malicious-site.com', prodEnv), false)
    assert.equal(isAllowedOrigin('https://attacker-missivedigital.com', prodEnv), false)
  })
})

describe('CORS Express Integration', () => {
  let app
  let server
  let serverPort

  test('sets up test express server with getCorsOptions', async () => {
    app = express()
    const options = getCorsOptions({
      NODE_ENV: 'development',
      CLIENT_URL: 'http://localhost:5173',
    })
    app.use(cors(options))
    app.get('/api/test', (req, res) => res.json({ success: true }))

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        serverPort = server.address().port
        resolve()
      })
    })
  })

  test('handles preflight OPTIONS request with credentials and custom headers', async () => {
    const res = await fetch(`http://localhost:${serverPort}/api/test`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'x-device-id, content-type',
      },
    })

    assert.equal(res.status, 200)
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173')
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true')
    assert.ok(res.headers.get('access-control-allow-headers'))
  })

  test('allows requests from 127.0.0.1:5173 in development', async () => {
    const res = await fetch(`http://localhost:${serverPort}/api/test`, {
      method: 'GET',
      headers: { Origin: 'http://127.0.0.1:5173' },
    })
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5173')
  })

  test('allows requests from alternative Vite port localhost:5174 in development', async () => {
    const res = await fetch(`http://localhost:${serverPort}/api/test`, {
      method: 'GET',
      headers: { Origin: 'http://localhost:5174' },
    })
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5174')
  })

  test('does not set access-control-allow-origin for disallowed origin', async () => {
    const prodApp = express()
    prodApp.use(cors(getCorsOptions({
      NODE_ENV: 'production',
      CLIENT_URL: 'https://tools.missivedigital.com',
    })))
    prodApp.get('/api/test', (req, res) => res.json({ success: true }))

    const prodServer = prodApp.listen(0)
    const port = prodServer.address().port

    try {
      const res = await fetch(`http://localhost:${port}/api/test`, {
        method: 'GET',
        headers: { Origin: 'https://evil-site.com' },
      })
      assert.equal(res.headers.get('access-control-allow-origin'), null)
    } finally {
      prodServer.close()
      if (server) server.close()
    }
  })
})
