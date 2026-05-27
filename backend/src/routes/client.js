import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { parseJson, stringifyJson } from '../lib/json.js'
import { authRequired, loadUser, requireRole } from '../middleware/auth.js'
import { getFreelancerDisplayName } from '../lib/freelancerDisplay.js'

const router = Router()

router.use(authRequired, loadUser, requireRole('client'))

router.get('/dashboard', async (req, res, next) => {
  try {
    const [projects, proposals, hires, milestones, talentPool, analytics] = await Promise.all([
      prisma.project.findMany({
        where: { clientId: req.userId },
        include: { _count: { select: { proposals: true } } },
        orderBy: { postedAt: 'desc' },
      }),
      prisma.proposal.findMany({
        where: { project: { clientId: req.userId } },
        include: { project: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hire.findMany({ where: { clientId: req.userId } }),
      prisma.milestone.findMany({ where: { clientId: req.userId } }),
      prisma.freelancerProfile.findMany(),
      prisma.clientAnalytics.findUnique({ where: { userId: req.userId } }),
    ])

    const proposalRows = await Promise.all(
      proposals.map(async (pr) => ({
        id: pr.id,
        projectId: pr.projectId,
        freelancer: pr.freelancerId
          ? await getFreelancerDisplayName(pr.freelancerId, pr.freelancerName)
          : pr.freelancerName,
        title: pr.title,
        bid: pr.bid,
        timeline: pr.timeline,
        aiScore: pr.aiScore,
        status: pr.status,
        skills: parseJson(pr.skills, []),
      }))
    )

    const hireRows = await Promise.all(
      hires.map(async (h) => ({
        id: h.id,
        name: h.freelancerId
          ? await getFreelancerDisplayName(h.freelancerId, h.name)
          : h.name,
        project: projects.find((p) => p.id === h.projectId)?.title || 'Project',
        milestone: h.milestone,
        progress: h.progress,
      }))
    )

    const talentRows = await Promise.all(
      talentPool.map(async (t) => ({
        id: t.id,
        userId: t.userId,
        name: t.userId ? await getFreelancerDisplayName(t.userId, t.name) : t.name,
        title: t.title,
        rate: t.rate,
        match: Math.round((t.trustScore + 10) * 0.9),
        skills: parseJson(t.skills, []),
        completed: t.completed,
        rating: t.rating,
        verified: t.verified,
        trustScore: t.trustScore,
        bio: t.bio,
        joined: t.joined,
        portfolio: t.portfolio,
        suspicious: t.suspicious,
        canInvite: !!t.userId,
      }))
    )

    res.json({
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        budget: p.budget,
        category: p.category,
        skills: parseJson(p.skills, []),
        status: p.status,
        views: p.views,
        postAiScore: p.postAiScore,
        postAiReview: parseJson(p.postAiReview, null),
        postedAt: p.postedAt,
        proposals: p._count.proposals,
      })),
      proposals: proposalRows,
      hires: hireRows,
      milestones: milestones.map((m) => ({
        id: m.id,
        project: m.projectTitle,
        amount: m.amount,
        status: m.status,
        due: m.due,
      })),
      talentPool: talentRows,
      analytics: analytics
        ? {
            spend: analytics.spend,
            hires: analytics.hires,
            avgTime: analytics.avgTime,
            success: analytics.success,
            escrowPending: analytics.escrowPending,
          }
        : { spend: 0, hires: 0, avgTime: '3.2 days', success: 94, escrowPending: 0 },
      spendHistory: parseJson(analytics?.spendHistory, []),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/invite', async (req, res, next) => {
  try {
    const { talentId, projectId } = req.body
    if (!talentId || !projectId) {
      return res.status(400).json({ error: 'Talent and project are required' })
    }

    const talent = await prisma.freelancerProfile.findUnique({ where: { id: talentId } })
    const project = await prisma.project.findFirst({
      where: { id: projectId, clientId: req.userId, status: 'open' },
    })

    if (!talent) return res.status(404).json({ error: 'Freelancer not found' })
    if (!project) return res.status(404).json({ error: 'Open project not found' })
    if (!talent.userId) {
      return res.status(400).json({
        error: 'This freelancer is not on TalentStage yet — only registered freelancers can be invited.',
      })
    }

    const existing = await prisma.proposal.findFirst({
      where: {
        projectId,
        freelancerId: talent.userId,
        status: { in: ['invited', 'pending', 'shortlisted'] },
      },
    })
    if (existing) {
      return res.status(400).json({ error: 'This freelancer was already invited or applied to this job' })
    }

    const displayName = await getFreelancerDisplayName(talent.userId, talent.name)

    const proposal = await prisma.proposal.create({
      data: {
        projectId,
        freelancerId: talent.userId,
        freelancerName: displayName,
        title: `Invited · ${talent.title}`,
        bid: 0,
        timeline: 'TBD',
        aiScore: talent.trustScore,
        status: 'invited',
        skills: talent.skills,
        statusUpdatedAt: new Date(),
      },
      include: { project: true },
    })

    res.status(201).json({
      proposal: {
        id: proposal.id,
        projectId: proposal.projectId,
        freelancer: displayName,
        status: 'invited',
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/milestones/:id/release', async (req, res, next) => {
  try {
    const milestone = await prisma.milestone.findFirst({
      where: { id: req.params.id, clientId: req.userId },
    })
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' })

    const amount = parseInt(String(milestone.amount).replace(/\D/g, ''), 10) || 0
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: 'released' },
    })
    await prisma.clientAnalytics.update({
      where: { userId: req.userId },
      data: {
        spend: { increment: amount },
        escrowPending: { decrement: Math.min(amount, 3500) },
      },
    })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.put('/projects/:id/review', async (req, res, next) => {
  try {
    const { postAiScore, postAiReview, ...updates } = req.body
    const project = await prisma.project.updateMany({
      where: { id: req.params.id, clientId: req.userId },
      data: {
        ...(postAiScore != null && { postAiScore }),
        ...(postAiReview != null && { postAiReview: stringifyJson(postAiReview) }),
        ...(updates.title && { title: updates.title }),
        ...(updates.description != null && { description: updates.description }),
        ...(updates.skills && { skills: stringifyJson(updates.skills) }),
        ...(updates.budget && { budget: updates.budget }),
        ...(updates.views != null && { views: updates.views }),
      },
    })
    if (!project.count) return res.status(404).json({ error: 'Project not found' })
    const updated = await prisma.project.findUnique({ where: { id: req.params.id } })
    res.json({ project: updated })
  } catch (err) {
    next(err)
  }
})

export default router
