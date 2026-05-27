import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a66c2]/40 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#0a66c2] text-white hover:bg-[#004182]',
        secondary: 'border border-[#0a66c2] bg-transparent text-[#0a66c2] hover:bg-[#0a66c2]/8',
        outline: 'border border-[#e0e0e0] bg-white text-[hsl(var(--foreground))] hover:bg-[#f3f2ef] dark:border-[hsl(var(--border))] dark:bg-transparent',
        ghost: 'text-[hsl(var(--muted-foreground))] hover:bg-black/5 dark:hover:bg-white/10',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-full px-3 text-xs',
        lg: 'h-10 rounded-full px-6',
        icon: 'h-9 w-9 rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
