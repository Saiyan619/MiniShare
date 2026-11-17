import { Check, LoaderCircle } from 'lucide-react'

interface StatusPillProps {
  status: 'Paired' | 'Waiting' | 'Connecting' | 'Reconnecting'
}

export function StatusPill({ status }: StatusPillProps) {
  const paired = status === 'Paired'
  const waiting = status === 'Waiting'

  return (
    <div
      className={[
        'inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-[16px] font-bold md:px-5',
        paired
          ? 'bg-success-bg text-success-text'
          : waiting
            ? 'bg-surface text-purple-text shadow-[0_10px_24px_rgba(36,31,63,0.06)]'
            : 'bg-tint text-purple-text',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      {paired ? (
        <Check className="size-5" strokeWidth={3} />
      ) : waiting ? (
        <span className="size-3 rounded-full bg-brand motion-safe:animate-pulse" />
      ) : (
        <LoaderCircle className="size-5 motion-safe:animate-spin" />
      )}
      {status}
    </div>
  )
}
