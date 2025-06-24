import { getEventTimingStatus } from '@/lib/eventUtils'

interface LiveBadgeProps {
  dateTime: string
  endTime?: string | null
  durationType?: string | null
  className?: string
}

export function LiveBadge({ dateTime, endTime, durationType, className = '' }: LiveBadgeProps) {
  const status = getEventTimingStatus(dateTime, endTime, durationType)

  if (status !== 'now') {
    return null
  }

  return (
    <div 
      className={`
        inline-flex items-center gap-1 px-2 py-1 
        text-xs font-bold rounded-md
        bg-[rgba(255,95,46,0.1)] 
        border border-[#FF5F2E] 
        text-[#FF5F2E]
        animate-pulse-glow
        ${className}
      `}
    >
      <span className="w-1.5 h-1.5 bg-[#FF5F2E] rounded-full animate-pulse-glow" />
      LIVE
    </div>
  )
}
