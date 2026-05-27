import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { CommandPalette } from './CommandPalette'
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal'
import { AIAssistantWidget } from './AIAssistantWidget'
import { useAuth } from '@/contexts/AuthContext'
import { PageTransition } from '@/components/shared/PageTransition'

export function WorkspaceLayout() {
  const { isAuthenticated } = useAuth()
  const [commandOpen, setCommandOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onOpenCommand={() => setCommandOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
        />
        <main className="flex-1 overflow-auto p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <AIAssistantWidget />
    </div>
  )
}
