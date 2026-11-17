import { useEffect, useState } from 'react'
import { ArrowLeft, Copy, Smartphone, Trash2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { copyText } from '../../lib/clipboard'
import { useSession } from '../../lib/session'
import { createRoom } from '../../lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { deleteRoom } from '../../lib/api'
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
import { CodeTiles } from './components/CodeTiles'
import { StatusPill } from './components/StatusPill'

export function WaitingView() {
  const navigate = useNavigate()
  const { session, setSession, clearSession } = useSession()
  const queryClient = useQueryClient()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const createMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (response) => {
      setSession({
        roomId: response.room.id,
        token: response.room.token_a,
        code: response.room.code,
        createdAt: new Date().toISOString(),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!session) throw new Error('Missing session')
      return deleteRoom(session.roomId, session.token)
    },
    onSuccess: () => {
      clearSession()
      queryClient.clear()
      navigate('/', { replace: true })
    },
  })

  if (!session) return null

  const expiresAt = new Date(session.createdAt).getTime() + 10 * 60 * 1000
  const remainingSeconds = Math.max(0, Math.ceil((expiresAt - now) / 1000))
  const expired = remainingSeconds === 0
  const remainingMinutes = Math.max(1, Math.ceil(remainingSeconds / 60))

  async function handleCopy() {
    if (!session) return
    try {
      await copyText(session.code)
      toast('Copied')
    } catch {
      toast.error('Could not copy the code')
    }
  }

  function leave() {
    clearSession()
    navigate('/', { replace: true })
  }

  return (
    <main className="min-h-dvh bg-page px-5 py-6 md:px-[52px] md:py-10">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex items-center justify-between">
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
                <AlertDialogAction onClick={leave}>Leave</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <StatusPill status="Waiting" />
        </header>

        <h1 className="mt-8 text-[44px] leading-none font-[800] tracking-[-0.045em] text-ink md:text-[60px]">
          {expired ? 'Code expired' : 'Your room'}
        </h1>
        <p className="mt-4 text-[21px] leading-[1.35] text-muted-ink md:text-[25px]">
          {expired ? 'Create a new room to keep sharing.' : 'Type this code on your other device.'}
        </p>

        {expired ? (
          <section className="mt-12 rounded-[32px] bg-surface p-6 shadow-[0_20px_50px_rgba(36,31,63,0.08)]">
            <Button
              variant="brand"
              className="h-[58px] w-full rounded-[20px] text-[17px] font-bold"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Creating…' : 'Create new room'}
            </Button>
          </section>
        ) : (
          <>
            <section className="mt-10 rounded-[32px] bg-surface p-5 shadow-[0_20px_50px_rgba(36,31,63,0.08)] md:p-8">
              <h2 className="mb-5 text-sm font-bold tracking-[0.16em] text-muted-ink md:text-lg">
                ROOM CODE
              </h2>
              <CodeTiles code={session.code} />
              <Button
                variant="accent"
                className="mt-6 h-[58px] w-full rounded-[20px] text-[20px] font-bold"
                onClick={handleCopy}
              >
                <Copy className="mr-2 size-5" />
                Copy code
              </Button>
            </section>

            <section className="mt-7 flex items-center gap-4 rounded-[24px] bg-surface p-5 md:p-6">
              <div className="grid size-[58px] shrink-0 place-items-center rounded-[18px] bg-tint text-brand">
                <Smartphone className="size-7" />
              </div>
              <div>
                <h2 className="text-[20px] font-[800] md:text-[23px]">
                  Waiting for the other device
                </h2>
                <p className="mt-1 text-[17px] text-muted-ink">
                  The code works for {remainingMinutes} more {remainingMinutes === 1 ? 'minute' : 'minutes'}.
                </p>
              </div>
            </section>
          </>
        )}

        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="outline" className="mt-10 h-[58px] w-full rounded-[20px] border-line bg-surface text-[18px] font-bold" />}
          >
            <Trash2 className="mr-2 size-5" />
            Delete room
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this room?</AlertDialogTitle>
              <AlertDialogDescription>Delete room? The room will be gone for both devices.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete room'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  )
}
