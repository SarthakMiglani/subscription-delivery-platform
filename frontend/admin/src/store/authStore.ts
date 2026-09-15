import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isMock = (import.meta as any).env?.VITE_MOCK === 'true'

// In mock mode, clear any prior null-token session so Zustand uses the mock initial state
if (isMock) {
  try {
    const stored = localStorage.getItem('admin-auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (!parsed?.state?.accessToken) {
        localStorage.removeItem('admin-auth')
      }
    }
  } catch {
    localStorage.removeItem('admin-auth')
  }
}

interface AdminAuthState {
  accessToken: string | null
  refreshToken: string | null
  setAuth: (accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      accessToken: isMock ? 'mock-admin-access-token' : null,
      refreshToken: isMock ? 'mock-admin-refresh-token' : null,
      setAuth: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => set({ accessToken: null, refreshToken: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'admin-auth',
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken }),
    }
  )
)
