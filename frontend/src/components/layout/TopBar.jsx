import { Search, Command, Moon, Sun, Bell, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Link } from 'react-router-dom'

export function TopBar({ onOpenCommand, onOpenShortcuts }) {
  const { toggleTheme, isDark } = useTheme()
  const { user } = useAuth()
  const { unreadCount } = useWorkspace()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-white/10 bg-[hsl(var(--background))]/80 px-6 backdrop-blur-xl">
      <button
        type="button"
        onClick={onOpenCommand}
        className="flex flex-1 max-w-md items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-white/10"
      >
        <Search className="h-4 w-4" />
        <span>Search or run command...</span>
        <kbd className="ml-auto hidden rounded border border-white/15 px-1.5 text-xs sm:inline">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onOpenShortcuts} title="Shortcuts">
          <Keyboard className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onOpenCommand} title="Command palette">
          <Command className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Link to="/app/notifications" className="relative">
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-indigo-500" />
          )}
        </Link>
        <Avatar>
          <AvatarFallback name={user?.name || 'You'} />
        </Avatar>
      </div>
    </header>
  )
}
