import { Router } from 'express'
import { createLeadHandler } from '../controllers/leadController.js'
import { validateLead } from '../middleware/validate.js'

const router = Router()

router.post('/', validateLead, createLeadHandler)

export default router
