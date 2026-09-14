import prisma from '../utils/prisma.js'
import { PDF_STORABLE_MODELS } from '../utils/pdfSendResultTypes.js'

/**
 * Generic "store the client-generated PDF on this result" handler, shared
 * by every tool wired into the PDF send pipeline (see
 * utils/pdfSendResultTypes.js) instead of one bespoke controller function
 * per tool. :model must be a whitelisted Prisma model name from the
 * registry, so this can never write to an unrelated collection.
 */
export async function storeResultPdfHandler(req, res) {
  try {
    const { model, id } = req.params
    const { pdfBase64 } = req.body

    if (!PDF_STORABLE_MODELS.has(model)) {
      return res.status(400).json({ success: false, error: 'Unknown result type.' })
    }
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return res.status(400).json({ success: false, error: 'PDF content is missing.' })
    }

    await prisma[model].update({ where: { id }, data: { pdfBase64 } })
    res.json({ success: true })
  } catch (err) {
    console.error('storeResultPdfHandler error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to store PDF report.' })
  }
}
