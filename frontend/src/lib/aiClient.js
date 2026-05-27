import { groqComplete, getGroqApiKey } from '@/lib/groq'

function parseJson(text) {
  const cleaned = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
    throw new Error('Could not parse AI response as JSON')
  }
}

export async function rankProposalsAI({ project, proposals }) {
  const apiKey = getGroqApiKey()
  const list = proposals
    .map(
      (p, i) =>
        `${i + 1}. ${p.freelancer} — bid $${p.bid}, timeline ${p.timeline}, skills: ${(p.skills || []).join(', ')}, current AI score ${p.aiScore}`
    )
    .join('\n')

  const content = await groqComplete({
    apiKey,
    system: `You are a hiring advisor for clients on TalentStage. Rank freelancer proposals objectively.
Return ONLY valid JSON: { "rankings": [{ "freelancer": string, "rank": number, "score": number, "reason": string }] }`,
    user: `Project: ${project.title}
Budget: ${project.budget}
Category: ${project.category}
Skills needed: ${(project.skills || []).join(', ') || 'not specified'}
Description: ${project.description || 'N/A'}

Proposals:
${list || 'No proposals yet'}

Rank all proposals from best to worst with score 0-100 and one-line reason each.`,
    maxTokens: 600,
  })
  return parseJson(content)
}

export async function generateJobDescriptionAI({ title, category, budget, skills }) {
  const apiKey = getGroqApiKey()
  const content = await groqComplete({
    apiKey,
    system: `You write clear job postings for freelance marketplaces. Return ONLY valid JSON:
{ "description": string, "deliverables": string[], "requirements": string[], "suggestedBudget": string }`,
    user: `Write a job posting for:
Title: ${title}
Category: ${category}
Budget: ${budget || 'flexible'}
Skills: ${(skills || []).join(', ') || 'to be defined'}

Make it professional, scannable, and attractive to top freelancers.`,
    maxTokens: 700,
  })
  return parseJson(content)
}

export async function matchTalentForProjectAI({ project, talentPool }) {
  const apiKey = getGroqApiKey()
  const talent = talentPool
    .map((t) => `${t.name} — ${t.title}, ${t.rate}, skills: ${t.skills.join(', ')}, rating ${t.rating}`)
    .join('\n')

  const content = await groqComplete({
    apiKey,
    system: `You match freelancers to client projects. Return ONLY valid JSON:
{ "matches": [{ "name": string, "match": number, "reason": string }] }`,
    user: `Project: ${project.title}
Budget: ${project.budget}
Skills: ${(project.skills || []).join(', ')}

Available freelancers:
${talent}

Return top matches with match % 0-100 and brief reason.`,
    maxTokens: 500,
  })
  return parseJson(content)
}

export async function screenFreelancerQuestionsAI({ projectTitle, skills }) {
  const apiKey = getGroqApiKey()
  const content = await groqComplete({
    apiKey,
    system: `You help clients interview freelancers. Return ONLY valid JSON:
{ "technical": string[], "behavioral": string[], "projectSpecific": string[] }`,
    user: `Generate interview screening questions for hiring a freelancer for: ${projectTitle}
Required skills: ${(skills || []).join(', ') || 'general development'}`,
    maxTokens: 600,
  })
  return parseJson(content)
}

export async function verifyAndMatchTalentAI({ project, talentPool }) {
  const apiKey = getGroqApiKey()
  const profiles = talentPool
    .map(
      (t) =>
        `ID:${t.id} | ${t.name} | ${t.title} | ${t.rate} | ${t.completed} jobs | rating ${t.rating ?? 'none'} | skills: ${t.skills.join(', ')} | bio: ${t.bio || 'none'} | joined ${t.joined || '?'} | portfolio: ${t.portfolio ? 'yes' : 'no'} | seed-trust: ${t.trustScore}`
    )
    .join('\n')

  const content = await groqComplete({
    apiKey,
    system: `You detect fake/suspicious freelancer profiles on a hiring marketplace and match legitimate ones to client projects.
Red flags: unrealistic rates, generic titles, no portfolio, 0 reviews, spam bios, "expert in everything", brand-new accounts with huge claims.
Return ONLY valid JSON:
{
  "verified": [{ "id": string, "name": string, "match": number, "trustScore": number, "reason": string }],
  "flagged": [{ "id": string, "name": string, "riskLevel": "high"|"medium", "reasons": string[], "recommendation": "reject"|"review" }],
  "summary": string
}`,
    user: `Client project to hire for:
Title: ${project.title}
Budget: ${project.budget}
Category: ${project.category}
Skills needed: ${(project.skills || []).join(', ') || 'not specified'}
Description: ${project.description || 'N/A'}

Freelancer profiles to analyze:
${profiles}

Return verified profiles sorted by match (only trustworthy ones). Flag suspicious/fake profiles separately. Use profile IDs from input.`,
    maxTokens: 900,
  })
  return parseJson(content)
}

export async function scoreJobPostAI({ project }) {
  const apiKey = getGroqApiKey()
  const content = await groqComplete({
    apiKey,
    system: `You score client job posts on freelance marketplaces for quality and discoverability.
Return ONLY valid JSON:
{
  "score": number,
  "visibility": "low"|"medium"|"high",
  "estimatedViews": string,
  "breakdown": { "title": number, "description": number, "skills": number, "budget": number },
  "strengths": string[],
  "improvements": string[],
  "viewBoostTips": [{ "tip": string, "impact": "high"|"medium"|"low" }]
}`,
    user: `Score this job post (0-100) and suggest how to get more freelancer views:

Title: ${project.title}
Category: ${project.category}
Budget: ${project.budget}
Skills: ${(project.skills || []).join(', ') || 'none listed'}
Description: ${project.description || '(empty — major issue)'}
Status: ${project.status}
Current views: ${project.views ?? 0}`,
    maxTokens: 800,
  })
  return parseJson(content)
}

export async function optimizeJobPostAI({ project, review }) {
  const apiKey = getGroqApiKey()
  const content = await groqComplete({
    apiKey,
    system: `You rewrite job posts to attract more qualified freelancers. Return ONLY valid JSON:
{
  "optimizedTitle": string,
  "optimizedDescription": string,
  "suggestedSkills": string[],
  "suggestedBudget": string
}`,
    user: `Improve this job post for more views and better applicants.

Current title: ${project.title}
Current description: ${project.description || 'empty'}
Budget: ${project.budget}
Skills: ${(project.skills || []).join(', ')}
AI review score: ${review?.score ?? 'unknown'}
Improvements needed: ${(review?.improvements || []).join('; ') || 'general polish'}
View tips: ${(review?.viewBoostTips || []).map((t) => t.tip).join('; ')}`,
    maxTokens: 700,
  })
  return parseJson(content)
}

/** Local heuristic scan when API unavailable */
export function localTalentScan({ project, talentPool }) {
  const projectSkills = (project.skills || []).map((s) => s.toLowerCase())
  const verified = []
  const flagged = []

  talentPool.forEach((t) => {
    const skillOverlap = t.skills.filter((s) =>
      projectSkills.some((ps) => s.toLowerCase().includes(ps) || ps.includes(s.toLowerCase()))
    ).length
    const match = Math.min(
      99,
      Math.round((skillOverlap / Math.max(projectSkills.length, 1)) * 50 + (t.trustScore || 50) * 0.5)
    )

    if (t.suspicious || (t.trustScore || 0) < 40) {
      flagged.push({
        id: t.id,
        name: t.name,
        riskLevel: (t.trustScore || 0) < 25 ? 'high' : 'medium',
        reasons: [
          t.completed < 3 && 'Very few completed jobs',
          !t.portfolio && 'No portfolio linked',
          (t.bio || '').includes('!!!') && 'Spam-like bio',
          t.rate?.includes('$12') && 'Unrealistically low rate',
          !t.rating && 'No client ratings',
        ].filter(Boolean),
        recommendation: (t.trustScore || 0) < 25 ? 'reject' : 'review',
      })
    } else {
      verified.push({
        id: t.id,
        name: t.name,
        match: match || t.match,
        trustScore: t.trustScore || 85,
        reason: `Skills align with ${project.title}; ${t.completed} jobs, ${t.rating}★ rating`,
      })
    }
  })

  verified.sort((a, b) => b.match - a.match)
  return {
    verified,
    flagged,
    summary: `Filtered ${flagged.length} suspicious profile(s). ${verified.length} verified match(es) for your project.`,
  }
}

export async function hiringCoachChat({ messages, clientContext }) {
  const apiKey = getGroqApiKey()
  const contextBlock = clientContext
    ? `\nClient context:\n- Open jobs: ${clientContext.openJobs}\n- Pending proposals: ${clientContext.pendingProposals}\n- Active hires: ${clientContext.activeHires}\n- Projects: ${clientContext.projectTitles?.join(', ') || 'none'}`
    : ''

  const apiMessages = [
    {
      role: 'system',
      content: `You are TalentStage Hiring Coach — an expert advisor for clients posting jobs and hiring freelancers.
Help with: writing job posts, evaluating proposals, interview questions, budgets, milestones, and red flags.
Be concise (2-4 sentences unless listing items).${contextBlock}`,
    },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  return groqComplete({
    apiKey,
    messages: apiMessages,
    maxTokens: 400,
    temperature: 0.7,
  })
}
