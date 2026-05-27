import { cn } from '@/lib/utils'

export function GlassCard({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[#e0e0e0] bg-white p-5 shadow-sm dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))]',
        hover && 'transition-shadow hover:shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
