import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Search, LayoutDashboard, Briefcase, User, UserPlus, MessageSquare, Wallet, Users, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const freelancerRoutes = [
  { label: 'Dashboard', path: '/freelancer', icon: LayoutDashboard },
  { label: 'Portfolio', path: '/freelancer/portfolio', icon: User },
  { label: 'Create Portfolio', path: '/freelancer/portfolio/create', icon: UserPlus },
  { label: 'Browse Projects', path: '/freelancer/projects', icon: Briefcase },
  { label: 'Messages', path: '/messages', icon: MessageSquare },
  { label: 'Payments', path: '/payments', icon: Wallet },
  { label: 'Community', path: '/community', icon: Users },
  { label: 'AI Features', path: '/ai', icon: Sparkles },
]

const clientRoutes = [
  { label: 'Dashboard', path: '/client', icon: LayoutDashboard },
  { label: 'Messages', path: '/messages', icon: MessageSquare },
  { label: 'Payments', path: '/payments', icon: Wallet },
  { label: 'AI Features', path: '/ai', icon: Sparkles },
  { label: 'Community', path: '/community', icon: Users },
]

export function CommandMenu({ open, onOpenChange }) {
  const navigate = useNavigate()
  const { isFreelancer } = useAuth()
  const routes = isFreelancer ? freelancerRoutes : clientRoutes

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [onOpenChange])

  if (!open) return null

  const go = (path) => {
    navigate(path)
    onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[20vh] backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <Command className="glass w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-white/10 px-4">
          <Search className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Command.Input placeholder="Search pages, projects..." className="flex-1 bg-transparent py-3 text-sm outline-none" />
        </div>
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No results found.</Command.Empty>
          {routes.map(({ label, path, icon: Icon }) => (
            <Command.Item
              key={path}
              onSelect={() => go(path)}
              className={cn('flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm aria-selected:bg-purple-500/20')}
            >
              <Icon className="h-4 w-4 text-purple-400" />
              {label}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  )
}
