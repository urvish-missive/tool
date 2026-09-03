import { Router } from 'express'
import { generateSitemap, validateSitemap } from '../controllers/sitemapController.js'

const router = Router()

router.post('/generate', generateSitemap)
router.post('/validate', validateSitemap)

export default router
