const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.1-8b-instant'
const API_KEY_STORAGE = 'talentstage-groq-api-key'

export function getGroqApiKey() {
  const fromEnv = import.meta.env.VITE_GROQ_API_KEY
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim()
  try {
    return localStorage.getItem(API_KEY_STORAGE)?.trim() || ''
  } catch {
    return ''
  }
}

export function setGroqApiKey(key) {
  if (key) localStorage.setItem(API_KEY_STORAGE, key.trim())
  else localStorage.removeItem(API_KEY_STORAGE)
}

export function hasGroqApiKey() {
  return Boolean(getGroqApiKey())
}

function buildSystemPrompt(contactName, viewerRole = 'freelancer') {
  if (viewerRole === 'client') {
    return `You are ${contactName}, a skilled freelancer on TalentStage (marketplace like Upwork).
You are chatting with a client who may hire you for a project. Stay in character as the freelancer.
Reply in 1-3 short sentences. Be professional, enthusiastic, and clear about your availability, skills, and timeline.
Discuss deliverables, rates, and questions about the project scope when relevant.
Do not mention that you are an AI. Do not use markdown unless necessary.`
  }
  return `You are ${contactName}, a client hiring freelancers on TalentStage (a marketplace like Upwork).
You are chatting with a freelancer in direct messages. Stay in character as the client.
Reply in 1-3 short sentences. Be professional, friendly, and practical.
Discuss project scope, budget, timeline, milestones, and next steps when relevant.
Do not mention that you are an AI. Do not use markdown unless necessary.`
}

/**
 * @param {object} params
 * @param {string} params.apiKey
 * @param {Array<{ self: boolean, text: string }>} params.messages - full thread including latest user message
 * @param {string} params.contactName
 */
export async function chatWithGroq({ apiKey, messages, contactName, viewerRole = 'freelancer' }) {
  if (!apiKey) {
    throw new Error('Groq API key is missing. Add VITE_GROQ_API_KEY to .env or enter your key in chat settings.')
  }

  const apiMessages = [
    { role: 'system', content: buildSystemPrompt(contactName, viewerRole) },
    ...messages
      .filter((m) => m.text && !m.isTyping && !m.isError)
      .map((m) => ({
        role: m.self ? 'user' : 'assistant',
        content: m.text,
      })),
  ]

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: apiMessages,
      max_tokens: 300,
      temperature: 0.75,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errMsg = data?.error?.message || `Groq API error (${response.status})`
    throw new Error(errMsg)
  }

  const content = data?.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('Empty response from Groq')
  return content
}

/**
 * Generic Groq completion for AI features
 */
export async function groqComplete({
  apiKey = getGroqApiKey(),
  system,
  user,
  messages,
  maxTokens = 800,
  temperature = 0.6,
  model = DEFAULT_MODEL,
}) {
  if (!apiKey) {
    throw new Error('Groq API key is missing. Add VITE_GROQ_API_KEY to .env')
  }

  const apiMessages = messages?.length
    ? messages
    : [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ]

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      max_tokens: maxTokens,
      temperature,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error?.message || `Groq API error (${response.status})`)
  }

  const content = data?.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('Empty response from Groq')
  return content
}
