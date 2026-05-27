import { useState, useRef, useEffect } from 'react'
import {
  Sparkles, Target, MessageSquare, Loader2, AlertCircle, ShieldCheck, ShieldAlert,
  Eye, TrendingUp, UserCheck, Ban, Star, BadgeCheck, Wand2, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label, Textarea, Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { GlassCard } from '@/components/shared/GlassCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useClient } from '@/contexts/ClientContext'
import { hasGroqApiKey } from '@/lib/groq'
import {
  verifyAndMatchTalentAI,
  scoreJobPostAI,
  optimizeJobPostAI,
  localTalentScan,
  hiringCoachChat,
} from '@/lib/aiClient'
import { cn } from '@/lib/utils'

export function ClientAIHiringPanel({ compact = false }) {
  const {
    projects,
    talentPool,
    stats,
    inviteTalent,
    updateProjectPostReview,
    applyPostOptimizations,
  } = useClient()

  const [selectedProjectId, setSelectedProjectId] = useState(() => projects[0]?.id || '')
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const [talentScan, setTalentScan] = useState(null)
  const [postReview, setPostReview] = useState(null)
  const [coachMessages, setCoachMessages] = useState([
    {
      role: 'assistant',
      content:
        'Ask me about spotting fake profiles, improving job posts, or getting more applicant views.',
    },
  ])
  const [coachInput, setCoachInput] = useState('')
  const coachEndRef = useRef(null)

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0]
  const apiReady = hasGroqApiKey()

  useEffect(() => {
    if (projects[0]?.id && !selectedProjectId) setSelectedProjectId(projects[0].id)
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (selectedProject?.postAiReview) setPostReview(selectedProject.postAiReview)
    else setPostReview(null)
  }, [selectedProjectId, selectedProject?.postAiReview])

  useEffect(() => {
    coachEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [coachMessages])

  const run = async (key, fn) => {
    setLoading(key)
    setError('')
    try {
      return await fn()
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading('')
    }
  }

  const getTalentById = (id) => talentPool.find((t) => t.id === id)

  const handleScanTalent = async () => {
    if (!selectedProject) return
    let result
    if (apiReady) {
      result = await run('scan', () =>
        verifyAndMatchTalentAI({ project: selectedProject, talentPool })
      )
      if (!result) {
        result = localTalentScan({ project: selectedProject, talentPool })
      }
    } else {
      setLoading('scan')
      result = localTalentScan({ project: selectedProject, talentPool })
      setLoading('')
    }
    if (result) setTalentScan(result)
  }

  const handleScorePost = async () => {
    if (!selectedProject) return
    let result
    if (apiReady) {
      result = await run('score', () => scoreJobPostAI({ project: selectedProject }))
    } else {
      setLoading('score')
      result = buildLocalPostReview(selectedProject)
      setLoading('')
    }
    if (result) {
      setPostReview(result)
      updateProjectPostReview(selectedProject.id, result)
    }
  }

  const handleApplyOptimizations = async () => {
    if (!selectedProject || !postReview) return
    if (apiReady) {
      const optimized = await run('optimize', () =>
        optimizeJobPostAI({ project: selectedProject, review: postReview })
      )
      if (optimized) {
        applyPostOptimizations(selectedProject.id, {
          title: optimized.optimizedTitle || selectedProject.title,
          description: optimized.optimizedDescription || selectedProject.description,
          skills: optimized.suggestedSkills || selectedProject.skills,
          budget: optimized.suggestedBudget || selectedProject.budget,
          postAiReview: {
            ...postReview,
            appliedAt: new Date().toISOString(),
          },
        })
        setPostReview((prev) => ({ ...prev, applied: true }))
      }
    } else {
      applyPostOptimizations(selectedProject.id, {
        description:
          selectedProject.description ||
          `We are hiring for ${selectedProject.title}. Clear scope, milestones, and weekly updates required.`,
        skills: selectedProject.skills?.length
          ? selectedProject.skills
          : ['React', 'Communication'],
      })
    }
  }

  const handleCoachSend = async () => {
    if (!coachInput.trim() || loading === 'coach') return
    const userMsg = { role: 'user', content: coachInput.trim() }
    const next = [...coachMessages, userMsg]
    setCoachMessages(next)
    setCoachInput('')
    if (!apiReady) {
      setCoachMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Add your Groq API key for personalized hiring advice. Meanwhile: verify portfolios, avoid $15/hr "expert" profiles, and add clear deliverables to job posts.',
        },
      ])
      return
    }
    setLoading('coach')
    setError('')
    try {
      const reply = await hiringCoachChat({
        messages: next,
        clientContext: {
          openJobs: stats.openProjects,
          pendingProposals: stats.totalProposals,
          activeHires: stats.activeHires,
          projectTitles: projects.map((p) => p.title),
        },
      })
      setCoachMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  const verifiedCount = talentScan?.verified?.length ?? 0
  const flaggedCount = talentScan?.flagged?.length ?? 0

  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5 text-purple-400" /> AI Hiring Intelligence
        </h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Filter fake freelancer profiles, surface verified matches for your project, score job posts, and get tips to boost views
        </p>
      </div>

      {!apiReady && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          <AlertCircle className="h-4 w-4" />
          Add VITE_GROQ_API_KEY for full AI — basic scan still works offline
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {projects.length > 0 && (
        <div>
          <Label className="text-xs">Select your job post / project</Label>
          <Select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value)
              setTalentScan(null)
            }}
            className="mt-1 max-w-md"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} {p.postAiScore != null ? `(AI ${p.postAiScore})` : ''}
              </option>
            ))}
          </Select>
        </div>
      )}

      <Tabs defaultValue="talent" className={compact ? 'text-sm' : ''}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="talent">Verified talent</TabsTrigger>
          <TabsTrigger value="posts">Job post score</TabsTrigger>
          <TabsTrigger value="coach">Hiring coach</TabsTrigger>
        </TabsList>

        {/* VERIFIED TALENT + FAKE FILTER */}
        <TabsContent value="talent" className="mt-4 space-y-4">
          <GlassCard>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h4 className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  Scan & filter profiles
                </h4>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  AI flags fake or suspicious freelancers and shows verified matches for{' '}
                  <strong>{selectedProject?.title}</strong>
                </p>
              </div>
              <Button
                className="gradient-btn shrink-0"
                disabled={!selectedProject || loading === 'scan'}
                onClick={handleScanTalent}
              >
                {loading === 'scan' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Scan {talentPool.length} profiles
              </Button>
            </div>

            {talentScan && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{verifiedCount}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Verified matches</p>
                </div>
                <div className="rounded-xl bg-red-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{flaggedCount}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Filtered (fake/risky)</p>
                </div>
                <div className="rounded-xl bg-purple-500/10 p-3 text-center">
                  <p className="text-2xl font-bold text-purple-300">{talentPool.length}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Total scanned</p>
                </div>
              </div>
            )}
            {talentScan?.summary && (
              <p className="mt-3 text-sm text-purple-200">{talentScan.summary}</p>
            )}
          </GlassCard>

          {talentScan?.flagged?.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-400">
                <Ban className="h-4 w-4" /> Filtered — do not hire
              </h4>
              <div className="space-y-2">
                {talentScan.flagged.map((f) => {
                  const t = getTalentById(f.id)
                  return (
                    <GlassCard key={f.id} className="border border-red-500/20 opacity-80">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium line-through decoration-red-400/60">
                            {f.name}
                          </p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {t?.title} · {t?.rate}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(f.reasons || []).map((r) => (
                              <Badge key={r} variant="danger" className="text-[10px]">
                                {r}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge variant="danger">{f.riskLevel} risk · {f.recommendation}</Badge>
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            </div>
          )}

          {talentScan?.verified?.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <UserCheck className="h-4 w-4" /> Verified matches for your project
              </h4>
              <div className="space-y-3">
                {talentScan.verified.map((v) => {
                  const t = getTalentById(v.id)
                  if (!t) return null
                  return (
                    <GlassCard key={v.id}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 font-bold">
                            {v.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{v.name}</p>
                              <Badge variant="success">
                                <BadgeCheck className="mr-1 h-3 w-3" /> Verified
                              </Badge>
                            </div>
                            <p className="text-sm text-purple-300">{t.title}</p>
                            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                              {t.rate} · {t.completed} jobs ·{' '}
                              <Star className="inline h-3 w-3 fill-amber-400 text-amber-400" />{' '}
                              {t.rating}
                            </p>
                            <p className="mt-2 text-sm">{v.reason}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {t.skills.map((s) => (
                                <Badge key={s} variant="secondary">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-400">{v.match}%</p>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">project match</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <ShieldCheck className="h-3 w-3 text-emerald-400" />
                            Trust {v.trustScore}%
                          </div>
                          <Button
                            size="sm"
                            className="gradient-btn"
                            disabled={!selectedProject?.id || selectedProject?.status !== 'open' || v.canInvite === false}
                            onClick={async () => {
                              try {
                                await inviteTalent(v.id, selectedProject?.id)
                                alert(`Invited ${v.name} — they will see it on their freelancer dashboard.`)
                              } catch (err) {
                                alert(err.message || 'Invite failed')
                              }
                            }}
                          >
                            Invite to job
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            </div>
          )}

          {!talentScan && (
            <p className="text-center text-sm text-[hsl(var(--muted-foreground))] py-8">
              Run a scan to filter fake profiles and see freelancers who match your project skills
            </p>
          )}
        </TabsContent>

        {/* JOB POST SCORE + VIEW BOOST */}
        <TabsContent value="posts" className="mt-4 space-y-4">
          <GlassCard>
            <h4 className="flex items-center gap-2 font-semibold">
              <Eye className="h-5 w-5 text-sky-400" />
              AI score for your job post
            </h4>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Get a discoverability score, review strengths, and actionable tips to increase views
            </p>

            <div className="mt-4 rounded-xl bg-white/5 p-4">
              <p className="font-medium">{selectedProject?.title}</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))] line-clamp-3">
                {selectedProject?.description || '(No description — add one to improve score)'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">{selectedProject?.category}</Badge>
                <Badge variant="secondary">{selectedProject?.budget}</Badge>
                <Badge variant="secondary">
                  <Eye className="mr-1 h-3 w-3" />
                  {selectedProject?.views ?? 0} views
                </Badge>
              </div>
            </div>

            <Button
              className="mt-4 gradient-btn"
              disabled={!selectedProject || loading === 'score'}
              onClick={handleScorePost}
            >
              {loading === 'score' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Target className="h-4 w-4" />
              )}
              Score this job post
            </Button>
          </GlassCard>

          {postReview && (
            <>
              <GlassCard>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-purple-300">{postReview.score}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">AI post score / 100</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-sky-400" />
                      <span className="text-sm capitalize">
                        Visibility: <strong>{postReview.visibility || 'medium'}</strong>
                      </span>
                    </div>
                    {postReview.estimatedViews && (
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Est. reach: {postReview.estimatedViews}
                      </p>
                    )}
                    <p className="text-sm">
                      Current views: <strong>{selectedProject?.views ?? 0}</strong>
                    </p>
                  </div>
                </div>

                {postReview.breakdown && (
                  <div className="mt-4 space-y-2">
                    {Object.entries(postReview.breakdown).map(([key, val]) => (
                      <div key={key}>
                        <div className="flex justify-between text-xs capitalize">
                          <span>{key}</span>
                          <span>{val}%</span>
                        </div>
                        <Progress value={val} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                )}

                {postReview.strengths?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-emerald-400">Strengths</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      {postReview.strengths.map((s) => (
                        <li key={s} className="flex gap-2">
                          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {postReview.improvements?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-amber-400">Needs improvement</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      {postReview.improvements.map((s) => (
                        <li key={s} className="rounded-lg bg-white/5 px-3 py-2">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </GlassCard>

              <GlassCard>
                <h4 className="flex items-center gap-2 font-semibold">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  Suggestions to increase views
                </h4>
                <div className="mt-3 space-y-2">
                  {(postReview.viewBoostTips || []).map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl bg-white/5 px-3 py-2 text-sm"
                    >
                      <Badge
                        variant={
                          tip.impact === 'high'
                            ? 'success'
                            : tip.impact === 'medium'
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {tip.impact}
                      </Badge>
                      <p>{tip.tip}</p>
                    </div>
                  ))}
                </div>

                <Button
                  className="mt-4 w-full gradient-btn sm:w-auto"
                  disabled={loading === 'optimize'}
                  onClick={handleApplyOptimizations}
                >
                  {loading === 'optimize' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Apply AI optimizations to job post
                </Button>
                {postReview.applied && (
                  <p className="mt-2 text-xs text-emerald-400">
                    Optimizations applied — views should increase as freelancers discover your post
                  </p>
                )}
              </GlassCard>
            </>
          )}
        </TabsContent>

        <TabsContent value="coach" className="mt-4">
          <GlassCard>
            <h4 className="mb-2 flex items-center gap-2 font-semibold">
              <MessageSquare className="h-4 w-4 text-purple-400" /> Hiring coach
            </h4>
            <div className={cn('space-y-3 overflow-y-auto', compact ? 'max-h-[280px]' : 'max-h-[360px]')}>
              {coachMessages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-xl px-3 py-2 text-sm',
                    m.role === 'user' ? 'ml-8 bg-purple-600/40' : 'mr-8 bg-white/10'
                  )}
                >
                  {m.content}
                </div>
              ))}
              <div ref={coachEndRef} />
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                handleCoachSend()
              }}
            >
              <input
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                placeholder="How do I spot fake freelancer profiles?"
                className="flex h-10 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
              />
              <Button type="submit" className="gradient-btn" disabled={loading === 'coach' || !coachInput.trim()}>
                {loading === 'coach' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
              </Button>
            </form>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function buildLocalPostReview(project) {
  const hasDesc = Boolean(project.description?.trim())
  const hasSkills = (project.skills || []).length > 0
  const hasBudget = Boolean(project.budget)
  let score = 45
  if (hasDesc) score += 25
  if (hasSkills) score += 15
  if (hasBudget) score += 15
  score = Math.min(score, 100)

  return {
    score,
    visibility: score >= 75 ? 'high' : score >= 55 ? 'medium' : 'low',
    estimatedViews: score >= 75 ? '50–120/week' : score >= 55 ? '20–50/week' : '5–15/week',
    breakdown: {
      title: project.title?.length > 10 ? 80 : 50,
      description: hasDesc ? 70 : 20,
      skills: hasSkills ? 75 : 30,
      budget: hasBudget ? 80 : 40,
    },
    strengths: [
      hasBudget && 'Budget range is visible',
      project.title?.length > 8 && 'Title describes the role',
    ].filter(Boolean),
    improvements: [
      !hasDesc && 'Add a detailed description with deliverables and timeline',
      !hasSkills && 'List required skills so matching freelancers find you',
      !hasBudget && 'Specify budget range to attract serious applicants',
    ].filter(Boolean),
    viewBoostTips: [
      { tip: 'Add 3–5 bullet deliverables and expected timeline', impact: 'high' },
      { tip: 'Include budget range — posts without budget get 40% fewer views', impact: 'high' },
      { tip: 'Tag specific skills (React, Figma) instead of generic "developer"', impact: 'medium' },
      { tip: 'Mention milestone payment structure for trust', impact: 'medium' },
      { tip: 'Respond to proposals within 48 hours to boost ranking', impact: 'low' },
    ],
  }
}
