import { groqChat } from './ai.js'

function parseJsonBlock(text) {
  if (!text) return null
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

function normalizeLinkedIn(url) {
  if (!url) return ''
  return url.trim().toLowerCase().replace(/\/$/, '')
}

function linkedInLooksValid(url) {
  const u = normalizeLinkedIn(url)
  return u.includes('linkedin.com/in/') || u.includes('linkedin.com/pub/')
}

function nameSimilarity(a, b) {
  const clean = (s) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .trim()
  const na = clean(a).split(/\s+/).filter(Boolean)
  const nb = clean(b).split(/\s+/).filter(Boolean)
  if (!na.length || !nb.length) return 0
  const hits = na.filter((part) => nb.some((p) => p.includes(part) || part.includes(p)))
  return hits.length / Math.max(na.length, nb.length)
}

export function verifyIdentityHeuristic({
  profileName,
  linkedInUrl,
  aadhaarVerified,
  livenessPassed,
  hasProfilePhoto,
  portfolioName,
  livenessScore,
}) {
  const flags = []
  let score = 45

  const nameMatch = nameSimilarity(profileName, portfolioName)
  if (nameMatch >= 0.5) score += 15
  else flags.push('Profile name does not closely match portfolio name')

  if (aadhaarVerified) score += 25
  else flags.push('Aadhaar not verified')

  if (livenessPassed) {
    score += 20
    if ((livenessScore ?? 0) < 0.6) flags.push('Low liveness confidence')
  } else {
    flags.push('Face liveness check not completed')
    score -= 20
  }

  if (hasProfilePhoto) score += 10
  else flags.push('Profile photo missing')

  if (linkedInUrl?.trim()) {
    if (linkedInLooksValid(linkedInUrl)) score += 5
    else flags.push('Invalid LinkedIn URL format')
  }

  if (!profileName?.trim()) {
    flags.push('Missing full legal name')
    score -= 15
  }

  score = Math.max(0, Math.min(100, score))

  let status = 'pending'
  const complete = aadhaarVerified && livenessPassed && hasProfilePhoto
  if (!complete) status = 'pending'
  else if (score >= 78 && flags.length <= 1) status = 'verified'
  else if (score < 40 || flags.length >= 4) status = 'flagged'

  return {
    status,
    trustScore: score,
    flags,
    summary:
      status === 'verified'
        ? 'Aadhaar, face liveness, and profile photo verified.'
        : status === 'flagged'
          ? 'Multiple authenticity concerns — admin review required.'
          : 'Submitted for review. Complete all verification steps.',
    passed: status === 'verified',
  }
}

export async function verifyIdentityAI(payload) {
  const heuristic = verifyIdentityHeuristic(payload)

  const raw = await groqChat(
    'You verify freelancer identity (sandbox, not legal KYC). Return JSON only: {"status":"verified|pending|flagged","trustScore":0-100,"flags":[],"summary":"","fakeRisk":"low|medium|high"}',
    `Name: ${payload.profileName}
Portfolio: ${payload.portfolioName}
Aadhaar verified: ${payload.aadhaarVerified}
Liveness: ${payload.livenessPassed} (score ${payload.livenessScore})
Profile photo: ${payload.hasProfilePhoto}
LinkedIn: ${payload.linkedInUrl || 'none'}
Heuristic: ${heuristic.trustScore}`,
    600
  )

  const parsed = parseJsonBlock(raw)
  if (parsed?.trustScore != null) {
    return {
      status: parsed.status || heuristic.status,
      trustScore: Math.min(100, Math.max(0, Number(parsed.trustScore))),
      flags: [...new Set([...(parsed.flags || []), ...heuristic.flags])],
      summary: parsed.summary || heuristic.summary,
      passed: (parsed.status || heuristic.status) === 'verified',
      fakeRisk: parsed.fakeRisk || 'medium',
      aiPowered: true,
    }
  }

  return { ...heuristic, aiPowered: false }
}
