import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ClipboardCheck, FileText, MessageSquare, Shield,
  AlertCircle, CheckCircle2, Loader2, Camera, CameraOff, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/shared/GlassCard'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ResumeUploadPanel } from '@/components/application/ResumeUploadPanel'
import { VoiceInterviewPanel } from '@/components/application/VoiceInterviewPanel'
import { Link } from 'react-router-dom'

const ROUNDS = [
  { id: 1, label: 'Skills quiz', icon: ClipboardCheck },
  { id: 2, label: 'Resume review', icon: FileText },
  { id: 3, label: 'AI interview', icon: MessageSquare },
]

export function ApplicationFlowPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const tabSwitches = useRef(0)
  const focusLost = useRef(0)
  const pasteCount = useRef(0)
  const quizStartTime = useRef(null)

  const [resumeResult, setResumeResult] = useState(null)
  const [verificationBlock, setVerificationBlock] = useState(null)

  const [transcript, setTranscript] = useState([])
  const [interviewDone, setInterviewDone] = useState(false)
  const [interviewResult, setInterviewResult] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { application } = await api.startApplication(projectId)
      setApp(application)
      if (application.quizPassed) setQuizResult({ passed: true, score: application.quizScore })
      if (application.resumePassed) setResumeResult({ passed: true, score: application.resumeScore })
      if (application.status === 'completed') {
        setInterviewDone(true)
        setInterviewResult({ score: application.interviewScore, passed: application.interviewPassed })
      }
      const detail = await api.getApplication(application.id)
      if (detail.application?.interviewTranscript?.length) {
        setTranscript(detail.application.interviewTranscript)
      }
    } catch (err) {
      if (err.message?.includes('VERIFICATION') || err.message?.includes('verification')) {
        setVerificationBlock(err.message)
      }
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!quizStarted) return
    const onVis = () => {
      if (document.hidden) tabSwitches.current += 1
    }
    const onBlur = () => {
      focusLost.current += 1
    }
    const onPaste = () => {
      pasteCount.current += 1
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    window.addEventListener('paste', onPaste)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('paste', onPaste)
    }
  }, [quizStarted])

  const startQuiz = async () => {
    setBusy(true)
    try {
      const data = await api.startQuiz(app.id)
      setQuestions(data.questions || [])
      setQuizStarted(true)
      quizStartTime.current = Date.now()
      setApp(data.application)
      // Request camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          streamRef.current = stream
          setCameraActive(true)
        }
      } catch (err) {
        setCameraPermissionDenied(true)
        console.warn('Camera permission denied:', err)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const submitQuiz = async () => {
    const answerList = questions.map((q) => ({
      questionId: q.id,
      selectedIndex: answers[q.id] ?? -1,
    }))
    if (answerList.some((a) => a.selectedIndex < 0)) {
      setError('Please answer all 15 questions.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const durationSec = quizStartTime.current
        ? Math.round((Date.now() - quizStartTime.current) / 1000)
        : 300
      const data = await api.submitQuiz(app.id, {
        answers: answerList,
        tabSwitches: tabSwitches.current,
        focusLost: focusLost.current,
        durationSec,
        pasteCount: pasteCount.current,
        cameraActive: cameraActive,
      })
      setQuizResult(data.result)
      setApp(data.application)
      // Stop camera after quiz submission
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      setCameraActive(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const submitResume = async (payload) => {
    setBusy(true)
    setError('')
    try {
      const data = await api.submitResume(app.id, payload)
      setResumeResult(data.analysis)
      setApp(data.application)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const startInterview = async () => {
    setBusy(true)
    try {
      const data = await api.startInterview(app.id)
      setTranscript(data.transcript || [])
      setApp(data.application)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const currentRound = app?.currentRound || 1
  const progressPct = interviewDone ? 100 : currentRound === 3 ? 85 : currentRound === 2 ? 55 : 25

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading application...
      </div>
    )
  }

  if ((error && !app) || verificationBlock) {
    return (
      <GlassCard className="p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
        <p className="mt-3">{verificationBlock || error}</p>
        <Link to="/freelancer/verify" className="mt-4 inline-block">
          <Button>Complete identity verification</Button>
        </Link>
        <Link to="/freelancer/projects" className="mt-2 block">
          <Button variant="ghost">Back to jobs</Button>
        </Link>
      </GlassCard>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/freelancer/projects" className="text-sm font-semibold text-[#0a66c2] hover:underline">
          ← Back to jobs
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{app?.project?.title || 'Job application'}</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Complete all three rounds. Your portfolio and skills are evaluated at each step.
        </p>
      </div>

      <div className="flex gap-2">
        {ROUNDS.map((r) => {
          const Icon = r.icon
          const done =
            (r.id === 1 && app?.quizPassed) ||
            (r.id === 2 && app?.resumePassed) ||
            (r.id === 3 && interviewDone)
          const active = currentRound === r.id && !done
          return (
            <div
              key={r.id}
              className={cn(
                'flex flex-1 flex-col items-center rounded-lg border px-2 py-3 text-center text-xs',
                done && 'border-[#0a66c2] bg-[#eef3f8]',
                active && 'border-[#0a66c2] ring-1 ring-[#0a66c2]',
                !done && !active && 'border-[#e0e0e0] bg-white'
              )}
            >
              <Icon className="mb-1 h-5 w-5 text-[#0a66c2]" strokeWidth={1.5} />
              <span className="font-semibold">{r.label}</span>
              {done && <CheckCircle2 className="mt-1 h-4 w-4 text-[#0a66c2]" />}
            </div>
          )
        })}
      </div>
      <Progress value={progressPct} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Round 1 */}
      {!app?.quizPassed && (app?.status === 'round_1' || app?.status === 'quiz_failed') && (
        <GlassCard className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Shield className="h-6 w-6 shrink-0 text-[#0a66c2]" />
              <div>
                <h2 className="font-semibold">Round 1 — Skills & integrity quiz</h2>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  15 questions based on this project and your portfolio. Stay on this tab; switching tabs or
                  pasting answers lowers your integrity score. Minimum 70% score and 55% integrity to pass.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="px-3 py-2 rounded-lg bg-[#eef3f8] border border-[#0a66c2]/30">
                <p className="text-xs font-semibold text-[#0a66c2]">ATTEMPTS</p>
                <p className="text-lg font-bold text-[#0a66c2]">
                  {5 - (app?.quizAttempts || 0)}/5
                </p>
                <p className="text-xs text-[#0a66c2]/70 mt-1">
                  {5 - (app?.quizAttempts || 0) === 5 ? 'First attempt' : 'Attempts remaining'}
                </p>
              </div>
            </div>
          </div>

          {!quizStarted ? (
            <Button 
              onClick={startQuiz} 
              disabled={busy || (app?.quizAttempts >= 5)}
              className="w-full"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Starting...
                </>
              ) : app?.quizAttempts >= 5 ? (
                'Max attempts reached - Contact support'
              ) : (
                'Start quiz'
              )}
            </Button>
          ) : (
            <>
              <div className="flex gap-4">
                <div className="flex-1 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="rounded-lg border border-[#e0e0e0] p-4">
                      <p className="text-sm font-medium">
                        {idx + 1}. {q.question}
                        {q.skill && <Badge variant="secondary" className="ml-2">{q.skill}</Badge>}
                      </p>
                      <div className="mt-3 space-y-2">
                        {(q.options || []).map((opt, oi) => (
                          <label
                            key={oi}
                            className={cn(
                              'flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2 text-sm',
                              answers[q.id] === oi
                                ? 'border-[#0a66c2] bg-[#eef3f8]'
                                : 'border-[#e0e0e0] hover:bg-[#f3f2ef]'
                            )}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={answers[q.id] === oi}
                              onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="w-80 flex flex-col gap-3">
                  {cameraActive && videoRef.current && (
                    <div className="relative rounded-lg border-2 border-[#0a66c2] overflow-hidden bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                        <Camera className="h-3 w-3" /> Recording
                      </div>
                    </div>
                  )}
                  {cameraPermissionDenied && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                      <div className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Camera permission denied</span>
                      </div>
                      <p className="mt-2 text-xs text-amber-600">Enable camera in your browser settings to improve verification.</p>
                    </div>
                  )}
                  {!cameraActive && !cameraPermissionDenied && (
                    <div className="rounded-lg border border-[#0a66c2]/20 bg-[#eef3f8] p-4 text-center">
                      <CameraOff className="h-8 w-8 mx-auto text-[#0a66c2]/40 mb-2" />
                      <p className="text-xs text-[#0a66c2]">Camera initializing...</p>
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={submitQuiz} disabled={busy} className="w-full">
                Submit quiz ({questions.length} questions)
              </Button>
            </>
          )}

          {quizResult && (
            <div className="rounded-lg border px-4 py-3 text-sm space-y-3">
              {quizResult.passed ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-700 border-b border-emerald-200 pb-3">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Quiz passed!</span>
                  </div>
                  <div className="text-emerald-700">
                    <p>Score: <strong>{quizResult.score}%</strong> | Integrity: <strong>{quizResult.integrity}%</strong></p>
                    <p className="mt-2 text-xs">Moving to next round — resume review...</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 border-b border-red-200 pb-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <span className="font-semibold">Quiz not passed</span>
                    </div>
                    <div className="text-right px-3 py-2 rounded bg-red-50 border border-red-200">
                      <p className="text-xs font-semibold text-red-600">ATTEMPT</p>
                      <p className="text-lg font-bold text-red-600">{app?.quizAttempts || 1}/5</p>
                      <p className="text-xs text-red-500 mt-1">{5 - (app?.quizAttempts || 0)} left</p>
                    </div>
                  </div>
                  <div className="text-red-600 text-sm space-y-2">
                    <div>
                      <p className="font-medium">Score: <strong>{quizResult.score}%</strong> | Integrity: <strong>{quizResult.integrity}%</strong></p>
                      <p className="text-xs text-red-500 mt-1">Requirement: 70% score + 55% integrity to pass</p>
                    </div>
                    {app?.quizAttempts >= 5 && (
                      <div className="mt-3 p-2 rounded bg-red-100 border border-red-300">
                        <p className="text-xs font-semibold text-red-700">❌ Maximum attempts reached</p>
                        <p className="text-xs text-red-600 mt-1">You have used all 5 attempts. Please contact support to request additional attempts.</p>
                      </div>
                    )}
                  </div>
                  {app?.quizAttempts < 5 && (
                    <Button
                      className="w-full"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true)
                        try {
                          await api.retakeQuiz(app.id)
                          setQuizStarted(false)
                          setQuestions([])
                          setAnswers({})
                          setQuizResult(null)
                          tabSwitches.current = 0
                          focusLost.current = 0
                          pasteCount.current = 0
                          await load()
                        } catch (err) {
                          setError(err.message)
                        } finally {
                          setBusy(false)
                        }
                      }}
                    >
                      Retake quiz ({5 - (app?.quizAttempts || 0)} attempts remaining)
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </GlassCard>
      )}

      {/* Round 2 */}
      {app?.quizPassed && !app?.resumePassed && (
        <GlassCard className="p-6">
          <ResumeUploadPanel
            onSubmit={submitResume}
            busy={busy}
            result={resumeResult}
            quizPassed={quizResult?.passed}
            app={app}
          />
        </GlassCard>
      )}

      {app?.resumePassed && !interviewDone && (
        <GlassCard className="p-6">
          <VoiceInterviewPanel
            transcript={transcript}
            onStart={startInterview}
            onSendMessage={async (msg) => {
              setTranscript((t) => [...t, { role: 'candidate', text: msg }])
              setBusy(true)
              setError('')
              try {
                const data = await api.sendInterviewMessage(app.id, msg)
                setTranscript((t) => [...t, { role: 'interviewer', text: data.reply }])
                setApp(data.application)
                if (data.complete) {
                  setInterviewDone(true)
                  setInterviewResult(data.result)
                }
              } catch (err) {
                setError(err.message)
              } finally {
                setBusy(false)
              }
            }}
            busy={busy}
            complete={interviewDone}
          />
        </GlassCard>
      )}

      {interviewDone && (
        <GlassCard className="p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#0a66c2]" />
          <h2 className="mt-4 text-lg font-semibold">Application complete</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Overall score: <strong>{app?.overallScore ?? '—'}</strong>
            {app?.recommended && ' — Recommended to the client'}
          </p>
          {interviewResult?.summary && (
            <p className="mt-3 text-sm">{interviewResult.summary}</p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/freelancer/applications"><Button variant="outline">My applications</Button></Link>
            <Link to="/freelancer/projects"><Button>Browse more jobs</Button></Link>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
