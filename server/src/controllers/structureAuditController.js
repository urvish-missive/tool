import { performWebsiteStructureAudit } from '../services/structureAudit/structureAuditService.js'
import prisma from '../utils/prisma.js'

export async function analyzeWebsiteStructure(req, res) {
  try {
    const { websiteUrl, focusNiche, leadId } = req.body

    if (!websiteUrl || typeof websiteUrl !== 'string' || !websiteUrl.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid website URL to audit.',
      })
    }

    // Perform full-depth crawl and AI architecture audit
    const result = await performWebsiteStructureAudit({
      websiteUrl: websiteUrl.trim(),
      focusNiche: focusNiche ? focusNiche.trim() : null,
    })

    // Persist to database (best effort)
    let recordId = null
    try {
      if (prisma?.websiteStructureAudit?.create) {
        const record = await prisma.websiteStructureAudit.create({
          data: {
            websiteUrl: result.websiteUrl,
            focusNiche: result.focusNiche,
            overallScore: result.overallScore,
            totalPages: result.totalPages,
            maxDepth: result.maxDepth,
            summaryJson: JSON.stringify(result.summary),
            inventoryJson: JSON.stringify(result.currentInventory),
            redirectMapJson: JSON.stringify(result.redirectMap),
            recommendedStructureJson: JSON.stringify(result.recommendedStructure),
            pagesToCreateJson: JSON.stringify(result.pagesToCreate),
          },
        })
        recordId = record?.id || null

        // Link with lead if provided
        if (leadId && recordId && prisma?.lead?.update) {
          await prisma.lead
            .update({
              where: { id: leadId },
              data: { websiteStructureAuditId: recordId },
            })
            .catch(() => {})
        }
      }
    } catch (dbErr) {
      console.warn('[StructureAudit] DB persistence skipped:', dbErr.message)
    }

    return res.status(200).json({
      success: true,
      data: {
        id: recordId || 'audit-' + Date.now(),
        websiteUrl: result.websiteUrl,
        domain: result.domain,
        focusNiche: result.focusNiche,
        overallScore: result.overallScore,
        architectureGrade: result.architectureGrade,
        totalPages: result.totalPages,
        maxDepth: result.maxDepth,
        homepageTitle: result.homepageTitle,
        summary: result.summary,
        currentInventory: result.currentInventory,
        redirectMap: result.redirectMap,
        recommendedStructure: result.recommendedStructure,
        pagesToCreate: result.pagesToCreate,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[StructureAudit] Error:', err)
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to complete website structure audit. Please try again.',
    })
  }
}

export async function getStructureAuditById(req, res) {
  try {
    const { id } = req.params
    if (!prisma?.websiteStructureAudit?.findUnique) {
      return res.status(404).json({ success: false, error: 'Audit not found' })
    }

    const audit = await prisma.websiteStructureAudit.findUnique({
      where: { id },
      include: { leads: true },
    })

    if (!audit) {
      return res.status(404).json({ success: false, error: 'Audit not found' })
    }

    return res.json({
      success: true,
      data: {
        id: audit.id,
        websiteUrl: audit.websiteUrl,
        focusNiche: audit.focusNiche,
        overallScore: audit.overallScore,
        totalPages: audit.totalPages,
        maxDepth: audit.maxDepth,
        summary: JSON.parse(audit.summaryJson || '{}'),
        currentInventory: JSON.parse(audit.inventoryJson || '[]'),
        redirectMap: JSON.parse(audit.redirectMapJson || '[]'),
        recommendedStructure: JSON.parse(audit.recommendedStructureJson || '[]'),
        pagesToCreate: JSON.parse(audit.pagesToCreateJson || '[]'),
        createdAt: audit.createdAt,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
