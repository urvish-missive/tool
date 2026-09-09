import { Router } from 'express'
import {
  generateTopicsHandler,
  generateClustersHandler,
  generateCalendarHandler,
  generateMasterBriefHandler,
  getTopicsHandler,
} from '../controllers/blogTopicController.js'

const router = Router()

// POST /api/blog-topics/generate: Generate blog topics
router.post('/generate', generateTopicsHandler)

// POST /api/blog-topics/clusters: Generate topic clusters
router.post('/clusters', generateClustersHandler)

// POST /api/blog-topics/calendar: Generate content calendar
router.post('/calendar', generateCalendarHandler)

// POST /api/blog-topics/master-brief: Generate 2,500-word master article brief
router.post('/master-brief', generateMasterBriefHandler)

// GET /api/blog-topics/:id: Get saved topics
router.get('/:id', getTopicsHandler)

export default router