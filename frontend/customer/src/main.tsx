import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { api } from './lib/api'
import { ToastProvider } from './components/ui/Toast'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isMock = (import.meta as any).env?.VITE_MOCK === 'true'

if (isMock) {
  // Set up mock interceptor (no backend needed)
  import('./lib/mockInterceptor').then(({ setupMockInterceptor }) => {
    setupMockInterceptor(api)
  })
  // Pre-populate auth store so the app opens directly on dashboard
  import('./store/authStore').then(({ useAuthStore }) => {
    const { accessToken } = useAuthStore.getState()
    if (!accessToken) {
      useAuthStore.getState().setAuth(
        'mock-access-token',
        'mock-refresh-token',
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        true,
      )
    }
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: isMock ? 0 : 1,
      staleTime: 30_000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
