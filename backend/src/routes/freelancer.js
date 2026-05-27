import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { parseJson } from '../lib/json.js'
import { authRequired, loadUser, requireRole } from '../middleware/auth.js'

const router = Router()

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins || 1}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

router.get('/dashboard', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const [proposals, recentProjects, portfolioRow] = await Promise.all([
      prisma.proposal.findMany({
        where: { freelancerId: req.userId },
        include: { project: true },
        orderBy: { statusUpdatedAt: 'desc' },
        take: 20,
      }),
      prisma.project.findMany({
        where: { status: 'open' },
        orderBy: { postedAt: 'desc' },
        take: 15,
        include: { _count: { select: { proposals: true } } },
      }),
      prisma.portfolio.findUnique({ where: { userId: req.userId } }),
    ])

    const portfolioSkills = parseJson(portfolioRow?.data, {}).skills || []

    const notifications = []

    proposals.forEach((p) => {
      if (p.status === 'pending') return
      const eventTime = p.statusUpdatedAt || p.createdAt
      notifications.push({
        id: `proposal-${p.id}-${p.status}-${eventTime}`,
        type: 'proposal',
        title:
          p.status === 'accepted'
            ? 'Proposal accepted!'
            : p.status === 'rejected'
              ? 'Proposal declined'
              : p.status === 'shortlisted'
                ? 'You were shortlisted'
                : 'Client invited you',
        body: `${p.project.title} — ${p.status}`,
        read: false,
        time: timeAgo(eventTime),
        createdAt: eventTime,
      })
    })

    const since = Date.now() - 7 * 24 * 60 * 60 * 1000
    recentProjects.forEach((proj) => {
      const skills = parseJson(proj.skills, [])
      const matches =
        !portfolioSkills.length ||
        skills.some((s) =>
          portfolioSkills.some(
            (ps) => ps.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ps.toLowerCase())
          )
        )
      if (new Date(proj.postedAt).getTime() >= since || matches) {
        notifications.push({
          id: `job-${proj.id}`,
          type: 'job',
          title: 'New job posted',
          body: `${proj.title} · ${proj.budget}`,
          read: false,
          time: timeAgo(proj.postedAt),
          createdAt: proj.postedAt,
        })
      }
    })

    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const activeProposals = proposals.filter((p) =>
      ['pending', 'shortlisted', 'invited'].includes(p.status)
    ).length

    res.json({
      proposals: proposals.map((p) => ({
        id: p.id,
        project: p.project.title,
        projectId: p.projectId,
        status: p.status,
        bid: p.bid ? `$${p.bid.toLocaleString()}` : 'Invite',
        submitted: timeAgo(p.createdAt),
        aiScore: p.aiScore,
      })),
      notifications: notifications.slice(0, 20),
      newJobsCount: recentProjects.length,
      stats: {
        activeProposals,
        totalProposals: proposals.length,
        acceptedCount: proposals.filter((p) => p.status === 'accepted').length,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
