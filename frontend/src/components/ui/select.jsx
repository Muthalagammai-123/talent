import { cn } from '@/lib/utils'

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'flex h-10 w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--foreground))] shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'light:border-slate-200 light:bg-white',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
