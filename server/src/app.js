import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import contentRoutes from './routes/contentRoutes.js'
import leadRoutes from './routes/leadRoutes.js'
import auditRoutes from './routes/auditRoutes.js'
import keywordRoutes from './routes/keywordRoutes.js'
import roiRoutes from './routes/roiRoutes.js'
import prisma from './utils/prisma.js'

const app = express()
const PORT = process.env.PORT || 5000

// Security
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))

// Body parsing with size limit
app.use(express.json({ limit: '1mb' }))

// Global rate limit
app.use('/api', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
}))

// Routes
app.use('/api/content', contentRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/audit', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "You've reached the current audit limit. Please try again later." },
}), auditRoutes)
app.use('/api/keywords', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit exceeded. Please try again later.' },}), keywordRoutes)
app.use('/api/seo-roi', roiRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' })
})

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Server error:', err.message)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

async function start() {
  // Test database connection
  try {
    await prisma.$connect()
    console.log('✓ Database connected successfully')
  } catch (err) {
    console.error('✗ Database connection failed:', err.message)
    console.error('  Check your DATABASE_URL in server/.env')
  }

  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`)
    console.log(`  API: http://localhost:${PORT}/api/health`)
  })
}

start()
