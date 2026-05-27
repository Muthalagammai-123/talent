import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Kanban, BookOpen, Code2, Bot, ScanSearch, MessageSquare, Bell, ChevronDown,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useSocket } from '@/contexts/SocketContext'
import { cn } from '@/lib/utils'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

const links = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/board', icon: Kanban, label: 'Board' },
  { to: '/app/wiki', icon: BookOpen, label: 'Wiki' },
  { to: '/app/snippets', icon: Code2, label: 'Snippets' },
  { to: '/app/ai', icon: Bot, label: 'AI Assistant' },
  { to: '/app/code-review', icon: ScanSearch, label: 'Code Review' },
  { to: '/app/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/app/notifications', icon: Bell, label: 'Notifications' },
]

export function Sidebar() {
  const { workspaces, currentWorkspace, setCurrentWorkspace, unreadCount } = useWorkspace()
  const { connected } = useSocket()

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[hsl(var(--card))]/80 backdrop-blur-xl">
      <div className="border-b border-white/10 p-4">
        <Logo />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="mt-4 flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
            <span className="truncate font-medium">{currentWorkspace.name}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="glass z-50 min-w-[200px] rounded-lg border border-white/10 p-1 shadow-xl">
              {workspaces.map((ws) => (
                <DropdownMenu.Item
                  key={ws.id}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm outline-none hover:bg-indigo-500/20"
                  onSelect={() => setCurrentWorkspace(ws)}
                >
                  {ws.name}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <div className="mt-2 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse')} />
          {connected ? 'Live sync active' : 'Connecting...'}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-[hsl(var(--muted-foreground))] hover:bg-white/5 hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
            {label === 'Notifications' && unreadCount > 0 && (
              <span className="ml-auto rounded-full bg-indigo-500 px-2 py-0.5 text-xs text-white">{unreadCount}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
