import 'dotenv/config' // reloaded
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import contentRoutes from './routes/contentRoutes.js'
import leadRoutes from './routes/leadRoutes.js'
import auditRoutes from './routes/auditRoutes.js'
import keywordRoutes from './routes/keywordRoutes.js'
import roiRoutes from './routes/roiRoutes.js'
import blogTopicRoutes from './routes/blogTopicRoutes.js'
import logoRoutes from './routes/logoRoutes.js'
import faqRoutes from './routes/faqRoutes.js'
import competitorRoutes from './routes/competitorRoutes.js'
import contentQaRoutes from './routes/contentQaRoutes.js'
import sitemapRoutes from './routes/sitemapRoutes.js'
import rankRoutes from './routes/rankRoutes.js'
import extractorRoutes from './routes/extractorRoutes.js'
import imageExtractorRoutes from './routes/imageExtractorRoutes.js'
import techInspectorRoutes from './routes/techInspectorRoutes.js'
import contentWriterRoutes from './routes/contentWriterRoutes.js'
import blogIntroRoutes from './routes/blogIntroRoutes.js'
import blogConclusionRoutes from './routes/blogConclusionRoutes.js'
import eeatRoutes from './routes/eeatRoutes.js'
import businessCompetitorRoutes from './routes/businessCompetitorRoutes.js'
import caseStudyRoutes from './routes/caseStudyRoutes.js'
import deviceRoutes from './routes/deviceRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

import { toolAccess } from './middleware/toolAccess.js'
import prisma from './utils/prisma.js'

const app = express()
const PORT = process.env.PORT || 5000

// Security
app.use(helmet({ crossOriginResourcePolicy: false }))
const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : ['*']
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(null, true)
  },
  credentials: true,
}))

// Body parsing with size limit (allows up to 25MB for base64 PDF report attachments)
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))

// Global rate limit
app.use('/api', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
}))

// Routes — Admin (no tool access middleware)
app.use('/api/admin', adminRoutes)

// Routes — Tools (with tool access checks)
app.use('/api/content', toolAccess('content-analyzer'), contentRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/audit', toolAccess('seo-audit'), auditRoutes)
app.use('/api/keywords', toolAccess('keyword-research'), keywordRoutes)
app.use('/api/seo-roi', toolAccess('seo-roi'), roiRoutes)
app.use('/api/blog-topics', toolAccess('blog-topics'), blogTopicRoutes)
app.use('/api/logo', toolAccess('logo-maker'), logoRoutes)
app.use('/api/faqs', toolAccess('faq-generator'), faqRoutes)
app.use('/api/competitors', toolAccess('competitor-analyzer'), competitorRoutes)
app.use('/api/content-qa', toolAccess('content-qa'), contentQaRoutes)
app.use('/api/sitemap', toolAccess('xml-sitemap-generator'), sitemapRoutes)
app.use('/api/rank', toolAccess('google-rank-checker'), rankRoutes)
app.use('/api/extractor', toolAccess('website-content-extractor'), extractorRoutes)
app.use('/api/image-extractor', toolAccess('website-image-extractor'), imageExtractorRoutes)
app.use('/api/tech-inspector', toolAccess('website-tech-inspector'), techInspectorRoutes)
app.use('/api/content-writer', toolAccess('ai-content-writer'), contentWriterRoutes)
app.use('/api/blog-intros', toolAccess('blog-intro-generator'), blogIntroRoutes)
app.use('/api/blog-conclusion', toolAccess('blog-conclusion-generator'), blogConclusionRoutes)
app.use('/api/eeat', toolAccess('eeat-analyzer'), eeatRoutes)
app.use('/api/business-competitor', toolAccess('business-competitor-analytics'), businessCompetitorRoutes)
app.use('/api/case-study', toolAccess('case-study-generator'), caseStudyRoutes)
app.use('/api/devices', deviceRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Tool configs (public — for frontend to check if tool is enabled)
app.get('/api/tools/public', async (req, res) => {
  try {
    const tools = await prisma.toolConfig.findMany({
      select: { slug: true, name: true, enabled: true, requireEmail: true, requireName: true, requirePhone: true, requireCompany: true, showLeadPopup: true, formFields: true, popupFields: true, deviceLimit: true },
    })

    res.json({ success: true, tools })
  } catch {
    res.json({ success: true, tools: [] })
  }
})

// 404
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' })
})

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Server error:', err.message)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

async function start() {
  try {
    await prisma.$connect()
    console.log('[OK] Database connected successfully')

    // Auto-seed default admin and tool configs
    await seedDefaults()
  } catch (err) {
    console.error('[ERROR] Database connection failed:', err.message)
  }

  app.listen(PORT, () => {
    console.log(`[OK] Server running on http://localhost:${PORT}`)
    console.log(`  API: http://localhost:${PORT}/api/health`)
  })
}

async function seedDefaults() {
  // Seed default admin if none exists
  const adminCount = await prisma.admin.count()
  if (adminCount === 0) {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.default.hash('admin123', 12)
    await prisma.admin.create({
      data: { email: 'admin@missivedigital.com', passwordHash: hash, name: 'Admin' },
    })
    console.log('[OK] Default admin created: admin@missivedigital.com / admin123')
  }

  // Seed default tool configs
  const toolCount = await prisma.toolConfig.count()
  if (toolCount === 0) {
    const tools = [
      { slug: 'content-analyzer', name: 'Content Analyzer', description: 'Analyze content for SEO optimization', dailyLimit: 100, hourlyLimit: 20, formFields: JSON.stringify({
        content: { enabled: true, label: 'Content', required: true },
        keyword: { enabled: true, label: 'Primary Keyword', required: false },
        secondaryKeywords: { enabled: true, label: 'Secondary Keywords', required: false },
        contentType: { enabled: true, label: 'Content Type', required: false },
        country: { enabled: true, label: 'Country', required: false },
      })},
      { slug: 'seo-audit', name: 'SEO Audit', description: 'Audit websites for technical SEO issues', dailyLimit: 50, hourlyLimit: 10, formFields: JSON.stringify({
        url: { enabled: true, label: 'Website URL', required: true },
        html: { enabled: true, label: 'Paste HTML', required: false },
        keyword: { enabled: true, label: 'Target Keyword', required: false },
      })},
      { slug: 'keyword-research', name: 'Keyword Research', description: 'Generate keyword ideas and opportunities', dailyLimit: 80, hourlyLimit: 15, formFields: JSON.stringify({
        seedKeyword: { enabled: true, label: 'Seed Keyword', required: false },
        websiteUrl: { enabled: true, label: 'Website URL', required: false },
        businessType: { enabled: true, label: 'Business Type', required: false },
      })},
      { slug: 'seo-roi', name: 'SEO ROI Calculator', description: 'Estimate SEO ROI and organic traffic', dailyLimit: 200, hourlyLimit: 50, formFields: JSON.stringify({
        currency: { enabled: true, label: 'Currency', required: false },
        traffic: { enabled: true, label: 'Monthly Traffic', required: true },
        leads: { enabled: true, label: 'Monthly Leads', required: false },
        custValue: { enabled: true, label: 'Customer Value', required: true },
        custRate: { enabled: true, label: 'Lead → Customer Rate', required: false },
        convRate: { enabled: true, label: 'Organic → Lead Rate', required: false },
        investment: { enabled: true, label: 'Monthly Investment', required: true },
        months: { enabled: true, label: 'Campaign Duration', required: false },
        growthPreset: { enabled: true, label: 'Growth Scenario', required: false },
      })},
      { slug: 'blog-topics', name: 'Blog Topic Generator', description: 'Generate blog topics and content ideas', dailyLimit: 60, hourlyLimit: 12, formFields: JSON.stringify({
        niche: { enabled: true, label: 'Niche / Industry', required: true },
        targetKeywords: { enabled: true, label: 'Target Keywords', required: false },
        audience: { enabled: true, label: 'Target Audience', required: false },
        contentGoal: { enabled: true, label: 'Content Goal', required: false },
        contentType: { enabled: true, label: 'Content Type', required: false },
        topicCount: { enabled: true, label: 'Topic Count', required: false },
      })},
      { slug: 'logo-maker', name: 'Logo Maker', description: 'Generate logo designs with AI', dailyLimit: 30, hourlyLimit: 5, formFields: JSON.stringify({
        brandName: { enabled: true, label: 'Brand Name', required: true },
        description: { enabled: true, label: 'Description', required: false },
        industry: { enabled: true, label: 'Industry', required: false },
        style: { enabled: true, label: 'Style', required: false },
        primaryColor: { enabled: true, label: 'Primary Color', required: false },
        secondaryColor: { enabled: true, label: 'Secondary Color', required: false },
      })},
      { slug: 'content-qa', name: 'Content QA', description: 'QA checklist to verify content quality before publish', dailyLimit: 100, hourlyLimit: 20, formFields: JSON.stringify({
        content: { enabled: true, label: 'Content', required: true },
        title: { enabled: true, label: 'Title', required: false },
        targetKeyword: { enabled: true, label: 'Target Keyword', required: false },
        metaDescription: { enabled: true, label: 'Meta Description', required: false },
        urlSlug: { enabled: true, label: 'URL Slug', required: false },
      })},
      { slug: 'faq-generator', name: 'FAQ Generator', description: 'Generate SEO-friendly FAQ questions and answers', dailyLimit: 80, hourlyLimit: 15, formFields: JSON.stringify({}) },
      { slug: 'competitor-analyzer', name: 'Competitor Analyzer', description: 'Analyze competitor websites for SEO insights', dailyLimit: 40, hourlyLimit: 8, formFields: JSON.stringify({}) },
      { slug: 'xml-sitemap-generator', name: 'XML Sitemap Generator', description: 'Generate, crawl, and validate SEO-compliant XML sitemaps', dailyLimit: 60, hourlyLimit: 15, formFields: JSON.stringify({
        websiteUrl: { enabled: true, label: 'Website URL', required: true },
        maxPages: { enabled: true, label: 'Max URLs', required: false },
        crawlDepth: { enabled: true, label: 'Crawl Depth', required: false },
        includeImages: { enabled: true, label: 'Include Images', required: false },
        changefreq: { enabled: true, label: 'Change Frequency', required: false },
        priority: { enabled: true, label: 'Priority', required: false },
      })},
      { slug: 'google-rank-checker', name: 'Google Rank Checker', description: 'Check search rankings and SERP intelligence on Google', dailyLimit: 50, hourlyLimit: 10, formFields: JSON.stringify({
        domain: { enabled: true, label: 'Domain / Website', required: true },
        keyword: { enabled: true, label: 'Target Keyword', required: true },
        country: { enabled: true, label: 'Country', required: false },
        device: { enabled: true, label: 'Device', required: false },
      })},
      { slug: 'website-content-extractor', name: 'Website Content Extractor & AI Q&A', description: 'Extract clean website content, metadata, schema, and answer questions with AI', dailyLimit: 60, hourlyLimit: 15, formFields: JSON.stringify({
        url: { enabled: true, label: 'Website URL', required: true },
        extractAIOverview: { enabled: true, label: 'AI Overview', required: false },
      })},
      { slug: 'website-image-extractor', name: 'Website Image Extractor & Downloader', description: 'Extract all images, logos, SVGs, and social banners from any URL with 1-click downloads', dailyLimit: 60, hourlyLimit: 15, formFields: JSON.stringify({
        url: { enabled: true, label: 'Website URL', required: true },
      })},
      { slug: 'website-tech-inspector', name: 'Website Tech & Theme Inspector', description: 'Extract website theme colors, technology stack, Google font families, and design specs', dailyLimit: 60, hourlyLimit: 15, formFields: JSON.stringify({
        url: { enabled: true, label: 'Website URL', required: true },
      })},
      { slug: 'ai-content-writer', name: 'AI Content Writer', description: 'AI-powered SEO content writer for blog posts, articles, product pages, and more', dailyLimit: 50, hourlyLimit: 10, formFields: JSON.stringify({
        keyword: { enabled: true, label: 'Topic / Primary Keyword', required: true },
        contentType: { enabled: true, label: 'Content Type', required: false },
        tone: { enabled: true, label: 'Tone', required: false },
        wordCount: { enabled: true, label: 'Word Count', required: false },
        targetAudience: { enabled: true, label: 'Target Audience', required: false },
        secondaryKeywords: { enabled: true, label: 'Secondary Keywords', required: false },
      })},
      { slug: 'blog-intro-generator', name: 'Blog Introduction Generator', description: 'Generate high-converting blog post introductions across TOFU, MOFU, and BOFU funnel stages', dailyLimit: 50, hourlyLimit: 10, formFields: JSON.stringify({
        topic: { enabled: true, label: 'Blog Topic / Title', required: true },
        funnelStage: { enabled: true, label: 'Funnel Stage (TOFU / MOFU / BOFU)', required: false },
        targetKeywords: { enabled: true, label: 'Target Keywords', required: false },
        targetAudience: { enabled: true, label: 'Target Audience', required: false },
        tone: { enabled: true, label: 'Tone of Voice', required: false },
        count: { enabled: true, label: 'Number of Introductions', required: false },
      })},
      { slug: 'business-competitor-analytics', name: 'Business Competitor Intelligence', description: 'Deep business intelligence on competitors: history, M&A, products, market position, marketing & sales strategies', dailyLimit: 30, hourlyLimit: 8, formFields: JSON.stringify({
        competitorUrl: { enabled: true, label: 'Competitor Website URL', required: true },
        companyName: { enabled: true, label: 'Company Name', required: false },
        industry: { enabled: true, label: 'Industry / Sector', required: false },
      })},
    ]
    await prisma.toolConfig.createMany({ data: tools })
    console.log('[OK] Default tool configs created')
  } else {
    // Ensure xml-sitemap-generator exists if database was already initialized
    try {
      const sitemapTool = await prisma.toolConfig.findUnique({ where: { slug: 'xml-sitemap-generator' } })
      if (!sitemapTool) {
        await prisma.toolConfig.create({
          data: {
            slug: 'xml-sitemap-generator',
            name: 'XML Sitemap Generator',
            description: 'Generate, crawl, and validate SEO-compliant XML sitemaps',
            dailyLimit: 60,
            hourlyLimit: 15,
            formFields: JSON.stringify({
              websiteUrl: { enabled: true, label: 'Website URL', required: true },
              maxPages: { enabled: true, label: 'Max URLs', required: false },
              crawlDepth: { enabled: true, label: 'Crawl Depth', required: false },
              includeImages: { enabled: true, label: 'Include Images', required: false },
              changefreq: { enabled: true, label: 'Change Frequency', required: false },
              priority: { enabled: true, label: 'Priority', required: false },
            }),
          },
        })
        console.log('[OK] XML Sitemap Generator tool config seeded')
      }
    } catch {}

    // Ensure google-rank-checker exists if database was already initialized
    try {
      const rankTool = await prisma.toolConfig.findUnique({ where: { slug: 'google-rank-checker' } })
      if (!rankTool) {
        await prisma.toolConfig.create({
          data: {
            slug: 'google-rank-checker',
            name: 'Google Rank Checker',
            description: 'Check search rankings and SERP intelligence on Google',
            dailyLimit: 50,
            hourlyLimit: 10,
            formFields: JSON.stringify({
              domain: { enabled: true, label: 'Domain / Website', required: true },
              keyword: { enabled: true, label: 'Target Keyword', required: true },
              country: { enabled: true, label: 'Country', required: false },
              device: { enabled: true, label: 'Device', required: false },
            }),
          },
        })
        console.log('[OK] Google Rank Checker tool config seeded')
      }
    } catch {}

    // Ensure website-content-extractor exists if database was already initialized
    try {
      const extractorTool = await prisma.toolConfig.findUnique({ where: { slug: 'website-content-extractor' } })
      if (!extractorTool) {
        await prisma.toolConfig.create({
          data: {
            slug: 'website-content-extractor',
            name: 'Website Content Extractor & AI Q&A',
            description: 'Extract clean website content, metadata, schema, and answer questions with AI',
            dailyLimit: 60,
            hourlyLimit: 15,
            formFields: JSON.stringify({
              url: { enabled: true, label: 'Website URL', required: true },
              extractAIOverview: { enabled: true, label: 'AI Overview', required: false },
            }),
          },
        })
        console.log('[OK] Website Content Extractor tool config seeded')
      }
    } catch {}

    // Ensure website-image-extractor exists if database was already initialized
    try {
      const imageTool = await prisma.toolConfig.findUnique({ where: { slug: 'website-image-extractor' } })
      if (!imageTool) {
        await prisma.toolConfig.create({
          data: {
            slug: 'website-image-extractor',
            name: 'Website Image Extractor & Downloader',
            description: 'Extract all images, logos, SVGs, and social banners from any URL with 1-click downloads',
            dailyLimit: 60,
            hourlyLimit: 15,
            formFields: JSON.stringify({
              url: { enabled: true, label: 'Website URL', required: true },
            }),
          },
        })
        console.log('[OK] Website Image Extractor tool config seeded')
      }
    } catch {}

    // Ensure website-tech-inspector exists if database was already initialized
    try {
      const techTool = await prisma.toolConfig.findUnique({ where: { slug: 'website-tech-inspector' } })
      if (!techTool) {
        await prisma.toolConfig.create({
          data: {
            slug: 'website-tech-inspector',
            name: 'Website Tech & Theme Inspector',
            description: 'Extract website theme colors, technology stack, Google font families, and design specs',
            dailyLimit: 60,
            hourlyLimit: 15,
            formFields: JSON.stringify({
              url: { enabled: true, label: 'Website URL', required: true },
            }),
          },
        })
        console.log('[OK] Website Tech & Theme Inspector tool config seeded')
      }
    } catch {}

    // Ensure ai-content-writer exists if database was already initialized
    try {
      const writerTool = await prisma.toolConfig.findUnique({ where: { slug: 'ai-content-writer' } })
      if (!writerTool) {
        await prisma.toolConfig.create({
          data: {
            slug: 'ai-content-writer',
            name: 'AI Content Writer',
            description: 'AI-powered SEO content writer for blog posts, articles, product pages, and more',
            dailyLimit: 50,
            hourlyLimit: 10,
            formFields: JSON.stringify({
              keyword: { enabled: true, label: 'Topic / Primary Keyword', required: true },
              contentType: { enabled: true, label: 'Content Type', required: false },
              tone: { enabled: true, label: 'Tone', required: false },
              wordCount: { enabled: true, label: 'Word Count', required: false },
              targetAudience: { enabled: true, label: 'Target Audience', required: false },
              secondaryKeywords: { enabled: true, label: 'Secondary Keywords', required: false },
            }),
          },
        })
        console.log('[OK] AI Content Writer tool config seeded')
      }
    } catch {}

    // Ensure blog-intro-generator exists if database was already initialized
    try {
      const introTool = await prisma.toolConfig.findUnique({ where: { slug: 'blog-intro-generator' } })
      if (!introTool) {
        await prisma.toolConfig.create({
          data: {
            slug: 'blog-intro-generator',
            name: 'Blog Introduction Generator',
            description: 'Generate high-converting blog post introductions across TOFU, MOFU, and BOFU funnel stages',
            dailyLimit: 50,
            hourlyLimit: 10,
            formFields: JSON.stringify({
              topic: { enabled: true, label: 'Blog Topic / Title', required: true },
              funnelStage: { enabled: true, label: 'Funnel Stage (TOFU / MOFU / BOFU)', required: false },
              targetKeywords: { enabled: true, label: 'Target Keywords', required: false },
              targetAudience: { enabled: true, label: 'Target Audience', required: false },
              tone: { enabled: true, label: 'Tone of Voice', required: false },
              count: { enabled: true, label: 'Number of Introductions', required: false },
            }),
          },
        })
        console.log('[OK] Blog Introduction Generator tool config seeded')
      }
    } catch {}

    // Ensure eeat-analyzer exists if database was already initialized
    try {
      const eeatTool = await prisma.toolConfig.findUnique({ where: { slug: 'eeat-analyzer' } })
      if (!eeatTool) {
        await prisma.toolConfig.create({
          data: {
            slug: 'eeat-analyzer',
            name: 'E-E-A-T & AI Search Authority Analyzer',
            description: 'Evaluate, score, and improve Google E-E-A-T and AI Overview / Perplexity citation readiness',
            dailyLimit: 50,
            hourlyLimit: 10,
            formFields: JSON.stringify({
              url: { enabled: true, label: 'Website URL', required: false },
              content: { enabled: true, label: 'Article / Draft Text', required: false },
              contentType: { enabled: true, label: 'E-E-A-T Content Type', required: false },
              targetKeywords: { enabled: true, label: 'Target Keywords', required: false },
            }),
          },
        })
        console.log('[OK] E-E-A-T Analyzer tool config seeded')
      }
    } catch {}

    // Ensure blog-conclusion-generator exists if database was already initialized
    try {
      const conclusionTool = await prisma.toolConfig.findUnique({ where: { slug: 'blog-conclusion-generator' } })
      if (!conclusionTool) {
        await prisma.toolConfig.create({
          data: {
            slug: 'blog-conclusion-generator',
            name: 'Blog Conclusion Generator',
            description: 'Generate high-converting blog post conclusions with specific H2 titles and intro loop closure',
            dailyLimit: 50,
            hourlyLimit: 15,
            formFields: JSON.stringify({
              topic: { enabled: true, label: 'Blog Topic / Title', required: true },
              intro: { enabled: true, label: 'Blog Introduction', required: false },
              keyTakeaways: { enabled: true, label: 'Key Takeaways', required: false },
              ctaGoal: { enabled: true, label: 'Call to Action Goal', required: false },
              funnelStage: { enabled: true, label: 'Funnel Stage', required: false },
              tone: { enabled: true, label: 'Tone of Voice', required: false },
              numVariations: { enabled: true, label: 'Number of Conclusions', required: false },
            }),
          },
        })
        console.log('[OK] Blog Conclusion Generator tool config seeded')
      }
    } catch {}

    // Ensure business-competitor-analytics exists if database was already initialized
    try {
      const bizTool = await prisma.toolConfig.findUnique({ where: { slug: 'business-competitor-analytics' } })
      if (!bizTool) {
        await prisma.toolConfig.create({
          data: {
            slug: 'business-competitor-analytics',
            name: 'Business Competitor Intelligence',
            description: 'Deep business intelligence on competitors: history, M&A, products, market position, marketing & sales strategies',
            dailyLimit: 30,
            hourlyLimit: 8,
            formFields: JSON.stringify({
              competitorUrl: { enabled: true, label: 'Competitor Website URL', required: true },
              companyName: { enabled: true, label: 'Company Name', required: false },
              industry: { enabled: true, label: 'Industry / Sector', required: false },
            }),
          },
        })
        console.log('[OK] Business Competitor Analytics tool config seeded')
      }
    } catch {}

    // Ensure case-study-generator exists if database was already initialized
    try {
      const caseStudyTool = await prisma.toolConfig.findUnique({ where: { slug: 'case-study-generator' } })
      if (!caseStudyTool) {
        await prisma.toolConfig.create({
          data: {
            slug: 'case-study-generator',
            name: 'Case Study Generator',
            description: 'Generate marketing-engineered B2B case studies with multi-channel distribution strategies and Missive QA compliance',
            dailyLimit: 50,
            hourlyLimit: 12,
            formFields: JSON.stringify({
              clientName: { enabled: true, label: 'Client / Brand Name', required: false },
              niche: { enabled: true, label: 'Niche / Industry', required: true },
              challenge: { enabled: true, label: 'Challenge / Bottleneck', required: true },
              solution: { enabled: true, label: 'Solution / Methodology', required: true },
              metrics: { enabled: true, label: 'Quantifiable Metrics & Results', required: true },
              targetAudience: { enabled: true, label: 'Target Audience / Personas', required: false },
              tone: { enabled: true, label: 'Tone of Voice', required: false },
            }),
          },
        })
        console.log('[OK] Case Study Generator tool config seeded')
      }
    } catch {}
  }
}

start()
