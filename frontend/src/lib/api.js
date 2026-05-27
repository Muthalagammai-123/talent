const API_BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'talentstage-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function isApiEnabled() {
  return import.meta.env.VITE_USE_API !== 'false'
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw new Error(
      'Cannot connect to API server. Start the backend: cd backend → npm run dev (port 3001)'
    )
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    err.code = data.code
    throw err
  }
  return data
}

export const api = {
  health: () => request('/health'),

  login: (credentials) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

  signup: (data) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  me: () => request('/auth/me'),

  setRole: (role) =>
    request('/auth/role', { method: 'PATCH', body: JSON.stringify({ role }) }),

  getPortfolio: () => request('/portfolio'),

  savePortfolio: (portfolio, aiScore) =>
    request('/portfolio', {
      method: 'PUT',
      body: JSON.stringify({ portfolio, aiScore }),
    }),

  browseProjects: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/projects/browse${q ? `?${q}` : ''}`)
  },

  getMyProjects: () => request('/projects/mine'),

  createProject: (project) =>
    request('/projects', { method: 'POST', body: JSON.stringify(project) }),

  updateProject: (id, data) =>
    request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  closeProject: (id) => request(`/projects/${id}/close`, { method: 'POST' }),

  getProposals: (projectId) => {
    const q = projectId ? `?projectId=${projectId}` : ''
    return request(`/proposals${q}`)
  },

  getMyProposals: () => request('/proposals/mine'),

  getFreelancerDashboard: () => request('/freelancer/dashboard'),

  submitProposal: (data) =>
    request('/proposals', { method: 'POST', body: JSON.stringify(data) }),

  updateProposalStatus: (id, status) =>
    request(`/proposals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  scoreProposal: (data) =>
    request('/proposals/score', { method: 'POST', body: JSON.stringify(data) }),

  getClientDashboard: () => request('/client/dashboard'),

  inviteTalent: (talentId, projectId) =>
    request('/client/invite', {
      method: 'POST',
      body: JSON.stringify({ talentId, projectId }),
    }),

  releaseMilestone: (id) =>
    request(`/client/milestones/${id}/release`, { method: 'POST' }),

  updateProjectReview: (id, data) =>
    request(`/client/projects/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getMessageThreads: () => request('/messages/threads'),

  createThread: (data) =>
    request('/messages/threads', { method: 'POST', body: JSON.stringify(data) }),

  sendThreadMessage: (threadId, text) =>
    request(`/messages/threads/${threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  markThreadRead: (threadId) =>
    request(`/messages/threads/${threadId}/read`, { method: 'POST' }),

  getPayments: () => request('/payments'),

  updatePayments: (data) =>
    request('/payments', { method: 'PUT', body: JSON.stringify(data) }),

  withdraw: (amount, method) =>
    request('/payments/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    }),

  getCommunity: () => request('/community'),

  createCommunityPost: (data) =>
    request('/community/posts', { method: 'POST', body: JSON.stringify(data) }),

  likePost: (id) => request(`/community/posts/${id}/like`, { method: 'POST' }),

  commentPost: (id, text) =>
    request(`/community/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  getVerification: () => request('/verification/me'),

  sendAadhaarOtp: (aadhaar) =>
    request('/verification/aadhaar/send-otp', {
      method: 'POST',
      body: JSON.stringify({ aadhaar }),
    }),

  verifyAadhaarOtp: (aadhaar, otp) =>
    request('/verification/aadhaar/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ aadhaar, otp }),
    }),

  submitLiveness: (data) =>
    request('/verification/liveness', { method: 'POST', body: JSON.stringify(data) }),

  saveVerificationPhoto: (data) =>
    request('/verification/profile-photo', { method: 'POST', body: JSON.stringify(data) }),

  submitVerification: (data) =>
    request('/verification/submit', { method: 'POST', body: JSON.stringify(data) }),

  getAdminVerifications: () => request('/verification/admin/pending'),

  getAdminVerificationDocument: (userId) => request(`/verification/admin/document/${userId}`),

  updateAdminVerification: (userId, data) =>
    request(`/verification/admin/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  startApplication: (projectId) =>
    request('/applications/start', { method: 'POST', body: JSON.stringify({ projectId }) }),

  getMyApplications: () => request('/applications/mine'),

  getApplication: (id) => request(`/applications/${id}`),

  startQuiz: (id) => request(`/applications/${id}/quiz/start`, { method: 'POST' }),

  submitQuiz: (id, data) =>
    request(`/applications/${id}/quiz/submit`, { method: 'POST', body: JSON.stringify(data) }),

  retakeQuiz: (id) => request(`/applications/${id}/quiz/retake`, { method: 'POST' }),

  submitResume: (id, data) =>
    request(`/applications/${id}/resume`, { method: 'POST', body: JSON.stringify(data) }),

  startInterview: (id) => request(`/applications/${id}/interview/start`, { method: 'POST' }),

  sendInterviewMessage: (id, message) =>
    request(`/applications/${id}/interview/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  getClientApplications: (projectId) => {
    const q = projectId ? `?projectId=${projectId}` : ''
    return request(`/applications/client/list${q}`)
  },

  recommendApplication: (id, recommended) =>
    request(`/applications/${id}/recommend`, {
      method: 'PATCH',
      body: JSON.stringify({ recommended }),
    }),

  reviewPortfolio: async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms))
    await delay(400)
    return { score: 92, verified: ['React', 'Node.js'], pending: ['AWS'] }
  },
}
