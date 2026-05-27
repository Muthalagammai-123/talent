import { Home, Users, MessageSquare, Wallet, Sparkles } from 'lucide-react'
import { DashboardShell } from './DashboardShell'

const links = [
  { to: '/client', icon: Home, label: 'Home', end: true },
  { to: '/client/candidates', icon: Users, label: 'Candidates' },
  { to: '/messages', icon: MessageSquare, label: 'Messaging' },
  { to: '/payments', icon: Wallet, label: 'Payments' },
  { to: '/ai', icon: Sparkles, label: 'Hiring' },
  { to: '/community', icon: Users, label: 'Network' },
]

export function ClientLayout() {
  return <DashboardShell links={links} />
}
