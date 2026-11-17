import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface Session {
  roomId: string
  token: string
  code: string
  createdAt: string
}

const SESSION_KEY = 'minishare:session'
const LEGACY_SESSION_KEY = 'textbridge:session'

let inMemorySession: Session | null = null

export function readSession(): Session | null {
  try {
    let value = window.localStorage.getItem(SESSION_KEY)
    if (!value) {
      const legacyValue = window.localStorage.getItem(LEGACY_SESSION_KEY)
      if (legacyValue) {
        window.localStorage.setItem(SESSION_KEY, legacyValue)
        window.localStorage.removeItem(LEGACY_SESSION_KEY)
        value = legacyValue
      }
    }
    if (!value) {
      inMemorySession = null
      console.info('[MiniShare session] no stored session')
      return null
    }
    const parsed = JSON.parse(value) as Partial<Session>
    if (
      typeof parsed.roomId !== 'string'
      || typeof parsed.token !== 'string'
      || typeof parsed.code !== 'string'
      || typeof parsed.createdAt !== 'string'
    ) {
      return inMemorySession
    }
    inMemorySession = parsed as Session
    console.info('[MiniShare session] restored', {
      roomId: inMemorySession.roomId,
      code: inMemorySession.code,
    })
    return inMemorySession
  } catch {
    console.warn('[MiniShare session] could not read storage; using memory fallback')
    return inMemorySession
  }
}

export function writeSession(session: Session): void {
  inMemorySession = session
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    console.info('[MiniShare session] stored', {
      roomId: session.roomId,
      code: session.code,
    })
  } catch {
    console.warn('[MiniShare session] could not write storage; using memory fallback')
    // The in-memory copy keeps the app usable when storage is unavailable.
  }
}

export function clearSession(): void {
  inMemorySession = null
  try {
    window.localStorage.removeItem(SESSION_KEY)
    console.info('[MiniShare session] cleared')
  } catch {
    console.warn('[MiniShare session] could not clear storage; cleared memory fallback')
    // The in-memory copy is already cleared.
  }
}

interface SessionContextValue {
  session: Session | null
  setSession: (session: Session) => void
  clearSession: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(() => readSession())

  const setSession = useCallback((nextSession: Session) => {
    writeSession(nextSession)
    setSessionState(nextSession)
  }, [])

  const clear = useCallback(() => {
    clearSession()
    setSessionState(null)
  }, [])

  const value = useMemo(
    () => ({ session, setSession, clearSession: clear }),
    [session, setSession, clear],
  )

  return createElement(SessionContext.Provider, { value }, children)
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within SessionProvider')
  return context
}
