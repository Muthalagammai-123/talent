import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ClientAIHiringPanel } from '@/components/client/ClientAIHiringPanel'
import {
  Sparkles, Target, FileText, MessageSquare, Code2, HelpCircle, BookOpen,
  Upload, RefreshCw, BadgeCheck, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/input'
import { Textarea } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GlassCard } from '@/components/shared/GlassCard'
import { PortfolioCoachChat } from '@/components/ai/PortfolioCoachChat'
import { usePortfolio } from '@/contexts/PortfolioContext'
import { hasGroqApiKey } from '@/lib/groq'
import {
  reviewPortfolioAI,
  loadSavedReview,
  generateMCQsAI,
  generateCodingTestsAI,
  generateInterviewQuestionsAI,
  generateSamplePortfolioAI,
} from '@/lib/aiPortfolio'
import { cn } from '@/lib/utils'

export function AIFeaturesPage() {
  const { isClient } = useAuth()

  if (isClient) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-7 w-7 text-purple-400" /> AI Hiring Studio
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Filter fake profiles, find verified talent for your projects, score job posts, and boost visibility
          </p>
        </div>
        <ClientAIHiringPanel />
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          <Link to="/client" className="text-purple-400 hover:underline">← Back to Hiring Hub</Link>
        </p>
      </div>
    )
  }

  return <FreelancerAIFeatures />
}

function FreelancerAIFeatures() {
  const { portfolio, updatePortfolio } = usePortfolio()
  const [review, setReview] = useState(() => loadSavedReview())
  const [resumeText, setResumeText] = useState(() => localStorage.getItem('talentstage-resume') || '')
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const [mcqs, setMcqs] = useState([])
  const [codingTests, setCodingTests] = useState([])
  const [interview, setInterview] = useState(null)
  const [samplePortfolio, setSamplePortfolio] = useState(null)
  const [mcqAnswers, setMcqAnswers] = useState({})
  const resumeFileRef = useRef(null)

  const apiReady = hasGroqApiKey()

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

  const handleReview = async () => {
    const result = await run('review', () => reviewPortfolioAI(portfolio, resumeText))
    if (result) {
      setReview(result)
      updatePortfolio({
        aiScore: result.score,
        aiSuggestions: result.improvements || portfolio.aiSuggestions,
      })
    }
  }

  const handleResumeFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      setResumeText(text)
      localStorage.setItem('talentstage-resume', text)
    }
    reader.readAsText(file)
  }

  const saveResume = () => {
    localStorage.setItem('talentstage-resume', resumeText)
  }

  const matches = review?.matchHighlights || []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-7 w-7 text-purple-400" /> AI Career Studio
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Groq-powered review, coach, assessments & interview prep — uses your live portfolio (RAG)
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
          <div className="text-right">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">AI Portfolio Score</p>
            <p className="text-2xl font-bold text-purple-300">{review?.score ?? portfolio.aiScore ?? '—'}</p>
          </div>
          <Progress value={review?.score ?? portfolio.aiScore ?? 0} className="w-20" />
        </div>
      </div>

      {!apiReady && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertCircle className="h-4 w-4" />
          Add VITE_GROQ_API_KEY to .env and restart dev server
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <Tabs defaultValue="review">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="review">Portfolio review</TabsTrigger>
          <TabsTrigger value="coach">AI coach</TabsTrigger>
          <TabsTrigger value="assess">MCQ & coding</TabsTrigger>
          <TabsTrigger value="interview">Interview prep</TabsTrigger>
          <TabsTrigger value="samples">Samples</TabsTrigger>
        </TabsList>

        {/* REVIEW TAB */}
        <TabsContent value="review" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard>
              <h2 className="flex items-center gap-2 font-semibold">
                <FileText className="h-5 w-5 text-purple-400" /> Resume & portfolio (RAG)
              </h2>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                AI reads your saved portfolio plus uploaded resume for accurate scoring.
              </p>
              <Link to="/freelancer/portfolio/create" className="mt-2 inline-block text-sm text-purple-400 hover:underline">
                Edit portfolio →
              </Link>
              <div className="mt-4">
                <input
                  ref={resumeFileRef}
                  type="file"
                  accept=".txt,.md,.text"
                  className="hidden"
                  onChange={handleResumeFile}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => resumeFileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Upload resume (.txt)
                </Button>
              </div>
              <div className="mt-3">
                <Label>Or paste resume text</Label>
                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  onBlur={saveResume}
                  className="mt-1 min-h-[100px] font-mono text-xs"
                  placeholder="Paste resume content here..."
                />
              </div>
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                Profile completion: {portfolio.completion}% · {(portfolio.skills || []).length} skills ·{' '}
                {(portfolio.projects || []).length} projects
              </p>
            </GlassCard>

            <GlassCard>
              <h2 className="font-semibold">AI portfolio score</h2>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Re-run after updating portfolio or resume
              </p>
              <Button
                className="mt-4 gradient-btn w-full sm:w-auto"
                onClick={handleReview}
                disabled={!apiReady || loading === 'review'}
              >
                {loading === 'review' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><RefreshCw className="h-4 w-4" /> Review & update AI score</>
                )}
              </Button>

              {review && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl bg-purple-500/10 p-4 text-center">
                    <p className="text-4xl font-bold text-purple-300">{review.score}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">out of 100</p>
                    {review.reviewedAt && (
                      <p className="mt-1 text-xs opacity-60">
                        Last reviewed: {new Date(review.reviewedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <p className="text-sm">{review.summary}</p>
                  {review.categoryScores && (
                    <div className="space-y-2">
                      {Object.entries(review.categoryScores).map(([k, v]) => (
                        <div key={k}>
                          <div className="flex justify-between text-xs capitalize">
                            <span>{k}</span>
                            <span>{v}%</span>
                          </div>
                          <Progress value={v} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <p className="mb-2 text-sm font-medium text-emerald-400">Strengths</p>
                    <ul className="space-y-1 text-sm">
                      {(review.strengths || []).map((s) => (
                        <li key={s} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-amber-400">Improvements</p>
                    <ul className="space-y-1 text-sm">
                      {(review.improvements || []).map((s) => (
                        <li key={s} className="rounded-lg bg-white/5 px-3 py-2">{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          <GlassCard>
            <h2 className="flex items-center gap-2 font-semibold">
              <Target className="h-5 w-5 text-purple-400" /> Project matching
            </h2>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {matches.length ? 'Based on your latest AI review' : 'Run portfolio review to generate matches'}
            </p>
            <div className="mt-4 space-y-3">
              {(matches.length ? matches : [{ project: 'Run review first', match: 0, reason: 'Click Review & update AI score' }]).map((m) => (
                <div key={m.project} className="flex flex-col gap-2 rounded-xl bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{m.project}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{m.reason}</p>
                  </div>
                  {m.match > 0 && (
                    <div className="flex items-center gap-3">
                      <Progress value={m.match} className="w-24" />
                      <span className="font-bold text-purple-300">{m.match}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="flex items-center gap-2 font-semibold"><BadgeCheck className="h-5 w-5" /> Skill verification</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(portfolio.skills || []).map((s) => {
                const verified = review?.verifiedSkills?.includes(s) || ['React', 'Node.js'].includes(s)
                return (
                  <Badge key={s} variant={verified ? 'success' : 'secondary'}>
                    {verified && <BadgeCheck className="mr-1 h-3 w-3" />}
                    {s}
                  </Badge>
                )
              })}
            </div>
            {review?.pendingSkills?.length > 0 && (
              <p className="mt-3 text-sm text-amber-400">Needs evidence: {review.pendingSkills.join(', ')}</p>
            )}
          </GlassCard>
        </TabsContent>

        {/* COACH TAB */}
        <TabsContent value="coach" className="mt-4">
          <GlassCard>
            <h2 className="mb-2 flex items-center gap-2 font-semibold">
              <MessageSquare className="h-5 w-5 text-purple-400" /> Portfolio improvement coach
            </h2>
            <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
              Chatbot with RAG access to your portfolio{resumeText ? ' and resume' : ''}.
            </p>
            <PortfolioCoachChat portfolio={portfolio} resumeText={resumeText} />
          </GlassCard>
        </TabsContent>

        {/* ASSESSMENT TAB */}
        <TabsContent value="assess" className="mt-4 space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button
              className="gradient-btn"
              disabled={!apiReady || loading === 'mcq'}
              onClick={async () => {
                const data = await run('mcq', () => generateMCQsAI(portfolio))
                if (data) setMcqs(Array.isArray(data) ? data : [])
              }}
            >
              {loading === 'mcq' ? <Loader2 className="h-4 w-4 animate-spin" /> : <HelpCircle className="h-4 w-4" />}
              Generate MCQs from my skills
            </Button>
            <Button
              variant="outline"
              disabled={!apiReady || loading === 'code'}
              onClick={async () => {
                const data = await run('code', () => generateCodingTestsAI(portfolio))
                if (data) setCodingTests(Array.isArray(data) ? data : [])
              }}
            >
              {loading === 'code' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Code2 className="h-4 w-4" />}
              Generate coding tests
            </Button>
          </div>

          {mcqs.length > 0 && (
            <GlassCard>
              <h3 className="font-semibold">Skill MCQs ({mcqs.length})</h3>
              <div className="mt-4 space-y-6">
                {mcqs.map((q, qi) => (
                  <div key={qi} className="rounded-xl border border-white/10 p-4">
                    <p className="font-medium">{qi + 1}. {q.question}</p>
                    {q.skill && <Badge className="mt-2" variant="secondary">{q.skill}</Badge>}
                    <div className="mt-3 space-y-2">
                      {(q.options || []).map((opt) => {
                        const letter = opt.trim().charAt(0)
                        const selected = mcqAnswers[qi] === letter
                        const correct = q.correct === letter
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setMcqAnswers((prev) => ({ ...prev, [qi]: letter }))}
                            className={cn(
                              'block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                              selected && correct && 'border-emerald-500 bg-emerald-500/20',
                              selected && !correct && 'border-red-500 bg-red-500/20',
                              !selected && 'border-white/10 hover:bg-white/5'
                            )}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                    {mcqAnswers[qi] && (
                      <p className={cn('mt-2 text-xs', mcqAnswers[qi] === q.correct ? 'text-emerald-400' : 'text-red-400')}>
                        {mcqAnswers[qi] === q.correct ? 'Correct!' : `Correct answer: ${q.correct}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {codingTests.length > 0 && (
            <GlassCard>
              <h3 className="font-semibold">Coding challenges</h3>
              <div className="mt-4 space-y-4">
                {codingTests.map((t, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{t.title}</p>
                      <Badge variant={t.difficulty === 'hard' ? 'danger' : t.difficulty === 'medium' ? 'warning' : 'secondary'}>
                        {t.difficulty}
                      </Badge>
                      {t.skill && <Badge>{t.skill}</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{t.description}</p>
                    {t.starterCode && (
                      <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-3 text-xs">{t.starterCode}</pre>
                    )}
                    {t.hints?.length > 0 && (
                      <ul className="mt-2 text-xs text-purple-300">
                        {t.hints.map((h) => <li key={h}>💡 {h}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </TabsContent>

        {/* INTERVIEW TAB */}
        <TabsContent value="interview" className="mt-4 space-y-6">
          <Button
            className="gradient-btn"
            disabled={!apiReady || loading === 'interview'}
            onClick={async () => {
              const data = await run('interview', () => generateInterviewQuestionsAI(portfolio))
              if (data) setInterview(data)
            }}
          >
            {loading === 'interview' ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
            Generate interview questions for my profile
          </Button>

          {interview && (
            <div className="grid gap-6 lg:grid-cols-3">
              {[
                { key: 'behavioral', title: 'Behavioral' },
                { key: 'technical', title: 'Technical' },
                { key: 'portfolioSpecific', title: 'Portfolio-specific' },
              ].map(({ key, title }) => (
                <GlassCard key={key}>
                  <h3 className="font-semibold">{title}</h3>
                  <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm">
                    {(interview[key] || []).map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ol>
                </GlassCard>
              ))}
            </div>
          )}

          <GlassCard>
            <h3 className="font-semibold">Sample interview questions (general)</h3>
            <ul className="mt-3 space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              {SAMPLE_INTERVIEW.map((q) => (
                <li key={q} className="rounded-lg bg-white/5 px-3 py-2">{q}</li>
              ))}
            </ul>
          </GlassCard>
        </TabsContent>

        {/* SAMPLES TAB */}
        <TabsContent value="samples" className="mt-4 space-y-6">
          <Button
            className="gradient-btn"
            disabled={!apiReady || loading === 'sample'}
            onClick={async () => {
              const focus = (portfolio.skills || []).slice(0, 3).join(' + ') || 'Full-Stack Developer'
              const data = await run('sample', () => generateSamplePortfolioAI(focus))
              if (data) setSamplePortfolio(data)
            }}
          >
            {loading === 'sample' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate sample portfolio for my skill stack
          </Button>

          {samplePortfolio && (
            <GlassCard>
              <h3 className="text-lg font-bold">{samplePortfolio.title}</h3>
              <p className="mt-2 text-purple-300">{samplePortfolio.bio}</p>
              <p className="mt-3 text-sm">{samplePortfolio.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(samplePortfolio.skills || []).map((s) => <Badge key={s}>{s}</Badge>)}
              </div>
              <div className="mt-4 space-y-3">
                {(samplePortfolio.sampleProjects || []).map((p) => (
                  <div key={p.title} className="rounded-xl bg-white/5 p-3 text-sm">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-[hsl(var(--muted-foreground))]">{p.description}</p>
                    <p className="mt-1 text-xs text-purple-300">{(p.tech || []).join(' · ')}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-4 space-y-1 text-sm">
                {(samplePortfolio.tips || []).map((t) => (
                  <li key={t}>✓ {t}</li>
                ))}
              </ul>
            </GlassCard>
          )}

          <GlassCard>
            <h3 className="font-semibold">Reference sample portfolio structure</h3>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/30 p-4 text-xs leading-relaxed">
{SAMPLE_PORTFOLIO_TEMPLATE}
            </pre>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const SAMPLE_INTERVIEW = [
  'Tell me about a challenging project you delivered as a freelancer.',
  'How do you estimate timeline and budget for a new client?',
  'Describe a time you had to learn a new technology quickly for a project.',
  'How do you handle scope creep from clients?',
  'Walk me through your deployment and CI/CD process.',
  'What is your approach to code reviews and quality?',
]

const SAMPLE_PORTFOLIO_TEMPLATE = `Name: Alex Rivera
Title: Senior Full-Stack Developer
Bio: I build scalable SaaS products for startups.

Skills: React, Node.js, PostgreSQL, AWS, TypeScript

Projects:
1. FinTrack Dashboard — Real-time analytics (React, D3, Node)
2. API Gateway — Microservices auth layer (Node, Redis)
3. E-commerce MVP — Stripe + Next.js storefront

Education: B.S. Computer Science
Certifications: AWS Solutions Architect

Tips:
- Add 3+ case studies with metrics (users, revenue, performance)
- Link live demos and GitHub repos
- Keep bio under 160 characters for search`
