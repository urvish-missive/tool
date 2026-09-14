import { Router } from 'express'
import {
  createLeadHandler,
  sendPdfReportHandler,
  linkLeadToResultHandler,
} from '../controllers/leadController.js'
import { validateLead } from '../middleware/validate.js'

const router = Router()

router.post('/', validateLead, createLeadHandler)
router.post('/send-pdf', sendPdfReportHandler)
router.patch('/:id/link-result', linkLeadToResultHandler)

export default router
