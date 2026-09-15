import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AuthLayout } from './components/layout/AuthLayout'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'
import { ProductsPage } from './pages/ProductsPage'
import { OrdersPage } from './pages/OrdersPage'
import { WalletPage } from './pages/WalletPage'
import { ProfilePage } from './pages/ProfilePage'
import { BottomNav } from './components/layout/BottomNav'

function AppShell() {
  return (
    <>
      <AuthLayout />
      <BottomNav />
    </>
  )
}

export default function App() {
  const { accessToken, onboardingComplete } = useAuthStore()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !accessToken ? (
            <LoginPage />
          ) : !onboardingComplete ? (
            <Navigate to="/onboarding" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/onboarding"
        element={
          !accessToken ? (
            <Navigate to="/login" replace />
          ) : onboardingComplete ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <OnboardingPage />
          )
        }
      />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to={accessToken ? (onboardingComplete ? '/dashboard' : '/onboarding') : '/login'} replace />} />
    </Routes>
  )
}
