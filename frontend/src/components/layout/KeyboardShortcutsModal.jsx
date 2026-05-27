import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { keyboardShortcuts } from '@/data/mockData'

export function KeyboardShortcutsModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          {keyboardShortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">{s.action}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-xs">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
