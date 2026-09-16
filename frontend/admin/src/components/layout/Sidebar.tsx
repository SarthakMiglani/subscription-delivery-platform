import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Truck, Users, PackageSearch, Wheat, Repeat, Clock, CalendarOff,
  ScrollText, LogOut, Droplets,
} from 'lucide-react'
import { useAdminAuthStore } from '../../store/authStore'
import { apiPost } from '../../lib/api'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/delivery', icon: Truck, label: 'Delivery' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/products', icon: PackageSearch, label: 'Products' },
  { to: '/ingredients', icon: Wheat, label: 'Ingredients' },
  { to: '/subscriptions', icon: Repeat, label: 'Subscriptions' },
  { to: '/scheduler', icon: Clock, label: 'Scheduler' },
  { to: '/holidays', icon: CalendarOff, label: 'Holidays' },
  { to: '/audit-logs', icon: ScrollText, label: 'Audit Log' },
]

interface SidebarProps {
  onNavClick?: () => void
  /**
   * 'fixed' — desktop usage: a floating rounded panel inset from the
   *           viewport edge (detached, card-like), not an edge-to-edge rail.
   * 'fill'  — mobile drawer usage: fills its fixed parent edge-to-edge since
   *           the drawer itself already reads as a distinct floating sheet.
   */
  variant?: 'fixed' | 'fill'
}

export function Sidebar({ onNavClick, variant = 'fixed' }: SidebarProps) {
  const navigate = useNavigate()
  const logout = useAdminAuthStore((s) => s.logout)

  function handleLogout() {
    const { refreshToken } = useAdminAuthStore.getState()
    if (refreshToken) {
      apiPost('/auth/logout', { refreshToken }).catch(() => {})
    }
    logout()
    onNavClick?.()
    navigate('/login')
  }

  const outerCls =
    variant === 'fixed'
      ? 'fixed top-4 left-4 bottom-4 w-60 z-30'
      : 'h-full w-64'

  const panelCls = variant === 'fixed' ? 'rounded-[1.75rem] shadow-popover h-full' : 'h-full'

  return (
    <aside className={outerCls}>
      <div className={`bg-primary flex flex-col ${panelCls}`}>
        <div className="px-5 py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-on-primary/10 flex items-center justify-center shrink-0">
              <Droplets size={19} className="text-inverse-primary" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-jakarta font-semibold text-on-primary text-[16px] leading-tight">FreshFlow</p>
              <p className="text-on-primary/55 text-[10.5px] tracking-wide uppercase">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-2 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavClick}
              className={({ isActive }) =>
                `focus-ring flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-colors text-sm font-medium ${
                  isActive ? 'bg-on-primary text-primary shadow-card' : 'text-on-primary/65 hover:bg-on-primary/[0.10] hover:text-on-primary/90'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive ? 2.1 : 1.75} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3">
          <button
            onClick={handleLogout}
            className="focus-ring flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl text-on-primary/65 hover:bg-on-primary/[0.10] hover:text-on-primary/90 text-sm font-medium transition-colors"
          >
            <LogOut size={17} strokeWidth={1.75} />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  )
}
