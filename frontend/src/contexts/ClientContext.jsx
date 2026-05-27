import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { clientData as seed } from '@/data/mockData'
import { api, getToken } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { notifyProjectsUpdated } from '@/lib/projectsSync'
import { notifyFreelancer } from '@/lib/notificationsSync'

const STORAGE_KEY = 'talentstage-client'

const seedProposals = [
  { id: 'pr1', projectId: 'cp1', freelancer: 'Alex Rivera', title: 'Full-stack revamp specialist', bid: 2800, timeline: '3 weeks', aiScore: 94, status: 'shortlisted', skills: ['React', 'Next.js'] },
  { id: 'pr2', projectId: 'cp1', freelancer: 'Priya Sharma', title: 'Marketing site + SEO', bid: 2200, timeline: '2 weeks', aiScore: 88, status: 'pending', skills: ['React', 'SEO'] },
]

const seedTalentPool = [
  { id: 't1', name: 'Alex Rivera', title: 'Senior Full-Stack Developer', rate: '$85/hr', match: 96, skills: ['React', 'Node.js'], completed: 47, rating: 4.9, verified: true, trustScore: 94, bio: '', joined: '2019', portfolio: true, suspicious: false },
]

function loadLocalState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    /* ignore */
  }
  return {
    projects: seed.postedProjects.map((p) => ({ ...p, description: '', skills: [], category: 'Web Dev', postedAt: 'May 20', views: 0 })),
    proposals: seedProposals,
    hires: seed.activeHires.map((h, i) => ({ ...h, id: `hire-${i}` })),
    milestones: seed.milestones.map((m, i) => ({ ...m, id: `ms-${i}` })),
    talentPool: seedTalentPool,
    analytics: { ...seed.analytics, escrowPending: 3500 },
    spendHistory: [3200, 4100, 2800, 5200, 3800, 6100, 4800],
  }
}

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function mapDashboard(data) {
  return {
    projects: data.projects.map((p) => ({
      ...p,
      postedAt: p.postedAt ? new Date(p.postedAt).toLocaleDateString() : 'recently',
    })),
    proposals: data.proposals,
    hires: data.hires,
    milestones: data.milestones,
    talentPool: data.talentPool,
    analytics: data.analytics,
    spendHistory: data.spendHistory,
  }
}

const ClientContext = createContext(null)

export function ClientProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const [state, setState] = useState(loadLocalState)
  const [syncing, setSyncing] = useState(false)

  const refreshFromApi = useCallback(async () => {
    if (!getToken() || user?.role !== 'client') return
    setSyncing(true)
    try {
      const data = await api.getClientDashboard()
      const mapped = mapDashboard(data)
      setState(mapped)
      persist(mapped)
    } catch (err) {
      console.warn('Client sync failed:', err.message)
    } finally {
      setSyncing(false)
    }
  }, [user?.role])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'client') {
      refreshFromApi()
    }
  }, [refreshFromApi, isAuthenticated, user?.role])

  const update = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      persist(next)
      return next
    })
  }, [])

  const postProject = useCallback(
    async (project) => {
      if (!getToken() || user?.role !== 'client') {
        throw new Error('Log in as a client to post jobs that freelancers can browse.')
      }
      const created = await api.createProject(project)
      await refreshFromApi()
      notifyProjectsUpdated()
      return created
    },
    [refreshFromApi, user?.role]
  )

  const updateProposalStatus = useCallback(
    async (proposalId, status) => {
      if (getToken() && user?.role === 'client') {
        await api.updateProposalStatus(proposalId, status)
        await refreshFromApi()
        notifyFreelancer({ type: 'proposal', proposalId, status })
        return
      }
      update((prev) => {
        const proposal = prev.proposals.find((p) => p.id === proposalId)
        if (!proposal) return prev
        let projects = prev.projects
        let hires = prev.hires
        let milestones = prev.milestones
        if (status === 'accepted') {
          projects = projects.map((p) =>
            p.id === proposal.projectId ? { ...p, status: 'hiring' } : p
          )
          hires = [
            ...hires,
            {
              id: `hire-${Date.now()}`,
              name: proposal.freelancer,
              project: projects.find((p) => p.id === proposal.projectId)?.title || 'Project',
              milestone: 'Phase 1',
              progress: 10,
            },
          ]
          milestones = [
            {
              id: `ms-${Date.now()}`,
              project: projects.find((p) => p.id === proposal.projectId)?.title,
              amount: `$${Math.round(proposal.bid * 0.3)}`,
              status: 'pending',
              due: 'In 14 days',
            },
            ...milestones,
          ]
        }
        return {
          ...prev,
          projects,
          hires,
          milestones,
          proposals: prev.proposals.map((p) => (p.id === proposalId ? { ...p, status } : p)),
        }
      })
    },
    [update, refreshFromApi]
  )

  const releaseMilestone = useCallback(
    async (milestoneId) => {
      if (getToken()) {
        await api.releaseMilestone(milestoneId)
        await refreshFromApi()
        return
      }
      update((prev) => {
        const ms = prev.milestones.find((m) => m.id === milestoneId)
        const amount = parseInt(String(ms?.amount).replace(/\D/g, ''), 10) || 0
        return {
          ...prev,
          milestones: prev.milestones.map((m) =>
            m.id === milestoneId ? { ...m, status: 'released' } : m
          ),
          analytics: {
            ...prev.analytics,
            spend: prev.analytics.spend + amount,
            escrowPending: Math.max(0, prev.analytics.escrowPending - amount),
          },
        }
      })
    },
    [update, refreshFromApi]
  )

  const closeProject = useCallback(
    async (projectId) => {
      if (getToken()) {
        await api.closeProject(projectId)
        await refreshFromApi()
        return
      }
      update((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === projectId ? { ...p, status: 'closed' } : p)),
      }))
    },
    [update, refreshFromApi]
  )

  const updateProjectPostReview = useCallback(
    async (projectId, review) => {
      if (getToken()) {
        await api.updateProjectReview(projectId, {
          postAiScore: review.score,
          postAiReview: review,
        })
      }
      update((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId
            ? { ...p, postAiScore: review.score, postAiReview: review, views: p.views ?? 0 }
            : p
        ),
      }))
    },
    [update]
  )

  const applyPostOptimizations = useCallback(
    async (projectId, updates) => {
      const payload = {
        ...updates,
        views: undefined,
      }
      if (getToken()) {
        const project = state.projects.find((p) => p.id === projectId)
        await api.updateProjectReview(projectId, {
          title: updates.title || project?.title,
          description: updates.description ?? project?.description,
          skills: updates.skills || project?.skills,
          budget: updates.budget || project?.budget,
          postAiReview: updates.postAiReview,
          views: (project?.views || 0) + 30,
        })
        await refreshFromApi()
        return
      }
      update((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId
            ? { ...p, ...payload, views: (p.views || 0) + 30 }
            : p
        ),
      }))
    },
    [state.projects, update, refreshFromApi]
  )

  const inviteTalent = useCallback(
    async (talentId, projectId) => {
      if (!projectId) throw new Error('Select an open project first')
      if (getToken()) {
        await api.inviteTalent(talentId, projectId)
        await refreshFromApi()
        notifyFreelancer({ type: 'invite', talentId, projectId })
        notifyProjectsUpdated()
        return
      }
      const talent = state.talentPool.find((t) => t.id === talentId)
      if (!talent) return
      update((prev) => ({
        ...prev,
        proposals: [
          {
            id: `pr-inv-${Date.now()}`,
            projectId,
            freelancer: talent.name,
            title: `Invited · ${talent.title}`,
            bid: 0,
            timeline: 'TBD',
            aiScore: talent.match,
            status: 'invited',
            skills: talent.skills,
          },
          ...prev.proposals,
        ],
      }))
    },
    [state.talentPool, update, refreshFromApi]
  )

  const stats = {
    openProjects: state.projects.filter((p) => p.status === 'open').length,
    totalProposals: state.proposals.filter((p) =>
      ['pending', 'shortlisted'].includes(p.status)
    ).length,
    activeHires: state.hires.length,
    pendingMilestones: state.milestones.filter((m) => m.status === 'pending').length,
  }

  return (
    <ClientContext.Provider
      value={{
        ...state,
        stats,
        syncing,
        refreshFromApi,
        postProject,
        updateProposalStatus,
        releaseMilestone,
        closeProject,
        inviteTalent,
        updateProjectPostReview,
        applyPostOptimizations,
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export function useClient() {
  const ctx = useContext(ClientContext)
  if (!ctx) throw new Error('useClient must be used within ClientProvider')
  return ctx
}
