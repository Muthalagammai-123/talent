import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { parseJson, stringifyJson } from '../lib/json.js'
import { authRequired, loadUser } from '../middleware/auth.js'

const router = Router()

router.get('/', authRequired, loadUser, async (req, res, next) => {
  try {
    let profile = await prisma.paymentProfile.findUnique({ where: { userId: req.userId } })
    if (!profile) {
      profile = await prisma.paymentProfile.create({ data: { userId: req.userId } })
    }
    res.json({
      totalEarnings: profile.totalEarnings,
      pending: profile.pending,
      available: profile.available,
      currency: profile.currency,
      methods: parseJson(profile.methods, []),
      transactions: parseJson(profile.transactions, []),
      withdrawals: parseJson(profile.withdrawals, []),
    })
  } catch (err) {
    next(err)
  }
})

router.put('/', authRequired, loadUser, async (req, res, next) => {
  try {
    const { methods, currency } = req.body
    const profile = await prisma.paymentProfile.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId,
        methods: stringifyJson(methods || []),
        currency: currency || 'INR',
      },
      update: {
        ...(methods && { methods: stringifyJson(methods) }),
        ...(currency && { currency }),
      },
    })
    res.json({
      totalEarnings: profile.totalEarnings,
      pending: profile.pending,
      available: profile.available,
      currency: profile.currency,
      methods: parseJson(profile.methods, []),
      transactions: parseJson(profile.transactions, []),
      withdrawals: parseJson(profile.withdrawals, []),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/withdraw', authRequired, loadUser, async (req, res, next) => {
  try {
    const { amount, method } = req.body
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid amount' })

    const profile = await prisma.paymentProfile.findUnique({ where: { userId: req.userId } })
    if (!profile || profile.available < amt) {
      return res.status(400).json({ error: 'Insufficient balance' })
    }

    const withdrawals = parseJson(profile.withdrawals, [])
    withdrawals.unshift({
      id: `w-${Date.now()}`,
      amount: amt,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: 'completed',
      method: method || 'bank',
    })

    const updated = await prisma.paymentProfile.update({
      where: { userId: req.userId },
      data: {
        available: profile.available - amt,
        withdrawals: stringifyJson(withdrawals),
      },
    })

    res.json({
      available: updated.available,
      withdrawals: parseJson(updated.withdrawals, []),
    })
  } catch (err) {
    next(err)
  }
})

export default router
