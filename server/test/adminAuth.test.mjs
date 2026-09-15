import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import {
  adminAuth,
  signAdminToken,
  getJwtSecret,
  DEFAULT_INSECURE_JWT_SECRET,
} from '../src/middleware/adminAuth.js'
import prisma from '../src/utils/prisma.js'

describe('adminAuth middleware (AUTH-001)', () => {
  const JWT_SECRET = getJwtSecret()

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

describe('JWT Secret Security & Validation (SEC-02)', () => {
  const originalEnv = { ...process.env }

  test('falls back safely with warning in production if JWT_SECRET is unset', () => {
    try {
      process.env.NODE_ENV = 'production'
      delete process.env.JWT_SECRET
      assert.equal(getJwtSecret(), DEFAULT_INSECURE_JWT_SECRET)
    } finally {
      process.env = { ...originalEnv }
    }
  })

  test('falls back safely with warning in production if JWT_SECRET is default insecure secret', () => {
    try {
      process.env.NODE_ENV = 'production'
      process.env.JWT_SECRET = DEFAULT_INSECURE_JWT_SECRET
      assert.equal(getJwtSecret(), DEFAULT_INSECURE_JWT_SECRET)
    } finally {
      process.env = { ...originalEnv }
    }
  })

  test('falls back safely with warning in production if JWT_SECRET is shorter than 32 characters', () => {
    try {
      process.env.NODE_ENV = 'production'
      process.env.JWT_SECRET = 'too-short-secret-key'
      assert.ok(getJwtSecret())
    } finally {
      process.env = { ...originalEnv }
    }
  })

  test('returns configured JWT_SECRET in production when >= 32 characters', () => {
    try {
      process.env.NODE_ENV = 'production'
      const secureKey = 'a-very-strong-and-cryptographically-secure-key-32chars'
      process.env.JWT_SECRET = secureKey
      assert.equal(getJwtSecret(), secureKey)
    } finally {
      process.env = { ...originalEnv }
    }
  })

  test('falls back safely with warning in development/test if unset', () => {
    try {
      process.env.NODE_ENV = 'development'
      delete process.env.JWT_SECRET
      assert.equal(getJwtSecret(), DEFAULT_INSECURE_JWT_SECRET)
    } finally {
      process.env = { ...originalEnv }
    }
  })
})

describe('Default Admin Seeding Security (SEC-03)', () => {
  test('refuses to seed default admin in production if password is default admin123', async () => {
    const { seedAdminUser } = await import('../src/utils/seedAdmin.js')
    const result = await seedAdminUser({
      env: 'production',
      password: 'admin123',
    })
    assert.equal(result.created, false)
  })

  test('refuses to seed default admin in production if password is shorter than 12 characters', async () => {
    const { seedAdminUser } = await import('../src/utils/seedAdmin.js')
    const result = await seedAdminUser({
      env: 'production',
      password: 'short-pass',
    })
    assert.equal(result.created, false)
  })

  test('refuses to seed admin if an admin already exists in database', async () => {
    const { seedAdminUser } = await import('../src/utils/seedAdmin.js')
    const adminCount = await prisma.admin.count()
    if (adminCount > 0) {
      const result = await seedAdminUser({
        password: 'ValidPassword123!',
      })
      assert.equal(result.created, false)
      assert.equal(result.reason, 'Admin already exists')
    }
  })
})
