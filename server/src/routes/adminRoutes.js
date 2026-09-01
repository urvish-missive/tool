import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import {
  login, createAdmin, getProfile, getStats,
  getTools, updateTool,
  getLeads, deleteLead,
  seedAdmin,
} from '../controllers/adminController.js'

const router = Router()

// Public (no auth)
router.post('/login', login)
router.post('/seed', seedAdmin)

// Protected (admin auth required)
router.get('/profile', adminAuth, getProfile)
router.post('/create', adminAuth, createAdmin)

// Dashboard
router.get('/stats', adminAuth, getStats)

// Tools management
router.get('/tools', adminAuth, getTools)
router.put('/tools/:id', adminAuth, updateTool)

// Leads management
router.get('/leads', adminAuth, getLeads)
router.delete('/leads/:id', adminAuth, deleteLead)

export default router
