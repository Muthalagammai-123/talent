import { BadgeCheck, ShieldAlert, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const STYLES = {
  verified: {
    icon: BadgeCheck,
    label: 'Verified',
    className: 'border-transparent bg-[#e8f4fc] text-[#0a66c2]',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'border-[#e0e0e0] bg-[#f3f2ef] text-[#666666]',
  },
  flagged: {
    icon: ShieldAlert,
    label: 'Flagged',
    className: 'border-transparent bg-red-50 text-red-700',
  },
  unverified: {
    icon: ShieldAlert,
    label: 'Unverified',
    className: 'border-[#e0e0e0] bg-white text-[#666666]',
  },
}

export function VerifiedBadge({ status = 'unverified', size = 'sm', showLabel = true, className }) {
  const key = STYLES[status] ? status : 'unverified'
  const { icon: Icon, label, className: style } = STYLES[key]
  const compact = size === 'xs'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border font-semibold',
        compact ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs',
        style,
        className
      )}
      title={label}
    >
      <Icon className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} strokeWidth={2} />
      {showLabel && <span>{label}</span>}
    </span>
  )
}

export function TrustScorePill({ score, className }) {
  if (score == null) return null
  const tone =
    score >= 75 ? 'text-[#057642] bg-[#e8f5e9]' : score >= 50 ? 'text-[#915907] bg-[#fff8e6]' : 'text-red-700 bg-red-50'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold',
        tone,
        className
      )}
    >
      Trust {score}
    </span>
  )
}
