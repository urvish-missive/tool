import prisma from '../utils/prisma.js'
import { sendPdfEmail } from '../services/emailService.js'

export async function createLeadHandler(req, res) {
  try {
    const { name, email, company, website, phone, source, analysisId, auditId, researchId, blogTopicId, contentQaId } = req.body

    const cleanEmail = email && typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : ''
    const emailVal = cleanEmail || (phone ? `${String(phone).replace(/\D/g, '')}@lead.local` : 'visitor@lead.local')
    const nameVal = (name && typeof name === 'string' && name.trim()) || (cleanEmail ? cleanEmail.split('@')[0] : 'Visitor')

    const lead = await prisma.lead.create({
      data: {
        name: nameVal,
        email: emailVal,
        company: company?.trim() || null,
        website: website?.trim() || null,
        phone: phone?.trim() || null,
        source: source || 'unknown',
        analysisId: analysisId || null,
        auditId: auditId || null,
        researchId: researchId || null,
        blogTopicId: blogTopicId || null,
        contentQaId: contentQaId || null,
      },
    })

    // Link device with email if deviceId present
    const deviceId = req.headers['x-device-id'] || req.body?.deviceId
    if (deviceId) {
      try {
        await prisma.deviceUsage.updateMany({
          where: { deviceId },
          data: { email: emailVal },
        })
      } catch (devErr) {
        console.warn('Could not link device to email:', devErr.message)
      }
    }

    res.json({ success: true, leadId: lead.id })
  } catch (err) {
    console.error('Lead creation error:', err.message)
    res.status(500).json({ success: false, error: 'Could not save your information. Please try again.' })
  }
}

/**
 * Handle sending PDF reports to user email while capturing lead information everywhere
 */
export async function sendPdfReportHandler(req, res) {
  try {
    const {
      name,
      email,
      company,
      website,
      phone,
      source = 'pdf-report',
      auditId,
      contentQaId,
      analysisId,
      researchId,
      pdfBase64,
      filename,
      reportTitle,
    } = req.body

    const cleanEmail = email && typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : ''
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required to receive the PDF report.',
      })
    }

    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'PDF report content is missing.',
      })
    }

    const nameVal = (name && typeof name === 'string' && name.trim()) || cleanEmail.split('@')[0] || 'Visitor'

    // 1. Capture the lead in MongoDB
    const lead = await prisma.lead.create({
      data: {
        name: nameVal,
        email: cleanEmail,
        company: company?.trim() || null,
        website: website?.trim() || null,
        phone: phone?.trim() || null,
        source: source || 'pdf-download',
        auditId: auditId || null,
        contentQaId: contentQaId || null,
        analysisId: analysisId || null,
        researchId: researchId || null,
      },
    })

    // 2. Link device with email if deviceId present
    const deviceId = req.headers['x-device-id'] || req.body?.deviceId
    if (deviceId) {
      try {
        await prisma.deviceUsage.updateMany({
          where: { deviceId },
          data: { email: cleanEmail },
        })
      } catch (devErr) {
        console.warn('Could not link device to email:', devErr.message)
      }
    }

    // 3. Convert base64 to Buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64')

    // 4. Send email with PDF attachment
    const emailResult = await sendPdfEmail({
      to: cleanEmail,
      name: nameVal,
      reportTitle: reportTitle || 'Your Report',
      pdfBuffer,
      filename: filename || `missive-report-${Date.now()}.pdf`,
    })

    return res.json({
      success: true,
      message: `PDF report sent to ${cleanEmail}!`,
      leadId: lead.id,
      simulated: emailResult.simulated,
    })
  } catch (err) {
    console.error('sendPdfReportHandler error:', err.message)
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to process and send PDF report. Please try again.',
    })
  }
}

// Get all leads (for admin)
export async function getLeadsHandler(req, res) {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ success: true, leads })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch leads' })
  }
}

