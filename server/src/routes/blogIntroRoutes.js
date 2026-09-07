import { Router } from 'express'
import { generateBlogIntrosHandler } from '../controllers/blogIntroController.js'

const router = Router()

// POST /api/blog-intros/generate — Generate multiple blog introductions across TOFU, MOFU, BOFU
router.post('/generate', generateBlogIntrosHandler)

export default router
