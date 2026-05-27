import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { GlassCard } from '@/components/shared/GlassCard'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

const STATUS_LABEL = {
  round_1: 'Quiz pending',
  quiz_failed: 'Quiz failed',
  round_2: 'Resume round',
  resume_review: 'Resume review',
  round_3: 'Interview',
  completed: 'Completed',
}

export function MyApplicationsPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getMyApplications()
      .then((d) => setApps(d.applications || []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <p className="flex items-center gap-2 py-12 text-[hsl(var(--muted-foreground))]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My applications</h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Track your three-round progress for each job.
      </p>
      {apps.length === 0 ? (
        <GlassCard className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No applications yet.{' '}
          <Link to="/freelancer/projects" className="font-semibold text-[#0a66c2] hover:underline">
            Browse jobs
          </Link>
        </GlassCard>
      ) : (
        apps.map((a) => (
          <GlassCard key={a.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <h3 className="font-semibold">{a.project?.title}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Round {a.currentRound} · {STATUS_LABEL[a.status] || a.status}
              </p>
              {a.overallScore != null && (
                <p className="mt-1 text-sm">Overall score: {a.overallScore}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {a.recommended && <Badge>Recommended</Badge>}
              <Link to={`/freelancer/apply/${a.projectId}`}>
                <Badge variant="default">Continue</Badge>
              </Link>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  )
}
