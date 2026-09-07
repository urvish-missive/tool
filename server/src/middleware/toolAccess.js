import prisma from '../utils/prisma.js'

// Simple in-memory rate limiter per IP per tool
const usageCounts = new Map()

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of usageCounts) {
    if (now - data.windowStart > 3600000) usageCounts.delete(key)
  }
}, 600000)

export function toolAccess(toolSlug) {
  return async (req, res, next) => {
    try {
      const config = await prisma.toolConfig.findUnique({ where: { slug: toolSlug } })

      // If no config exists, create default (first time)
      if (!config) {
        const defaults = {
          'content-analyzer': { name: 'Content Analyzer', description: 'Analyze content for SEO optimization' },
          'seo-audit': { name: 'SEO Audit', description: 'Audit websites for technical SEO issues' },
          'keyword-research': { name: 'Keyword Research', description: 'Generate keyword ideas and opportunities' },
          'seo-roi': { name: 'SEO ROI Calculator', description: 'Estimate SEO ROI and organic traffic' },
          'blog-topics': { name: 'Blog Topic Generator', description: 'Generate blog topics and content ideas' },
          'logo-maker': { name: 'Logo Maker', description: 'Generate logo designs with AI' },
          'website-content-extractor': { name: 'Website Content Extractor & AI Q&A', description: 'Extract clean website content, metadata, schema, and answer questions with AI' },
          'website-image-extractor': { name: 'Website Image Extractor & Downloader', description: 'Extract all images, logos, SVGs, and social banners from any URL with 1-click downloads' },
          'website-tech-inspector': { name: 'Website Tech & Theme Inspector', description: 'Extract website theme colors, technology stack, Google font families, and design specs' },
          'ai-content-writer': { name: 'AI Content Writer', description: 'Generate SEO-optimized articles and long-form content' },
          'blog-intro-generator': { name: 'Blog Introduction Generator', description: 'Generate high-converting blog post introductions across TOFU, MOFU, and BOFU funnel stages' },
          'eeat-analyzer': { name: 'E-E-A-T & AI Search Authority Analyzer', description: 'Evaluate, score, and improve Google E-E-A-T and AI Overview / Perplexity citation readiness' },
        }
        const info = defaults[toolSlug] || { name: toolSlug, description: '' }
        await prisma.toolConfig.create({
          data: { slug: toolSlug, name: info.name, description: info.description, deviceLimit: 3 },
        })
        return next()
      }

      // Check if tool is enabled
      if (!config.enabled) {
        return res.status(403).json({
          success: false,
          error: `The ${config.name} tool is currently disabled. Please try again later.`,
          toolDisabled: true,
        })
      }

      const ip = req.ip || req.connection?.remoteAddress || 'unknown'
      const deviceId = req.headers['x-device-id'] || req.query?.deviceId || req.body?.deviceId || null
      const isActionRequest = req.method === 'POST' || req.method === 'PUT'

      // ─── Device Limit Enforcement ────────────────────────────
      if (deviceId && isActionRequest) {
        const deviceRecord = await prisma.deviceUsage.findUnique({
          where: { deviceId_toolSlug: { deviceId, toolSlug } },
        })

        if (deviceRecord) {
          if (deviceRecord.isBlocked) {
            return res.status(403).json({
              success: false,
              error: 'Access to this tool is currently restricted. Please contact support.',
              deviceBlocked: true,
              deviceId,
              toolSlug,
              toolName: config.name,
              email: deviceRecord.email || null,
            })
          }

          const effectiveLimit = deviceRecord.customLimit !== null && deviceRecord.customLimit !== undefined
            ? deviceRecord.customLimit
            : (config.deviceLimit ?? 3)

          if (effectiveLimit > 0 && deviceRecord.usageCount >= effectiveLimit) {
            return res.status(429).json({
              success: false,
              error: `Complimentary limit reached for ${config.name} (${deviceRecord.usageCount} of ${effectiveLimit} free generations used). Please enter your email to request extended access.`,
              deviceLimitReached: true,
              limit: effectiveLimit,
              usageCount: deviceRecord.usageCount,
              email: deviceRecord.email || null,
              toolSlug,
              toolName: config.name,
            })
          }
        }
      }

      // ─── Rate limiting by IP (Hourly DDoS/Burst Protection) ───
      const now = Date.now()
      const key = `${toolSlug}:${ip}`
      const record = usageCounts.get(key)

      if (record) {
        if (now - record.windowStart > 3600000) {
          usageCounts.set(key, { count: 1, windowStart: now })
        } else {
          if (record.count >= config.hourlyLimit) {
            return res.status(429).json({
              success: false,
              error: `Rate limit exceeded for ${config.name}. Max ${config.hourlyLimit} requests per hour.`,
              retryAfter: Math.ceil((3600000 - (now - record.windowStart)) / 1000),
            })
          }
          record.count++
        }
      } else {
        usageCounts.set(key, { count: 1, windowStart: now })
      }

      // ─── Track usage on response completion ─────────────────
      if (deviceId && isActionRequest) {
        res.on('finish', async () => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            try {
              const userAgent = req.headers['user-agent'] || 'Unknown'
              const email = req.body?.email || req.query?.email || null
              const emailVal = (email && typeof email === 'string' && email.includes('@'))
                ? email.trim().toLowerCase()
                : null

              const updateData = {
                usageCount: { increment: 1 },
                lastUsedAt: new Date(),
                ip,
                userAgent,
              }
              if (emailVal) updateData.email = emailVal

              await prisma.deviceUsage.upsert({
                where: { deviceId_toolSlug: { deviceId, toolSlug } },
                create: {
                  deviceId,
                  toolSlug,
                  usageCount: 1,
                  ip,
                  userAgent,
                  email: emailVal,
                  lastUsedAt: new Date(),
                },
                update: updateData,
              })
            } catch (trackErr) {
              console.error('Device usage tracking error:', trackErr.message)
            }
          }
        })
      }

      req.toolConfig = config
      next()
    } catch (err) {
      console.error('Tool access check failed:', err.message)
      next()
    }
  }
}

