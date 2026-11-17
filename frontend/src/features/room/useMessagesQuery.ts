import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { getMessages, type Message, type MessagesResponse } from '../../lib/api'

export interface MessagesData extends MessagesResponse {
  messages: Message[]
}

export function useMessagesQuery(roomId: string, token: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['messages', roomId],
    enabled: Boolean(roomId && token),
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if ('status' in (error as object) && (error as { status?: number }).status === 401) {
        return false
      }
      return failureCount < 2
    },
    queryFn: async (): Promise<MessagesData> => {
      const key = ['messages', roomId] as const
      const cached = queryClient.getQueryData<MessagesData>(key)
      let after: number | string = cached?.messages.at(-1)?.id ?? 0
      let merged = cached?.messages ?? []
      let result: MessagesResponse = {
        messages: [],
        you: 'A',
        paired: false,
      }

      while (true) {
        result = await getMessages(roomId, token, after)
        const ids = new Set(merged.map((message) => message.id))
        const incoming = result.messages.filter((message) => !ids.has(message.id))
        merged = [...merged, ...incoming]

        if (result.messages.length < 200) break
        after = result.messages.at(-1)?.id ?? after
      }

      return {
        messages: merged,
        you: result.you,
        paired: result.paired,
        expiresAt: result.expiresAt,
      }
    },
  })
}
