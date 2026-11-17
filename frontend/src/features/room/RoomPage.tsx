import { useSession } from '../../lib/session'
import { useMessagesQuery } from './useMessagesQuery'
import { WaitingView } from './WaitingView'
import { PairedRoom } from './PairedRoom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { Navigate } from 'react-router'
import { deleteRoom } from '../../lib/api'

export function RoomPage() {
  const { session, clearSession } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const roomId = session?.roomId ?? ''
  const token = session?.token ?? ''
  const messagesQuery = useMessagesQuery(roomId, token)

  const deleteMutation = useMutation({
    mutationFn: () => deleteRoom(roomId, token),
    onSuccess: () => {
      clearSession()
      queryClient.clear()
      navigate('/', { replace: true })
    },
  })

  function leaveRoom() {
    clearSession()
    queryClient.clear()
    navigate('/', { replace: true })
  }

  if (!session) return <Navigate to="/" replace />

  if (!messagesQuery.data && messagesQuery.isLoading) {
    return (
      <PairedRoom
        sessionCode={session.code}
        roomId={session.roomId}
        token={session.token}
        data={undefined}
        isLoading
        isError={false}
        expiresAt={undefined}
        onLeave={leaveRoom}
        onDelete={() => deleteMutation.mutate()}
      />
    )
  }

  if (!messagesQuery.data?.paired) {
    return <WaitingView />
  }

  return (
    <PairedRoom
      sessionCode={session.code}
      roomId={session.roomId}
      token={session.token}
      data={messagesQuery.data}
      isLoading={messagesQuery.isLoading}
      isError={messagesQuery.isError}
      expiresAt={messagesQuery.data?.expiresAt}
      onLeave={leaveRoom}
      onDelete={() => deleteMutation.mutate()}
    />
  )
}
