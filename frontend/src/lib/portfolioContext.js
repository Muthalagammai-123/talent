/** Build RAG-style text context from live portfolio + optional resume */
export function buildPortfolioContext(portfolio, resumeText = '') {
  const lines = [
    '# Freelancer Profile',
    `Name: ${portfolio.name || 'Not set'}`,
    `Title: ${portfolio.title || 'Not set'}`,
    `Location: ${portfolio.location || 'Not set'}`,
    `Bio: ${portfolio.bio || ''}`,
    `Description: ${portfolio.description || ''}`,
    `Profile completion: ${portfolio.completion || 0}%`,
    '',
    `Skills: ${(portfolio.skills || []).join(', ') || 'None'}`,
    `Interests: ${(portfolio.interests || []).join(', ') || 'None'}`,
    '',
    '## Education',
    ...(portfolio.education || []).map((e) => `- ${e.degree} at ${e.school} (${e.year})`),
    '',
    '## Certifications',
    ...(portfolio.certifications || []).map((c) => `- ${c.name} by ${c.issuer} (${c.year})`),
    '',
    '## Projects',
    ...(portfolio.projects || []).map(
      (p) => `- ${p.title}: ${p.description || 'No description'} | Links: ${p.link || 'N/A'} ${p.live || ''}`
    ),
    '',
    '## Experience',
    ...(portfolio.experience || []).map((e) => `- ${e.role} at ${e.company} (${e.period})`),
    '',
    `Posts count: ${(portfolio.posts || []).length}`,
  ]

  if (resumeText?.trim()) {
    lines.push('', '## Uploaded Resume', resumeText.trim())
  }

  return lines.join('\n')
}

export function parseJsonFromGroq(text) {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    const arrMatch = trimmed.match(/\[[\s\S]*\]/)
    if (arrMatch) return JSON.parse(arrMatch[0])
    throw new Error('Could not parse AI response as JSON')
  }
}
