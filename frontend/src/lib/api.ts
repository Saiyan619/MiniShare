import axios, { AxiosError, type AxiosResponse } from 'axios'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface RoomCreateResponse {
  message: string
  room: {
    id: string
    code: string
    token_a: string
  }
}

export interface RoomJoinResponse {
  message: string
  room: {
    id: string
    token_b: string
  }
}

export interface Message {
  id: string
  sender: 'A' | 'B'
  text: string
  createdAt: string
}

export interface MessagesResponse {
  messages: Message[]
  you: 'A' | 'B'
  paired: boolean
  expiresAt?: string
}

export interface SentMessageResponse {
  message: {
    id: string
    createdAt: string
  }
}

export interface ApiMessageResponse {
  message: string
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 0,
})

api.interceptors.request.use((config) => {
  console.info('[MiniShare API] request', {
    method: config.method?.toUpperCase(),
    url: `${config.baseURL ?? ''}${config.url ?? ''}`,
  })
  return config
})

api.interceptors.response.use(
  (response) => {
    console.info('[MiniShare API] response', {
      method: response.config.method?.toUpperCase(),
      url: `${response.config.baseURL ?? ''}${response.config.url ?? ''}`,
      status: response.status,
    })
    return response
  },
  (error: unknown) => {
    if (error instanceof AxiosError) {
      console.warn('[MiniShare API] error', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status ?? 0,
        message: error.response?.data?.message ?? error.message,
      })
    } else {
      console.warn('[MiniShare API] unknown error', error)
    }
    return Promise.reject(error)
  },
)

function parseErrorData(data: unknown, status: number): string {
  if (typeof data === 'string') {
    return data || 'Request failed'
  }
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return status === 429 ? 'Too many requests' : 'Request failed'
}

async function request<T>(response: Promise<AxiosResponse<T>>): Promise<T> {
  try {
    const result = await response
    return result.data
  } catch (error) {
    if (error instanceof AxiosError) {
      if (!error.response) {
        throw new ApiError('Network error', 0)
      }
      throw new ApiError(
        parseErrorData(error.response.data, error.response.status),
        error.response.status,
      )
    }
    throw new ApiError('Network error', 0)
  }
}

function authHeaders(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` }
}

export function createRoom(): Promise<RoomCreateResponse> {
  return request(api.post<RoomCreateResponse>('/rooms'))
}

export function joinRoom(code: string): Promise<RoomJoinResponse> {
  return request(api.post<RoomJoinResponse>('/rooms/join', { code }))
}

export function sendMessage(
  roomId: string,
  token: string,
  text: string,
): Promise<SentMessageResponse> {
  return request(
    api.post<SentMessageResponse>(
      `/rooms/${roomId}/messages`,
      { text },
      { headers: authHeaders(token) },
    ),
  )
}

export async function getMessages(
  roomId: string,
  token: string,
  after: number | string = 0,
): Promise<MessagesResponse> {
  return request(
    api.get<MessagesResponse>(
      `/rooms/${roomId}/messages`,
      {
        params: { after },
        headers: authHeaders(token),
      },
    ),
  )
}

export function deleteRoom(roomId: string, token: string): Promise<ApiMessageResponse> {
  return request(
    api.delete<ApiMessageResponse>(
      `/rooms/${roomId}`,
      { headers: authHeaders(token) },
    ),
  )
}
