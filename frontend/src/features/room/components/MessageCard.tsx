import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../../components/ui/button'
import { copyText } from '../../../lib/clipboard'
import type { Message } from '../../../lib/api'

interface MessageCardProps {
  message: Message
  you: 'A' | 'B'
}

function formatTime(createdAt: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt))
}

export function MessageCard({ message, you }: MessageCardProps) {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const element = textRef.current
    if (!element) return
    setOverflows(element.scrollHeight > element.clientHeight + 1)
  }, [message.text, expanded])

  async function handleCopy() {
    try {
      await copyText(message.text)
      setCopied(true)
      toast('Copied')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Could not copy message')
    }
  }

  const isYou = message.sender === you

  return (
    <article className="grid grid-cols-[52px_minmax(0,1fr)_44px] items-start gap-3 border-b border-line-soft py-5 last:border-b-0 md:grid-cols-[58px_minmax(0,1fr)_64px] md:gap-4 lg:grid-cols-[58px_minmax(0,1fr)_72px]">
      <div
        className={[
          'grid size-[52px] place-items-center rounded-[18px] md:size-[58px]',
          isYou ? 'bg-tint text-brand' : 'bg-success-bg text-success-text',
        ].join(' ')}
        aria-hidden="true"
      >
        {isYou ? <ArrowUp className="size-7" strokeWidth={2.5} /> : <ArrowDown className="size-7" strokeWidth={2.5} />}
      </div>

      <div className="min-w-0">
        <p className="text-[17px] leading-tight font-[800] md:text-[18px]">
          {isYou ? 'You' : 'Other device'}
          <span className="ml-2 font-normal text-muted-ink">· {formatTime(message.createdAt)}</span>
          {isYou && <Check className="ml-2 inline size-4 text-brand" strokeWidth={3} aria-label="Sent" />}
          {isYou && <span className="ml-1 text-purple-text">Sent</span>}
        </p>
        <p
          ref={textRef}
          className={[
            'mt-2 text-[18px] leading-[1.45] whitespace-pre-wrap break-words text-ink md:text-[19px]',
            expanded ? '' : 'line-clamp-3',
          ].join(' ')}
        >
          {message.text}
        </p>
        {overflows && (
          <button
            type="button"
            className="mt-1 min-h-[44px] text-left text-[17px] font-bold text-purple-text"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-[44px] justify-end rounded-[14px] px-2 text-ink lg:w-[72px]"
        aria-label={copied ? 'Copied' : 'Copy message'}
        onClick={handleCopy}
      >
        <Copy className="size-5" />
        <span className="hidden lg:inline"> {copied ? 'Copied' : 'Copy'}</span>
      </Button>
    </article>
  )
}
