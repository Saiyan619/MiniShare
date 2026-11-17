import { useEffect, useState } from 'react'
import { ArrowRight, ExternalLink, LockKeyhole, Plus, Repeat2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { ApiError, createRoom, joinRoom } from '../../lib/api'
import { useSession } from '../../lib/session'

export function HomePage() {
  const navigate = useNavigate()
  const { setSession } = useSession()
  const [code, setCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [slowCreate, setSlowCreate] = useState(false)
  const [slowJoin, setSlowJoin] = useState(false)

  const createMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (response) => {
      setSession({
        roomId: response.room.id,
        token: response.room.token_a,
        code: response.room.code,
        createdAt: new Date().toISOString(),
      })
      navigate('/room', { replace: true })
    },
  })

  const joinMutation = useMutation({
    mutationFn: (roomCode: string) => joinRoom(roomCode),
    onSuccess: (response, roomCode) => {
      setSession({
        roomId: response.room.id,
        token: response.room.token_b,
        code: roomCode,
        createdAt: new Date().toISOString(),
      })
      navigate('/room', { replace: true })
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 429) {
        setJoinError('Too many attempts. Wait a few minutes.')
      } else {
        setJoinError("That code didn't work. Check it and try again.")
      }
    },
  })

  useEffect(() => {
    if (!createMutation.isPending) {
      setSlowCreate(false)
      return
    }
    const timeout = window.setTimeout(() => setSlowCreate(true), 5000)
    return () => window.clearTimeout(timeout)
  }, [createMutation.isPending])

  useEffect(() => {
    if (!joinMutation.isPending) {
      setSlowJoin(false)
      return
    }
    const timeout = window.setTimeout(() => setSlowJoin(true), 5000)
    return () => window.clearTimeout(timeout)
  }, [joinMutation.isPending])

  const normalizedCode = code.toUpperCase().trim()

  function submitJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (normalizedCode.length !== 6) return
    setJoinError('')
    joinMutation.mutate(normalizedCode)
  }

  return (
    <main className="min-h-dvh bg-page px-5 py-8 sm:px-8 md:px-[52px] md:py-12 lg:flex lg:items-center lg:px-[72px]">
      <div className="mx-auto w-full max-w-[1180px] lg:grid lg:grid-cols-[1fr_520px] lg:items-center lg:gap-20">
        <section className="md:max-w-[650px] lg:max-w-none">
          <div className="mb-11 grid size-[76px] place-items-center rounded-[24px] bg-accent-fill text-ink md:size-[84px]">
            <Repeat2 className="size-9" strokeWidth={2.4} />
          </div>

          <h1 className="text-[48px] leading-none font-[800] tracking-[-0.055em] text-ink md:text-[64px] lg:text-[72px]">
            MiniShare
          </h1>
          <p className="mt-5 max-w-[520px] text-[24px] leading-[1.35] text-muted-ink md:text-[27px]">
            Paste on one device, read it on the other. No account, no cables.
          </p>

          <div className="mt-12 hidden space-y-4 lg:block">
            {[
              'Create a room on one device.',
              'Enter its code on the other.',
              'Paste text. It appears on both.',
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-4 text-[17px] text-ink">
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent-fill/55 text-sm font-bold text-purple-text">
                  {index + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <p className="mt-10 flex items-center gap-2 text-[16px] text-muted-ink lg:mt-12">
            <LockKeyhole className="size-5" />
            Rooms delete themselves after 24 hours.
          </p>
        </section>

        <div className="mt-10 rounded-[36px] bg-surface p-4 shadow-[0_28px_60px_rgba(36,31,63,0.10)] md:mt-16 md:grid md:grid-cols-2 md:gap-4 md:p-5 lg:mt-0 lg:block">
          <section className="rounded-[28px] bg-accent-fill p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="grid size-[64px] shrink-0 place-items-center rounded-[20px] bg-surface">
                <Plus className="size-8 text-purple-text" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-[25px] leading-tight font-[800] tracking-tight md:text-[28px]">
                  Create a room
                </h2>
                <p className="mt-2 text-[17px] leading-[1.35] text-accent-ink md:text-[18px]">
                  You get a code. Type it on your other device.
                </p>
              </div>
            </div>
            {slowCreate && (
              <p className="mt-3 text-sm font-semibold text-accent-ink" role="status">
                Waking the server, this can take a moment.
              </p>
            )}
            <Button
              variant="default"
              className="mt-5 h-[56px] w-full rounded-[20px] text-[18px] font-bold"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Creating…' : 'Create room'}
              {!createMutation.isPending && <ArrowRight className="ml-2 size-5" />}
            </Button>
          </section>

          <form
            onSubmit={submitJoin}
            className="mt-4 rounded-[28px] border border-line-soft bg-surface p-5 md:mt-0 md:p-6 lg:mt-4"
          >
            <div className="flex items-start gap-4">
              <div className="grid size-[64px] shrink-0 place-items-center rounded-[20px] bg-tint">
                <ExternalLink className="size-7 text-brand" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-[25px] leading-tight font-[800] tracking-tight md:text-[28px]">
                  Join a room
                </h2>
                <p className="mt-2 text-[17px] leading-[1.35] text-muted-ink md:text-[18px]">
                  Got a code from your other device?
                </p>
              </div>
            </div>

            <label htmlFor="room-code" className="mt-6 block text-sm font-bold tracking-[0.16em] text-muted-ink">
              ROOM CODE
            </label>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_116px] gap-3">
              <Input
                id="room-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 6))}
                maxLength={6}
                autoComplete="off"
                autoCapitalize="characters"
                aria-describedby={joinError ? 'join-error' : undefined}
                className="h-[58px] rounded-[20px] border-line px-5 text-[16px] font-bold tracking-[0.26em] text-muted-ink md:text-[16px]"
                placeholder="K7F2QX"
              />
              <Button
                type="submit"
                variant="brand"
                className="h-[58px] rounded-[20px] text-[17px] font-bold"
                disabled={normalizedCode.length !== 6 || joinMutation.isPending}
              >
                {joinMutation.isPending ? 'Joining…' : 'Join'}
              </Button>
            </div>
            {slowJoin && (
              <p className="mt-3 text-sm font-semibold text-purple-text" role="status">
                Waking the server, this can take a moment.
              </p>
            )}
            {joinError && (
              <p id="join-error" className="mt-3 text-sm font-semibold text-destructive" role="alert">
                {joinError}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  )
}
