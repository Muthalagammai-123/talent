import { cn } from '@/lib/utils'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[#e0e0e0] bg-white text-[hsl(var(--card-foreground))] shadow-sm dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))]',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1.5 p-5 pb-0', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-base font-semibold leading-none text-[hsl(var(--foreground))]', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-[hsl(var(--muted-foreground))]', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5', className)} {...props} />
}
