import { cn } from '@/lib/utils'

export function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-sm border border-[#e0e0e0] bg-white px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus-visible:border-[#0a66c2] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0a66c2] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))]',
        className
      )}
      {...props}
    />
  )
}

export function Label({ className, ...props }) {
  return (
    <label
      className={cn('text-sm font-medium leading-none text-[hsl(var(--foreground))]', className)}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'flex min-h-[100px] w-full rounded-sm border border-[#e0e0e0] bg-white px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus-visible:border-[#0a66c2] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0a66c2] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))]',
        className
      )}
      {...props}
    />
  )
}
