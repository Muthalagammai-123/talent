import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

export function Progress({ className, value = 0, ...props }) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-[#e0e0e0]', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-[#0a66c2] transition-all"
        style={{ width: `${value}%` }}
      />
    </ProgressPrimitive.Root>
  )
}
