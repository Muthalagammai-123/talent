import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({ className, showText = true }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2', className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#0a66c2] text-sm font-bold text-white">
        TS
      </div>
      {showText && (
        <span className="hidden text-xl font-semibold tracking-tight text-[#0a66c2] sm:inline">
          TalentStage
        </span>
      )}
    </Link>
  )
}
