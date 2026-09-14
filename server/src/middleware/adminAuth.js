import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'

export const DEFAULT_INSECURE_JWT_SECRET = 'seo-tools-admin-secret-key-change-in-production'

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === DEFAULT_INSECURE_JWT_SECRET || secret.trim().length < 32) {
      throw new Error(
        'FATAL: JWT_SECRET must be explicitly set to a cryptographically secure string (at least 32 characters) in production.'
      )
    }
  }
  if (!secret) {
    // Only warn once per process if unset in development
    if (!getJwtSecret._warned) {
      console.warn(
        '[SECURITY WARNING] JWT_SECRET is not set in environment variables. Falling back to default development secret.'
      )
      getJwtSecret._warned = true
    }
    return DEFAULT_INSECURE_JWT_SECRET
  }
  return secret
}

export async function adminAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' })
  }

  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, getJwtSecret())

    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, error: 'Invalid token payload' })
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    })

    if (!admin) {
      return res.status(401).json({ success: false, error: 'User account not found or deleted' })
    }

    if (admin.isActive === false) {
      return res.status(403).json({ success: false, error: 'Account has been disabled' })
    }

    if (admin.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' })
    }

    req.admin = admin
    next()
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}

export function signAdminToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    getJwtSecret(),
    { expiresIn: '24h' }
  )
}
