import { useNavigate } from 'react-router-dom'
import { Briefcase, Building2 } from 'lucide-react'
import { GlassCard } from '@/components/shared/GlassCard'
import { Logo } from '@/components/shared/Logo'
import { useAuth } from '@/contexts/AuthContext'

export function RoleSelectionPage() {
  const { setRole, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const choose = async (role) => {
    await setRole(role)
    navigate(role === 'freelancer' ? '/freelancer' : '/client')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f2ef] px-4 py-12">
      <Logo className="mb-8" />
      <h1 className="text-2xl font-semibold sm:text-3xl">How do you want to use TalentStage?</h1>
      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
        Pick the experience that fits you. You can update this later.
      </p>
      <div className="mt-8 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => choose('freelancer')} className="text-left">
          <GlassCard className="h-full cursor-pointer p-6 transition-shadow hover:shadow-md">
            <Briefcase className="mb-4 h-9 w-9 text-[#0a66c2]" strokeWidth={1.5} />
            <h2 className="text-lg font-semibold">I&apos;m a freelancer</h2>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
              Browse projects, build your portfolio, and connect with clients.
            </p>
          </GlassCard>
        </button>
        <button type="button" onClick={() => choose('client')} className="text-left">
          <GlassCard className="h-full cursor-pointer p-6 transition-shadow hover:shadow-md">
            <Building2 className="mb-4 h-9 w-9 text-[#0a66c2]" strokeWidth={1.5} />
            <h2 className="text-lg font-semibold">I&apos;m hiring</h2>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
              Post jobs, review proposals, and manage payments in one place.
            </p>
          </GlassCard>
        </button>
      </div>
    </div>
  )
}
