import prisma from '../utils/prisma.js'

export async function createLeadHandler(req, res) {
  try {
    const { name, email, company, website, phone, analysisId } = req.body

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        company: company || null,
        website: website || null,
        phone: phone || null,
        source: 'content-analyzer',
        analysisId: analysisId || null,
      },
    })

    res.json({ success: true, leadId: lead.id })
  } catch (err) {
    console.error('Lead creation error:', err.message)
    res.status(500).json({ success: false, error: 'Could not save your information. Please try again.' })
  }
}
