import { useEffect, useRef } from 'react'
import { ArrowLeft, Repeat2, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Skeleton } from '../../components/ui/skeleton'
import { StatusPill } from './components/StatusPill'
import { MessageCard } from './components/MessageCard'
import { Composer } from './components/Composer'
import { toast } from 'sonner'
import { copyText } from '../../lib/clipboard'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog'
import type { MessagesData } from './useMessagesQuery'

interface PairedRoomProps {
  sessionCode: string
  roomId: string
  token: string
  data: MessagesData | undefined
  isLoading: boolean
  isError: boolean
  expiresAt?: string
  onLeave: () => void
  onDelete: () => void
}

function formatExpiry(expiresAt?: string): string {
  if (!expiresAt) return ''
  const milliseconds = new Date(expiresAt).getTime() - Date.now()
  if (milliseconds <= 0) return 'Expired'
  const totalMinutes = Math.ceil(milliseconds / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `Expires in ${hours > 0 ? `${hours}h ` : ''}${minutes}m`
}

export function PairedRoom({
  sessionCode,
  roomId,
  token,
  data,
  isLoading,
  isError,
  expiresAt,
  onLeave,
  onDelete,
}: PairedRoomProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const nearBottomRef = useRef(true)
  const previousCountRef = useRef(0)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (data && data.messages.length > previousCountRef.current && nearBottomRef.current) {
      list.scrollTo({
        top: list.scrollHeight,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })
    }
    previousCountRef.current = data?.messages.length ?? 0
  }, [data?.messages])

  function handleScroll() {
    const list = listRef.current
    if (!list) return
    nearBottomRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 120
  }

  async function handleCopyCode() {
    try {
      await copyText(sessionCode)
      toast('Copied')
    } catch {
      toast.error('Could not copy the code')
    }
  }

  let previousDate = ''

  return (
    <main className="min-h-dvh bg-page md:px-[52px] md:py-8 lg:h-dvh lg:overflow-hidden lg:px-6 lg:py-5">
      <div className="mx-auto max-w-[1180px] lg:grid lg:h-full lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-5">
        <aside className="hidden rounded-[36px] bg-surface p-6 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="grid size-[48px] place-items-center rounded-[16px] bg-accent-fill">
              <Repeat2 className="size-6" />
            </div>
            <span className="font-[800]">MiniShare</span>
          </div>
          <h1 className="mt-10 text-[38px] font-[800] tracking-[-0.04em]">Room</h1>
          <p className="mt-2 text-[14px] text-muted-ink">{formatExpiry(expiresAt)}</p>
          <p className="mt-7 text-xs font-bold tracking-[0.16em] text-muted-ink">ROOM CODE</p>
          <button
            type="button"
            className="mt-3 flex h-[58px] items-center justify-between rounded-[18px] border border-line-soft px-5 font-mono text-xl font-bold"
            onClick={handleCopyCode}
            aria-label={`Copy room code ${sessionCode}`}
          >
            {sessionCode}
            <span className="text-xs">Copy</span>
          </button>
          <div className="mt-6">
            <StatusPill status={isLoading ? 'Connecting' : isError ? 'Reconnecting' : 'Paired'} />
          </div>
          <div className="mt-auto space-y-3">
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="outline" className="h-[52px] w-full rounded-[18px] border-line text-[15px] font-bold" />}
              >
                <Trash2 className="mr-2 size-4" />
                Delete room
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this room?</AlertDialogTitle>
                  <AlertDialogDescription>Delete room? The room will be gone for both devices.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={onDelete}>Delete room</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="ghost" className="h-[44px] w-full rounded-[18px] text-[15px]" />}>
                Leave
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave this room?</AlertDialogTitle>
                  <AlertDialogDescription>You won't be able to rejoin this room.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onLeave}>Leave</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </aside>

        <section className="flex min-h-dvh flex-col overflow-hidden lg:min-h-0 lg:rounded-[36px] lg:bg-surface">
          <header className="px-5 pt-6 md:px-0 md:pt-0 lg:px-7 lg:pt-6">
            <div className="flex items-center justify-between lg:hidden">
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="outline" size="icon" aria-label="Leave room" className="size-[58px] rounded-[20px] border-line bg-surface" />}
                >
                  <ArrowLeft className="size-7" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave this room?</AlertDialogTitle>
                    <AlertDialogDescription>You won't be able to rejoin this room.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onLeave}>Leave</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex items-center gap-3">
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Delete room"
                        className="size-[58px] rounded-[20px] border-line bg-surface md:w-auto md:px-5 md:text-[15px] md:font-bold"
                      />
                    }
                  >
                    <Trash2 className="size-5 md:mr-2" />
                    <span className="hidden md:inline">Delete room</span>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this room?</AlertDialogTitle>
                      <AlertDialogDescription>The room will be gone for both devices.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={onDelete}>Delete room</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <StatusPill status={isLoading ? 'Connecting' : isError ? 'Reconnecting' : 'Paired'} />
              </div>
            </div>
            <div className="mt-6 flex items-end justify-between lg:mt-0">
              <div>
                <h1 className="text-[44px] leading-none font-[800] tracking-[-0.045em] md:text-[52px] lg:text-[28px]">
                  Room
                </h1>
                {formatExpiry(expiresAt) && (
                  <p className="mt-3 text-[20px] text-muted-ink md:text-[22px] lg:text-[14px]">
                    {formatExpiry(expiresAt)}
                  </p>
                )}
              </div>
              <span className="rounded-[16px] border border-line-soft bg-surface px-5 py-4 font-mono text-xl font-bold md:text-2xl lg:hidden">
                {sessionCode}
              </span>
            </div>
            {isLoading && (
              <div className="mt-5 flex items-center gap-2 text-[16px] font-bold text-purple-text lg:hidden">
                Connecting
              </div>
            )}
          </header>

          <div
            ref={listRef}
            onScroll={handleScroll}
            aria-live="polite"
            className="mt-7 flex-1 overflow-y-auto rounded-t-[36px] bg-surface px-5 py-2 md:mt-8 md:px-8 lg:mt-5 lg:rounded-[28px]"
          >
            {isLoading ? (
              <div className="space-y-5 py-4">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-[110px] w-full rounded-[28px] bg-soft motion-safe:animate-pulse" />
                ))}
              </div>
            ) : data?.messages.length === 0 ? (
              <div className="grid min-h-[420px] place-items-center text-center">
                <div>
                  <div className="mx-auto grid size-[120px] place-items-center rounded-[36px] bg-tint text-brand">
                    <Repeat2 className="size-14" />
                  </div>
                  <h2 className="mt-8 text-[34px] font-[800] tracking-tight">Nothing here yet</h2>
                  <p className="mx-auto mt-4 max-w-[520px] text-[20px] leading-[1.5] text-muted-ink">
                    Paste some text below and it shows up on your other device within a few seconds.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {data?.messages.map((message) => {
                  const date = new Date(message.createdAt)
                  const today = new Date()
                  const yesterday = new Date(today)
                  yesterday.setDate(today.getDate() - 1)
                  let label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                  if (date.toDateString() === today.toDateString()) label = 'Today'
                  else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday'
                  const separator = label !== previousDate
                  previousDate = label
                  return (
                    <div key={message.id}>
                      {separator && (
                        <p className="pt-5 text-sm font-bold tracking-[0.14em] text-muted-ink">{label.toUpperCase()}</p>
                      )}
                      <MessageCard message={message} you={data.you} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <Composer roomId={roomId} token={token} />
        </section>
      </div>
    </main>
  )
}
