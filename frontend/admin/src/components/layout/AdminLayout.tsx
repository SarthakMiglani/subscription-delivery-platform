import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuthStore } from '../../store/authStore'
import { Sidebar } from './Sidebar'
import { NotificationBell } from './NotificationBell'

export function AdminLayout() {
  const accessToken = useAdminAuthStore((s) => s.accessToken)
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar variant="fixed" />
      </div>

      {/* Mobile drawer — fixed w-60 wrapper that slides in/out */}
      <div
        className={`fixed top-0 left-0 h-full w-60 z-50 md:hidden transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar fills the fixed wrapper — no own fixed positioning */}
        <Sidebar variant="fill" onNavClick={() => setDrawerOpen(false)} />
      </div>

      {/* Backdrop — closes drawer on tap outside */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-60 min-h-screen bg-background overflow-y-auto">
        {/* Mobile top bar — hidden on desktop */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-primary-container border-b border-on-primary-container/20">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="p-1.5 -ml-1.5 rounded-lg text-on-primary-container hover:bg-on-primary-container/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
          <span className="material-symbols-outlined text-on-primary-container text-2xl filled">water_drop</span>
          <p className="font-jakarta font-bold text-on-primary-container text-base flex-1">FreshFlow Admin</p>
          {/* Bell on mobile top bar */}
          <NotificationBell />
        </div>

        <Outlet />
      </main>
    </div>
  )
}

