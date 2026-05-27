import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultPortfolio = {
  name: 'Alex Rivera',
  title: 'Senior Full-Stack Developer',
  location: 'Remote · UTC-5',
  bio: 'Building scalable web apps for startups and enterprises. 8+ years experience.',
  completion: 78,
  aiScore: 92,
  skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'GraphQL'],
  education: [{ school: 'MIT', degree: 'B.S. Computer Science', year: '2016' }],
  experience: [
    { company: 'TechFlow Inc', role: 'Lead Developer', period: '2021 - Present' },
    { company: 'StartupXYZ', role: 'Full-Stack Dev', period: '2018 - 2021' },
  ],
  projects: [
    { id: 'proj-1', title: 'FinTrack Dashboard', image: 'gradient-1', link: 'github.com', live: 'fintrack.app', description: '' },
    { id: 'proj-2', title: 'HealthConnect API', image: 'gradient-2', link: 'github.com', live: null, description: '' },
  ],
  interests: ['Web Development', 'SaaS', 'AI Integration'],
  certifications: [{ id: 'c1', name: 'AWS Solutions Architect', issuer: 'Amazon', year: '2023' }],
  posts: [],
  aiSuggestions: [
    'Add 2 more React projects to boost match rate by ~15%',
    'Complete skill verification for TypeScript',
  ],
}

const talentPool = [
  { name: 'Alex Rivera', title: 'Senior Full-Stack Developer', rate: '$85/hr', skills: ['React', 'Node.js', 'TypeScript'], completed: 47, rating: 4.9, verified: true, trustScore: 94, bio: '8+ years building SaaS dashboards and APIs.', joined: '2019', portfolio: true, suspicious: false },
  { name: 'Elena Voss', title: 'UI/UX Designer', rate: '$70/hr', skills: ['Figma', 'UI/UX'], completed: 32, rating: 4.8, verified: true, trustScore: 91, bio: 'Product designer for fintech brands.', joined: '2020', portfolio: true, suspicious: false },
  { name: 'Priya Sharma', title: 'React Specialist', rate: '$65/hr', skills: ['React', 'Next.js'], completed: 28, rating: 4.9, verified: true, trustScore: 88, bio: 'Frontend lead — marketing sites, SEO.', joined: '2021', portfolio: true, suspicious: false },
  { name: 'Marcus Cole', title: 'Backend Engineer', rate: '$90/hr', skills: ['Node.js', 'AWS'], completed: 55, rating: 4.7, verified: true, trustScore: 90, bio: 'CRM integrations, PostgreSQL, REST APIs.', joined: '2018', portfolio: true, suspicious: false },
  { name: 'Pro Coder 247', title: 'Expert in Everything — Cheap!', rate: '$12/hr', skills: ['React', 'AI', 'Blockchain'], completed: 1, rating: 5.0, verified: false, trustScore: 22, bio: 'Best developer. Hire now!!!', joined: 'May 2026', portfolio: false, suspicious: true },
  { name: 'J. D.', title: 'Developer', rate: '$20/hr', skills: ['HTML'], completed: 0, rating: null, verified: false, trustScore: 18, bio: 'I do websites.', joined: '2 days ago', portfolio: false, suspicious: true },
]

async function main() {
  await prisma.comment.deleteMany()
  await prisma.postLike.deleteMany()
  await prisma.communityPost.deleteMany()
  await prisma.message.deleteMany()
  await prisma.threadParticipant.deleteMany()
  await prisma.messageThread.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.hire.deleteMany()
  await prisma.proposal.deleteMany()
  await prisma.jobApplication.deleteMany()
  await prisma.project.deleteMany()
  await prisma.paymentProfile.deleteMany()
  await prisma.clientAnalytics.deleteMany()
  await prisma.identityVerification.deleteMany()
  await prisma.freelancerProfile.deleteMany()
  await prisma.portfolio.deleteMany()
  await prisma.user.deleteMany()

  const hash = await bcrypt.hash('demo123', 10)

  const freelancer = await prisma.user.create({
    data: {
      email: 'freelancer@demo.com',
      password: hash,
      name: 'Alex Rivera',
      role: 'freelancer',
      portfolio: {
        create: { data: JSON.stringify(defaultPortfolio), aiScore: 92 },
      },
      paymentProfile: {
        create: {
          totalEarnings: 48250,
          pending: 3200,
          available: 8500,
          currency: 'INR',
          methods: JSON.stringify([
            { id: 'upi-1', type: 'upi', label: 'UPI', upiId: 'freelancer@oksbi', verified: true, isDefault: true },
          ]),
          transactions: JSON.stringify([
            { id: 't1', desc: 'Milestone — CRM Integration', amount: 1500, status: 'completed', date: 'May 20' },
          ]),
          withdrawals: JSON.stringify([]),
        },
      },
    },
  })

  const client = await prisma.user.create({
    data: {
      email: 'client@demo.com',
      password: hash,
      name: 'Sarah Chen',
      role: 'client',
      clientAnalytics: {
        create: {
          spend: 12400,
          hires: 8,
          avgTime: '3.2 days',
          success: 94,
          escrowPending: 3500,
          spendHistory: JSON.stringify([3200, 4100, 2800, 5200, 3800, 6100, 4800]),
        },
      },
    },
  })

  for (const t of talentPool) {
    await prisma.freelancerProfile.create({
      data: {
        name: t.name,
        title: t.title,
        rate: t.rate,
        skills: JSON.stringify(t.skills),
        completed: t.completed,
        rating: t.rating,
        verified: t.verified,
        trustScore: t.trustScore,
        bio: t.bio,
        joined: t.joined,
        portfolio: t.portfolio,
        suspicious: t.suspicious,
        userId: t.name === 'Alex Rivera' ? freelancer.id : null,
      },
    })
  }

  const p1 = await prisma.project.create({
    data: {
      clientId: client.id,
      title: 'Marketing Website Revamp',
      description: 'Revamp marketing site with React, improve SEO and Core Web Vitals.',
      budget: '$2,500',
      category: 'Web Dev',
      skills: JSON.stringify(['React', 'Next.js', 'SEO']),
      status: 'open',
      views: 42,
    },
  })

  const p2 = await prisma.project.create({
    data: {
      clientId: client.id,
      title: 'CRM Integration',
      description: 'Integrate HubSpot CRM with internal PostgreSQL database.',
      budget: '$5,000',
      category: 'Backend',
      skills: JSON.stringify(['Node.js', 'PostgreSQL', 'REST']),
      status: 'hiring',
      views: 28,
    },
  })

  const browseProjects = [
    { title: 'React Dashboard for SaaS', budget: '$3,000 - $5,000', category: 'Web Dev', skills: ['React', 'TypeScript', 'Tailwind'], description: 'Build analytics dashboard with charts and auth.' },
    { title: 'Mobile App UI Redesign', budget: '$1,500 - $2,500', category: 'Design', skills: ['Figma', 'UI/UX', 'Mobile'], description: 'Redesign fintech app screens.' },
    { title: 'Node.js API Integration', budget: '$2,000 - $4,000', category: 'Backend', skills: ['Node.js', 'PostgreSQL', 'REST'], description: 'Integrate Stripe and webhooks.' },
  ]

  for (const bp of browseProjects) {
    await prisma.project.create({
      data: {
        clientId: client.id,
        title: bp.title,
        description: bp.description,
        budget: bp.budget,
        category: bp.category,
        skills: JSON.stringify(bp.skills),
        status: 'open',
      },
    })
  }

  await prisma.proposal.createMany({
    data: [
      { projectId: p1.id, freelancerId: freelancer.id, freelancerName: 'Alex Rivera', title: 'Full-stack revamp specialist', bid: 2800, timeline: '3 weeks', aiScore: 94, status: 'shortlisted', skills: JSON.stringify(['React', 'Next.js']) },
      { projectId: p1.id, freelancerName: 'Priya Sharma', title: 'Marketing site + SEO', bid: 2200, timeline: '2 weeks', aiScore: 88, status: 'pending', skills: JSON.stringify(['React', 'SEO']) },
      { projectId: p2.id, freelancerName: 'Sam Kim', title: 'CRM & API expert', bid: 4800, timeline: '5 weeks', aiScore: 96, status: 'accepted', skills: JSON.stringify(['Node.js', 'PostgreSQL']) },
    ],
  })

  await prisma.hire.create({
    data: {
      clientId: client.id,
      projectId: p2.id,
      name: 'Sam Kim',
      milestone: 'Phase 2',
      progress: 65,
    },
  })

  await prisma.milestone.createMany({
    data: [
      { clientId: client.id, projectId: p2.id, projectTitle: 'CRM Integration', amount: '$1,500', status: 'pending', due: 'May 28' },
      { clientId: client.id, projectId: p1.id, projectTitle: 'Marketing Website Revamp', amount: '$2,000', status: 'released', due: 'May 20' },
    ],
  })

  const thread = await prisma.messageThread.create({
    data: {
      lastMessage: 'I can deliver the revamp in 3 weeks at $2,800',
      lastTime: '10:32 AM',
      projectTitle: 'Marketing Website Revamp',
      participants: {
        create: [{ userId: client.id, unread: 1 }],
      },
      messages: {
        create: [
          { senderId: freelancer.id, senderName: 'Alex Rivera', text: 'Hi! I submitted a proposal for your Marketing Website Revamp.', self: false, time: '10:10' },
          { senderId: client.id, senderName: 'You', text: 'Thanks Alex — what timeline and budget are you thinking?', self: true, time: '10:15' },
          { senderId: freelancer.id, senderName: 'Alex Rivera', text: 'I can deliver the revamp in 3 weeks at $2,800', self: false, time: '10:32' },
        ],
      },
    },
  })

  await prisma.communityPost.createMany({
    data: [
      { authorId: client.id, authorName: 'Dev Community', title: 'How to price your first enterprise project', body: 'Share your pricing strategies below.', likes: 124, tags: JSON.stringify(['tips', 'career']), commentCount: 32 },
      { authorId: freelancer.id, authorName: 'TalentStage Team', title: 'New: AI skill verification badges', body: 'Verify skills with assessments.', likes: 89, tags: JSON.stringify(['announcement']), commentCount: 15 },
    ],
  })

  await prisma.user.create({
    data: {
      email: 'admin@talentstage.com',
      password: hash,
      name: 'TalentStage Admin',
      role: 'admin',
      paymentProfile: { create: {} },
    },
  })

  console.log('Seed complete')
  console.log('  freelancer@demo.com / demo123')
  console.log('  client@demo.com / demo123')
  console.log('  admin@talentstage.com / demo123')
  console.log('  Thread id:', thread.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
