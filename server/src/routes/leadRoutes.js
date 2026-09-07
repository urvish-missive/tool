import { Router } from 'express'
import { createLeadHandler, sendPdfReportHandler } from '../controllers/leadController.js'
import { validateLead } from '../middleware/validate.js'

const router = Router()

router.post('/', validateLead, createLeadHandler)
router.post('/send-pdf', sendPdfReportHandler)

export default router
