import { NavLink, useNavigate } from 'react-router-dom'
import { useAdminAuthStore } from '../../store/authStore'
import { apiPost } from '../../lib/api'

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/delivery', icon: 'local_shipping', label: 'Delivery' },
  { to: '/customers', icon: 'group', label: 'Customers' },
  { to: '/products', icon: 'inventory_2', label: 'Products' },
  { to: '/ingredients', icon: 'nutrition', label: 'Ingredients' },
  { to: '/subscriptions', icon: 'repeat', label: 'Subscriptions' },
  { to: '/scheduler', icon: 'schedule', label: 'Scheduler' },
  { to: '/holidays', icon: 'event_busy', label: 'Holidays' },
  { to: '/audit-logs', icon: 'manage_search', label: 'Audit Log' },
]

interface SidebarProps {
  /** Called when a nav item or logout is tapped — used to close the mobile drawer */
  onNavClick?: () => void
  /**
   * 'fixed' (default) — desktop usage, positions itself with `position: fixed`
   * 'fill'            — drawer usage, fills its already-fixed parent instead
   */
  variant?: 'fixed' | 'fill'
}

export function Sidebar({ onNavClick, variant = 'fixed' }: SidebarProps) {
  const navigate = useNavigate()
  const logout = useAdminAuthStore((s) => s.logout)

  function handleLogout() {
    // Revoke the refresh token server-side before clearing local state. Best-effort —
    // if this fails (e.g. offline), still proceed with the local logout.
    const { refreshToken } = useAdminAuthStore.getState()
    if (refreshToken) {
      apiPost('/auth/logout', { refreshToken }).catch(() => {})
    }
    logout()
    onNavClick?.()
    navigate('/login')
  }

  const cls =
    variant === 'fixed'
      ? 'fixed top-0 left-0 h-full w-60 bg-primary-container flex flex-col z-30'
      : 'h-full w-60 bg-primary-container flex flex-col'

  return (
    <aside className={cls}>
      <div className="p-6 border-b border-on-primary-container/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-primary-container text-3xl filled">water_drop</span>
          <div>
            <p className="font-jakarta font-bold text-on-primary-container text-lg leading-tight">FreshFlow</p>
            <p className="text-on-primary-container/70 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-primary text-on-primary'
                  : 'text-on-primary-container hover:bg-on-primary-container/10'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'filled' : ''}`}>{icon}</span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-on-primary-container/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-on-primary-container hover:bg-on-primary-container/10 text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
