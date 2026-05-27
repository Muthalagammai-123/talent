import { Link } from 'react-router-dom'
import { ShieldCheck, Users, ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/shared/GlassCard'
import { Button } from '@/components/ui/button'

export function AdminOverviewPage() {
  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Platform trust tools for TalentStage.
        </p>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#eef3f8]">
            <ShieldCheck className="h-6 w-6 text-[#0a66c2]" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">Identity verification queue</h2>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Approve or flag freelancers after reviewing LinkedIn, uploaded ID, and AI risk flags.
            </p>
            <Link to="/admin/verifications" className="mt-4 inline-block">
              <Button className="gap-2">
                Open queue <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 opacity-80">
        <div className="flex items-start gap-4">
          <Users className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
          <div>
            <h2 className="font-semibold text-[hsl(var(--muted-foreground))]">User management</h2>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Coming soon — analytics and moderation.</p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
