import prisma from '../utils/prisma.js'
import bcrypt from 'bcryptjs'
import { signAdminToken } from '../middleware/adminAuth.js'

// ─── Auth ────────────────────────────────────────────────

export async function login(req, res) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' })
    }

    const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } })
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, admin.passwordHash)
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    const token = signAdminToken(admin)
    res.json({ success: true, token, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } })
  } catch (err) {
    console.error('Admin login error:', err.message)
    res.status(500).json({ success: false, error: 'Login failed' })
  }
}

export async function createAdmin(req, res) {
  try {
    const { email, password, name } = req.body
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name required' })
    }

    const existing = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return res.status(409).json({ success: false, error: 'Admin with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const admin = await prisma.admin.create({
      data: { email: email.toLowerCase(), passwordHash, name },
    })

    res.json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name } })
  } catch (err) {
    console.error('Create admin error:', err.message)
    res.status(500).json({ success: false, error: 'Could not create admin' })
  }
}

export async function getProfile(req, res) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })
    if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' })
    res.json({ success: true, admin })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get profile' })
  }
}

// ─── Dashboard Stats ─────────────────────────────────────

export async function getStats(req, res) {
  try {
    const [
      totalLeads,
      totalAnalyses,
      totalAudits,
      totalKeywords,
      totalBlogs,
      totalLogos,
      leadsToday,
      analysesToday,
      toolConfigs,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.analysis.count(),
      prisma.audit.count(),
      prisma.keywordResearch.count(),
      prisma.blogTopic.count(),
      prisma.generatedLogo.count(),
      prisma.lead.count({ where: { createdAt: { gte: startOfDay() } } }),
      prisma.analysis.count({ where: { createdAt: { gte: startOfDay() } } }),
      prisma.toolConfig.findMany({ orderBy: { name: 'asc' } }),
    ])

    const recentLeads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, email: true, company: true, source: true, createdAt: true },
    })

    const leadsBySource = await prisma.lead.groupBy({
      by: ['source'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    // Usage by day (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const dailyUsage = await prisma.lead.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { id: true },
    })

    // Recent activity across all tools
    const [recentAnalyses, recentAudits, recentKeywords, recentBlogs, recentLogos, recentRois] = await Promise.all([
      prisma.analysis.findMany({ orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, targetKeyword: true, overallScore: true, createdAt: true } }),
      prisma.audit.findMany({ orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, websiteUrl: true, overallScore: true, createdAt: true } }),
      prisma.keywordResearch.findMany({ orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, seedKeyword: true, websiteUrl: true, createdAt: true } }),
      prisma.blogTopic.findMany({ orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, niche: true, contentGoal: true, createdAt: true } }),
      prisma.generatedLogo.findMany({ orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, brandName: true, industry: true, createdAt: true } }),
      prisma.rOICalculation.findMany({ orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, monthlySeoInvestment: true, currency: true, createdAt: true } }),
      prisma.contentQA.findMany({ orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, title: true, targetKeyword: true, overallScore: true, createdAt: true } }),
    ])

    const recentActivity = [
      ...recentAnalyses.map(a => ({ tool: 'Content Analyzer', detail: a.targetKeyword || 'Untitled', score: a.overallScore, createdAt: a.createdAt, id: a.id })),
      ...recentAudits.map(a => ({ tool: 'SEO Audit', detail: a.websiteUrl, score: a.overallScore, createdAt: a.createdAt, id: a.id })),
      ...recentKeywords.map(k => ({ tool: 'Keyword Research', detail: k.seedKeyword, website: k.websiteUrl, createdAt: k.createdAt, id: k.id })),
      ...recentBlogs.map(b => ({ tool: 'Blog Topic Generator', detail: b.niche, goal: b.contentGoal, createdAt: b.createdAt, id: b.id })),
      ...recentLogos.map(l => ({ tool: 'Logo Maker', detail: l.brandName, industry: l.industry, createdAt: l.createdAt, id: l.id })),
      ...recentRois.map(r => ({ tool: 'ROI Calculator', detail: `${r.currency} ${r.monthlySeoInvestment}/mo investment`, createdAt: r.createdAt, id: r.id })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 15)

    res.json({
      success: true,
      stats: {
        totalLeads,
        totalAnalyses,
        totalAudits,
        totalKeywords,
        totalBlogs,
        totalLogos,
        totalTools: totalAnalyses + totalAudits + totalKeywords + totalBlogs + totalLogos,
        leadsToday,
        analysesToday,
        toolConfigs,
        recentLeads,
        recentActivity,
        leadsBySource: leadsBySource.map(l => ({ source: l.source || 'unknown', count: l._count.id })),
        dailyUsage,
      },
    })
  } catch (err) {
    console.error('Stats error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
}

// ─── Tool Config CRUD ────────────────────────────────────

export async function getTools(req, res) {
  try {
    const tools = await prisma.toolConfig.findMany({ orderBy: { name: 'asc' } })

    // Get usage counts per tool
    const usageData = []
    for (const tool of tools) {
      const todayStart = startOfDay()
      const count = await prisma.lead.count({
        where: { source: tool.slug, createdAt: { gte: todayStart } },
      })
      const totalCount = await prisma.lead.count({ where: { source: tool.slug } })
      usageData.push({ ...tool, todayUsage: count, totalUsage: totalCount })
    }

    res.json({ success: true, tools: usageData })
  } catch (err) {
    console.error('Get tools error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch tools' })
  }
}

export async function updateTool(req, res) {
  try {
    const { id } = req.params
    const { enabled, dailyLimit, hourlyLimit, requireEmail, requireName, requirePhone, requireCompany, showLeadPopup, name, description } = req.body

    const data = {}
    if (enabled !== undefined) data.enabled = enabled
    if (dailyLimit !== undefined) data.dailyLimit = parseInt(dailyLimit) || 100
    if (hourlyLimit !== undefined) data.hourlyLimit = parseInt(hourlyLimit) || 20
    if (requireEmail !== undefined) data.requireEmail = requireEmail
    if (requireName !== undefined) data.requireName = requireName
    if (requirePhone !== undefined) data.requirePhone = requirePhone
    if (requireCompany !== undefined) data.requireCompany = requireCompany
    if (showLeadPopup !== undefined) data.showLeadPopup = showLeadPopup
    if (req.body.formFields !== undefined) {
      // Store as JSON string — merge with existing fields if partial update
      const existing = await prisma.toolConfig.findUnique({ where: { id }, select: { formFields: true } })
      const prev = existing?.formFields ? JSON.parse(existing.formFields) : {}
      data.formFields = JSON.stringify({ ...prev, ...req.body.formFields })
    }
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description

    const tool = await prisma.toolConfig.update({ where: { id }, data })
    res.json({ success: true, tool })
  } catch (err) {
    console.error('Update tool error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to update tool' })
  }
}

// ─── Leads Management ────────────────────────────────────

export async function getLeads(req, res) {
  try {
    const { page = 1, limit = 20, source, search } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {}
    if (source) where.source = source
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true, name: true, email: true, company: true, website: true, phone: true,
          source: true, createdAt: true,
        },
      }),
      prisma.lead.count({ where }),
    ])

    res.json({
      success: true,
      leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (err) {
    console.error('Get leads error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch leads' })
  }
}

export async function deleteLead(req, res) {
  try {
    const { id } = req.params
    await prisma.lead.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete lead' })
  }
}

// ─── Seed Admin (run once) ──────────────────────────────

export async function seedAdmin(req, res) {
  try {
    const { email, password, name } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' })
    }

    const existing = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return res.json({ success: true, message: 'Admin already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const admin = await prisma.admin.create({
      data: { email: email.toLowerCase(), passwordHash, name: name || 'Admin' },
    })

    res.json({ success: true, message: 'Admin created', admin: { email: admin.email, name: admin.name } })
  } catch (err) {
    console.error('Seed admin error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to seed admin' })
  }
}

export async function getActivity(req, res) {
  try {
    const { page = 1, limit = 20, tool } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = Math.min(parseInt(limit), 50)

    // Fetch from all tool tables in parallel
    const toolQueries = {
      'content-analyzer': () => prisma.analysis.findMany({
        orderBy: { createdAt: 'desc' }, skip, take,
        select: { id: true, targetKeyword: true, contentType: true, overallScore: true, seoScore: true, createdAt: true },
      }),
      'seo-audit': () => prisma.audit.findMany({
        orderBy: { createdAt: 'desc' }, skip, take,
        select: { id: true, websiteUrl: true, overallScore: true, technicalScore: true, onPageScore: true, createdAt: true },
      }),
      'keyword-research': () => prisma.keywordResearch.findMany({
        orderBy: { createdAt: 'desc' }, skip, take,
        select: { id: true, seedKeyword: true, websiteUrl: true, businessType: true, country: true, createdAt: true },
      }),
      'blog-topic-generator': () => prisma.blogTopic.findMany({
        orderBy: { createdAt: 'desc' }, skip, take,
        select: { id: true, niche: true, contentGoal: true, contentType: true, createdAt: true },
      }),
      'logo-maker': () => prisma.generatedLogo.findMany({
        orderBy: { createdAt: 'desc' }, skip, take,
        select: { id: true, brandName: true, industry: true, style: true, primaryColor: true, createdAt: true },
      }),
      'seo-roi': () => prisma.rOICalculation.findMany({
        orderBy: { createdAt: 'desc' }, skip, take,
        select: { id: true, monthlySeoInvestment: true, currency: true, campaignMonths: true, createdAt: true },
      }),
      'content-qa': () => prisma.contentQA.findMany({
        orderBy: { createdAt: 'desc' }, skip, take,
        select: { id: true, title: true, targetKeyword: true, overallScore: true, createdAt: true },
      }),
    }

    let activity = []
    let total = 0

    if (tool && toolQueries[tool]) {
      // Single tool
      const [results, count] = await Promise.all([
        toolQueries[tool](),
        getToolCount(tool),
      ])
      activity = results.map(r => formatActivity(tool, r))
      total = count
    } else {
      // All tools — fetch and merge
      const [analyses, audits, keywords, blogs, logos, rois, contentQas, counts] = await Promise.all([
        prisma.analysis.findMany({ orderBy: { createdAt: 'desc' }, skip, take: take + 10, select: { id: true, targetKeyword: true, contentType: true, overallScore: true, seoScore: true, createdAt: true } }),
        prisma.audit.findMany({ orderBy: { createdAt: 'desc' }, skip, take: take + 10, select: { id: true, websiteUrl: true, overallScore: true, technicalScore: true, onPageScore: true, createdAt: true } }),
        prisma.keywordResearch.findMany({ orderBy: { createdAt: 'desc' }, skip, take: take + 10, select: { id: true, seedKeyword: true, websiteUrl: true, businessType: true, country: true, createdAt: true } }),
        prisma.blogTopic.findMany({ orderBy: { createdAt: 'desc' }, skip, take: take + 10, select: { id: true, niche: true, contentGoal: true, contentType: true, createdAt: true } }),
        prisma.generatedLogo.findMany({ orderBy: { createdAt: 'desc' }, skip, take: take + 10, select: { id: true, brandName: true, industry: true, style: true, primaryColor: true, createdAt: true } }),
        prisma.rOICalculation.findMany({ orderBy: { createdAt: 'desc' }, skip, take: take + 10, select: { id: true, monthlySeoInvestment: true, currency: true, campaignMonths: true, createdAt: true } }),
        prisma.contentQA.findMany({ orderBy: { createdAt: 'desc' }, skip, take: take + 10, select: { id: true, title: true, targetKeyword: true, overallScore: true, createdAt: true } }),
        Promise.all([
          prisma.analysis.count(), prisma.audit.count(), prisma.keywordResearch.count(),
          prisma.blogTopic.count(), prisma.generatedLogo.count(), prisma.rOICalculation.count(),
          prisma.contentQA.count(),
        ]),
      ])

      total = counts.reduce((a, b) => a + b, 0)

      activity = [
        ...analyses.map(r => formatActivity('content-analyzer', r)),
        ...audits.map(r => formatActivity('seo-audit', r)),
        ...keywords.map(r => formatActivity('keyword-research', r)),
        ...blogs.map(r => formatActivity('blog-topic-generator', r)),
        ...logos.map(r => formatActivity('logo-maker', r)),
        ...rois.map(r => formatActivity('seo-roi', r)),
        ...contentQas.map(r => formatActivity('content-qa', r)),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, take)
    }

    res.json({
      success: true,
      activity,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    })
  } catch (err) {
    console.error('Activity error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch activity' })
  }
}

async function getToolCount(tool) {
  const counts = {
    'content-analyzer': () => prisma.analysis.count(),
    'seo-audit': () => prisma.audit.count(),
    'keyword-research': () => prisma.keywordResearch.count(),
    'blog-topic-generator': () => prisma.blogTopic.count(),
    'logo-maker': () => prisma.generatedLogo.count(),
    'seo-roi': () => prisma.rOICalculation.count(),
    'content-qa': () => prisma.contentQA.count(),
  }
  return counts[tool] ? counts[tool]() : 0
}

function formatActivity(tool, record) {
  const toolNames = {
    'content-analyzer': 'Content Analyzer',
    'seo-audit': 'SEO Audit',
    'keyword-research': 'Keyword Research',
    'blog-topic-generator': 'Blog Topic Generator',
    'logo-maker': 'Logo Maker',
    'seo-roi': 'ROI Calculator',
    'content-qa': 'Content QA',
  }
  const base = { id: record.id, tool, toolName: toolNames[tool] || tool, createdAt: record.createdAt }

  switch (tool) {
    case 'content-analyzer':
      return { ...base, detail: record.targetKeyword || 'Untitled', score: record.overallScore, subdetail: record.contentType }
    case 'seo-audit':
      return { ...base, detail: record.websiteUrl, score: record.overallScore, subdetail: `Technical: ${record.technicalScore} | On-Page: ${record.onPageScore}` }
    case 'keyword-research':
      return { ...base, detail: record.seedKeyword, score: null, subdetail: [record.websiteUrl, record.businessType, record.country].filter(Boolean).join(' • ') }
    case 'blog-topic-generator':
      return { ...base, detail: record.niche, score: null, subdetail: [record.contentGoal, record.contentType].filter(Boolean).join(' • ') }
    case 'logo-maker':
      return { ...base, detail: record.brandName, score: null, subdetail: [record.industry, record.style, record.primaryColor].filter(Boolean).join(' • ') }
    case 'seo-roi':
      return { ...base, detail: `${record.currency} ${record.monthlySeoInvestment}/mo`, score: null, subdetail: `${record.campaignMonths} months campaign` }
    case 'content-qa':
      return { ...base, detail: record.title || record.targetKeyword || 'Untitled', score: record.overallScore, subdetail: null }
    default:
      return base
  }
}

function startOfDay() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
