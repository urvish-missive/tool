import { Router } from 'express'
import { storeResultPdfHandler } from '../controllers/resultPdfController.js'

const router = Router()

// POST /api/results/:model/:id/store-pdf
router.post('/:model/:id/store-pdf', storeResultPdfHandler)

export default router
