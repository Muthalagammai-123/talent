import { useEffect, useState, useMemo } from 'react'
import {
  Star, ClipboardCheck, FileText, MessageSquare, ChevronDown, ChevronUp,
  Loader2, UserCheck, UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/shared/GlassCard'
import { Badge } from '@/components/ui/badge'
import { VerifiedBadge, TrustScorePill } from '@/components/shared/VerifiedBadge'
import { Select } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { useClient } from '@/contexts/ClientContext'
import { cn } from '@/lib/utils'

const STATUS_LABEL = {
  round_1: 'In quiz',
  quiz_failed: 'Quiz failed',
  round_2: 'Resume round',
  resume_review: 'Resume review',
  round_3: 'Interview',
  completed: 'Completed',
}

export function ClientCandidatesPage() {
  const { projects } = useClient()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [projectFilter, setProjectFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    const pid = projectFilter === 'all' ? undefined : projectFilter
    api
      .getClientApplications(pid)
      .then((d) => setApplications(d.applications || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [projectFilter])

  const filtered = useMemo(() => {
    if (projectFilter === 'all') return applications
    return applications.filter((a) => a.projectId === projectFilter)
  }, [applications, projectFilter])

  const recommended = filtered.filter((a) => a.recommended || (a.overallScore >= 72 && a.status === 'completed'))
  const inProgress = filtered.filter((a) => a.status !== 'completed' && a.status !== 'quiz_failed')
  const completed = filtered.filter((a) => a.status === 'completed')

  const toggleRecommend = async (app, recommended) => {
    setBusyId(app.id)
    try {
      await api.recommendApplication(app.id, recommended)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const CandidateCard = ({ app }) => {
    const open = expandedId === app.id
    return (
      <GlassCard className="overflow-hidden p-0">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-4 p-5 text-left hover:bg-[#f3f2ef]"
          onClick={() => setExpandedId(open ? null : app.id)}
        >
              <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eef3f8] text-lg font-semibold text-[#0a66c2]">
              {(app.freelancerName || '?').charAt(0)}
            </div>
            <div>
              <p className="font-semibold flex flex-wrap items-center gap-2">
                {app.freelancerName}
                <VerifiedBadge
                  status={app.verification?.verified ? 'verified' : app.verification?.status || 'unverified'}
                  size="xs"
                />
                <TrustScorePill score={app.verification?.trustScore ?? app.portfolio?.trustScore} />
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {app.portfolio?.title || 'Freelancer'} · {app.project?.title}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{STATUS_LABEL[app.status] || app.status}</Badge>
                {app.recommended && <Badge>Recommended</Badge>}
                {app.overallScore != null && (
                  <Badge variant="default">Score {app.overallScore}</Badge>
                )}
              </div>
            </div>
          </div>
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {open && (
          <div className="space-y-4 border-t border-[#e0e0e0] bg-[#f3f2ef] p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-[#e0e0e0] bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <ClipboardCheck className="h-4 w-4 text-[#0a66c2]" /> Round 1 — Quiz
                </p>
                {app.quizPassed ? (
                  <ul className="mt-2 space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
                    <li>Score: {app.quizScore}%</li>
                    <li>Integrity: {app.quizIntegrity}%</li>
                    <li>Status: Passed</li>
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                    {app.status === 'quiz_failed' ? 'Did not pass quiz' : 'In progress'}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-[#e0e0e0] bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4 text-[#0a66c2]" /> Round 2 — Resume
                </p>
                {app.resumePassed ? (
                  <>
                    <p className="mt-2 text-sm">AI score: {app.resumeScore}%</p>
                    {app.resumeAnalysis?.summary && (
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        {app.resumeAnalysis.summary}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Not completed</p>
                )}
              </div>
              <div className="rounded-lg border border-[#e0e0e0] bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquare className="h-4 w-4 text-[#0a66c2]" /> Round 3 — Interview
                </p>
                {app.interviewScore != null ? (
                  <>
                    <p className="mt-2 text-sm">Score: {app.interviewScore}%</p>
                    {app.interviewResult?.summary && (
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        {app.interviewResult.summary}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Not completed</p>
                )}
              </div>
            </div>

            {app.portfolio && (
              <div className="rounded-lg border border-[#e0e0e0] bg-white p-4">
                <p className="text-sm font-semibold">Portfolio</p>
                <p className="mt-1 text-sm">{app.portfolio.bio || 'No bio'}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(app.portfolio.skills || []).map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
                {(app.portfolio.projects || []).length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {app.portfolio.projects.map((p) => (
                      <li key={p.id || p.title}>• {p.title}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {app.resumeText && (
              <div className="rounded-lg border border-[#e0e0e0] bg-white p-4">
                <p className="text-sm font-semibold">Resume</p>
                <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs text-[hsl(var(--muted-foreground))]">
                  {app.resumeText}
                </pre>
              </div>
            )}

            {(app.interviewTranscript || []).length > 0 && (
              <div className="rounded-lg border border-[#e0e0e0] bg-white p-4">
                <p className="text-sm font-semibold">Interview transcript</p>
                <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                  {app.interviewTranscript.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        'rounded px-3 py-2 text-sm',
                        m.role === 'candidate' ? 'bg-[#f3f2ef]' : 'bg-[#eef3f8]'
                      )}
                    >
                      <span className="text-xs font-semibold capitalize text-[#0a66c2]">{m.role}</span>
                      <p className="mt-0.5">{m.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={busyId === app.id || app.status !== 'completed'}
                onClick={() => toggleRecommend(app, true)}
              >
                <UserCheck className="h-4 w-4" />
                {app.recommended ? 'Recommended' : 'Recommend'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === app.id}
                onClick={() => toggleRecommend(app, false)}
              >
                <UserX className="h-4 w-4" /> Remove recommendation
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Screened candidates</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Review freelancers who completed the three-round application (quiz, resume, interview).
          </p>
        </div>
        <Select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="w-full sm:w-64"
        >
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 py-12 text-[hsl(var(--muted-foreground))]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading candidates...
        </p>
      ) : filtered.length === 0 ? (
        <GlassCard className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No applications yet. Freelancers apply via the 3-round process from Browse Jobs.
        </GlassCard>
      ) : (
        <Tabs defaultValue="recommended">
          <TabsList>
            <TabsTrigger value="recommended">
              <Star className="mr-1 h-4 w-4" /> Top picks ({recommended.length})
            </TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="inprogress">In progress ({inProgress.length})</TabsTrigger>
            <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="recommended" className="mt-4 space-y-3">
            {recommended.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No recommended candidates yet.</p>
            ) : (
              recommended.map((app) => <CandidateCard key={app.id} app={app} />)
            )}
          </TabsContent>
          <TabsContent value="completed" className="mt-4 space-y-3">
            {completed.map((app) => <CandidateCard key={app.id} app={app} />)}
          </TabsContent>
          <TabsContent value="inprogress" className="mt-4 space-y-3">
            {inProgress.map((app) => <CandidateCard key={app.id} app={app} />)}
          </TabsContent>
          <TabsContent value="all" className="mt-4 space-y-3">
            {filtered.map((app) => <CandidateCard key={app.id} app={app} />)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
