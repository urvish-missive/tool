import prisma from '../utils/prisma.js'

/**
 * POST /api/devices/link-email
 * Links an email address to a deviceId so admin can identify it
 */
export async function linkDeviceEmailHandler(req, res) {
  try {
    const deviceId = req.headers['x-device-id'] || req.body?.deviceId
    const { email, toolSlug } = req.body

    if (!deviceId) {
      return res.status(400).json({ success: false, error: 'Device ID required' })
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email required' })
    }

    const emailVal = email.trim().toLowerCase()

    // Update all records for this device
    await prisma.deviceUsage.updateMany({
      where: { deviceId },
      data: { email: emailVal },
    })

    // If a toolSlug is specified and record doesn't exist yet, create one
    if (toolSlug) {
      const existing = await prisma.deviceUsage.findUnique({
        where: { deviceId_toolSlug: { deviceId, toolSlug } },
      })
      if (!existing) {
        await prisma.deviceUsage.create({
          data: {
            deviceId,
            toolSlug,
            email: emailVal,
            ip: req.ip || req.connection?.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'Unknown',
            usageCount: 0,
          },
        })
      }
    }

    res.json({
      success: true,
      message: 'Email successfully linked to your device.',
    })
  } catch (err) {
    console.error('Link device email error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to link email.' })
  }
}

/**
 * GET /api/devices/status
 * Returns usage status for the current device and tool
 */
export async function getDeviceStatusHandler(req, res) {
  try {
    const deviceId = req.headers['x-device-id'] || req.query?.deviceId
    const toolSlug = req.query?.toolSlug

    if (!deviceId || !toolSlug) {
      return res.json({ success: true, usageCount: 0, limit: 3, isBlocked: false })
    }

    const [config, record] = await Promise.all([
      prisma.toolConfig.findUnique({ where: { slug: toolSlug } }),
      prisma.deviceUsage.findUnique({ where: { deviceId_toolSlug: { deviceId, toolSlug } } }),
    ])

    const defaultLimit = config?.deviceLimit ?? 3
    const limit = record?.customLimit !== null && record?.customLimit !== undefined
      ? record.customLimit
      : defaultLimit

    res.json({
      success: true,
      deviceId,
      toolSlug,
      usageCount: record?.usageCount || 0,
      limit,
      remaining: Math.max(0, limit - (record?.usageCount || 0)),
      isBlocked: record?.isBlocked || false,
      email: record?.email || null,
    })
  } catch (err) {
    console.error('Get device status error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to retrieve device status' })
  }
}
