import { prisma } from './prisma.js'
import { parseJson } from './json.js'

export async function getFreelancerDisplayName(userId, fallback = '') {
  if (!userId) return fallback
  const [user, portfolio] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.portfolio.findUnique({ where: { userId } }),
  ])
  const portfolioName = parseJson(portfolio?.data, {}).name
  return (portfolioName?.trim() || user?.name || fallback || '').trim()
}

export async function syncFreelancerIdentity(userId, { name, title }) {
  if (!userId || !name?.trim()) return
  const displayName = name.trim()

  await prisma.user.update({
    where: { id: userId },
    data: { name: displayName },
  })

  const profile = await prisma.freelancerProfile.findFirst({ where: { userId } })
  if (profile) {
    await prisma.freelancerProfile.update({
      where: { id: profile.id },
      data: {
        name: displayName,
        ...(title?.trim() ? { title: title.trim() } : {}),
      },
    })
  }

  await prisma.proposal.updateMany({
    where: { freelancerId: userId },
    data: { freelancerName: displayName },
  })

  await prisma.hire.updateMany({
    where: { freelancerId: userId },
    data: { name: displayName },
  })
}
