import prisma from '../utils/prisma.js'

export async function createLeadHandler(req, res) {
  try {
    const { name, email, company, website, phone, source, analysisId, auditId, researchId, blogTopicId } = req.body

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
