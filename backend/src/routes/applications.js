import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { parseJson, stringifyJson } from '../lib/json.js'
import { authRequired, loadUser, requireRole } from '../middleware/auth.js'
import { getFreelancerDisplayName } from '../lib/freelancerDisplay.js'
import {
  generateQuizQuestions,
  gradeQuiz,
  analyzeResume,
  runInterviewTurn,
  computeOverallScore,
} from '../lib/ai.js'

const router = Router()

const defaultPortfolio = { skills: [], name: '', title: '', bio: '' }

async function getPortfolioData(userId) {
  const row = await prisma.portfolio.findUnique({ where: { userId } })
  return parseJson(row?.data, defaultPortfolio)
}

function formatApplication(app, extras = {}) {
  return {
    id: app.id,
    projectId: app.projectId,
    freelancerId: app.freelancerId,
    status: app.status,
    currentRound: app.currentRound,
    quizScore: app.quizScore,
    quizPassed: app.quizPassed,
    quizIntegrity: app.quizIntegrity,
    quizTabSwitches: app.quizTabSwitches,
    quizFocusLost: app.quizFocusLost,
    quizAttempts: app.quizAttempts || 0,
    quizCameraActive: app.quizCameraActive || false,
    resumeScore: app.resumeScore,
    resumePassed: app.resumePassed,
    resumeAnalysis: parseJson(app.resumeAnalysis, null),
    interviewScore: app.interviewScore,
    interviewPassed: app.interviewPassed,
    overallScore: app.overallScore,
    recommended: app.recommended,
    clientReviewed: app.clientReviewed,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    project: app.project
      ? {
          id: app.project.id,
          title: app.project.title,
          description: app.project.description,
          budget: app.project.budget,
          skills: parseJson(app.project.skills, []),
        }
      : undefined,
    ...extras,
  }
}

router.post('/start', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const { projectId } = req.body
    if (!projectId) return res.status(400).json({ error: 'projectId required' })

    const verification = await prisma.identityVerification.findUnique({
      where: { userId: req.userId },
    })
    if (!verification || verification.status !== 'verified') {
      return res.status(403).json({
        error: 'Complete identity verification before applying to projects',
        code: 'VERIFICATION_REQUIRED',
        verificationStatus: verification?.status || 'unverified',
      })
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project || project.status !== 'open') {
      return res.status(400).json({ error: 'Project is not open for applications' })
    }

    let app = await prisma.jobApplication.findUnique({
      where: { projectId_freelancerId: { projectId, freelancerId: req.userId } },
      include: { project: true },
    })

    if (!app) {
      app = await prisma.jobApplication.create({
        data: {
          projectId,
          freelancerId: req.userId,
          status: 'round_1',
          currentRound: 1,
        },
        include: { project: true },
      })
    }

    res.json({ application: formatApplication(app) })
  } catch (err) {
    next(err)
  }
})

router.get('/mine', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const apps = await prisma.jobApplication.findMany({
      where: { freelancerId: req.userId },
      include: { project: true },
      orderBy: { updatedAt: 'desc' },
    })
    res.json({ applications: apps.map((a) => formatApplication(a)) })
  } catch (err) {
    next(err)
  }
})

router.get('/client/list', authRequired, loadUser, requireRole('client'), async (req, res, next) => {
  try {
    const { projectId } = req.query
    const projects = await prisma.project.findMany({
      where: { clientId: req.userId, ...(projectId ? { id: String(projectId) } : {}) },
      select: { id: true },
    })
    const projectIds = projects.map((p) => p.id)

    const apps = await prisma.jobApplication.findMany({
      where: { projectId: { in: projectIds } },
      include: { project: true, freelancer: { select: { id: true, name: true, email: true } } },
      orderBy: [{ recommended: 'desc' }, { overallScore: 'desc' }, { updatedAt: 'desc' }],
    })

    const rows = await Promise.all(
      apps.map(async (app) => {
        const name = await getFreelancerDisplayName(app.freelancerId, app.freelancer?.name)
        const portfolio = await getPortfolioData(app.freelancerId)
        const quizQuestions = parseJson(app.quizQuestions, [])
        const quizAnswers = parseJson(app.quizAnswers, [])
        const identity = await prisma.identityVerification.findUnique({
          where: { userId: app.freelancerId },
        })
        const fp = await prisma.freelancerProfile.findUnique({
          where: { userId: app.freelancerId },
        })

        return formatApplication(app, {
          freelancerName: name,
          freelancerEmail: app.freelancer?.email,
          verification: identity
            ? {
                status: identity.status,
                trustScore: identity.trustScore,
                verified: identity.status === 'verified',
              }
            : { status: 'unverified', trustScore: 50, verified: false },
          portfolio: {
            name: portfolio.name,
            title: portfolio.title,
            skills: portfolio.skills,
            bio: portfolio.bio,
            aiScore: portfolio.aiScore,
            verified: fp?.verified ?? identity?.status === 'verified',
            trustScore: fp?.trustScore ?? identity?.trustScore ?? 50,
            projects: (portfolio.projects || []).slice(0, 4),
          },
          resumeText: app.resumeText,
          resumeFileName: app.resumeFileName,
          quizSummary: {
            score: app.quizScore,
            integrity: app.quizIntegrity,
            passed: app.quizPassed,
            answered: quizAnswers.length,
            total: quizQuestions.length,
          },
          interviewTranscript: parseJson(app.interviewTranscript, []).filter(
            (m) => m.role !== 'system'
          ),
          interviewResult: (() => {
            const sys = parseJson(app.interviewTranscript, []).find((m) => m.role === 'system')
            return sys?.text ? parseJson(sys.text, null) : null
          })(),
        })
      })
    )

    res.json({ applications: rows })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', authRequired, loadUser, async (req, res, next) => {
  try {
    const app = await prisma.jobApplication.findUnique({
      where: { id: req.params.id },
      include: { project: true, freelancer: { select: { id: true, name: true, email: true } } },
    })
    if (!app) return res.status(404).json({ error: 'Application not found' })

    const isOwner = app.freelancerId === req.userId
    const isClient =
      req.user.role === 'client' && app.project.clientId === req.userId

    if (!isOwner && !isClient) return res.status(403).json({ error: 'Forbidden' })

    const portfolio = isClient
      ? await getPortfolioData(app.freelancerId)
      : await getPortfolioData(req.userId)

    const questions = isOwner ? parseJson(app.quizQuestions, null) : null
    const safeQuestions = questions?.map(({ correctIndex, ...q }) => q) || null

    res.json({
      application: formatApplication(app, {
        quizQuestions: safeQuestions,
        interviewTranscript: isOwner || isClient ? parseJson(app.interviewTranscript, []) : null,
        portfolio: isClient ? portfolio : undefined,
      }),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/quiz/start', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const app = await prisma.jobApplication.findFirst({
      where: { id: req.params.id, freelancerId: req.userId },
      include: { project: true },
    })
    if (!app) return res.status(404).json({ error: 'Application not found' })
    if (app.currentRound !== 1 && app.status !== 'round_1') {
      return res.status(400).json({ error: 'Quiz not available for current round' })
    }

    const portfolio = await getPortfolioData(req.userId)
    const questions = await generateQuizQuestions(app.project, portfolio)

    const updated = await prisma.jobApplication.update({
      where: { id: app.id },
      data: {
        quizQuestions: stringifyJson(questions),
        quizStartedAt: new Date(),
        quizTabSwitches: 0,
        quizFocusLost: 0,
      },
      include: { project: true },
    })

    const clientQuestions = questions.map(({ correctIndex, ...q }) => q)
    res.json({
      application: formatApplication(updated),
      questions: clientQuestions,
      rules: {
        minQuestions: 15,
        passScore: 70,
        minIntegrity: 55,
        antiCheat: 'Tab switches and fast submissions lower integrity score.',
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/quiz/submit', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const { answers, tabSwitches = 0, focusLost = 0, durationSec = 0, pasteCount = 0, cameraActive = false } = req.body
    const app = await prisma.jobApplication.findFirst({
      where: { id: req.params.id, freelancerId: req.userId },
    })
    if (!app) return res.status(404).json({ error: 'Application not found' })

    const questions = parseJson(app.quizQuestions, [])
    if (questions.length < 15) {
      return res.status(400).json({ error: 'Quiz not started or incomplete question set' })
    }
    if (!Array.isArray(answers) || answers.length < 15) {
      return res.status(400).json({ error: 'Answer all 15 questions' })
    }

    const result = gradeQuiz(questions, answers, {
      tabSwitches: tabSwitches + (app.quizTabSwitches || 0),
      focusLost: focusLost + (app.quizFocusLost || 0),
      durationSec,
      pasteCount,
    })

    const updated = await prisma.jobApplication.update({
      where: { id: app.id },
      data: {
        quizAnswers: stringifyJson(answers),
        quizScore: result.score,
        quizIntegrity: result.integrity,
        quizPassed: result.passed,
        quizTabSwitches: tabSwitches,
        quizFocusLost: focusLost,
        quizCompletedAt: new Date(),
        quizCameraActive: cameraActive,
        quizAttempts: (app.quizAttempts || 0) + 1,
        status: result.passed ? 'round_2' : 'quiz_failed',
        currentRound: result.passed ? 2 : 1,
      },
      include: { project: true },
    })

    res.json({ 
      application: formatApplication(updated), 
      result: {
        ...result,
        passed: result.passed,
        score: result.score,
        integrity: result.integrity,
      }
    })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/quiz/retake', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const app = await prisma.jobApplication.findFirst({
      where: { id: req.params.id, freelancerId: req.userId },
      include: { project: true },
    })
    if (!app) return res.status(404).json({ error: 'Application not found' })
    if (app.quizPassed) return res.status(400).json({ error: 'Quiz already passed' })

    const attempts = app.quizAttempts || 0
    if (attempts >= 5) {
      return res.status(400).json({ error: 'Maximum 5 quiz attempts exceeded. Contact support for more attempts.' })
    }

    const updated = await prisma.jobApplication.update({
      where: { id: app.id },
      data: {
        status: 'round_1',
        currentRound: 1,
        quizQuestions: null,
        quizAnswers: null,
        quizScore: null,
        quizPassed: null,
        quizIntegrity: null,
        quizTabSwitches: 0,
        quizFocusLost: 0,
        quizStartedAt: null,
        quizCompletedAt: null,
      },
      include: { project: true },
    })

    res.json({ 
      application: formatApplication(updated),
      attemptsRemaining: 5 - (attempts + 1)
    })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/resume', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const { resumeText, resumeFileName, resumeFileType, resumeExtractMethod } = req.body
    if (!resumeText?.trim() || resumeText.trim().length < 80) {
      return res.status(400).json({ error: 'Upload a resume file or paste at least 80 characters of text' })
    }

    const app = await prisma.jobApplication.findFirst({
      where: { id: req.params.id, freelancerId: req.userId },
      include: { project: true },
    })
    if (!app) return res.status(404).json({ error: 'Application not found' })
    if (!app.quizPassed) return res.status(400).json({ error: 'Pass the quiz round first' })

    const portfolio = await getPortfolioData(req.userId)
    const analysis = await analyzeResume(app.project, portfolio, resumeText)

    const updated = await prisma.jobApplication.update({
      where: { id: app.id },
      data: {
        resumeText: resumeText.trim(),
        resumeFileName: resumeFileName || 'resume.txt',
        resumeFileType: resumeFileType || 'text/plain',
        resumeExtractMethod: resumeExtractMethod || 'paste',
        resumeScore: analysis.score,
        resumeAnalysis: stringifyJson(analysis),
        resumePassed: analysis.passed,
        status: analysis.passed ? 'round_3' : 'resume_review',
        currentRound: analysis.passed ? 3 : 2,
      },
      include: { project: true },
    })

    res.json({ application: formatApplication(updated), analysis })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/interview/start', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const app = await prisma.jobApplication.findFirst({
      where: { id: req.params.id, freelancerId: req.userId },
      include: { project: true },
    })
    if (!app) return res.status(404).json({ error: 'Application not found' })
    if (!app.resumePassed) return res.status(400).json({ error: 'Complete resume screening first' })

    let transcript = parseJson(app.interviewTranscript, [])
    if (transcript.length > 0) {
      return res.json({
        application: formatApplication(app),
        transcript,
        reply: transcript[transcript.length - 1]?.text,
        complete: app.status === 'completed',
      })
    }

    const portfolio = await getPortfolioData(req.userId)
    const opening = await runInterviewTurn(
      app.project,
      portfolio,
      [],
      `I am ${portfolio.name || req.user.name}, ready to interview for ${app.project.title}.`
    )

    transcript = [
      { role: 'candidate', text: `Ready to interview for ${app.project.title}.`, at: new Date().toISOString() },
      { role: 'interviewer', text: opening.reply, at: new Date().toISOString() },
    ]

    const updated = await prisma.jobApplication.update({
      where: { id: app.id },
      data: { interviewTranscript: stringifyJson(transcript), status: 'round_3', currentRound: 3 },
      include: { project: true },
    })

    res.json({
      application: formatApplication(updated),
      transcript,
      reply: opening.reply,
      complete: false,
    })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/interview/message', authRequired, loadUser, requireRole('freelancer'), async (req, res, next) => {
  try {
    const { message } = req.body
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' })

    const app = await prisma.jobApplication.findFirst({
      where: { id: req.params.id, freelancerId: req.userId },
      include: { project: true },
    })
    if (!app) return res.status(404).json({ error: 'Application not found' })
    if (!app.resumePassed) return res.status(400).json({ error: 'Complete resume screening first' })

    const portfolio = await getPortfolioData(req.userId)
    let transcript = parseJson(app.interviewTranscript, [])

    transcript = [...transcript, { role: 'candidate', text: message.trim(), at: new Date().toISOString() }]

    const turn = await runInterviewTurn(app.project, portfolio, transcript, message.trim())
    transcript = [...transcript, { role: 'interviewer', text: turn.reply, at: new Date().toISOString() }]

    const updateData = {
      interviewTranscript: stringifyJson(transcript),
      status: 'round_3',
      currentRound: 3,
    }

    if (turn.complete && turn.result) {
      const overall = computeOverallScore({
        quizScore: app.quizScore,
        resumeScore: app.resumeScore,
        interviewScore: turn.result.score,
      })
      Object.assign(updateData, {
        interviewScore: turn.result.score,
        interviewPassed: turn.result.passed,
        overallScore: overall,
        status: 'completed',
        currentRound: 3,
        recommended: turn.result.passed && overall >= 72,
      })
      updateData.interviewTranscript = stringifyJson([
        ...transcript,
        { role: 'system', text: stringifyJson(turn.result), at: new Date().toISOString() },
      ])
    }

    const updated = await prisma.jobApplication.update({
      where: { id: app.id },
      data: updateData,
      include: { project: true },
    })

    res.json({
      application: formatApplication(updated),
      reply: turn.reply,
      complete: turn.complete,
      result: turn.result || null,
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/recommend', authRequired, loadUser, requireRole('client'), async (req, res, next) => {
  try {
    const { recommended } = req.body
    const app = await prisma.jobApplication.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    })
    if (!app || app.project.clientId !== req.userId) {
      return res.status(404).json({ error: 'Application not found' })
    }

    const updated = await prisma.jobApplication.update({
      where: { id: app.id },
      data: {
        recommended: Boolean(recommended),
        clientReviewed: true,
      },
      include: { project: true },
    })

    res.json({ application: formatApplication(updated) })
  } catch (err) {
    next(err)
  }
})

export default router
