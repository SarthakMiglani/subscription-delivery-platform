import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  customerId: string | null
  onboardingComplete: boolean
  setAuth: (accessToken: string, refreshToken: string, customerId: string, onboardingComplete: boolean) => void
  setOnboardingComplete: (val: boolean) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      customerId: null,
      onboardingComplete: false,
      setAuth: (accessToken, refreshToken, customerId, onboardingComplete) =>
        set({ accessToken, refreshToken, customerId, onboardingComplete }),
      setOnboardingComplete: (val) => set({ onboardingComplete: val }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, customerId: null, onboardingComplete: false }),
      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'customer-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        customerId: state.customerId,
        onboardingComplete: state.onboardingComplete,
      }),
    }
  )
)
