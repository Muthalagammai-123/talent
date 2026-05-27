import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import {
  LayoutDashboard, Kanban, BookOpen, Code2, Bot, MessageSquare, Bell, Settings, Moon, Sun,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/app' },
  { label: 'Kanban Board', icon: Kanban, path: '/app/board' },
  { label: 'Wiki', icon: BookOpen, path: '/app/wiki' },
  { label: 'Snippets', icon: Code2, path: '/app/snippets' },
  { label: 'AI Assistant', icon: Bot, path: '/app/ai' },
  { label: 'Code Review', icon: Code2, path: '/app/code-review' },
  { label: 'Team Chat', icon: MessageSquare, path: '/app/chat' },
  { label: 'Notifications', icon: Bell, path: '/app/notifications' },
]

export function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate()
  const { toggleTheme, isDark } = useTheme()

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

  const run = (path) => {
    navigate(path)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 pt-[15vh] backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <Command
        className="glass w-full max-w-xl overflow-hidden rounded-xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command.Input
          placeholder="Search commands, pages..."
          className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">No results.</Command.Empty>
          <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs text-[hsl(var(--muted-foreground))]">
            {navItems.map(({ label, icon: Icon, path }) => (
              <Command.Item
                key={path}
                onSelect={() => run(path)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-indigo-500/20'
                )}
              >
                <Icon className="h-4 w-4 text-indigo-400" />
                {label}
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading="Actions" className="px-2 py-1.5 text-xs text-[hsl(var(--muted-foreground))]">
            <Command.Item
              onSelect={() => { toggleTheme(); onOpenChange(false) }}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-indigo-500/20"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              Toggle {isDark ? 'light' : 'dark'} mode
            </Command.Item>
            <Command.Item
              onSelect={() => run('/app/settings')}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-indigo-500/20"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}
