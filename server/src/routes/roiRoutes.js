import { Router } from 'express'
import { calculateROIHandler } from '../controllers/roiController.js'

const router = Router()

router.post('/calculate', calculateROIHandler)

export default router
