import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import portfolioRoutes from './routes/portfolio.js'
import projectRoutes from './routes/projects.js'
import proposalRoutes from './routes/proposals.js'
import clientRoutes from './routes/client.js'
import messageRoutes from './routes/messages.js'
import paymentRoutes from './routes/payments.js'
import communityRoutes from './routes/community.js'
import freelancerRoutes from './routes/freelancer.js'
import applicationRoutes from './routes/applications.js'
import verificationRoutes from './routes/verification.js'

export function createApp() {
  const app = express()

  // CORS configuration - allow localhost and all Vercel preview/production URLs
  const corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3001',
      ]
      
      // Allow any Vercel preview or production URL
      if (origin && origin.includes('vercel.app')) {
        callback(null, true)
      } else if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  }

  app.use(cors(corsOptions))
  app.use(express.json({ limit: '8mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'talentstage-api' })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/portfolio', portfolioRoutes)
  app.use('/api/projects', projectRoutes)
  app.use('/api/proposals', proposalRoutes)
  app.use('/api/client', clientRoutes)
  app.use('/api/messages', messageRoutes)
  app.use('/api/payments', paymentRoutes)
  app.use('/api/community', communityRoutes)
  app.use('/api/freelancer', freelancerRoutes)
  app.use('/api/applications', applicationRoutes)
  app.use('/api/verification', verificationRoutes)

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
  })

  return app
}
