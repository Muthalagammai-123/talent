import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Sparkles, TrendingUp, Bell, Briefcase, Shield } from 'lucide-react'
import { VerifiedBadge, TrustScorePill } from '@/components/shared/VerifiedBadge'
import { api, getToken } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { GlassCard } from '@/components/shared/GlassCard'
import { proposals as seedProposals, notifications as seedNotifications } from '@/data/mockData'
import { usePortfolio } from '@/contexts/PortfolioContext'
import { NOTIFICATIONS_UPDATED } from '@/lib/notificationsSync'
import { cn } from '@/lib/utils'

const STATUS_VARIANT = {
  pending: 'secondary',
  shortlisted: 'default',
  accepted: 'success',
  rejected: 'danger',
  invited: 'warning',
  interview: 'default',
  declined: 'danger',
}

export function FreelancerDashboardPage() {
  const { portfolio } = usePortfolio()
  const [proposals, setProposals] = useState(seedProposals)
  const [notifications, setNotifications] = useState(seedNotifications)
  const [stats, setStats] = useState({ activeProposals: 3, acceptedCount: 0, newJobsCount: 0 })
  const [verification, setVerification] = useState(null)

  const loadDashboard = useCallback(() => {
    if (!getToken()) return
    api
      .getFreelancerDashboard()
      .then((data) => {
        if (data.proposals?.length) setProposals(data.proposals)
        if (data.notifications?.length) setNotifications(data.notifications)
        if (data.stats) setStats(data.stats)
      })
      .catch(() => {})
    api.getVerification().then((d) => setVerification(d.verification)).catch(() => {})
  }, [])

  useEffect(() => {
    loadDashboard()
    const onUpdate = () => loadDashboard()
    window.addEventListener(NOTIFICATIONS_UPDATED, onUpdate)
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED, onUpdate)
  }, [loadDashboard])

  const unread = notifications.filter((n) => !n.read)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">Welcome back, {portfolio.name || 'there'}</h1>
            {verification && (
              <>
                <VerifiedBadge status={verification.status} />
                <TrustScorePill score={verification.trustScore} />
              </>
            )}
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Here&apos;s what&apos;s happening in your professional world</p>
        </div>
        {verification && verification.status !== 'verified' && (
          <Link to="/freelancer/verify">
            <Button variant="outline" size="sm" className="gap-2">
              <Shield className="h-4 w-4" /> Verify identity
            </Button>
          </Link>
        )}
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Profile completion</p>
            <p className="text-2xl font-bold">{portfolio.completion}%</p>
          </div>
          <div className="flex-1 max-w-xs">
            <Progress value={portfolio.completion} />
          </div>
          <Link to="/freelancer/portfolio/create" className="text-sm font-semibold text-[#0a66c2] hover:underline">
            Complete profile →
          </Link>
        </div>
      </GlassCard>

      {stats.newJobsCount > 0 && (
        <GlassCard className="border border-[#0a66c2]/20 bg-[#eef3f8]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-[#0a66c2]" />
              <div>
                <p className="font-semibold">{stats.newJobsCount} open jobs available</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Clients posted new projects — browse and submit proposals
                </p>
              </div>
            </div>
            <Link to="/freelancer/projects">
              <Badge className="cursor-pointer">Browse jobs →</Badge>
            </Link>
          </div>
        </GlassCard>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active proposals', value: String(stats.activeProposals ?? proposals.length), icon: FileText },
          { label: 'Accepted', value: String(stats.acceptedCount ?? 0), icon: TrendingUp },
          { label: 'AI portfolio score', value: `${portfolio.aiScore || '—'}/100`, icon: Sparkles },
          { label: 'New alerts', value: String(unread.length), icon: Bell },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-[#eef3f8] p-3">
                <s.icon className="h-5 w-5 text-[#0a66c2]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My proposals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proposals.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No proposals yet. Browse projects to apply.</p>
            ) : (
              proposals.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-sm border border-[#e0e0e0] bg-[#f3f2ef] px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-sm">{p.project}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {p.submitted} · {p.bid}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[p.status] || 'secondary'} className="capitalize">
                    {p.status}
                  </Badge>
                </div>
              ))
            )}
            <Link to="/freelancer/projects" className="block text-center text-sm font-semibold text-[#0a66c2] hover:underline">
              Browse more projects →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Notifications ({unread.length} new)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No notifications yet.</p>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'rounded-xl px-4 py-3 text-sm',
                    !n.read ? 'border border-[#0a66c2]/20 bg-[#eef3f8]' : 'bg-[#f3f2ef]'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{n.title}</p>
                    {n.type === 'job' && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">Job</Badge>
                    )}
                    {n.type === 'proposal' && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">Proposal</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{n.body}</p>
                  <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{n.time}</p>
                  {n.type === 'job' && (
                    <Link
                      to="/freelancer/projects"
                      className="mt-2 inline-block text-xs font-semibold text-[#0a66c2] hover:underline"
                    >
                      View on Browse Projects →
                    </Link>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
