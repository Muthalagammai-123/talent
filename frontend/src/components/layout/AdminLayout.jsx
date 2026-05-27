import { LayoutDashboard, ShieldCheck } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { DashboardShell } from './DashboardShell'
import { useAuth } from '@/contexts/AuthContext'

const links = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/verifications', icon: ShieldCheck, label: 'Verifications' },
]

export function AdminLayout() {
  const { user, isAdmin, isAuthenticated } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Access restricted</h1>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Sign in as <strong>admin@talentstage.com</strong> to review verifications.
        </p>
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Current: {user?.email}</p>
      </div>
    )
  }

  return <DashboardShell links={links} />
}
