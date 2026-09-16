import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Menu, Droplets } from 'lucide-react'
import { useAdminAuthStore } from '../../store/authStore'
import { Sidebar } from './Sidebar'
import { NotificationBell } from './NotificationBell'

export function AdminLayout() {
  const accessToken = useAdminAuthStore((s) => s.accessToken)
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar variant="fixed" />
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 z-50 md:hidden transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar variant="fill" onNavClick={() => setDrawerOpen(false)} />
      </div>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-inverse-surface/45 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Main content — offset to clear the floating sidebar panel (w-60 + left-4 inset + gap) */}
      <main className="flex-1 md:ml-[17.5rem] min-h-screen overflow-y-auto">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-primary safe-top">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="focus-ring flex items-center justify-center w-9 h-9 -ml-1 rounded-full bg-on-primary/10 text-on-primary hover:bg-on-primary/20 transition-colors"
          >
            <Menu size={20} />
          </button>
          <Droplets size={20} className="text-inverse-primary" strokeWidth={1.75} />
          <p className="font-jakarta font-semibold text-on-primary text-base flex-1">FreshFlow Admin</p>
          <NotificationBell />
        </div>

        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
