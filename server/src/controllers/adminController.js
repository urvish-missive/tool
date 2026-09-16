import prisma from '../utils/prisma.js'
import bcrypt from 'bcryptjs'
import { signAdminToken } from '../middleware/adminAuth.js'
import {
  sendStoredPdfForLead,
  getStoredPdfForLead,
  getStoredPdfForResult,
  LEAD_RESULT_FIELDS,
} from '../utils/pdfSendResultTypes.js'

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

    if (admin.isActive === false) {
      return res.status(403).json({ success: false, error: 'Account has been disabled' })
    }

    const token = signAdminToken(admin)
    res.json({ success: true, token, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role, isActive: admin.isActive !== false } })
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
      data: { email: email.toLowerCase(), passwordHash, name, isActive: true },
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
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
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
    const [recentAnalyses, recentAudits, recentKeywords, recentBlogs, recentLogos, recentRois, recentSitemaps] = await Promise.all([
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
      prisma.sitemapGeneration.findMany({ orderBy: { createdAt: 'desc' }, take: 10,
        select: { id: true, websiteUrl: true, totalUrls: true, createdAt: true } }).catch(() => []),
    ])

    const recentActivity = [
      ...recentAnalyses.map(a => ({ tool: 'Content Analyzer', detail: a.targetKeyword || 'Untitled', score: a.overallScore, createdAt: a.createdAt, id: a.id })),
      ...recentAudits.map(a => ({ tool: 'SEO Audit', detail: a.websiteUrl, score: a.overallScore, createdAt: a.createdAt, id: a.id })),
      ...recentKeywords.map(k => ({ tool: 'Keyword Research', detail: k.seedKeyword, website: k.websiteUrl, createdAt: k.createdAt, id: k.id })),
      ...recentBlogs.map(b => ({ tool: 'Blog Topic Generator', detail: b.niche, goal: b.contentGoal, createdAt: b.createdAt, id: b.id })),
      ...recentLogos.map(l => ({ tool: 'Logo Maker', detail: l.brandName, industry: l.industry, createdAt: l.createdAt, id: l.id })),
      ...recentRois.map(r => ({ tool: 'ROI Calculator', detail: `${r.currency} ${r.monthlySeoInvestment}/mo investment`, createdAt: r.createdAt, id: r.id })),
      ...((recentSitemaps || []).map(s => ({ tool: 'XML Sitemap Generator', detail: s.websiteUrl || 'Direct Generation', score: null, createdAt: s.createdAt, id: s.id }))),
      ...((await prisma.rankCheck?.findMany?.({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, domain: true, keyword: true, position: true, createdAt: true } }).catch(() => [])) || []).map(r => ({ tool: 'Google Rank Checker', detail: `${r.domain} ("${r.keyword}")`, score: r.position ? `#${r.position}` : 'N/A', createdAt: r.createdAt, id: r.id })),
      ...((await prisma.extractedWebsite?.findMany?.({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, websiteUrl: true, title: true, wordCount: true, createdAt: true } }).catch(() => [])) || []).map(e => ({ tool: 'Website Extractor', detail: e.websiteUrl, score: null, subdetail: `${e.wordCount || 0} words extracted`, createdAt: e.createdAt, id: e.id })),
      ...((await prisma.extractedImageProject?.findMany?.({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, websiteUrl: true, totalImages: true, createdAt: true } }).catch(() => [])) || []).map(img => ({ tool: 'Image Extractor', detail: img.websiteUrl, score: null, subdetail: `${img.totalImages || 0} images discovered`, createdAt: img.createdAt, id: img.id })),
      ...((await prisma.extractedTechProject?.findMany?.({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, websiteUrl: true, hostname: true, createdAt: true } }).catch(() => [])) || []).map(t => ({ tool: 'Tech & Theme Inspector', detail: t.websiteUrl, score: null, subdetail: t.hostname || 'Inspected', createdAt: t.createdAt, id: t.id })),
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
    if (req.body.pdfSendMode !== undefined) {
      data.pdfSendMode = req.body.pdfSendMode === 'automatic' ? 'automatic' : 'manual'
    }
    if (req.body.deviceLimit !== undefined) {
      data.deviceLimit = Math.max(0, parseInt(req.body.deviceLimit) || 0)
    }

    if (req.body.formFields !== undefined) {
      // Store as JSON string — merge with existing fields if partial update
      const existing = await prisma.toolConfig.findUnique({ where: { id }, select: { formFields: true } })
      const prev = existing?.formFields ? JSON.parse(existing.formFields) : {}
      data.formFields = JSON.stringify({ ...prev, ...req.body.formFields })
    }
    if (req.body.popupFields !== undefined) {
      if (typeof req.body.popupFields === 'string') {
        data.popupFields = req.body.popupFields
      } else {
        const existing = await prisma.toolConfig.findUnique({ where: { id }, select: { popupFields: true } })
        let prev = {}
        try {
          if (existing?.popupFields) prev = JSON.parse(existing.popupFields)
        } catch {}
        data.popupFields = JSON.stringify({ ...prev, ...req.body.popupFields })
      }
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
          pdfSendStatus: true, pdfSentAt: true, pdfSendError: true, pdfSendTriggeredBy: true,
          ...Object.fromEntries(LEAD_RESULT_FIELDS.map((field) => [field, true])),
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

/**
 * Unique clients, deduplicated by email, aggregated from Lead records —
 * one row per person instead of one row per tool submission (that's what
 * /admin/leads already shows). Leads are fetched newest-first and folded in
 * application code (capped at 5000 rows) rather than via a MongoDB
 * aggregation pipeline: Prisma's groupBy can't pick "this group's most
 * recent name/company/phone" in one query, and at this app's realistic
 * lead volume a plain fetch-and-fold is simpler and correct.
 */
export async function getClients(req, res) {
  try {
    const { page = 1, limit = 20, search } = req.query

    const where = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ]
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000,
      select: {
        name: true, email: true, company: true, phone: true, website: true,
        source: true, createdAt: true,
      },
    })

    const byEmail = new Map()
    for (const lead of leads) {
      const key = lead.email.toLowerCase()
      const existing = byEmail.get(key)
      if (!existing) {
        // Leads are sorted newest-first, so the first row seen for an email
        // is already its most recent submission — keep those field values.
        byEmail.set(key, {
          email: lead.email,
          name: lead.name,
          company: lead.company,
          phone: lead.phone,
          website: lead.website,
          sources: new Set(lead.source ? [lead.source] : []),
          submissions: 1,
          firstSeen: lead.createdAt,
          lastSeen: lead.createdAt,
        })
      } else {
        existing.submissions += 1
        if (lead.source) existing.sources.add(lead.source)
        if (lead.createdAt < existing.firstSeen) existing.firstSeen = lead.createdAt
      }
    }

    const allClients = Array.from(byEmail.values()).map((c) => ({ ...c, sources: Array.from(c.sources) }))
    const total = allClients.length
    const start = (parseInt(page) - 1) * parseInt(limit)
    const clients = allClients.slice(start, start + parseInt(limit))

    res.json({
      success: true,
      clients,
      stats: { totalClients: total },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)) || 1,
      },
    })
  } catch (err) {
    console.error('Get clients error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch clients' })
  }
}

/**
 * One client's submission history (which tools, when) — their "log".
 */
export async function getClientActivity(req, res) {
  try {
    const { email } = req.params
    const leads = await prisma.lead.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, source: true, createdAt: true, pdfSendStatus: true },
    })
    res.json({ success: true, activity: leads })
  } catch (err) {
    console.error('Get client activity error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch client activity' })
  }
}

/**
 * Manually send the PDF report already stored for this lead's linked result
 * (see the automatic-send path in leadController.js for the same logic used
 * right after lead capture). Reads the previously-generated PDF from the
 * result record — e.g. ContentQA.pdfBase64 — rather than requiring a live
 * browser session, so this works for a lead captured at any point in the past.
 */
export async function sendLeadPdf(req, res) {
  try {
    const { id } = req.params
    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found.' })
    }

    const result = await sendStoredPdfForLead(lead, 'manual')
    if (!result.success) {
      return res.status(result.status === 'failed' ? 502 : 400).json(result)
    }
    return res.json(result)
  } catch (err) {
    console.error('sendLeadPdf error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to send PDF report.' })
  }
}

/**
 * Return stored PDF base64 + filename for direct browser download by admin
 */
export async function getLeadPdf(req, res) {
  try {
    const { id } = req.params
    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found.' })
    }

    const result = await getStoredPdfForLead(lead)
    if (!result.success) {
      return res.status(404).json(result)
    }

    return res.json(result)
  } catch (err) {
    console.error('getLeadPdf error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to retrieve PDF report.' })
  }
}

/**
 * Download raw PDF file directly via HTTP attachment
 */
export async function downloadLeadPdfFile(req, res) {
  try {
    const { id } = req.params
    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) {
      return res.status(404).send('Lead not found.')
    }

    const result = await getStoredPdfForLead(lead)
    if (!result.success) {
      return res.status(404).send(result.error)
    }

    const buffer = Buffer.from(result.pdfBase64, 'base64')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.setHeader('Content-Length', buffer.length)
    return res.send(buffer)
  } catch (err) {
    console.error('downloadLeadPdfFile error:', err.message)
    res.status(500).send('Failed to download PDF.')
  }
}

/**
 * Return stored PDF for an arbitrary tool activity result
 */
export async function getResultPdf(req, res) {
  try {
    const { tool, id } = req.params
    const result = await getStoredPdfForResult(tool, id)
    if (!result.success) {
      return res.status(404).json(result)
    }
    return res.json(result)
  } catch (err) {
    console.error('getResultPdf error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to retrieve PDF.' })
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
      data: { email: email.toLowerCase(), passwordHash, name: name || 'Admin', isActive: true },
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
      'website-content-extractor': () => prisma.extractedWebsite.findMany({
        orderBy: { createdAt: 'desc' }, skip, take,
        select: { id: true, websiteUrl: true, title: true, wordCount: true, createdAt: true },
      }),
      'website-image-extractor': () => prisma.extractedImageProject.findMany({
        orderBy: { createdAt: 'desc' }, skip, take,
        select: { id: true, websiteUrl: true, totalImages: true, createdAt: true },
      }),
      'website-tech-inspector': () => prisma.extractedTechProject.findMany({
        orderBy: { createdAt: 'desc' }, skip, take,
        select: { id: true, websiteUrl: true, hostname: true, createdAt: true },
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
    'xml-sitemap-generator': () => prisma.sitemapGeneration.count().catch(() => 0),
    'google-rank-checker': () => prisma.rankCheck?.count?.().catch(() => 0) || 0,
    'website-content-extractor': () => prisma.extractedWebsite?.count?.().catch(() => 0) || 0,
    'website-image-extractor': () => prisma.extractedImageProject?.count?.().catch(() => 0) || 0,
    'website-tech-inspector': () => prisma.extractedTechProject?.count?.().catch(() => 0) || 0,
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
    'xml-sitemap-generator': 'XML Sitemap Generator',
    'google-rank-checker': 'Google Rank Checker',
    'website-content-extractor': 'Website Content Extractor',
    'website-image-extractor': 'Website Image Extractor',
    'website-tech-inspector': 'Tech & Theme Inspector',
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
    case 'xml-sitemap-generator':
      return { ...base, detail: record.websiteUrl || 'Direct Generation', score: null, subdetail: `${record.totalUrls || 0} URLs generated` }
    case 'google-rank-checker':
      return { ...base, detail: `${record.domain} ("${record.keyword}")`, score: record.position ? `#${record.position}` : 'N/A', subdetail: `${record.country || 'US'} (${record.device || 'desktop'})` }
    case 'website-content-extractor':
      return { ...base, detail: record.websiteUrl, score: null, subdetail: record.title || `${record.wordCount || 0} words extracted` }
    case 'website-image-extractor':
      return { ...base, detail: record.websiteUrl, score: null, subdetail: `${record.totalImages || 0} images discovered` }
    case 'website-tech-inspector':
      return { ...base, detail: record.websiteUrl, score: null, subdetail: record.hostname || 'Tech & Theme Inspected' }
    default:
      return base
  }
}

function startOfDay() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── Device Limit Management ─────────────────────────────

export async function getDevices(req, res) {
  try {
    const { search, tool, status, page = 1, limit = 50 } = req.query
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)
    const take = Math.min(Math.max(1, parseInt(limit)), 100)

    const where = {}

    // Tool filter
    if (tool && tool !== 'all') {
      where.toolSlug = tool
    }

    // Status filter (database level)
    if (status === 'blocked') {
      where.isBlocked = true
    }

    // Search by email, deviceId, IP
    if (search && search.trim()) {
      const q = search.trim()
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { deviceId: { contains: q, mode: 'insensitive' } },
        { ip: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [devices, total, toolConfigs] = await Promise.all([
      prisma.deviceUsage.findMany({
        where,
        orderBy: { lastUsedAt: 'desc' },
        skip,
        take,
      }),
      prisma.deviceUsage.count({ where }),
      prisma.toolConfig.findMany({ select: { slug: true, name: true, deviceLimit: true } }),
    ])

    const toolMap = {}
    toolConfigs.forEach(t => { toolMap[t.slug] = t })

    const enrichedDevices = devices.map(d => {
      const toolCfg = toolMap[d.toolSlug]
      const defaultLimit = toolCfg?.deviceLimit ?? 3
      const effectiveLimit = d.customLimit !== null && d.customLimit !== undefined
        ? d.customLimit
        : defaultLimit
      const isLimitReached = effectiveLimit > 0 && d.usageCount >= effectiveLimit

      return {
        ...d,
        toolName: toolCfg?.name || d.toolSlug,
        defaultLimit,
        effectiveLimit,
        isLimitReached,
      }
    })

    let filteredList = enrichedDevices
    if (status === 'limit_reached') {
      filteredList = enrichedDevices.filter(d => d.isLimitReached && !d.isBlocked)
    } else if (status === 'active') {
      filteredList = enrichedDevices.filter(d => !d.isLimitReached && !d.isBlocked)
    }

    const [totalDevicesCount, blockedCount, devicesWithEmail] = await Promise.all([
      prisma.deviceUsage.count(),
      prisma.deviceUsage.count({ where: { isBlocked: true } }),
      prisma.deviceUsage.count({ where: { email: { not: null } } }),
    ])

    res.json({
      success: true,
      devices: filteredList,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
      stats: {
        totalDevices: totalDevicesCount,
        blockedDevices: blockedCount,
        devicesWithEmail,
      },
    })
  } catch (err) {
    console.error('Get devices error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch devices' })
  }
}

export async function resetDeviceLimit(req, res) {
  try {
    const { id } = req.params
    const updated = await prisma.deviceUsage.update({
      where: { id },
      data: { usageCount: 0, lastUsedAt: new Date() },
    })
    res.json({ success: true, message: 'Device limit reset successfully', device: updated })
  } catch (err) {
    console.error('Reset device limit error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to reset device limit' })
  }
}

export async function setDeviceCustomLimit(req, res) {
  try {
    const { id } = req.params
    const { customLimit } = req.body
    const limitVal = customLimit === null || customLimit === undefined || customLimit === ''
      ? null
      : Math.max(0, parseInt(customLimit))

    const updated = await prisma.deviceUsage.update({
      where: { id },
      data: { customLimit: limitVal },
    })
    res.json({ success: true, message: 'Device custom limit updated', device: updated })
  } catch (err) {
    console.error('Set custom limit error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to update custom limit' })
  }
}

export async function toggleBlockDevice(req, res) {
  try {
    const { id } = req.params
    const current = await prisma.deviceUsage.findUnique({ where: { id } })
    if (!current) return res.status(404).json({ success: false, error: 'Device not found' })

    const updated = await prisma.deviceUsage.update({
      where: { id },
      data: { isBlocked: !current.isBlocked },
    })
    res.json({
      success: true,
      message: updated.isBlocked ? 'Device blocked' : 'Device unblocked',
      device: updated,
    })
  } catch (err) {
    console.error('Toggle block error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to update device status' })
  }
}

export async function deleteDevice(req, res) {
  try {
    const { id } = req.params
    await prisma.deviceUsage.delete({ where: { id } })
    res.json({ success: true, message: 'Device record deleted' })
  } catch (err) {
    console.error('Delete device error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to delete device' })
  }
}

