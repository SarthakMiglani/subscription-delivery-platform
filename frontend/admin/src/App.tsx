import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from './components/layout/AdminLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { DeliveryPage } from './pages/DeliveryPage'
import { CustomersPage } from './pages/CustomersPage'
import { CustomerDetailPage } from './pages/CustomerDetailPage'
import { ProductsPage } from './pages/ProductsPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'
import { SchedulerPage } from './pages/SchedulerPage'
import { HolidaysPage } from './pages/HolidaysPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { IngredientsPage } from './pages/IngredientsPage'
import { NotificationsPage } from './pages/NotificationsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AdminLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/delivery" element={<DeliveryPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/ingredients" element={<IngredientsPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/scheduler" element={<SchedulerPage />} />
        <Route path="/holidays" element={<HolidaysPage />} />
        <Route path="/audit-logs" element={<AuditLogPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
