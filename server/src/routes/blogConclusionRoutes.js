import { Router } from 'express'
import { generateBlogConclusionsHandler } from '../controllers/blogConclusionController.js'

const router = Router()

// POST /api/blog-conclusion/generate — Generate multiple high-converting blog conclusions
router.post('/generate', generateBlogConclusionsHandler)

export default router
