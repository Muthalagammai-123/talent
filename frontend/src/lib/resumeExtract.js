/** Extract plain text from uploaded resume files in the browser */
export async function extractTextFromResumeFile(file) {
  if (!file) throw new Error('No file selected')

  const name = file.name.toLowerCase()
  const type = file.type

  if (name.endsWith('.txt') || type === 'text/plain') {
    const text = await file.text()
    return { text: text.trim(), fileName: file.name, fileType: type || 'text/plain', method: 'txt' }
  }

  if (name.endsWith('.pdf') || type === 'application/pdf') {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const raw = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    const chunks = raw.match(/\(([^()\\]{2,})\)/g) || []
    let text = chunks
      .map((c) => c.slice(1, -1))
      .join(' ')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (text.length < 80) {
      const alt = raw.match(/BT[\s\S]*?ET/g)?.join(' ') || ''
      text = alt.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim()
    }

    if (text.length < 80) {
      throw new Error(
        'Could not extract enough text from this PDF. Save as .txt or paste your resume in the text box.'
      )
    }
    return { text, fileName: file.name, fileType: 'application/pdf', method: 'pdf-heuristic' }
  }

  if (name.endsWith('.doc') || name.endsWith('.docx')) {
    throw new Error('Word documents: save as PDF or .txt, or paste resume text below.')
  }

  throw new Error('Supported formats: .pdf, .txt')
}
