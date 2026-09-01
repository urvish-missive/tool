import 'dotenv/config'
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
import adminRoutes from './routes/adminRoutes.js'
import { toolAccess } from './middleware/toolAccess.js'
import prisma from './utils/prisma.js'

const app = express()
const PORT = process.env.PORT || 5000

// Security
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))

// Body parsing with size limit
app.use(express.json({ limit: '1mb' }))

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Tool configs (public — for frontend to check if tool is enabled)
app.get('/api/tools/public', async (req, res) => {
  try {
    const tools = await prisma.toolConfig.findMany({
      select: { slug: true, name: true, enabled: true, requireEmail: true, requireName: true, requirePhone: true, requireCompany: true, showLeadPopup: true, formFields: true },
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
    console.log('✓ Database connected successfully')

    // Auto-seed default admin and tool configs
    await seedDefaults()
  } catch (err) {
    console.error('✗ Database connection failed:', err.message)
  }

  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`)
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
    console.log('✓ Default admin created: admin@missivedigital.com / admin123')
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
        country: { enabled: true, label: 'Country', required: false },
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
    ]
    await prisma.toolConfig.createMany({ data: tools })
    console.log('✓ Default tool configs created')
  }
}

start()
