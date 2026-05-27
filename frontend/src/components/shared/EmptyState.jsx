import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({ title, description, actionLabel, onAction, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 py-16 px-6 text-center">
      <div className="mb-4 rounded-2xl bg-purple-500/10 p-4">
        <Icon className="h-10 w-10 text-purple-400" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-6 gradient-btn" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
