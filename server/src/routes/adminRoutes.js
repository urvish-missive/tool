import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { adminAuth } from '../middleware/adminAuth.js'
import {
  login, getProfile, getStats,
  getTools, updateTool,
  getLeads, deleteLead, sendLeadPdf, getLeadPdf, downloadLeadPdfFile,
  getClients, getClientActivity,
  getActivity, getResultPdf,
  getDevices, resetDeviceLimit, setDeviceCustomLimit, toggleBlockDevice, deleteDevice,
} from '../controllers/adminController.js'

const router = Router()

// PIN guessing protection: 5 wrong PINs per IP per 15 minutes (correct PINs are not counted)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many wrong PINs. Try again in 15 minutes.' },
})

// Public (no auth)
router.post('/login', loginLimiter, login)

// Protected (admin auth required)
router.get('/profile', adminAuth, getProfile)

// Dashboard
router.get('/stats', adminAuth, getStats)

// Tools management
router.get('/tools', adminAuth, getTools)
router.put('/tools/:id', adminAuth, updateTool)

// Device limits management
router.get('/devices', adminAuth, getDevices)
router.post('/devices/:id/reset', adminAuth, resetDeviceLimit)
router.patch('/devices/:id/limit', adminAuth, setDeviceCustomLimit)
router.post('/devices/:id/block', adminAuth, toggleBlockDevice)
router.delete('/devices/:id', adminAuth, deleteDevice)

// Activity
router.get('/activity', adminAuth, getActivity)
router.get('/results/:tool/:id/pdf', adminAuth, getResultPdf)

// Leads management
router.get('/leads', adminAuth, getLeads)
router.delete('/leads/:id', adminAuth, deleteLead)
router.post('/leads/:id/send-pdf', adminAuth, sendLeadPdf)
router.get('/leads/:id/pdf', adminAuth, getLeadPdf)
router.get('/leads/:id/download-pdf', adminAuth, downloadLeadPdfFile)

// Clients management (leads deduplicated by email)
router.get('/clients', adminAuth, getClients)
router.get('/clients/:email/activity', adminAuth, getClientActivity)

export default router

