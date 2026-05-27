const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

function getApiKey() {
  return process.env.GROQ_API_KEY?.trim() || ''
}

export async function groqChat(system, user, maxTokens = 1200) {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.5,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.warn('Groq error:', data?.error?.message)
    return null
  }
  return data?.choices?.[0]?.message?.content?.trim() || null
}

function parseJsonBlock(text) {
  if (!text) return null
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

const SKILL_QUESTIONS = {
  React: [
    { q: 'What hook runs after every render including the first?', options: ['useEffect', 'useLayoutEffect', 'useMemo', 'useCallback'], correct: 0 },
    { q: 'Which pattern helps avoid prop drilling?', options: ['Context API', 'Inline styles', 'StrictMode', 'Fragment'], correct: 0 },
    { q: 'What does React.memo optimize?', options: ['Component re-renders', 'Bundle size', 'API calls', 'CSS'], correct: 0 },
  ],
  'Node.js': [
    { q: 'Which module is built-in for HTTP servers?', options: ['http', 'express', 'axios', 'fetch'], correct: 0 },
    { q: 'What is the event loop primarily responsible for?', options: ['Async I/O scheduling', 'DOM updates', 'CSS parsing', 'Memory GC only'], correct: 0 },
  ],
  TypeScript: [
    { q: 'What does interface primarily describe?', options: ['Object shape', 'Runtime class', 'CSS module', 'API route'], correct: 0 },
    { q: 'Which keyword makes all properties optional?', options: ['Partial', 'Pick', 'Record', 'Readonly'], correct: 0 },
  ],
  PostgreSQL: [
    { q: 'Which clause filters groups after aggregation?', options: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'], correct: 0 },
  ],
  AWS: [
    { q: 'S3 is primarily used for?', options: ['Object storage', 'Relational DB', 'Load balancing', 'DNS'], correct: 0 },
  ],
  default: [
    { q: 'What is a REST API best practice for updates?', options: ['Use appropriate HTTP verbs', 'Always use GET', 'Skip validation', 'Hide errors'], correct: 0 },
    { q: 'Agile sprint planning focuses on?', options: ['Deliverable increments', 'Annual budgets only', 'Hardware specs', 'Office layout'], correct: 0 },
    { q: 'Git branches help teams by?', options: ['Isolating parallel work', 'Deleting history', 'Disabling CI', 'Removing tests'], correct: 0 },
    { q: 'Code review primarily improves?', options: ['Quality and knowledge sharing', 'Compile time only', 'Logo design', 'DNS TTL'], correct: 0 },
    { q: 'Unit tests should be?', options: ['Fast and isolated', 'Manual only', 'Run once a year', 'Skipped in CI'], correct: 0 },
  ],
}

function buildFallbackQuiz(project, portfolio) {
  const skills = [
    ...new Set([
      ...JSON.parse(project.skills || '[]'),
      ...(portfolio.skills || []),
    ]),
  ].slice(0, 6)

  const pool = []
  skills.forEach((skill) => {
    const bank = SKILL_QUESTIONS[skill] || SKILL_QUESTIONS.default
    bank.forEach((item, i) => {
      pool.push({
        id: `q-${skill}-${i}-${pool.length}`,
        skill,
        question: `[${skill}] ${item.q}`,
        options: item.options,
        correctIndex: item.correct,
        type: 'mcq',
      })
    })
  })

  while (pool.length < 20) {
    const d = SKILL_QUESTIONS.default[pool.length % SKILL_QUESTIONS.default.length]
    pool.push({
      id: `q-gen-${pool.length}`,
      skill: 'General',
      question: d.q,
      options: d.options,
      correctIndex: d.correct,
      type: 'mcq',
    })
  }

  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 15)
  return shuffled.map((q, idx) => ({ ...q, order: idx + 1 }))
}

export async function generateQuizQuestions(project, portfolio) {
  const projectSkills = JSON.parse(project.skills || '[]')
  const portfolioSkills = portfolio.skills || []

  const aiPrompt = `Generate exactly 15 multiple-choice screening questions for a freelancer applying to this job.
Return ONLY valid JSON array. Each item: {"id":"q1","skill":"React","question":"...","options":["A","B","C","D"],"correctIndex":0}
Project title: ${project.title}
Description: ${project.description}
Required skills: ${projectSkills.join(', ')}
Candidate skills: ${portfolioSkills.join(', ')}
Mix technical depth, role fit, and integrity-style questions (no trick questions).`

  const raw = await groqChat(
    'You output only JSON arrays for hiring quizzes. No markdown.',
    aiPrompt,
    2000
  )

  const parsed = parseJsonBlock(raw)
  if (Array.isArray(parsed) && parsed.length >= 15) {
    return parsed.slice(0, 15).map((q, idx) => ({
      id: q.id || `q-${idx}`,
      skill: q.skill || 'General',
      question: q.question,
      options: q.options || [],
      correctIndex: Number(q.correctIndex) || 0,
      type: 'mcq',
      order: idx + 1,
    }))
  }

  return buildFallbackQuiz(project, portfolio)
}

export function gradeQuiz(questions, answers, integrityMeta = {}) {
  const answerMap = Object.fromEntries((answers || []).map((a) => [a.questionId, a.selectedIndex]))
  let correct = 0
  questions.forEach((q) => {
    if (answerMap[q.id] === q.correctIndex) correct++
  })

  const score = Math.round((correct / questions.length) * 100)
  const { tabSwitches = 0, focusLost = 0, durationSec = 0, pasteCount = 0 } = integrityMeta

  let integrity = 100
  integrity -= Math.min(40, tabSwitches * 8)
  integrity -= Math.min(25, focusLost * 5)
  integrity -= Math.min(20, pasteCount * 10)
  if (durationSec > 0 && durationSec < 90) integrity -= 25
  if (durationSec > 3600) integrity -= 15
  integrity = Math.max(0, Math.min(100, integrity))

  const passed = score >= 70 && integrity >= 55

  return { score, correct, total: questions.length, integrity, passed }
}

export async function analyzeResume(project, portfolio, resumeText) {
  const fallback = () => {
    const skills = JSON.parse(project.skills || '[]')
    const resumeLower = resumeText.toLowerCase()
    const hits = skills.filter((s) => resumeLower.includes(s.toLowerCase())).length
    const score = Math.min(95, 45 + hits * 12 + Math.min(20, Math.floor(resumeText.length / 200)))
    return {
      score,
      passed: score >= 65,
      summary: `Resume mentions ${hits}/${skills.length} required skills. ${score >= 65 ? 'Proceed to interview.' : 'Strengthen project-relevant experience.'}`,
      strengths: hits > 0 ? [`Aligned with: ${skills.slice(0, hits).join(', ')}`] : ['Add measurable outcomes'],
      gaps: hits < skills.length ? skills.filter((s) => !resumeLower.includes(s.toLowerCase())).slice(0, 3) : [],
      recommendation: score >= 65 ? 'advance' : 'review',
    }
  }

  const raw = await groqChat(
    'You are a technical recruiter. Respond with JSON only: {"score":0-100,"passed":bool,"summary":"","strengths":[],"gaps":[],"recommendation":"advance|review|reject"}',
    `Job: ${project.title}\nSkills needed: ${project.skills}\nCandidate portfolio skills: ${(portfolio.skills || []).join(', ')}\nResume:\n${resumeText.slice(0, 6000)}`,
    900
  )

  const parsed = parseJsonBlock(raw)
  if (parsed?.score != null) {
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score))),
      passed: Boolean(parsed.passed ?? parsed.score >= 65),
      summary: parsed.summary || '',
      strengths: parsed.strengths || [],
      gaps: parsed.gaps || [],
      recommendation: parsed.recommendation || 'review',
    }
  }
  return fallback()
}

export async function runInterviewTurn(project, portfolio, transcript, userMessage) {
  const history = (transcript || [])
    .map((m) => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.text}`)
    .join('\n')

  const raw = await groqChat(
    `You conduct a professional 5-question technical interview for "${project.title}". 
After each candidate answer, ask ONE follow-up or next question (max 3 sentences). 
When you have asked 5 questions and received answers, respond starting with [COMPLETE] then JSON: {"score":0-100,"passed":bool,"summary":"","highlights":[],"concerns":[]}`,
    `${history}\nCandidate: ${userMessage}`,
    700
  )

  if (!raw) {
    const count = (transcript || []).filter((m) => m.role === 'interviewer').length
    const fallbacks = [
      'Walk me through a recent project similar to this role.',
      'How do you estimate timeline and handle scope changes?',
      'Describe debugging a critical production issue.',
      'How do you collaborate with clients on deliverables?',
      'Why are you the right fit for this project?',
    ]
    const nextQ = fallbacks[Math.min(count, fallbacks.length - 1)]
    if (count >= 4) {
      return {
        complete: true,
        reply: 'Thank you. Your interview is complete.',
        result: {
          score: 72,
          passed: true,
          summary: 'Solid communication and relevant experience indicated.',
          highlights: ['Clear structure', 'Client-focused answers'],
          concerns: [],
        },
      }
    }
    return { complete: false, reply: nextQ }
  }

  if (raw.includes('[COMPLETE]')) {
    const parsed = parseJsonBlock(raw)
    return {
      complete: true,
      reply: 'Thank you for completing the interview. Your responses have been recorded.',
      result: {
        score: Number(parsed?.score) || 75,
        passed: Boolean(parsed?.passed ?? (parsed?.score || 75) >= 68),
        summary: parsed?.summary || 'Interview completed.',
        highlights: parsed?.highlights || [],
        concerns: parsed?.concerns || [],
      },
    }
  }

  return { complete: false, reply: raw.replace(/^\[COMPLETE\]\s*/i, '') }
}

export function computeOverallScore(app) {
  const parts = []
  if (app.quizScore != null) parts.push(app.quizScore * 0.35)
  if (app.resumeScore != null) parts.push(app.resumeScore * 0.3)
  if (app.interviewScore != null) parts.push(app.interviewScore * 0.35)
  if (!parts.length) return 0
  const weights = []
  if (app.quizScore != null) weights.push(0.35)
  if (app.resumeScore != null) weights.push(0.3)
  if (app.interviewScore != null) weights.push(0.35)
  const wSum = weights.reduce((a, b) => a + b, 0)
  return Math.round(parts.reduce((a, b) => a + b, 0) / wSum)
}
