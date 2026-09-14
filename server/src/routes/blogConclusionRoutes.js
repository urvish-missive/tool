import { Router } from 'express'
import {
  generateBlogConclusionsHandler,
  storeBlogConclusionPdfHandler,
} from '../controllers/blogConclusionController.js'

const router = Router()

// POST /api/blog-conclusion/generate — Generate multiple high-converting blog conclusions
router.post('/generate', generateBlogConclusionsHandler)
router.post('/:id/store-pdf', storeBlogConclusionPdfHandler)

export default router
