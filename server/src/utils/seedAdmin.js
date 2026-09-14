import prisma from './prisma.js'

export async function seedAdminUser(options = {}) {
  const adminCount = await prisma.admin.count()
  if (adminCount > 0) return { created: false, reason: 'Admin already exists' }

  const initialEmail = options.email || process.env.ADMIN_INITIAL_EMAIL || 'admin@missivedigital.com'
  const initialPassword = options.password || process.env.ADMIN_INITIAL_PASSWORD
  const isProduction = (options.env || process.env.NODE_ENV) === 'production'

  if (isProduction) {
    if (!initialPassword || initialPassword === 'admin123' || initialPassword.trim().length < 12) {
      console.warn(
        '[SECURITY WARNING] Initial admin account not created in production: ADMIN_INITIAL_PASSWORD must be provided via environment variables with at least 12 characters.'
      )
      return { created: false, reason: 'Insecure or missing ADMIN_INITIAL_PASSWORD in production' }
    }
  }

  const passwordToUse = initialPassword || 'admin123'
  if (!initialPassword && !isProduction) {
    console.warn(
      '[SECURITY WARNING] Auto-seeding development admin with default credentials (admin@missivedigital.com / admin123). Set ADMIN_INITIAL_PASSWORD in .env for security.'
    )
  }

  const bcrypt = await import('bcryptjs')
  const hash = await bcrypt.default.hash(passwordToUse, 12)
  await prisma.admin.create({
    data: {
      email: initialEmail,
      passwordHash: hash,
      name: options.name || 'Admin',
      role: 'admin',
      isActive: true,
    },
  })
  console.log(`[OK] Admin account created: ${initialEmail}`)
  return { created: true, email: initialEmail }
}

// Allow standalone CLI execution via "node src/utils/seedAdmin.js"
if (process.argv[1] && process.argv[1].endsWith('seedAdmin.js')) {
  seedAdminUser()
    .then((result) => {
      console.log('Seeding result:', result)
      process.exit(0)
    })
    .catch((err) => {
      console.error('Seeding failed:', err)
      process.exit(1)
    })
}
