import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { parseJson, stringifyJson } from '../lib/json.js'
import { authRequired, loadUser, requireRole } from '../middleware/auth.js'

const router = Router()

function formatProject(p, proposalCount) {
  return {
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
    proposals: proposalCount ?? p._count?.proposals ?? 0,
    clientId: p.clientId,
  }
}

router.get('/browse', async (req, res, next) => {
  try {
    const { q, category, status } = req.query
    const statusFilter = status ? String(status) : 'open'
    const projects = await prisma.project.findMany({
      where: {
        status: statusFilter,
        ...(category && category !== 'All' ? { category: String(category) } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: String(q) } },
                { description: { contains: String(q) } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { proposals: true } } },
      orderBy: { postedAt: 'desc' },
    })
    res.json({ projects: projects.map((p) => formatProject(p)) })
  } catch (err) {
    next(err)
  }
})

router.get('/mine', authRequired, loadUser, requireRole('client'), async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { clientId: req.userId },
      include: { _count: { select: { proposals: true } } },
      orderBy: { postedAt: 'desc' },
    })
    res.json({ projects: projects.map((p) => formatProject(p)) })
  } catch (err) {
    next(err)
  }
})

router.post('/', authRequired, loadUser, requireRole('client'), async (req, res, next) => {
  try {
    const { title, description, budget, category, skills } = req.body
    if (!title) return res.status(400).json({ error: 'Title required' })

    const project = await prisma.project.create({
      data: {
        clientId: req.userId,
        title,
        description: description || '',
        budget: budget || 'Flexible',
        category: category || 'Web Dev',
        skills: stringifyJson(skills || []),
        status: 'open',
        postedAt: new Date(),
      },
      include: { _count: { select: { proposals: true } } },
    })
    res.status(201).json({ project: formatProject(project) })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', authRequired, loadUser, requireRole('client'), async (req, res, next) => {
  try {
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, clientId: req.userId },
    })
    if (!existing) return res.status(404).json({ error: 'Project not found' })

    const { title, description, budget, category, skills, status, views, postAiScore, postAiReview } = req.body
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(title != null && { title }),
        ...(description != null && { description }),
        ...(budget != null && { budget }),
        ...(category != null && { category }),
        ...(skills != null && { skills: stringifyJson(skills) }),
        ...(status != null && { status }),
        ...(views != null && { views }),
        ...(postAiScore != null && { postAiScore }),
        ...(postAiReview != null && { postAiReview: stringifyJson(postAiReview) }),
      },
      include: { _count: { select: { proposals: true } } },
    })
    res.json({ project: formatProject(project) })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/close', authRequired, loadUser, requireRole('client'), async (req, res, next) => {
  try {
    const project = await prisma.project.updateMany({
      where: { id: req.params.id, clientId: req.userId },
      data: { status: 'closed' },
    })
    if (!project.count) return res.status(404).json({ error: 'Project not found' })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
