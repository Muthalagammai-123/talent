import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, key: 'aadhaar', label: 'Aadhaar' },
  { id: 2, key: 'liveness', label: 'Liveness' },
  { id: 3, key: 'profile', label: 'Profile photo' },
  { id: 4, key: 'review', label: 'Review' },
]

export function VerificationStepper({ current, completed = {} }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#e0e0e0] pb-4">
      {STEPS.map((step, i) => {
        const done = completed[step.key]
        const active = current === step.id
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold',
                done && 'border-[#057642] bg-[#057642] text-white',
                active && !done && 'border-[#0a66c2] bg-[#0a66c2] text-white',
                !active && !done && 'border-[#e0e0e0] bg-white text-[#666]'
              )}
            >
              {done ? <Check className="h-4 w-4" /> : String(step.id).padStart(2, '0')}
            </div>
            <span
              className={cn(
                'text-xs font-medium sm:text-sm',
                active ? 'text-[#0a66c2]' : 'text-[hsl(var(--muted-foreground))]'
              )}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-1 hidden h-px w-6 bg-[#e0e0e0] sm:block" aria-hidden />
            )}
          </div>
        )
      })}
    </div>
  )
}
