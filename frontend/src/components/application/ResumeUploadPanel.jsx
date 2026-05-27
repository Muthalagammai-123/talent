import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label, Textarea } from '@/components/ui/input'
import { extractTextFromResumeFile } from '@/lib/resumeExtract'
import { cn } from '@/lib/utils'

export function ResumeUploadPanel({ onSubmit, busy, result, quizPassed, app }) {
  const [file, setFile] = useState(null)
  const [extracted, setExtracted] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [paste, setPaste] = useState('')
  const [fileMeta, setFileMeta] = useState(null)
  const [localError, setLocalError] = useState('')
  const inputRef = useRef(null)

  const handleFile = async (f) => {
    if (!f) return
    setLocalError('')
    setExtracting(true)
    setFile(f)
    try {
      const data = await extractTextFromResumeFile(f)
      setExtracted(data.text)
      setFileMeta({ fileName: data.fileName, fileType: data.fileType, method: data.method })
    } catch (err) {
      setLocalError(err.message)
      setExtracted('')
      setFileMeta(null)
    } finally {
      setExtracting(false)
    }
  }

  const submit = () => {
    const text = (extracted || paste).trim()
    if (text.length < 80) {
      setLocalError('Resume must be at least 80 characters.')
      return
    }
    onSubmit({
      resumeText: text,
      resumeFileName: fileMeta?.fileName || (file ? file.name : 'resume-paste.txt'),
      resumeFileType: fileMeta?.fileType || 'text/plain',
      resumeExtractMethod: fileMeta?.method || 'paste',
    })
  }

  const preview = (extracted || paste).slice(0, 500)

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Round 2 — Resume upload & AI screening</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Upload your resume (.pdf or .txt). AI scores fit against this job and your portfolio skills.
      </p>
      {quizPassed && app && (
        <p className="text-sm text-emerald-700">
          Quiz passed: {app.quizScore}% (integrity {app.quizIntegrity}%)
        </p>
      )}

      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#e0e0e0] bg-[#f3f2ef] px-6 py-10 transition-colors',
          file && 'border-[#0a66c2] bg-[#eef3f8]'
        )}
      >
        <Upload className="mb-3 h-10 w-10 text-[#0a66c2]" strokeWidth={1.5} />
        <p className="text-sm font-medium">Drag & drop or choose resume file</p>
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">PDF or TXT · max 5MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="mt-4 hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button type="button" variant="outline" className="mt-4" onClick={() => inputRef.current?.click()}>
          Select file
        </Button>
        {file && (
          <p className="mt-3 flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            {file.name}
            {extracting && <Loader2 className="h-4 w-4 animate-spin" />}
            {extracted && !extracting && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          </p>
        )}
      </div>

      {localError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {localError}
        </div>
      )}

      {preview && (
        <div className="rounded-lg border border-[#e0e0e0] bg-white p-3">
          <p className="text-xs font-semibold text-[#0a66c2]">Extracted preview</p>
          <p className="mt-2 max-h-32 overflow-y-auto text-xs text-[hsl(var(--muted-foreground))]">
            {preview}
            {(extracted || paste).length > 500 ? '…' : ''}
          </p>
        </div>
      )}

      <div>
        <Label>Or paste resume text</Label>
        <Textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          className="mt-2 min-h-[120px] font-mono text-sm"
          placeholder="Paste resume if file upload fails..."
        />
      </div>

      <Button onClick={submit} disabled={busy || extracting} className="w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit resume for AI review'}
      </Button>

      {result && (
        <div
          className={cn(
            'rounded-lg border px-4 py-3 text-sm',
            result.passed ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'
          )}
        >
          <p className="font-semibold">AI score: {result.score}/100 — {result.passed ? 'Passed' : 'Needs improvement'}</p>
          <p className="mt-1">{result.summary}</p>
          {result.strengths?.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs">
              {result.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
