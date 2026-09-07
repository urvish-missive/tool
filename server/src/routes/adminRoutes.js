import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import {
  login, getProfile, getStats,
  getTools, updateTool,
  getLeads, deleteLead,
  getActivity,
  getDevices, resetDeviceLimit, setDeviceCustomLimit, toggleBlockDevice, deleteDevice,
} from '../controllers/adminController.js'

const router = Router()

// Public (no auth)
router.post('/login', login)

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

// Leads management
router.get('/leads', adminAuth, getLeads)
router.delete('/leads/:id', adminAuth, deleteLead)

export default router

