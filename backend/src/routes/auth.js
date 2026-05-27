import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { parseJson } from '../lib/json.js'
import { authRequired, loadUser, signToken } from '../middleware/auth.js'
import { isAdminUser } from '../lib/admin.js'

const router = Router()

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' })
    }
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (exists) return res.status(409).json({ error: 'Email already registered' })

    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hash,
        paymentProfile: { create: {} },
      },
      select: { id: true, name: true, email: true, role: true },
    })

    const token = signToken(user)
    res.status(201).json({ user, token })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const safe = { id: user.id, name: user.name, email: user.email, role: user.role }
    res.json({ user: safe, token: signToken(safe) })
  } catch (err) {
    next(err)
  }
})

router.get('/me', authRequired, loadUser, async (req, res, next) => {
  try {
    const payload = {
      ...req.user,
      isAdmin: isAdminUser(req.user),
    }
    if (req.user.role === 'freelancer') {
      const v = await prisma.identityVerification.findUnique({
        where: { userId: req.userId },
      })
      payload.verification = v
        ? {
            status: v.status,
            trustScore: v.trustScore,
            canApply: v.status === 'verified',
            flags: parseJson(v.flags, []),
          }
        : { status: 'unverified', trustScore: 50, canApply: false, flags: [] }
    }
    res.json({ user: payload })
  } catch (err) {
    next(err)
  }
})

router.patch('/role', authRequired, loadUser, async (req, res, next) => {
  try {
    const { role } = req.body
    if (!['freelancer', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Role must be freelancer or client' })
    }
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    })
    if (role === 'client') {
      await prisma.clientAnalytics.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      })
    }
    if (role === 'freelancer') {
      await prisma.freelancerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          name: user.name,
          title: 'Freelancer',
          rate: 'TBD',
          skills: '[]',
          bio: '',
          joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          portfolio: true,
        },
        update: { name: user.name },
      })
    }
    res.json({ user, token: signToken(user) })
  } catch (err) {
    next(err)
  }
})

export default router
