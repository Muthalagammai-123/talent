import { Home, User, Briefcase, ClipboardList, Shield, MessageSquare, Wallet, Users, Sparkles } from 'lucide-react'
import { DashboardShell } from './DashboardShell'

const links = [
  { to: '/freelancer', icon: Home, label: 'Home', end: true },
  { to: '/freelancer/portfolio', icon: User, label: 'Profile' },
  { to: '/freelancer/verify', icon: Shield, label: 'Verify' },
  { to: '/freelancer/projects', icon: Briefcase, label: 'Jobs' },
  { to: '/freelancer/applications', icon: ClipboardList, label: 'Applications' },
  { to: '/messages', icon: MessageSquare, label: 'Messaging' },
  { to: '/payments', icon: Wallet, label: 'Payments' },
  { to: '/community', icon: Users, label: 'Network' },
  { to: '/ai', icon: Sparkles, label: 'Tools' },
]

export function FreelancerLayout() {
  return <DashboardShell links={links} />
}
