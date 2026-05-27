import { useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Users, CheckCircle2, DollarSign, Briefcase, FileText,
  Sparkles, MessageSquare, Star, Eye, UserCheck, XCircle, Send,
  Wallet, TrendingUp, Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { GlassCard } from '@/components/shared/GlassCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useClient } from '@/contexts/ClientContext'
import { useMessages } from '@/contexts/MessagesContext'
import { ClientMessagesPanel } from '@/components/client/ClientMessagesPanel'
import { ClientAIHiringPanel } from '@/components/client/ClientAIHiringPanel'
import { categories } from '@/data/mockData'
import { VerifiedBadge, TrustScorePill } from '@/components/shared/VerifiedBadge'
import { cn } from '@/lib/utils'

const STATUS_VARIANT = {
  open: 'default',
  hiring: 'warning',
  closed: 'secondary',
  pending: 'secondary',
  shortlisted: 'default',
  accepted: 'success',
  rejected: 'danger',
  invited: 'default',
  released: 'success',
}

export function ClientDashboardPage() {
  const navigate = useNavigate()
  const {
    projects, proposals, hires, milestones, talentPool, analytics, spendHistory, stats,
    postProject, updateProposalStatus, releaseMilestone, closeProject, inviteTalent,
  } = useClient()
  const { ensureThread, totalUnread } = useMessages()

  const [postOpen, setPostOpen] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '', description: '', budget: '', category: 'Web Dev', skills: '',
  })
  const [selectedProject, setSelectedProject] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [msg, setMsg] = useState('')
  const [inviteProjectByTalent, setInviteProjectByTalent] = useState({})

  const openProjects = useMemo(
    () => projects.filter((p) => p.status === 'open'),
    [projects]
  )

  const handleProposalAction = useCallback(
    async (proposalId, status) => {
      try {
        await updateProposalStatus(proposalId, status)
        const labels = {
          accepted: 'Proposal accepted — freelancer notified',
          rejected: 'Proposal rejected — freelancer notified',
          shortlisted: 'Freelancer shortlisted',
        }
        setMsg(labels[status] || 'Proposal updated')
        setTimeout(() => setMsg(''), 3500)
      } catch (err) {
        setMsg(err.message || 'Failed to update proposal')
        setTimeout(() => setMsg(''), 4000)
      }
    },
    [updateProposalStatus]
  )

  const handleInvite = useCallback(
    async (talent) => {
      const projectId = inviteProjectByTalent[talent.id] || openProjects[0]?.id
      if (!projectId) {
        setMsg('Post an open job first, then invite freelancers')
        setTimeout(() => setMsg(''), 4000)
        return
      }
      if (talent.canInvite === false) {
        setMsg('Only freelancers registered on TalentStage can be invited (e.g. demo freelancer account)')
        setTimeout(() => setMsg(''), 5000)
        return
      }
      try {
        await inviteTalent(talent.id, projectId)
        setMsg(`Invited ${talent.name} — they will see it on their dashboard`)
        setTimeout(() => setMsg(''), 3500)
      } catch (err) {
        setMsg(err.message || 'Invite failed')
        setTimeout(() => setMsg(''), 4000)
      }
    },
    [inviteTalent, inviteProjectByTalent, openProjects]
  )

  const filteredProposals = useMemo(() => {
    if (selectedProject === 'all') return proposals
    return proposals.filter((p) => p.projectId === selectedProject)
  }, [proposals, selectedProject])

  const openChat = useCallback(
    (freelancerName, projectTitle) => {
      ensureThread(freelancerName, projectTitle)
      setActiveTab('messages')
    },
    [ensureThread]
  )

  const handlePost = async () => {
    if (!newProject.title.trim()) return
    try {
      await postProject({
        ...newProject,
        skills: newProject.skills.split(',').map((s) => s.trim()).filter(Boolean),
      })
      setNewProject({ title: '', description: '', budget: '', category: 'Web Dev', skills: '' })
      setPostOpen(false)
      setMsg('Job published! Freelancers will see it under Browse Projects.')
      setTimeout(() => setMsg(''), 4000)
    } catch (err) {
      setMsg(err.message || 'Failed to post job')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Hiring overview</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Post jobs, review proposals, and manage your team
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setActiveTab('ai')}>
            <Sparkles className="h-4 w-4" /> AI hiring tools
          </Button>
          <Dialog open={postOpen} onOpenChange={setPostOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-btn"><Plus className="h-4 w-4" /> Post a job</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Post a new project</DialogTitle></DialogHeader>
              <div className="mt-4 space-y-3">
                <div>
                  <Label>Project title</Label>
                  <Input value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} className="mt-1" placeholder="e.g. React dashboard build" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} className="mt-1 min-h-[100px]" placeholder="Scope, deliverables, timeline expectations..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Budget</Label>
                    <Input value={newProject.budget} onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })} className="mt-1" placeholder="$3,000 - $5,000" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={newProject.category}
                      onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                      className="mt-1"
                    >
                      {categories.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Required skills (comma separated)</Label>
                  <Input value={newProject.skills} onChange={(e) => setNewProject({ ...newProject, skills: e.target.value })} className="mt-1" placeholder="React, Node.js, Figma" />
                </div>
                <Button className="w-full gradient-btn" onClick={handlePost}>Publish job</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Open jobs', value: stats.openProjects, icon: Briefcase, color: 'text-[#0a66c2]' },
          { label: 'Proposals', value: stats.totalProposals, icon: FileText, color: 'text-[#0a66c2]' },
          { label: 'Active hires', value: stats.activeHires, icon: Users, color: 'text-emerald-600' },
          { label: 'Total spend', value: `$${analytics.spend.toLocaleString()}`, icon: DollarSign, color: 'text-amber-600' },
          { label: 'In escrow', value: `$${analytics.escrowPending?.toLocaleString()}`, icon: Shield, color: 'text-orange-600' },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4">
            <s.icon className={cn('mb-2 h-5 w-5', s.color)} />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Review proposals', icon: FileText, tab: 'proposals' },
          { label: 'Screened candidates', icon: Users, href: '/client/candidates' },
          { label: 'Message talent', icon: MessageSquare, tab: 'messages' },
          { label: 'AI hiring tools', icon: Sparkles, tab: 'ai' },
          { label: 'Release payment', icon: Wallet, tab: 'milestones' },
        ].map((action) => (
          <GlassCard
            key={action.label}
            role="button"
            tabIndex={0}
            onClick={() => (action.href ? navigate(action.href) : setActiveTab(action.tab))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                action.href ? navigate(action.href) : setActiveTab(action.tab)
              }
            }}
            className="flex cursor-pointer items-center gap-3 p-4 hover:bg-white/10"
          >
            <action.icon className="h-5 w-5 text-[#0a66c2]" strokeWidth={1.5} />
            <span className="text-sm font-medium">{action.label}</span>
            {action.tab === 'messages' && totalUnread > 0 && (
              <Badge className="ml-auto">{totalUnread}</Badge>
            )}
          </GlassCard>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">My jobs ({projects.length})</TabsTrigger>
          <TabsTrigger value="proposals">Proposals ({proposals.length})</TabsTrigger>
          <TabsTrigger value="hires">Hires & work</TabsTrigger>
          <TabsTrigger value="milestones">Payments</TabsTrigger>
          <TabsTrigger value="talent">Find talent</TabsTrigger>
          <TabsTrigger value="messages">
            Messages{totalUnread > 0 ? ` (${totalUnread})` : ''}
          </TabsTrigger>
          <TabsTrigger value="ai">AI hiring</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <GlassCard className="lg:col-span-2">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <TrendingUp className="h-5 w-5 text-purple-400" /> Hiring activity
              </h3>
              <div className="flex h-36 items-end gap-2">
                {spendHistory.map((amount, i) => {
                  const max = Math.max(...spendHistory)
                  const h = (amount / max) * 100
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-purple-400"
                        style={{ height: `${h}%`, minHeight: 4 }}
                      />
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i]}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="font-bold text-purple-300">{analytics.avgTime}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Avg. hire time</p>
                </div>
                <div>
                  <p className="font-bold text-emerald-400">{analytics.success}%</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Success rate</p>
                </div>
                <div>
                  <p className="font-bold">{analytics.hires}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Total hires</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-semibold">Hiring pipeline</h3>
              <div className="mt-4 space-y-3">
                {[
                  { step: 'Jobs posted', count: projects.length, color: 'bg-purple-500' },
                  { step: 'Proposals received', count: proposals.length, color: 'bg-sky-500' },
                  { step: 'Shortlisted', count: proposals.filter((p) => p.status === 'shortlisted').length, color: 'bg-indigo-500' },
                  { step: 'Hired', count: proposals.filter((p) => p.status === 'accepted').length, color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className={cn('h-2 w-2 rounded-full', item.color)} />
                    <span className="flex-1 text-sm">{item.step}</span>
                    <span className="font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Recent proposals</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {proposals.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{p.freelancer}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">${p.bid} · AI {p.aiScore}</p>
                    </div>
                    <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Active work</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {hires.slice(0, 2).map((h) => (
                  <div key={h.id}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{h.name}</span>
                      <span className="text-[hsl(var(--muted-foreground))]">{h.progress}%</span>
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{h.project}</p>
                    <Progress value={h.progress} className="mt-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PROJECTS */}
        <TabsContent value="projects" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <GlassCard key={p.id}>
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary">{p.category}</Badge>
                  <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                </div>
                <h3 className="mt-3 font-semibold">{p.title}</h3>
                {p.description && <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">{p.description}</p>}
                <p className="mt-2 text-sm text-purple-300">{p.budget}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(p.skills || []).map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
                <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                  {proposals.filter((pr) => pr.projectId === p.id).length} proposals · Posted {p.postedAt}
                  {' · '}{p.views ?? 0} views
                  {p.postAiScore != null && (
                    <span className="text-purple-300"> · AI post score {p.postAiScore}</span>
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedProject(p.id)
                      setActiveTab('ai')
                    }}
                  >
                    <Sparkles className="h-3 w-3" /> AI score post
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedProject(p.id)
                      setActiveTab('proposals')
                    }}
                  >
                    <Eye className="h-3 w-3" /> View proposals
                  </Button>
                  {p.status === 'open' && (
                    <Button size="sm" variant="ghost" onClick={() => closeProject(p.id)}>Close job</Button>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </TabsContent>

        {/* PROPOSALS */}
        <TabsContent value="proposals" className="mt-4 space-y-4">
          <Select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </Select>

          {filteredProposals.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 font-bold">
                      {p.freelancer.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{p.freelancer}</p>
                      <p className="text-sm text-purple-300">{p.title}</p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        Bid ${p.bid?.toLocaleString()} · {p.timeline}
                        {p.aiScore ? ` · AI score ${p.aiScore}` : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(p.skills || []).map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                    {['pending', 'shortlisted', 'invited'].includes(p.status) && (
                      <>
                        {p.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => handleProposalAction(p.id, 'shortlisted')}>
                            Shortlist
                          </Button>
                        )}
                        <Button size="sm" className="gradient-btn" onClick={() => handleProposalAction(p.id, 'accepted')}>
                          <UserCheck className="h-3 w-3" /> Accept
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleProposalAction(p.id, 'rejected')}>
                          <XCircle className="h-3 w-3" /> Reject
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openChat(
                          p.freelancer,
                          projects.find((pr) => pr.id === p.projectId)?.title
                        )
                      }
                    >
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </TabsContent>

        {/* HIRES */}
        <TabsContent value="hires" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {hires.map((h) => (
              <GlassCard key={h.id}>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-lg font-bold">
                    {h.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{h.name}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{h.project}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{h.milestone}</span>
                    <span className="text-purple-300">{h.progress}%</span>
                  </div>
                  <Progress value={h.progress} />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    size="sm"
                    onClick={() => openChat(h.name, h.project)}
                  >
                    <MessageSquare className="h-3 w-3" /> Message
                  </Button>
                  <Button variant="outline" size="sm">View deliverables</Button>
                </div>
              </GlassCard>
            ))}
            {hires.length === 0 && (
              <p className="col-span-2 text-center text-[hsl(var(--muted-foreground))] py-12">
                No active hires yet. Accept a proposal to start working with a freelancer.
              </p>
            )}
          </div>
        </TabsContent>

        {/* MILESTONES / PAYMENTS */}
        <TabsContent value="milestones" className="mt-4">
          <GlassCard className="mb-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Secure milestone payments — release funds when work is approved. Funds are held in escrow until you release.
            </p>
          </GlassCard>
          <div className="space-y-3">
            {milestones.map((m) => (
              <GlassCard key={m.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{m.project}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Due {m.due}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-purple-300">{m.amount}</p>
                  <Badge variant={STATUS_VARIANT[m.status]}>{m.status}</Badge>
                  {m.status === 'pending' && (
                    <Button size="sm" className="gradient-btn" onClick={() => releaseMilestone(m.id)}>
                      <CheckCircle2 className="h-3 w-3" /> Release payment
                    </Button>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
          <Link to="/payments">
            <Button variant="outline" className="mt-4"><Wallet className="h-4 w-4" /> Full payment dashboard</Button>
          </Link>
        </TabsContent>

        {/* FIND TALENT */}
        <TabsContent value="talent" className="mt-4">
          <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
            AI-ranked freelancers based on skills, ratings, and project fit. Invite them to your open jobs.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {talentPool.map((t) => (
              <GlassCard key={t.id}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef3f8] text-lg font-semibold text-[#0a66c2]">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold flex flex-wrap items-center gap-2">
                        {t.name}
                        <VerifiedBadge status={t.verified ? 'verified' : t.suspicious ? 'flagged' : 'unverified'} size="xs" />
                        <TrustScorePill score={t.trustScore} />
                      </p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{t.title}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.rate} · {t.completed} jobs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-300">{t.match}%</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">match</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {t.rating}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
                <div className="mt-4 flex gap-2">
                  <Select
                    className="flex-1 h-9 text-xs"
                    value={inviteProjectByTalent[t.id] || openProjects[0]?.id || ''}
                    onChange={(e) =>
                      setInviteProjectByTalent((prev) => ({ ...prev, [t.id]: e.target.value }))
                    }
                    disabled={!openProjects.length}
                  >
                    {openProjects.length === 0 ? (
                      <option value="">No open jobs — post a project first</option>
                    ) : (
                      openProjects.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))
                    )}
                  </Select>
                  <Button
                    size="sm"
                    className="gradient-btn shrink-0"
                    disabled={!openProjects.length || t.canInvite === false}
                    onClick={() => handleInvite(t)}
                  >
                    <Send className="h-3 w-3" /> Invite
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openChat(t.name, projects.find((p) => p.status === 'open')?.title)}
                  >
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <ClientMessagesPanel compact />
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <ClientAIHiringPanel compact />
        </TabsContent>
      </Tabs>
    </div>
  )
}
