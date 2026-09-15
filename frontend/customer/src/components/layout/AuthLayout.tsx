import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function AuthLayout() {
  const { accessToken, onboardingComplete } = useAuthStore()
  if (!accessToken) return <Navigate to="/login" replace />
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />
  return <Outlet />
}
