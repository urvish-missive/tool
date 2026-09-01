import { Router } from 'express'
import { createResearch, getResearch } from '../controllers/keywordController.js'

const router = Router()

router.post('/research', createResearch)
router.get('/:id', getResearch)

export default router
