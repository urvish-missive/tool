import { Router } from 'express'
import {
  generateContentHandler,
  rewriteContentHandler,
  generateMetaTagsHandler,
  getContentHandler,
} from '../controllers/contentWriterController.js'

const router = Router()

// POST /api/content-writer/generate — Generate SEO content
router.post('/generate', generateContentHandler)

// POST /api/content-writer/rewrite — Rewrite/improve existing content
router.post('/rewrite', rewriteContentHandler)

// POST /api/content-writer/meta-tags — Generate meta tags
router.post('/meta-tags', generateMetaTagsHandler)

// GET /api/content-writer/:id — Get saved content
router.get('/:id', getContentHandler)

export default router
