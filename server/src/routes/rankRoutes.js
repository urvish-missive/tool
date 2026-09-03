import { Router } from 'express'
import { checkGoogleRank } from '../controllers/rankController.js'

const router = Router()

router.post('/check', checkGoogleRank)

export default router
