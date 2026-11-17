import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { toast, Toaster } from 'sonner'
import { ApiError } from './lib/api'
import { clearSession, SessionProvider } from './lib/session'
import './index.css'
import App from './App.tsx'

function handleGlobalError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    console.warn('[MiniShare] unauthorized; ending local room session')
    clearSession()
    queryClient.clear()
    toast('This room has ended')
    window.location.replace('/')
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) {
          return false
        }
        return failureCount < 2
      },
    },
  },
  queryCache: new QueryCache({
    onError: handleGlobalError,
  }),
  mutationCache: new MutationCache({
    onError: handleGlobalError,
  }),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <BrowserRouter>
          <App />
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>,
)
