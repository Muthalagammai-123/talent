import { LayoutDashboard, User, UserPlus, Briefcase, MessageSquare, Wallet, Users, Sparkles } from 'lucide-react'
import { DashboardShell } from './DashboardShell'
import { useAuth } from '@/contexts/AuthContext'

const freelancerLinks = [
  { to: '/freelancer', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/freelancer/portfolio', icon: User, label: 'Portfolio' },
  { to: '/freelancer/portfolio/create', icon: UserPlus, label: 'Create Portfolio' },
  { to: '/freelancer/projects', icon: Briefcase, label: 'Browse Projects' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/payments', icon: Wallet, label: 'Payments' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/ai', icon: Sparkles, label: 'AI Features' },
]

const clientLinks = [
  { to: '/client', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/payments', icon: Wallet, label: 'Payments' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/ai', icon: Sparkles, label: 'AI Features' },
]

export function AppLayout() {
  const { isFreelancer } = useAuth()
  return <DashboardShell links={isFreelancer ? freelancerLinks : clientLinks} />
}
