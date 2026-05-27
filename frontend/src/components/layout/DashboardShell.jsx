import { useState } from 'react'
import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { Menu, Moon, Sun, Search, LogOut, X, Shield } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { PageTransition } from '@/components/shared/PageTransition'
import { CommandMenu } from './CommandMenu'
import { NotificationDropdown } from './NotificationDropdown'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

function NavItem({ to, icon: Icon, label, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'relative flex min-w-[52px] flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-normal text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))] sm:min-w-[64px] sm:text-xs',
          isActive && 'font-semibold text-[#0a66c2] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-[#0a66c2] after:content-[""]'
        )
      }
    >
      <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
      <span className="hidden max-w-[72px] truncate sm:inline">{label}</span>
    </NavLink>
  )
}

export function DashboardShell({ links }) {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const navLinks = isAdmin
    ? [...links, { to: '/admin/verifications', icon: Shield, label: 'Admin' }]
    : links
  const { toggleTheme, isDark } = useTheme()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user?.role) return <Navigate to="/role-selection" replace />

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="min-h-screen bg-[#f3f2ef] dark:bg-[hsl(var(--background))]">
      <header className="sticky top-0 z-50 border-b border-[#e0e0e0] bg-white dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))]">
        <div className="mx-auto flex h-[52px] max-w-[1128px] items-center gap-2 px-3 sm:gap-4 sm:px-4">
          <Logo showText={false} className="shrink-0" />

          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="hidden min-w-0 flex-1 max-w-[280px] items-center gap-2 rounded-sm border border-transparent bg-[#eef3f8] px-3 py-1.5 text-left text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:border-[#0a66c2] hover:bg-white sm:flex lg:max-w-[360px]"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">Search</span>
          </button>

          <nav className="ml-auto hidden items-stretch md:flex">
            {navLinks.map((link) => (
              <NavItem key={link.to} {...link} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 md:ml-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden items-center gap-0.5 md:flex">
              <NotificationDropdown />
              <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Avatar className="h-7 w-7">
                <AvatarFallback name={user?.name} className="text-xs" />
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={closeMobile}
            aria-label="Close menu"
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-[#e0e0e0] bg-white shadow-xl dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))] md:hidden">
            <div className="flex items-center justify-between border-b border-[#e0e0e0] px-4 py-3 dark:border-[hsl(var(--border))]">
              <span className="text-sm font-semibold">Menu</span>
              <Button variant="ghost" size="icon" onClick={closeMobile}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium',
                      isActive
                        ? 'bg-[#0a66c2]/10 text-[#0a66c2]'
                        : 'text-[hsl(var(--foreground))] hover:bg-[#f3f2ef]'
                    )
                  }
                >
                  <link.icon className="h-5 w-5" strokeWidth={1.5} />
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="space-y-1 border-t border-[#e0e0e0] p-3 dark:border-[hsl(var(--border))]">
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar className="h-9 w-9">
                  <AvatarFallback name={user?.name} />
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user?.name}</p>
                  <p className="truncate text-xs text-[hsl(var(--muted-foreground))] capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[#f3f2ef]"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </aside>
        </>
      )}

      <main className="mx-auto max-w-[1128px] px-3 py-4 sm:px-4 sm:py-6">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  )
}
