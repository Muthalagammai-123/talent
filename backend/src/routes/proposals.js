import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { parseJson, stringifyJson } from '../lib/json.js'
import { authRequired, loadUser, requireRole } from '../middleware/auth.js'
import { getFreelancerDisplayName } from '../lib/freelancerDisplay.js'

const router = Router()

const ALLOWED_STATUSES = ['pending', 'shortlisted', 'accepted', 'rejected', 'invited']

function formatProposal(p) {
  return {
    id: p.id,
    projectId: p.projectId,
    freelancer: p.freelancerName,
    freelancerId: p.freelancerId,
    title: p.title,
    bid: p.bid,
    timeline: p.timeline,
    coverLetter: p.coverLetter,
    aiScore: p.aiScore,
    status: p.status,
    skills: parseJson(p.skills, []),
    project: p.project ? { id: p.project.id, title: p.project.title } : undefined,
  }
}

router.get('/mine', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { freelancerId: req.userId },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({
      proposals: proposals.map((p) => ({
        id: p.id,
        project: p.project.title,
        status: p.status,
        bid: `$${p.bid.toLocaleString()}`,
        submitted: p.createdAt,
      })),
    })
  } catch (err) {
    next(err)
  }
})

router.get('/', authRequired, loadUser, async (req, res, next) => {
  try {
    const { projectId } = req.query
    const where = {}
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: String(projectId), clientId: req.userId },
      })
      if (!project && req.user.role === 'client') {
        return res.status(404).json({ error: 'Project not found' })
      }
      where.projectId = String(projectId)
    } else if (req.user.role === 'client') {
      const clientProjects = await prisma.project.findMany({
        where: { clientId: req.userId },
        select: { id: true },
      })
      where.projectId = { in: clientProjects.map((p) => p.id) }
    }

    const proposals = await prisma.proposal.findMany({
      where,
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = await Promise.all(
      proposals.map(async (p) => {
        const base = formatProposal(p)
        if (p.freelancerId) {
          base.freelancer = await getFreelancerDisplayName(p.freelancerId, p.freelancerName)
        }
        return base
      })
    )

    res.json({ proposals: formatted })
  } catch (err) {
    next(err)
  }
})

router.post('/', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const { projectId, title, bid, timeline, coverLetter, skills, aiScore } = req.body
    if (!projectId || !bid) return res.status(400).json({ error: 'projectId and bid required' })

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project || project.status !== 'open') {
      return res.status(400).json({ error: 'Project not available' })
    }

    const displayName = await getFreelancerDisplayName(req.userId, req.user.name)

    const proposal = await prisma.proposal.create({
      data: {
        projectId,
        freelancerId: req.userId,
        freelancerName: displayName,
        title: title || `${displayName}'s proposal`,
        bid: parseInt(bid, 10),
        timeline: timeline || 'TBD',
        coverLetter: coverLetter || '',
        aiScore: aiScore ?? null,
        skills: stringifyJson(skills || []),
        status: 'pending',
        statusUpdatedAt: new Date(),
      },
      include: { project: true },
    })
    res.status(201).json({ proposal: formatProposal(proposal) })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/status', authRequired, loadUser, requireRole('client'), async (req, res, next) => {
  try {
    const { status } = req.body
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    })
    if (!proposal || proposal.project.clientId !== req.userId) {
      return res.status(404).json({ error: 'Proposal not found' })
    }

    let freelancerId = proposal.freelancerId
    if (!freelancerId && proposal.freelancerName) {
      const profile = await prisma.freelancerProfile.findFirst({
        where: { name: proposal.freelancerName },
      })
      freelancerId = profile?.userId || null
    }

    const displayName = freelancerId
      ? await getFreelancerDisplayName(freelancerId, proposal.freelancerName)
      : proposal.freelancerName

    const updated = await prisma.proposal.update({
      where: { id: req.params.id },
      data: {
        status,
        statusUpdatedAt: new Date(),
        ...(freelancerId && !proposal.freelancerId ? { freelancerId } : {}),
        freelancerName: displayName,
      },
      include: { project: true },
    })

    if (status === 'accepted') {
      await prisma.project.update({
        where: { id: proposal.projectId },
        data: { status: 'hiring' },
      })
      await prisma.hire.create({
        data: {
          clientId: req.userId,
          projectId: proposal.projectId,
          freelancerId,
          name: displayName,
          milestone: 'Phase 1',
          progress: 10,
        },
      })
      await prisma.milestone.create({
        data: {
          clientId: req.userId,
          projectId: proposal.projectId,
          projectTitle: proposal.project.title,
          amount: `$${Math.round(proposal.bid * 0.3)}`,
          status: 'pending',
          due: 'In 14 days',
        },
      })
      await prisma.clientAnalytics.upsert({
        where: { userId: req.userId },
        create: { userId: req.userId, hires: 1 },
        update: { hires: { increment: 1 } },
      })
    }

    res.json({ proposal: formatProposal(updated) })
  } catch (err) {
    next(err)
  }
})

router.post('/score', authRequired, async (req, res) => {
  const { bid, timeline, coverLetter = '' } = req.body
  let score = 50
  if (coverLetter.length > 100) score += 20
  if (coverLetter.length > 300) score += 15
  if (parseInt(bid, 10) > 0) score += 10
  if (timeline) score += 5
  score = Math.min(98, score + Math.floor(Math.random() * 8))
  res.json({
    score,
    tips:
      score < 70
        ? ['Expand your cover letter with relevant experience', 'Reference similar projects from your portfolio']
        : ['Strong proposal — highlight delivery timeline', 'Consider adding a quick Loom intro'],
  })
})

export default router
