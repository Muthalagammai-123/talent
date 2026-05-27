import { getGroqApiKey, groqComplete } from '@/lib/groq'
import { buildPortfolioContext, parseJsonFromGroq } from '@/lib/portfolioContext'

const REVIEW_STORAGE = 'talentstage-ai-review'

export function loadSavedReview() {
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveReview(review) {
  localStorage.setItem(REVIEW_STORAGE, JSON.stringify({ ...review, reviewedAt: new Date().toISOString() }))
}

export async function reviewPortfolioAI(portfolio, resumeText = '') {
  const apiKey = getGroqApiKey()
  if (!apiKey) throw new Error('Groq API key missing. Add VITE_GROQ_API_KEY to .env')

  const context = buildPortfolioContext(portfolio, resumeText)

  const text = await groqComplete({
    apiKey,
    system: `You are an expert technical recruiter and portfolio reviewer for TalentStage freelancer marketplace.
Analyze the freelancer profile below (RAG context). Respond ONLY with valid JSON, no markdown fences.`,
    user: `${context}

Return JSON:
{
  "score": <number 0-100>,
  "summary": "<2 sentences overall assessment>",
  "strengths": ["<string>", ...],
  "improvements": ["<actionable tip>", ...],
  "verifiedSkills": ["<skills clearly demonstrated>", ...],
  "pendingSkills": ["<skills listed but weak evidence>", ...],
  "categoryScores": {
    "profile": <0-100>,
    "skills": <0-100>,
    "projects": <0-100>,
    "experience": <0-100>
  },
  "matchHighlights": [
    { "project": "<job title>", "match": <0-100>, "reason": "<short>" }
  ]
}`,
    maxTokens: 1200,
    temperature: 0.4,
  })

  const review = parseJsonFromGroq(text)
  saveReview(review)
  return review
}

export async function coachChatAI({ portfolio, resumeText, messages }) {
  const apiKey = getGroqApiKey()
  if (!apiKey) throw new Error('Groq API key missing')

  const context = buildPortfolioContext(portfolio, resumeText)

  const apiMessages = [
    {
      role: 'system',
      content: `You are TalentStage AI Portfolio Coach. Use this freelancer data as ground truth (RAG):
${context}

Give specific, actionable advice to improve their portfolio, win clients, and pass interviews.
Be concise (2-4 sentences unless asked for lists). Friendly professional tone.`,
    },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  return groqComplete({
    apiKey,
    messages: apiMessages,
    maxTokens: 600,
    temperature: 0.7,
  })
}

export async function generateMCQsAI(portfolio) {
  const apiKey = getGroqApiKey()
  if (!apiKey) throw new Error('Groq API key missing')

  const skills = (portfolio.skills || []).join(', ') || 'general programming'
  const context = buildPortfolioContext(portfolio)

  const text = await groqComplete({
    apiKey,
    system: 'You create skill assessment MCQs for freelancers. Respond ONLY with valid JSON array.',
    user: `Based on skills: ${skills}
Profile context:
${context}

Return JSON array of 5 MCQs:
[{ "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct": "A", "skill": "React" }]`,
    maxTokens: 1500,
    temperature: 0.5,
  })

  return parseJsonFromGroq(text)
}

export async function generateCodingTestsAI(portfolio) {
  const apiKey = getGroqApiKey()
  if (!apiKey) throw new Error('Groq API key missing')

  const skills = (portfolio.skills || []).join(', ') || 'JavaScript'
  const context = buildPortfolioContext(portfolio)

  const text = await groqComplete({
    apiKey,
    system: 'You create practical coding challenges for freelancer skill verification. Respond ONLY with valid JSON array.',
    user: `Skills: ${skills}
Profile:
${context}

Return JSON array of 3 coding challenges:
[{
  "title": "...",
  "difficulty": "easy|medium|hard",
  "description": "...",
  "starterCode": "// optional starter",
  "hints": ["..."],
  "skill": "Node.js"
}]`,
    maxTokens: 1500,
    temperature: 0.5,
  })

  return parseJsonFromGroq(text)
}

export async function generateInterviewQuestionsAI(portfolio) {
  const apiKey = getGroqApiKey()
  if (!apiKey) throw new Error('Groq API key missing')

  const context = buildPortfolioContext(portfolio)

  const text = await groqComplete({
    apiKey,
    system: 'You are an interview coach. Respond ONLY with valid JSON.',
    user: `Profile:
${context}

Return JSON:
{
  "behavioral": ["question1", ...5 items],
  "technical": ["question1", ...5 items],
  "portfolioSpecific": ["question referencing their projects", ...3 items]
}`,
    maxTokens: 1000,
    temperature: 0.6,
  })

  return parseJsonFromGroq(text)
}

export async function generateSamplePortfolioAI(skillFocus = 'Full-Stack React') {
  const apiKey = getGroqApiKey()
  if (!apiKey) throw new Error('Groq API key missing')

  const text = await groqComplete({
    apiKey,
    system: 'You write exemplary freelancer portfolio sections. Respond ONLY with valid JSON.',
    user: `Create a sample portfolio outline for a ${skillFocus} freelancer that others can copy.
Return JSON:
{
  "title": "...",
  "bio": "...",
  "description": "...",
  "skills": ["..."],
  "sampleProjects": [{ "title": "...", "description": "...", "tech": ["..."] }],
  "tips": ["..."]
}`,
    maxTokens: 900,
    temperature: 0.7,
  })

  return parseJsonFromGroq(text)
}
