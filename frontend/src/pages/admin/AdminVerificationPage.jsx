import { useEffect, useState } from 'react'
import {
  Shield, Loader2, CheckCircle2, XCircle, ExternalLink, FileImage,
  AlertTriangle, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { GlassCard } from '@/components/shared/GlassCard'
import { VerifiedBadge, TrustScorePill } from '@/components/shared/VerifiedBadge'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export function AdminVerificationPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [document, setDocument] = useState(null)
  const [docLoading, setDocLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api
      .getAdminVerifications()
      .then((d) => setRows(d.verifications || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const selected = rows.find((r) => r.userId === selectedId) ?? rows[0] ?? null

  useEffect(() => {
    if (rows.length > 0 && !selectedId) setSelectedId(rows[0].userId)
  }, [rows, selectedId])

  useEffect(() => {
    if (!selected?.userId) return
    setAdminNote(selected.adminNote || '')
    setDocument(null)
    setDocLoading(true)
    api
      .getAdminVerificationDocument(selected.userId)
      .then(setDocument)
      .catch(() => setDocument(null))
      .finally(() => setDocLoading(false))
  }, [selected?.userId])

  const decide = async (status) => {
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      await api.updateAdminVerification(selected.userId, {
        status,
        trustScore: status === 'verified' ? Math.max(selected.trustScore, 80) : selected.trustScore,
        adminNote: adminNote.trim() || undefined,
      })
      load()
      const next = rows.filter((r) => r.userId !== selected.userId)
      setSelectedId(next[0]?.userId || null)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 py-16 text-sm text-[hsl(var(--muted-foreground))]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading verification queue…
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-[1128px] space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">Trust & safety</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Review identity submissions — LinkedIn, ID upload, and AI risk signals.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-sm border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <GlassCard className="p-0 overflow-hidden">
          <div className="border-b border-[#e0e0e0] px-4 py-3">
            <p className="text-sm font-semibold">Queue ({rows.length})</p>
          </div>
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-[hsl(var(--muted-foreground))]">No pending or flagged accounts.</p>
          ) : (
            <ul className="max-h-[520px] divide-y divide-[#e0e0e0] overflow-y-auto">
              {rows.map((row) => (
                <li key={row.userId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.userId)}
                    className={cn(
                      'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-[#f3f2ef]',
                      selectedId === row.userId && 'bg-[#eef3f8]'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{row.profileName || row.user?.name}</span>
                      <VerifiedBadge status={row.status} size="xs" />
                    </div>
                    <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">{row.user?.email}</span>
                    <TrustScorePill score={row.trustScore} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        {selected ? (
          <GlassCard className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#eef3f8] text-xl font-semibold text-[#0a66c2]">
                  {(selected.profileName || selected.user?.name || '?').charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{selected.profileName}</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{selected.user?.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <VerifiedBadge status={selected.status} />
                    <TrustScorePill score={selected.trustScore} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-sm border border-[#e0e0e0] bg-[#f9fafb] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                  Aadhaar
                </p>
                <p className="mt-2 text-sm font-medium">
                  {selected.aadhaarMasked || '—'}
                  {selected.aadhaarVerified && (
                    <span className="ml-2 text-[#057642]">Verified</span>
                  )}
                </p>
              </div>
              <div className="rounded-sm border border-[#e0e0e0] bg-[#f9fafb] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                  Liveness
                </p>
                <p className="mt-2 text-sm font-medium">
                  {selected.livenessPassed
                    ? `Passed (${Math.round((selected.livenessScore || 0) * 100)}%)`
                    : 'Not completed'}
                </p>
              </div>
              <div className="rounded-sm border border-[#e0e0e0] bg-[#f9fafb] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                  LinkedIn
                </p>
                {selected.linkedInUrl ? (
                  <a
                    href={selected.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-sm font-semibold text-[#0a66c2] hover:underline"
                  >
                    View profile <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-red-600">Missing</p>
                )}
              </div>
              <div className="rounded-sm border border-[#e0e0e0] bg-[#f9fafb] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                  Portfolio name
                </p>
                <p className="mt-2 text-sm font-medium">{selected.portfolioName || '—'}</p>
              </div>
            </div>

            {selected.aiAnalysis?.summary && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{selected.aiAnalysis.summary}</p>
            )}

            {selected.flags?.length > 0 && (
              <ul className="space-y-1 rounded-sm border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {selected.flags.map((f) => (
                  <li key={f} className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold flex items-center gap-2">
                  <FileImage className="h-4 w-4" /> Profile photo
                </p>
                {docLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#0a66c2]" />
                ) : document?.profilePhoto ? (
                  <img
                    src={document.profilePhoto}
                    alt="Profile"
                    className="max-h-48 rounded-full border border-[#e0e0e0] object-cover"
                  />
                ) : (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">No photo</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Liveness snapshot</p>
                {document?.livenessSnapshot ? (
                  <img
                    src={document.livenessSnapshot}
                    alt="Liveness"
                    className="max-h-48 rounded-sm border border-[#e0e0e0] object-contain"
                  />
                ) : (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">No snapshot</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="adminNote">Admin note (internal)</Label>
              <Textarea
                id="adminNote"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="mt-1.5 min-h-[72px]"
                placeholder="Reason for approval or flag…"
              />
            </div>

            <div className="flex flex-wrap gap-3 border-t border-[#e0e0e0] pt-4">
              <Button
                onClick={() => decide('verified')}
                disabled={busy}
                className="gap-2 bg-[#057642] hover:bg-[#046c3b]"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve
              </Button>
              <Button variant="outline" onClick={() => decide('pending')} disabled={busy}>
                Keep pending
              </Button>
              <Button
                variant="outline"
                onClick={() => decide('flagged')}
                disabled={busy}
                className="gap-2 text-red-700 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" /> Flag account
              </Button>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="flex flex-col items-center justify-center p-12 text-center">
            <Shield className="h-12 w-12 text-[#0a66c2]/40" />
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Select a submission from the queue</p>
          </GlassCard>
        )}
      </div>
    </div>
  )
}
