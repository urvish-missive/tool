import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'seo-tools-admin-secret-key-change-in-production'

export async function adminAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' })
  }

  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

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
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}
