import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { parseJson, stringifyJson } from '../lib/json.js'
import { authRequired, loadUser, requireRole } from '../middleware/auth.js'
import { syncFreelancerIdentity } from '../lib/freelancerDisplay.js'

const router = Router()

const defaultPortfolio = {
  name: '',
  title: '',
  bio: '',
  skills: [],
  education: [],
  experience: [],
  projects: [],
  posts: [],
  certifications: [],
  interests: [],
  completion: 0,
  aiScore: null,
  aiSuggestions: [],
}

router.get('/', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    let row = await prisma.portfolio.findUnique({ where: { userId: req.userId } })
    if (!row) {
      row = await prisma.portfolio.create({
        data: {
          userId: req.userId,
          data: stringifyJson({ ...defaultPortfolio, name: req.user.name }),
        },
      })
    }
    const data = parseJson(row.data, defaultPortfolio)
    if (data.name?.trim() && data.name.trim() !== req.user.name) {
      await syncFreelancerIdentity(req.userId, { name: data.name, title: data.title })
    }
    res.json({ portfolio: { ...data, aiScore: row.aiScore ?? data.aiScore } })
  } catch (err) {
    next(err)
  }
})

router.put('/', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const { portfolio, aiScore } = req.body
    if (!portfolio) return res.status(400).json({ error: 'Portfolio data required' })

    const { profilePhoto: _photo, ...portfolioData } = portfolio

    const row = await prisma.portfolio.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId,
        data: stringifyJson(portfolioData),
        aiScore: aiScore ?? portfolio.aiScore ?? null,
      },
      update: {
        data: stringifyJson(portfolioData),
        aiScore: aiScore ?? portfolio.aiScore ?? undefined,
      },
    })

    if (portfolioData.name?.trim()) {
      await syncFreelancerIdentity(req.userId, {
        name: portfolioData.name,
        title: portfolioData.title,
      })
    }

    const data = parseJson(row.data, defaultPortfolio)
    res.json({ portfolio: { ...data, aiScore: row.aiScore } })
  } catch (err) {
    next(err)
  }
})

export default router
