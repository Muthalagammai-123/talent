import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-white/10 light:bg-slate-200', className)}
      {...props}
    />
  )
}
