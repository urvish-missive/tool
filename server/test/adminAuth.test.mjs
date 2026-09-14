import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { adminAuth, signAdminToken } from '../src/middleware/adminAuth.js'
import prisma from '../src/utils/prisma.js'

describe('adminAuth middleware (AUTH-001)', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'seo-tools-admin-secret-key-change-in-production'

  function createMockRes() {
    return {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code
        return this
      },
      json(payload) {
        this.body = payload
        return this
      },
    }
  }

  test('rejects request when no Authorization header is present', async () => {
    const req = { headers: {} }
    const res = createMockRes()
    let nextCalled = false

    await adminAuth(req, res, () => {
      nextCalled = true
    })

    assert.equal(nextCalled, false)
    assert.equal(res.statusCode, 401)
    assert.equal(res.body.success, false)
    assert.match(res.body.error, /No token provided/)
  })

  test('rejects request when token signature is invalid', async () => {
    const fakeToken = jwt.sign({ id: '65f123456789abcdef123456', role: 'admin' }, 'wrong-secret')
    const req = { headers: { authorization: `Bearer ${fakeToken}` } }
    const res = createMockRes()
    let nextCalled = false

    await adminAuth(req, res, () => {
      nextCalled = true
    })

    assert.equal(nextCalled, false)
    assert.equal(res.statusCode, 401)
    assert.match(res.body.error, /Invalid or expired token/)
  })

  test('rejects request when admin user no longer exists in database', async () => {
    // Valid token signed with correct secret, but ID does not exist in DB
    const nonExistentId = '65f999999999999999999999'
    const token = jwt.sign({ id: nonExistentId, email: 'ghost@example.com', role: 'admin' }, JWT_SECRET)
    const req = { headers: { authorization: `Bearer ${token}` } }
    const res = createMockRes()
    let nextCalled = false

    await adminAuth(req, res, () => {
      nextCalled = true
    })

    assert.equal(nextCalled, false)
    assert.equal(res.statusCode, 401)
    assert.match(res.body.error, /User account not found or deleted/)
  })

  test('rejects request when admin account is disabled (isActive === false)', async () => {
    // Create a temporary disabled admin in DB
    const disabledEmail = `test-disabled-${Date.now()}@example.com`
    const disabledAdmin = await prisma.admin.create({
      data: {
        email: disabledEmail,
        passwordHash: 'testhash',
        name: 'Disabled Test Admin',
        role: 'admin',
        isActive: false,
      },
    })

    try {
      const token = signAdminToken(disabledAdmin)
      const req = { headers: { authorization: `Bearer ${token}` } }
      const res = createMockRes()
      let nextCalled = false

      await adminAuth(req, res, () => {
        nextCalled = true
      })

      assert.equal(nextCalled, false)
      assert.equal(res.statusCode, 403)
      assert.match(res.body.error, /Account has been disabled/)
    } finally {
      await prisma.admin.delete({ where: { id: disabledAdmin.id } })
    }
  })

  test('allows request and populates req.admin when admin is active', async () => {
    let activeAdmin = await prisma.admin.findFirst({ where: { isActive: true, role: 'admin' } })
    let tempAdmin = null

    if (!activeAdmin) {
      tempAdmin = await prisma.admin.create({
        data: {
          email: `test-active-${Date.now()}@example.com`,
          passwordHash: 'testhash',
          name: 'Active Test Admin',
          role: 'admin',
          isActive: true,
        },
      })
      activeAdmin = tempAdmin
    }

    try {
      const token = signAdminToken(activeAdmin)
      const req = { headers: { authorization: `Bearer ${token}` } }
      const res = createMockRes()
      let nextCalled = false

      await adminAuth(req, res, () => {
        nextCalled = true
      })

      assert.equal(nextCalled, true)
      assert.equal(res.statusCode, 200)
      assert.ok(req.admin)
      assert.equal(req.admin.id, activeAdmin.id)
      assert.equal(req.admin.email, activeAdmin.email)
      assert.equal(req.admin.role, 'admin')
      assert.equal(req.admin.isActive, true)
    } finally {
      if (tempAdmin) {
        await prisma.admin.delete({ where: { id: tempAdmin.id } })
      }
    }
  })
})
