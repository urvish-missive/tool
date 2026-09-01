import prisma from '../utils/prisma.js'

export async function createLeadHandler(req, res) {
  try {
    const { name, email, company, website, phone, source, analysisId, auditId, researchId, blogTopicId } = req.body

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' })
    }

    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
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
