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
        }
        const info = defaults[toolSlug] || { name: toolSlug, description: '' }
        await prisma.toolConfig.create({
          data: { slug: toolSlug, name: info.name, description: info.description },
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

      // Rate limiting by IP
      const ip = req.ip || req.connection?.remoteAddress || 'unknown'
      const now = Date.now()
      const key = `${toolSlug}:${ip}`
      const record = usageCounts.get(key)

      if (record) {
        // Check hourly limit
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

      // Attach config to request for controllers to use
      req.toolConfig = config
      next()
    } catch (err) {
      console.error('Tool access check failed:', err.message)
      // Don't block on errors — let the request through
      next()
    }
  }
}
