import prisma from '../utils/prisma.js'
import { sendPdfEmail } from '../services/emailService.js'
import { sendStoredPdfForLead, shouldAutoSendForLead, LEAD_RESULT_FIELDS } from '../utils/pdfSendResultTypes.js'

export async function createLeadHandler(req, res) {
  try {
    const { name, email, company, website, phone, source, analysisId } = req.body

    const cleanEmail = email && typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : ''
    const emailVal = cleanEmail || (phone ? `${String(phone).replace(/\D/g, '')}@lead.local` : 'visitor@lead.local')
    const nameVal = (name && typeof name === 'string' && name.trim()) || (cleanEmail ? cleanEmail.split('@')[0] : 'Visitor')

    const data = {
      name: nameVal,
      email: emailVal,
      company: company?.trim() || null,
      website: website?.trim() || null,
      phone: phone?.trim() || null,
      source: source || 'unknown',
      analysisId: analysisId || null,
    }
    // Accept a linked result ID for any registered tool (content-qa,
    // seo-audit, faq-generator, etc.) — see utils/pdfSendResultTypes.js —
    // instead of hardcoding each tool's Lead field name here.
    for (const field of LEAD_RESULT_FIELDS) {
      if (req.body[field]) data[field] = req.body[field]
    }

    const lead = await prisma.lead.create({ data })

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

    // If this tool's PDF delivery mode is "automatic", send the already-
    // stored PDF report right away rather than waiting for an admin to send
    // it manually later. Non-fatal: lead capture already succeeded above
    // regardless of whether the send itself works. shouldAutoSendForLead
    // looks up the linked result type generically (see
    // utils/pdfSendResultTypes.js) rather than hardcoding one tool.
    shouldAutoSendForLead(lead)
      .then((shouldSend) => {
        if (shouldSend) return sendStoredPdfForLead(lead, 'automatic')
      })
      .catch((err) => console.warn('Automatic PDF send failed (non-fatal):', err.message))

    res.json({ success: true, leadId: lead.id })
  } catch (err) {
    console.error('Lead creation error:', err.message)
    res.status(500).json({ success: false, error: 'Could not save your information. Please try again.' })
  }
}

/**
 * Links an already-captured lead to a result generated afterward, then
 * re-checks automatic send. This exists for tools where the lead is
 * captured via the pre-use popup gate (LeadCaptureModal, showLeadPopup on
 * ToolConfig) BEFORE generation runs — createLeadHandler's automatic-send
 * check finds nothing at that moment because the result doesn't exist yet.
 * Once generation finishes and the result (with its stored PDF) exists,
 * the client calls this to attach it to that same lead, which is what
 * actually makes automatic send possible for those tools.
 */
export async function linkLeadToResultHandler(req, res) {
  try {
    const { id } = req.params

    const data = {}
    for (const field of LEAD_RESULT_FIELDS) {
      if (req.body[field]) data[field] = req.body[field]
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, error: 'No result ID provided to link.' })
    }

    const lead = await prisma.lead.update({ where: { id }, data })

    shouldAutoSendForLead(lead)
      .then((shouldSend) => {
        if (shouldSend) return sendStoredPdfForLead(lead, 'automatic')
      })
      .catch((err) => console.warn('Automatic PDF send failed (non-fatal):', err.message))

    res.json({ success: true })
  } catch (err) {
    console.error('linkLeadToResultHandler error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to link result to lead.' })
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
      blogConclusionId,
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
        blogConclusionId: blogConclusionId || null,
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

